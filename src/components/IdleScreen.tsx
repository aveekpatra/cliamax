"use client";

import { motion } from "motion/react";
import { Mic, History } from "lucide-react";
import { MicSelector } from "@/components/ui/mic-selector";

interface IdleScreenProps {
  selectedDeviceId: string;
  onStart: () => void;
  onDeviceChange: (deviceId: string) => void;
  onShowHistory: () => void;
}

export function IdleScreen({
  selectedDeviceId,
  onStart,
  onDeviceChange,
  onShowHistory,
}: IdleScreenProps) {
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Record button */}
        <motion.button
          onClick={onStart}
          className="group relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
          whileHover={{ scale: 1.06, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Mic className="size-7" />
        </motion.button>

        {/* Mic selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <MicSelector
            value={selectedDeviceId}
            onValueChange={onDeviceChange}
          />
        </motion.div>

        {/* Hint */}
        <motion.p
          className="text-sm text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Stiskněte pro zahájení nahrávání
        </motion.p>
      </div>

      {/* Past sessions link — bottom of screen */}
      <motion.button
        onClick={onShowHistory}
        className="absolute bottom-6 flex items-center gap-1.5 text-xs text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <History className="size-3" />
        Předchozí relace
      </motion.button>
    </motion.div>
  );
}
