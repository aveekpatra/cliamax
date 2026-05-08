"use client";

import { cn } from "@/lib/utils";
import { REVIEW_STATUS_LABEL, type ReviewStatus } from "./types";

interface StatusChipProps {
  status: ReviewStatus;
  size?: "sm" | "default";
  className?: string;
}

const DOT: Record<ReviewStatus, string> = {
  draft: "bg-muted-foreground/40",
  reviewed: "bg-info",
  signed: "bg-success",
};

export function StatusChip({ status, size = "default", className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        "text-muted-foreground/80",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", DOT[status])} />
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
}
