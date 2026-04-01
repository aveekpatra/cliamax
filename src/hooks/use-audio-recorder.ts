"use client";

import { useCallback, useRef, useState } from "react";

interface UseAudioRecorderOptions {
  deviceId?: string;
  sampleRate?: number;
  onAudioData?: (pcmData: ArrayBuffer) => void;
}

export function useAudioRecorder({
  deviceId,
  sampleRate = 16000,
  onAudioData,
}: UseAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;
  const isPausedRef = useRef(false);

  // Accumulate raw PCM chunks for Whisper second-pass
  const recordedChunksRef = useRef<Int16Array[]>([]);

  const start = useCallback(async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, sampleRate, channelCount: 1 }
          : { sampleRate, channelCount: 1 },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // Buffer size 1600 gives ~100ms chunks at 16kHz (optimal for streaming STT)
      // Note: ScriptProcessorNode rounds to nearest power-of-2, so we use 2048 (~128ms)
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      recordedChunksRef.current = [];

      processor.onaudioprocess = (event) => {
        if (isPausedRef.current) return;
        const float32Data = event.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16LE PCM
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Data[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Store for Whisper second-pass
        recordedChunksRef.current.push(new Int16Array(int16Data));
        onAudioDataRef.current?.(int16Data.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setIsPaused(false);
      isPausedRef.current = false;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
    }
  }, [deviceId, sampleRate]);

  const stop = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;

    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  /** Get recorded audio as a WAV Blob for Whisper second-pass */
  const getRecording = useCallback((): Blob | null => {
    const chunks = recordedChunksRef.current;
    if (chunks.length === 0) return null;

    // Concatenate all PCM chunks
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const pcm = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Build WAV header (44 bytes) + PCM data
    const wavBuffer = new ArrayBuffer(44 + pcm.byteLength);
    const view = new DataView(wavBuffer);
    const sr = sampleRate;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sr * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    // RIFF header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + pcm.byteLength, true);
    writeString(view, 8, "WAVE");
    // fmt chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    // data chunk
    writeString(view, 36, "data");
    view.setUint32(40, pcm.byteLength, true);
    new Int16Array(wavBuffer, 44).set(pcm);

    return new Blob([wavBuffer], { type: "audio/wav" });
  }, [sampleRate]);

  return { isRecording, isPaused, error, start, stop, pause, resume, getRecording };
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
