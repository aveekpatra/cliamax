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
      // Buffer size 4096 gives ~256ms chunks at 16kHz
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (isPausedRef.current) return;
        const float32Data = event.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16LE PCM
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Data[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
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

  return { isRecording, isPaused, error, start, stop, pause, resume };
}
