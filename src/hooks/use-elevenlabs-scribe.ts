"use client";

import { useCallback, useRef, useState } from "react";
import type { TranscriptEntry, WordConfidence } from "@/types/session";

interface UseElevenLabsScribeOptions {
  language?: string;
  onTranscript?: (entry: TranscriptEntry) => void;
  /** Called with interim (partial) text while user is speaking */
  onInterim?: (text: string, speaker: "doctor" | "patient") => void;
}

/** Convert ElevenLabs logprob to 0-1 confidence */
function logprobToConfidence(logprob: number): number {
  return Math.min(1, Math.max(0, Math.exp(logprob)));
}

/** Convert ArrayBuffer of Int16 PCM to base64 string */
function pcmToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface ScribeWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | "audio_event";
  speaker_id?: string;
  logprob?: number;
}

export function useElevenLabsScribe({
  language = "ces",
  onTranscript,
  onInterim,
}: UseElevenLabsScribeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onInterimRef = useRef(onInterim);
  onInterimRef.current = onInterim;
  const entryCounterRef = useRef(0);
  const isFirstChunkRef = useRef(true);

  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get single-use token from our API route
      const res = await fetch("/api/elevenlabs/token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get ElevenLabs token");
      const { token } = await res.json();

      const params = new URLSearchParams({
        model_id: "scribe_v2_realtime",
        language_code: language,
        audio_format: "pcm_16000",
        commit_strategy: "vad",
        vad_silence_threshold_secs: "2.0",
        vad_threshold: "0.4",
        min_speech_duration_ms: "100",
        min_silence_duration_ms: "100",
        include_timestamps: "true",
        token,
      });

      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`
      );

      ws.onopen = () => {
        setIsConnected(true);
        isFirstChunkRef.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.message_type) {
            case "partial_transcript": {
              // Interim text — show as faint italic, will change
              if (msg.text?.trim()) {
                onInterimRef.current?.(msg.text.trim(), "doctor");
              }
              break;
            }

            case "committed_transcript_with_timestamps": {
              // Final committed segment — clear interim, add to transcript
              onInterimRef.current?.("", "doctor");

              const words: ScribeWord[] = msg.words || [];
              const textWords = words.filter((w: ScribeWord) => w.type === "word");

              if (textWords.length === 0 && msg.text?.trim()) {
                // No word-level data, just plain text
                const entry: TranscriptEntry = {
                  id: `entry-${Date.now()}-${entryCounterRef.current++}`,
                  speaker: "doctor",
                  text: msg.text.trim(),
                  timestamp: Date.now(),
                  words: [],
                  corrected: false,
                };
                onTranscriptRef.current?.(entry);
                break;
              }

              if (textWords.length === 0) break;

              // Group words by speaker
              let currentSpeaker = textWords[0]?.speaker_id ?? "speaker_0";
              let currentWords: ScribeWord[] = [];

              const flushGroup = () => {
                if (currentWords.length === 0) return;

                const wordConfidences: WordConfidence[] = currentWords.map((w) => ({
                  word: w.text,
                  confidence: w.logprob != null ? logprobToConfidence(w.logprob) : 1,
                  start: w.start,
                  end: w.end,
                }));

                const entry: TranscriptEntry = {
                  id: `entry-${Date.now()}-${entryCounterRef.current++}`,
                  speaker: mapSpeaker(currentSpeaker),
                  text: currentWords.map((w) => w.text).join(" "),
                  timestamp: Date.now(),
                  words: wordConfidences,
                  corrected: false,
                };
                onTranscriptRef.current?.(entry);
              };

              for (const w of textWords) {
                const spk = w.speaker_id ?? "speaker_0";
                if (spk !== currentSpeaker) {
                  flushGroup();
                  currentSpeaker = spk;
                  currentWords = [w];
                } else {
                  currentWords.push(w);
                }
              }
              flushGroup();
              break;
            }

            case "committed_transcript": {
              // Final text without timestamps (fallback)
              onInterimRef.current?.("", "doctor");
              if (msg.text?.trim()) {
                const entry: TranscriptEntry = {
                  id: `entry-${Date.now()}-${entryCounterRef.current++}`,
                  speaker: "doctor",
                  text: msg.text.trim(),
                  timestamp: Date.now(),
                  words: [],
                  corrected: false,
                };
                onTranscriptRef.current?.(entry);
              }
              break;
            }

            case "session_started":
              // Connection confirmed
              break;

            default:
              // Handle errors
              if (msg.error) {
                console.error("ElevenLabs Scribe error:", msg.message_type, msg.error);
              }
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to ElevenLabs Scribe";
      setError(message);
    }
  }, [language]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendAudio = useCallback((pcmData: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const message: Record<string, unknown> = {
      message_type: "input_audio_chunk",
      audio_base_64: pcmToBase64(pcmData),
      commit: false,
      sample_rate: 16000,
    };

    // previous_text only allowed on the first chunk
    if (isFirstChunkRef.current) {
      isFirstChunkRef.current = false;
    }

    wsRef.current.send(JSON.stringify(message));
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}

// First speaker = doctor, second = patient
function mapSpeaker(speakerId: string): "doctor" | "patient" {
  return speakerId === "speaker_0" ? "doctor" : "patient";
}
