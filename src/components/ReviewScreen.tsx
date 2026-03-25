"use client";

import { motion } from "motion/react";
import type { TranscriptEntry } from "@/types/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TranscriptView } from "@/components/TranscriptView";
import { NoteEditor } from "@/components/NoteEditor";
import { BillingCodes } from "@/components/BillingCodes";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface ReviewScreenProps {
  entries: TranscriptEntry[];
  startedAt: number | null;
  durationMs: number;
  savedNote: string;
  savedTemplateId: string;
  savedBillingCodes: Array<{ code: string; name: string; points: number; reason: string }>;
  onSaveNote: (note: string, templateId: string) => void;
  onSaveBillingCodes: (codes: Array<{ code: string; name: string; points: number; reason: string }>) => void;
  onNewSession: () => void;
  onBackToList: () => void;
}

export function ReviewScreen({
  entries,
  durationMs,
  savedNote,
  savedTemplateId,
  savedBillingCodes,
  onSaveNote,
  onSaveBillingCodes,
  onNewSession,
  onBackToList,
}: ReviewScreenProps) {
  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: transcript (narrow) */}
        <motion.div
          className="w-[340px] shrink-0 border-r overflow-hidden flex flex-col"
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Button onClick={onBackToList} size="icon-xs" variant="ghost">
              <ArrowLeft className="size-3.5" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider">
              Přepis
            </span>
            <span className="text-[10px] text-muted-foreground/30 tabular-nums ml-auto">
              {formatDuration(durationMs)}
            </span>
          </div>
          <ScrollArea className="flex-1" scrollFade>
            <div className="px-2 pb-4 text-[0.8rem] opacity-75">
              <TranscriptView entries={entries} isRecording={false} />
            </div>
          </ScrollArea>
        </motion.div>

        {/* Right: workspace */}
        <motion.div
          className="flex-1 overflow-hidden flex flex-col"
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <span className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wider">
              Klinická zpráva
            </span>
            <Button
              onClick={onNewSession}
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground/60"
            >
              <RotateCcw className="size-3" />
              Nová relace
            </Button>
          </div>

          <ScrollArea className="flex-1" scrollFade>
            <div className="px-6 pb-8 flex flex-col gap-6">
              <NoteEditor
                transcript={entries}
                savedNote={savedNote}
                savedTemplateId={savedTemplateId}
                onSave={onSaveNote}
                durationMs={durationMs}
              />
              <Separator />
              <BillingCodes
                transcript={entries}
                savedCodes={savedBillingCodes}
                onSave={onSaveBillingCodes}
              />
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </motion.div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
