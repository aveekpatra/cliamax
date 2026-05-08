"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogPopup,
  DialogPortal,
  DialogBackdrop,
  DialogViewport,
} from "@/components/ui/dialog";
import { Search, User, FileAudio, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientId, ReviewStatus, SessionId } from "./types";
import { StatusChip } from "./StatusChip";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPatient: (id: PatientId) => void;
  onOpenSession: (id: SessionId) => void;
  onNewSession: () => void;
  onNewPatient: () => void;
}

type Row =
  | { kind: "action"; id: string; label: string; icon: React.ReactNode; onRun: () => void }
  | {
      kind: "patient";
      id: PatientId;
      label: string;
      subtitle?: string;
      onRun: () => void;
    }
  | {
      kind: "session";
      id: SessionId;
      label: string;
      subtitle: string;
      status: ReviewStatus;
      onRun: () => void;
    };

export function CommandPalette({
  open,
  onOpenChange,
  onOpenPatient,
  onOpenSession,
  onNewSession,
  onNewPatient,
}: CommandPaletteProps) {
  const patients = useQuery(api.patients.list, open ? {} : "skip");
  const sessions = useQuery(api.sessions.list, open ? {} : "skip");
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const query = q.trim().toLowerCase();
    const actions: Row[] = [
      {
        kind: "action",
        id: "new-session",
        label: "Nová relace",
        icon: <Mic className="size-3.5" />,
        onRun: () => {
          onOpenChange(false);
          onNewSession();
        },
      },
      {
        kind: "action",
        id: "new-patient",
        label: "Nový pacient",
        icon: <Plus className="size-3.5" />,
        onRun: () => {
          onOpenChange(false);
          onNewPatient();
        },
      },
    ];

    const patientRows: Row[] = (patients ?? [])
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.mrn?.toLowerCase().includes(query)
      )
      .slice(0, 8)
      .map((p) => ({
        kind: "patient",
        id: p._id,
        label: p.name,
        subtitle: [
          p.mrn,
          p.sessionCount > 0 ? `${p.sessionCount} relací` : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
        onRun: () => {
          onOpenChange(false);
          onOpenPatient(p._id);
        },
      }));

    const sessionRows: Row[] = (sessions ?? [])
      .filter(
        (s) =>
          !query ||
          s.title.toLowerCase().includes(query) ||
          s.patient?.name.toLowerCase().includes(query)
      )
      .slice(0, 8)
      .map((s) => ({
        kind: "session",
        id: s._id,
        label: s.patient?.name ?? s.title,
        subtitle: formatDate(s.date),
        status: (s.reviewStatus ?? "draft") as ReviewStatus,
        onRun: () => {
          onOpenChange(false);
          onOpenSession(s._id);
        },
      }));

    if (query) {
      const filteredActions = actions.filter((a) =>
        a.label.toLowerCase().includes(query)
      );
      return [...filteredActions, ...patientRows, ...sessionRows];
    }
    return [...actions, ...patientRows, ...sessionRows];
  }, [q, patients, sessions, onOpenChange, onNewSession, onNewPatient, onOpenPatient, onOpenSession]);

  useEffect(() => {
    if (cursor >= rows.length) setCursor(Math.max(0, rows.length - 1));
  }, [rows.length, cursor]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      rows[cursor]?.onRun();
    }
  };

  const grouped = useMemo(() => {
    const actions = rows.filter((r) => r.kind === "action");
    const ps = rows.filter((r) => r.kind === "patient");
    const ss = rows.filter((r) => r.kind === "session");
    return { actions, patients: ps, sessions: ss };
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport className="items-start pt-[12vh]">
          <DialogPopup
            showCloseButton={false}
            className="max-w-xl p-0 overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b px-3 py-2.5">
              <Search className="size-4 text-muted-foreground/60" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Hledat pacienty, relace, akce…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-auto p-1.5">
              {rows.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-8">
                  Žádné výsledky.
                </p>
              ) : (
                <>
                  {grouped.actions.length > 0 && (
                    <Section label="Akce">
                      {grouped.actions.map((r) => (
                        <Row
                          key={r.id}
                          row={r}
                          active={rows[cursor]?.id === r.id}
                          onHover={() =>
                            setCursor(rows.findIndex((x) => x.id === r.id))
                          }
                        />
                      ))}
                    </Section>
                  )}
                  {grouped.patients.length > 0 && (
                    <Section label="Pacienti">
                      {grouped.patients.map((r) => (
                        <Row
                          key={r.id}
                          row={r}
                          active={rows[cursor]?.id === r.id}
                          onHover={() =>
                            setCursor(rows.findIndex((x) => x.id === r.id))
                          }
                        />
                      ))}
                    </Section>
                  )}
                  {grouped.sessions.length > 0 && (
                    <Section label="Relace">
                      {grouped.sessions.map((r) => (
                        <Row
                          key={r.id}
                          row={r}
                          active={rows[cursor]?.id === r.id}
                          onHover={() =>
                            setCursor(rows.findIndex((x) => x.id === r.id))
                          }
                        />
                      ))}
                    </Section>
                  )}
                </>
              )}
            </div>

            <div className="border-t px-3 py-2 text-[11px] text-muted-foreground/50 flex items-center justify-between">
              <span>↑ ↓ navigovat · ↵ otevřít · esc zavřít</span>
            </div>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({
  row,
  active,
  onHover,
}: {
  row: Row;
  active: boolean;
  onHover: () => void;
}) {
  return (
    <button
      onClick={row.onRun}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
        active ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <span className="size-5 flex items-center justify-center text-muted-foreground/60">
        {row.kind === "patient" ? (
          <User className="size-3.5" />
        ) : row.kind === "session" ? (
          <FileAudio className="size-3.5" />
        ) : (
          row.icon
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{row.label}</span>
        {row.kind !== "action" && row.subtitle && (
          <span className="block text-xs text-muted-foreground/60 truncate">
            {row.subtitle}
          </span>
        )}
      </span>
      {row.kind === "session" && <StatusChip status={row.status} size="sm" />}
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
