"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TranscriptEntry, WordConfidence } from "@/types/session";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Mic, CheckCircle2 } from "lucide-react";
import { CONFIDENCE_THRESHOLD } from "@/hooks/use-transcript-correction";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
}

export function TranscriptView({ entries, isRecording }: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0 && !isRecording) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mic />
          </EmptyMedia>
          <EmptyTitle>Zatím žádný přepis</EmptyTitle>
          <EmptyDescription>
            Váš rozhovor se zde zobrazí během nahrávání.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  let lastSpeaker: string | null = null;

  return (
    <div className="flex flex-col gap-0.5 px-6 py-5">
      <AnimatePresence initial={false}>
        {entries.map((entry) => {
          const showLabel = entry.speaker !== lastSpeaker;
          lastSpeaker = entry.speaker;
          const isDoctor = entry.speaker === "doctor";

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {showLabel && (
                <motion.div
                  className="mt-5 mb-1.5 first:mt-0 flex items-center gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span
                    className={`text-xs font-medium tracking-wide uppercase ${
                      isDoctor
                        ? "text-foreground/40"
                        : "text-info-foreground/50"
                    }`}
                  >
                    {isDoctor ? "Lékař" : "Pacient"}
                  </span>
                </motion.div>
              )}
              <div
                className={`text-[0.9rem] leading-relaxed ${
                  isDoctor
                    ? "text-foreground/90"
                    : "pl-4 text-foreground/65 border-l-2 border-info/15"
                }`}
              >
                <ConfidenceText entry={entry} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            className="mt-5 flex items-center gap-2 text-muted-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Spinner className="size-3" />
            <span className="text-xs">Naslouchám...</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

/** Renders text with low-confidence words highlighted in amber */
function ConfidenceText({ entry }: { entry: TranscriptEntry }) {
  // If corrected, show corrected text with a subtle check
  if (entry.corrected) {
    return (
      <span className="relative">
        {entry.text}
        <CheckCircle2 className="ml-1 inline-block size-3 text-success/50" />
      </span>
    );
  }

  // If no word-level data, just show plain text
  if (!entry.words || entry.words.length === 0) {
    return <span>{entry.text}</span>;
  }

  return (
    <span>
      {entry.words.map((w: WordConfidence, i: number) => {
        const isLow = w.confidence < CONFIDENCE_THRESHOLD;
        return (
          <span key={`${entry.id}-w${i}`}>
            {i > 0 && " "}
            {isLow ? (
              <span
                className="rounded-sm bg-warning/15 px-0.5 text-warning-foreground decoration-warning/40 decoration-wavy underline underline-offset-2 cursor-help"
                title={`Spolehlivost: ${Math.round(w.confidence * 100)}%`}
              >
                {w.word}
              </span>
            ) : (
              w.word
            )}
          </span>
        );
      })}
    </span>
  );
}
