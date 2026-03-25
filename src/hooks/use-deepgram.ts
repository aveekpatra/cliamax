"use client";

import { useCallback, useRef, useState } from "react";
import type { TranscriptEntry, WordConfidence } from "@/types/session";

interface UseDeepgramOptions {
  language?: string;
  onTranscript?: (entry: TranscriptEntry) => void;
}

interface DeepgramWord {
  word: string;
  speaker: number;
  confidence: number;
  start: number;
  end: number;
}

export function useDeepgram({
  language = "cs",
  onTranscript,
}: UseDeepgramOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const entryCounterRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get temporary token from our API route
      const res = await fetch("/api/cartesia/token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get access token");
      const { token } = await res.json();

      // Optimized for Czech accuracy + low latency
      const params = new URLSearchParams({
        model: "nova-3",
        language,
        punctuate: "true",
        diarize: "true",
        diarize_version: "latest",
        interim_results: "true",
        vad_events: "true",
        endpointing: "300",
        utterance_end_ms: "1000",
        no_delay: "true",
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",
        smart_format: "true",
      });

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params.toString()}`,
        ["token", token]
      );

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Only process final results for diarization + confidence accuracy
          if (
            data.type === "Results" &&
            data.is_final &&
            data.channel?.alternatives?.[0]
          ) {
            const alt = data.channel.alternatives[0];
            if (!alt.transcript?.trim()) return;

            const words: DeepgramWord[] = alt.words || [];

            if (words.length === 0) {
              const entry: TranscriptEntry = {
                id: `entry-${Date.now()}-${entryCounterRef.current++}`,
                speaker: "doctor",
                text: alt.transcript.trim(),
                timestamp: Date.now(),
                words: [],
                corrected: false,
              };
              onTranscriptRef.current?.(entry);
              return;
            }

            // Group words by speaker, preserving confidence data
            let currentSpeaker = words[0]?.speaker ?? 0;
            let currentWords: DeepgramWord[] = [];

            const flushGroup = () => {
              if (currentWords.length === 0) return;

              const wordConfidences: WordConfidence[] = currentWords.map((w) => ({
                word: w.word,
                confidence: w.confidence,
                start: w.start,
                end: w.end,
              }));

              const entry: TranscriptEntry = {
                id: `entry-${Date.now()}-${entryCounterRef.current++}`,
                speaker: mapSpeaker(currentSpeaker),
                text: currentWords.map((w) => w.word).join(" "),
                timestamp: Date.now(),
                words: wordConfidences,
                corrected: false,
              };
              onTranscriptRef.current?.(entry);
            };

            for (const w of words) {
              if (w.speaker !== currentSpeaker) {
                flushGroup();
                currentSpeaker = w.speaker;
                currentWords = [w];
              } else {
                currentWords.push(w);
              }
            }
            flushGroup();
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
        err instanceof Error ? err.message : "Failed to connect to Deepgram";
      setError(message);
    }
  }, [language]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendAudio = useCallback((pcmData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(pcmData);
    }
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}

// Speaker 0 = doctor (first speaker), Speaker 1 = patient
function mapSpeaker(speakerNumber: number): "doctor" | "patient" {
  return speakerNumber === 0 ? "doctor" : "patient";
}
