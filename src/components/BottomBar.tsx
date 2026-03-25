"use client";

import { motion } from "motion/react";
import type { SessionStatus } from "@/types/session";
import { Button } from "@/components/ui/button";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { MicSelector } from "@/components/ui/mic-selector";
import { Pause, Square, Play } from "lucide-react";

interface BottomBarProps {
  status: SessionStatus;
  selectedDeviceId: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDeviceChange: (deviceId: string) => void;
}

export function BottomBar({
  status,
  selectedDeviceId,
  onPause,
  onResume,
  onStop,
  onDeviceChange,
}: BottomBarProps) {
  return (
    <motion.div
      className="flex items-center gap-4 border-t bg-background/80 backdrop-blur-sm px-5 py-3"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Left: controls */}
      <div className="flex items-center gap-1">
        {status === "paused" ? (
          <Button onClick={onResume} size="icon" variant="ghost">
            <Play className="size-4" />
          </Button>
        ) : (
          <Button onClick={onPause} size="icon" variant="ghost">
            <Pause className="size-4" />
          </Button>
        )}
        <Button onClick={onStop} size="icon" variant="ghost">
          <Square className="size-3.5" />
        </Button>
      </div>

      {/* Center: waveform */}
      <div className="flex-1 min-w-0">
        <LiveWaveform
          active={status === "recording"}
          processing={status === "paused"}
          deviceId={selectedDeviceId || undefined}
          mode="scrolling"
          height={28}
          barWidth={2}
          barGap={1}
          sensitivity={1.5}
        />
      </div>

      {/* Right: mic */}
      <MicSelector
        value={selectedDeviceId}
        onValueChange={onDeviceChange}
        disabled
      />
    </motion.div>
  );
}
