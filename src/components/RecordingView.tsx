"use client";

import { motion } from "motion/react";
import type { TranscriptEntry, SessionStatus } from "@/types/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptView } from "@/components/TranscriptView";
import { BottomBar } from "@/components/BottomBar";

interface RecordingViewProps {
  status: SessionStatus;
  entries: TranscriptEntry[];
  selectedDeviceId: string;
  startedAt: number | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNewSession: () => void;
  onDeviceChange: (deviceId: string) => void;
  sidebarTrigger?: React.ReactNode;
}

export function RecordingView({
  status,
  entries,
  selectedDeviceId,
  onPause,
  onResume,
  onStop,
  onDeviceChange,
}: RecordingViewProps) {
  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.35 }}
    >
      {/* Status indicator */}
      <div className="flex justify-end px-5 pt-3 pb-0">
        {status === "recording" && (
          <motion.span
            className="flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="size-1.5 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] text-muted-foreground/40 font-medium tracking-wider">
              NAHRÁVÁNÍ
            </span>
          </motion.span>
        )}
        {status === "paused" && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] text-muted-foreground/40 font-medium tracking-wider">
              POZASTAVENO
            </span>
          </span>
        )}
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" scrollFade>
          <TranscriptView
            entries={entries}
            isRecording={status === "recording"}
          />
        </ScrollArea>
      </div>

      {/* Bottom bar */}
      <BottomBar
        status={status}
        selectedDeviceId={selectedDeviceId}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onDeviceChange={onDeviceChange}
      />
    </motion.div>
  );
}
