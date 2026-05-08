"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Mic, FileAudio, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { REVIEW_STATUS_LABEL, REVIEW_STATUS_ORDER, type ReviewStatus, type SessionId } from "./types";

interface SessionsListViewProps {
  onNewSession: () => void;
  onOpenSession: (id: SessionId) => void;
}

export function SessionsListView({ onNewSession, onOpenSession }: SessionsListViewProps) {
  const sessions = useQuery(api.sessions.list, {});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");

  const filtered = useMemo(() => {
    if (!sessions) return [];
    let result = sessions;
    if (statusFilter !== "all") {
      result = result.filter((s) => (s.reviewStatus ?? "draft") === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.patient?.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sessions, query, statusFilter]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-8 pt-8 pb-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Relace</h1>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {sessions ? `${sessions.length} celkem` : "Načítání…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat…"
            size="sm"
            className="w-60 bg-white"
          />
          <Button size="sm" className="gap-1.5" onClick={onNewSession}>
            <Mic className="size-3.5" />
            Nová relace
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 px-8 pb-3">
        <FilterChip
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        >
          Vše
          {sessions && (
            <span className="ml-1.5 opacity-50 tabular-nums">
              {sessions.length}
            </span>
          )}
        </FilterChip>
        {REVIEW_STATUS_ORDER.map((status) => {
          const count = sessions?.filter(
            (s) => (s.reviewStatus ?? "draft") === status
          ).length;
          return (
            <FilterChip
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {REVIEW_STATUS_LABEL[status]}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 opacity-50 tabular-nums">
                  {count}
                </span>
              )}
            </FilterChip>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {sessions === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : sessions.length === 0 ? (
          <Empty className="mt-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileAudio />
              </EmptyMedia>
              <EmptyTitle>Zatím žádné relace</EmptyTitle>
              <EmptyDescription>
                Zahajte novou relaci pro záznam rozhovoru s pacientem.
              </EmptyDescription>
            </EmptyHeader>
            <Button size="sm" className="gap-1.5 mt-4" onClick={onNewSession}>
              <Mic className="size-3.5" />
              Nová relace
            </Button>
          </Empty>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-12">
            Žádné výsledky.
          </p>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <ul className="divide-y">
              {filtered.map((s) => (
                <li key={s._id}>
                  <button
                    onClick={() => onOpenSession(s._id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {s.patient?.name ?? s.title}
                        </span>
                        <StatusChip
                          status={(s.reviewStatus ?? "draft") as ReviewStatus}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        {s.patient ? (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {s.patient.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">Bez pacienta</span>
                        )}
                        <span className="text-muted-foreground/30">·</span>
                        <span>{formatDate(s.date)}</span>
                        {s.durationMs && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span>{formatDuration(s.durationMs)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground/30 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-[background-color,box-shadow] active:shadow-none",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_0_0_rgba(0,0,0,0.18)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_0_0_rgba(0,0,0,0.18)]"
          : "bg-white text-muted-foreground/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_0_0_rgba(0,0,0,0.04)] hover:bg-accent hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05)]"
      )}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}
