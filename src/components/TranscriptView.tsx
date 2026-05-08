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
import { Mic, CheckCircle2, Check, X, Sparkles } from "lucide-react";
import { CONFIDENCE_THRESHOLD } from "@/hooks/use-transcript-correction";

interface TranscriptViewProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
  interimText?: string;
  interimSpeaker?: "doctor" | "patient";
  /** Doctor clicks a low-confidence entry to request a suggestion */
  onRequestSuggestion?: (entryId: string) => void;
  onAcceptSuggestion?: (entryId: string) => void;
  onDismissSuggestion?: (entryId: string) => void;
  /** Flip the speaker on a single entry (manual diarization correction) */
  onToggleSpeaker?: (entryId: string) => void;
}

export function TranscriptView({
  entries,
  isRecording,
  interimText,
  interimSpeaker = "doctor",
  onRequestSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onToggleSpeaker,
}: TranscriptViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, interimText]);

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
                  {onToggleSpeaker ? (
                    <button
                      type="button"
                      onClick={() => onToggleSpeaker(entry.id)}
                      title="Prohodit roli (Lékař ↔ Pacient)"
                      className={`text-xs font-medium tracking-wide uppercase rounded px-1 -mx-1 cursor-pointer transition-colors hover:bg-accent ${
                        isDoctor
                          ? "text-foreground/40 hover:text-foreground/80"
                          : "text-info-foreground/50 hover:text-info-foreground/80"
                      }`}
                    >
                      {isDoctor ? "Lékař" : "Pacient"}
                    </button>
                  ) : (
                    <span
                      className={`text-xs font-medium tracking-wide uppercase ${
                        isDoctor
                          ? "text-foreground/40"
                          : "text-info-foreground/50"
                      }`}
                    >
                      {isDoctor ? "Lékař" : "Pacient"}
                    </span>
                  )}
                </motion.div>
              )}
              <div
                className={`text-[0.9rem] leading-relaxed ${
                  isDoctor
                    ? "text-foreground/90"
                    : "pl-4 text-foreground/65 border-l-2 border-info/15"
                }`}
              >
                <EntryText
                  entry={entry}
                  onRequestSuggestion={onRequestSuggestion}
                  onAccept={onAcceptSuggestion}
                  onDismiss={onDismissSuggestion}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Interim (partial) results — shown immediately while user speaks */}
      {interimText && (
        <div>
          {interimSpeaker !== lastSpeaker && (
            <div className="mt-5 mb-1.5 flex items-center gap-1.5">
              <span
                className={`text-xs font-medium tracking-wide uppercase ${
                  interimSpeaker === "doctor"
                    ? "text-foreground/40"
                    : "text-info-foreground/50"
                }`}
              >
                {interimSpeaker === "doctor" ? "Lékař" : "Pacient"}
              </span>
            </div>
          )}
          <div
            className={`text-[0.9rem] leading-relaxed italic opacity-50 ${
              interimSpeaker === "doctor"
                ? "text-foreground/90"
                : "pl-4 text-foreground/65 border-l-2 border-info/15"
            }`}
          >
            {interimText}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isRecording && !interimText && (
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

function EntryText({
  entry,
  onRequestSuggestion,
  onAccept,
  onDismiss,
}: {
  entry: TranscriptEntry;
  onRequestSuggestion?: (entryId: string) => void;
  onAccept?: (entryId: string) => void;
  onDismiss?: (entryId: string) => void;
}) {
  // Already accepted a suggestion
  if (entry.corrected) {
    return (
      <span className="relative">
        {entry.text}
        <CheckCircle2 className="ml-1 inline-block size-3 text-success/50" />
      </span>
    );
  }

  // Loading a suggestion
  if (entry.loadingSuggestion) {
    return (
      <span className="relative">
        <span className="opacity-60">{entry.text}</span>
        <Spinner className="ml-1.5 inline-block size-3 align-middle" />
      </span>
    );
  }

  // Suggestion ready — show accept/dismiss
  if (entry.suggestion) {
    return (
      <span className="relative">
        <span className="text-muted-foreground/50 line-through decoration-muted-foreground/30">
          {entry.text}
        </span>
        {" "}
        <span className="rounded-sm bg-info/10 px-1 py-0.5 text-info-foreground/80 border border-info/20">
          {entry.suggestion}
        </span>
        <button
          onClick={() => onAccept?.(entry.id)}
          className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-success/15 text-success hover:bg-success/25 transition-colors align-middle"
          title="Přijmout opravu"
        >
          <Check className="size-3" />
        </button>
        <button
          onClick={() => onDismiss?.(entry.id)}
          className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-destructive/10 text-destructive/70 hover:bg-destructive/20 transition-colors align-middle"
          title="Odmítnout opravu"
        >
          <X className="size-3" />
        </button>
      </span>
    );
  }

  // No word-level data — plain text
  if (!entry.words || entry.words.length === 0) {
    return <span>{entry.text}</span>;
  }

  // Check if this entry has any low-confidence words (clickable)
  const hasLowConfidence = entry.words.some((w) => w.confidence < CONFIDENCE_THRESHOLD);

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
      {/* Show "suggest fix" button for entries with low-confidence words */}
      {hasLowConfidence && onRequestSuggestion && (
        <button
          onClick={() => onRequestSuggestion(entry.id)}
          className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground/60 hover:bg-warning/20 hover:text-warning-foreground/80 transition-colors align-middle"
          title="Navrhnout opravu pomocí AI"
        >
          <Sparkles className="size-2.5" />
          Opravit
        </button>
      )}
    </span>
  );
}
