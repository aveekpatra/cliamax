"use client";

import { UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import type { SessionStatus } from "@/types/session";

interface NavBarProps {
  status: SessionStatus;
}

export function NavBar({ status }: NavBarProps) {
  const isRecording = status === "recording" || status === "paused";

  return (
    <motion.nav
      className="flex items-center justify-between px-5 py-2.5 border-b bg-background/80 backdrop-blur-sm z-50"
      animate={{ opacity: isRecording ? 0.4 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <span className="font-heading text-sm font-semibold tracking-tight">
        Claimax
      </span>
      <UserButton
        appearance={{
          elements: { avatarBox: "size-7" },
        }}
      />
    </motion.nav>
  );
}
