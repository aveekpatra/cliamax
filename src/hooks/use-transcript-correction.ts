"use client";

import { useCallback, useRef } from "react";
import type { TranscriptEntry } from "@/types/session";
import type { MedicalSpecialty } from "@/lib/medical-vocabulary";

const CONFIDENCE_THRESHOLD = 0.70;

// How many surrounding entries to send as context
const CONTEXT_WINDOW = 3;

interface UseTranscriptCorrectionOptions {
  /** Access to all current entries for context */
  getEntries: () => TranscriptEntry[];
  /** Medical specialty for vocabulary context */
  specialty?: MedicalSpecialty;
}

/**
 * On-demand transcript correction. The doctor clicks a low-confidence
 * segment, we call the LLM for that single entry with surrounding
 * context, and return a suggestion.
 */
export function useTranscriptCorrection({
  getEntries,
  specialty = "general",
}: UseTranscriptCorrectionOptions) {
  const specialtyRef = useRef(specialty);
  specialtyRef.current = specialty;

  /**
   * Request a correction for a single entry. Returns the suggested text,
   * or null if no correction was produced / the LLM returned the same text.
   */
  const requestCorrection = useCallback(
    async (entryId: string): Promise<string | null> => {
      const allEntries = getEntries();
      const entry = allEntries.find((e) => e.id === entryId);
      if (!entry) return null;

      // Gather surrounding context
      const idx = allEntries.indexOf(entry);
      const contextEntries: Array<{ id: string; speaker: string; text: string }> = [];
      for (
        let i = Math.max(0, idx - CONTEXT_WINDOW);
        i <= Math.min(allEntries.length - 1, idx + CONTEXT_WINDOW);
        i++
      ) {
        if (allEntries[i].id !== entryId) {
          contextEntries.push({
            id: allEntries[i].id,
            speaker: allEntries[i].speaker,
            text: allEntries[i].text,
          });
        }
      }

      try {
        const res = await fetch("/api/ai/correct-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: [{ id: entry.id, speaker: entry.speaker, text: entry.text }],
            context: contextEntries,
            specialty: specialtyRef.current,
          }),
        });

        if (!res.ok) return null;

        const { corrections } = await res.json();
        if (!corrections || corrections.length === 0) return null;

        const correction = corrections[0];
        // Only return if the LLM actually changed something
        if (correction.correctedText && correction.correctedText !== entry.text) {
          return correction.correctedText;
        }
        return null;
      } catch {
        return null;
      }
    },
    [getEntries]
  );

  return { requestCorrection };
}

export { CONFIDENCE_THRESHOLD };
