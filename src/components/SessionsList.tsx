"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Mic, Clock, FileText, ChevronRight } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface SessionsListProps {
  onNewSession: () => void;
  onOpenSession: (sessionId: Id<"sessions">) => void;
}

export function SessionsList({ onNewSession, onOpenSession }: SessionsListProps) {
  const sessions = useQuery(api.sessions.list);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <span className="font-heading text-base font-semibold">Relace</span>
        <Button onClick={onNewSession} size="sm" className="gap-1.5">
          <Mic className="size-3.5" />
          Nová relace
        </Button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-auto">
        {sessions === undefined ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Zatím žádné relace</EmptyTitle>
              <EmptyDescription>
                Zahajte novou relaci pro záznam rozhovoru s pacientem.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            {sessions.map((session, i) => (
              <motion.button
                key={session._id}
                onClick={() => onOpenSession(session._id)}
                className="flex items-center gap-4 px-6 py-4 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {session.title}
                    </span>
                    <Badge
                      variant={session.status === "completed" ? "success" : session.status === "recording" ? "error" : "default"}
                      size="sm"
                    >
                      {session.status === "completed" ? "Dokončeno" : session.status === "recording" ? "Nahrávání" : session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/50">
                    <span>{formatDate(session.date)}</span>
                    {session.durationMs && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDuration(session.durationMs)}
                      </span>
                    )}
                    <span>{session.transcript.length} položek</span>
                    {session.note && (
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        Zpráva uložena
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/30 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
