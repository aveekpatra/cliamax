"use client";

import { useCallback, useRef } from "react";
import type { TranscriptEntry } from "@/types/session";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;
const CONFIDENCE_THRESHOLD = 0.85;

interface UseTranscriptCorrectionOptions {
  /** Called when entries are corrected — update your state */
  onCorrected: (corrections: Array<{ id: string; correctedText: string }>) => void;
}

/**
 * Batches uncorrected transcript entries and sends them to the LLM
 * for medical terminology correction. Only sends entries that have
 * at least one low-confidence word.
 */
export function useTranscriptCorrection({ onCorrected }: UseTranscriptCorrectionOptions) {
  const pendingRef = useRef<TranscriptEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);

  const flush = useCallback(async () => {
    if (inflightRef.current || pendingRef.current.length === 0) return;

    inflightRef.current = true;
    const batch = pendingRef.current.splice(0, BATCH_SIZE);

    try {
      const res = await fetch("/api/ai/correct-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: batch.map((e) => ({
            id: e.id,
            speaker: e.speaker,
            text: e.text,
          })),
        }),
      });

      if (res.ok) {
        const { corrections } = await res.json();
        if (corrections && corrections.length > 0) {
          // Only pass through corrections that actually changed the text
          const realCorrections = corrections.filter(
            (c: { id: string; correctedText: string }) => {
              const original = batch.find((e) => e.id === c.id);
              return original && c.correctedText !== original.text;
            }
          );
          if (realCorrections.length > 0) {
            onCorrected(realCorrections);
          }
        }
      }
    } catch {
      // Silent failure — transcript stays as-is, doctor can still see confidence highlights
    } finally {
      inflightRef.current = false;
      // If more entries queued, flush again
      if (pendingRef.current.length > 0) {
        flush();
      }
    }
  }, [onCorrected]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush();
    }, BATCH_DELAY_MS);
  }, [flush]);

  /**
   * Enqueue an entry for correction. Only entries with low-confidence
   * words are actually sent to the LLM — high-confidence entries are skipped.
   */
  const enqueue = useCallback(
    (entry: TranscriptEntry) => {
      // Check if any word is below confidence threshold
      const hasLowConfidence = entry.words?.some(
        (w) => w.confidence < CONFIDENCE_THRESHOLD
      );

      if (!hasLowConfidence) return; // Skip — Deepgram was confident enough

      pendingRef.current.push(entry);

      if (pendingRef.current.length >= BATCH_SIZE) {
        flush();
      } else {
        scheduleFlush();
      }
    },
    [flush, scheduleFlush]
  );

  /** Force flush any remaining entries (call on session stop) */
  const flushRemaining = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flush();
  }, [flush]);

  return { enqueue, flushRemaining };
}

export { CONFIDENCE_THRESHOLD };
