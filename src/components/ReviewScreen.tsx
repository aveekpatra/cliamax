"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { TranscriptEntry } from "@/types/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TranscriptView } from "@/components/TranscriptView";
import { NoteEditor } from "@/components/NoteEditor";
import { BillingCodes } from "@/components/BillingCodes";
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/ui/popover";
import {
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/app/StatusChip";
import {
  REVIEW_STATUS_ORDER,
  type ReviewStatus,
  type PatientId,
} from "@/components/app/types";
import type { Id } from "../../convex/_generated/dataModel";

interface ReviewScreenProps {
  sessionId: Id<"sessions"> | null;
  entries: TranscriptEntry[];
  startedAt: number | null;
  durationMs: number;
  savedNote: string;
  savedTemplateId: string;
  savedBillingCodes: Array<{ code: string; name: string; points: number; reason: string }>;
  patientId: PatientId | null;
  reviewStatus: ReviewStatus;
  isReprocessing?: boolean;
  onSaveNote: (note: string, templateId: string) => void;
  onSaveBillingCodes: (codes: Array<{ code: string; name: string; points: number; reason: string }>) => void;
  onRequestSuggestion?: (entryId: string) => void;
  onAcceptSuggestion?: (entryId: string) => void;
  onDismissSuggestion?: (entryId: string) => void;
  onLinkPatient: (id: PatientId | null) => void;
  onChangeReviewStatus: (status: ReviewStatus) => void;
  onNewSession: () => void;
  onBackToList: () => void;
}

export function ReviewScreen({
  entries,
  startedAt,
  durationMs,
  savedNote,
  savedTemplateId,
  savedBillingCodes,
  patientId,
  reviewStatus,
  isReprocessing,
  onSaveNote,
  onSaveBillingCodes,
  onRequestSuggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
  onLinkPatient,
  onChangeReviewStatus,
  onNewSession,
  onBackToList,
}: ReviewScreenProps) {
  const patients = useQuery(api.patients.list);
  const selected = patients?.find((p) => p._id === patientId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Left: transcript rail */}
        <div className="w-[340px] shrink-0 border-r overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Button onClick={onBackToList} size="icon-xs" variant="ghost">
              <ArrowLeft className="size-3.5" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              Přepis
            </span>
            {isReprocessing && (
              <span className="flex items-center gap-1 text-[10px] text-info/70">
                <RefreshCw className="size-2.5 animate-spin" />
                Zpřesňování…
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 tabular-nums ml-auto">
              {formatDuration(durationMs)}
            </span>
          </div>
          <ScrollArea className="flex-1" scrollFade>
            <div className="px-2 pb-4 text-[0.8rem] opacity-80">
              <TranscriptView
                entries={entries}
                isRecording={false}
                onRequestSuggestion={onRequestSuggestion}
                onAcceptSuggestion={onAcceptSuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Right: workspace */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1" scrollFade>
            <div className="max-w-4xl mx-auto px-8 py-8 flex flex-col gap-8">
              {/* Header */}
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1
                      className={cn(
                        "font-heading text-2xl font-semibold tracking-tight truncate",
                        !selected && "text-muted-foreground/70"
                      )}
                    >
                      {selected?.name ?? "Bez pacienta"}
                    </h1>
                    <PatientChip
                      patientId={patientId}
                      onChange={onLinkPatient}
                      label={selected ? "Změnit" : "Přiřadit pacienta"}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground/80 mt-1 flex items-center gap-2">
                    <span>{formatDate(startedAt)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{formatDuration(durationMs)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{entries.length} {pluralRepliky(entries.length)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPicker status={reviewStatus} onChange={onChangeReviewStatus} />
                  <Button
                    onClick={onNewSession}
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-muted-foreground/80"
                  >
                    <RotateCcw className="size-3.5" />
                    Nová relace
                  </Button>
                </div>
              </header>

              {/* Zpráva */}
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                  Zpráva
                </h2>
                <div className="rounded-xl border bg-card p-5">
                  <NoteEditor
                    transcript={entries}
                    savedNote={savedNote}
                    savedTemplateId={savedTemplateId}
                    onSave={onSaveNote}
                    durationMs={durationMs}
                  />
                </div>
              </section>

              {/* Výkony */}
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                  Výkony
                </h2>
                <div className="rounded-xl border bg-card p-5">
                  <BillingCodes
                    transcript={entries}
                    savedCodes={savedBillingCodes}
                    onSave={onSaveBillingCodes}
                  />
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function PatientChip({
  patientId,
  onChange,
  label,
}: {
  patientId: PatientId | null;
  onChange: (id: PatientId | null) => void;
  label: string;
}) {
  const patients = useQuery(api.patients.list);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = patients?.filter(
    (p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground/80 hover:text-foreground hover:bg-accent transition-colors" />
        }
      >
        <span>{label}</span>
        <ChevronDown className="size-3 opacity-60" />
      </PopoverTrigger>
      <PopoverPopup className="w-64 p-1.5" align="start">
        <div className="flex items-center gap-2 border-b pb-1.5 mb-1.5 px-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-auto flex flex-col gap-0.5">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent",
              !patientId && "bg-accent/60"
            )}
          >
            <span className="size-4 flex items-center justify-center">
              {!patientId && <Check className="size-3" />}
            </span>
            <span className="text-muted-foreground/80">Bez pacienta</span>
          </button>
          {filtered?.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 py-2 px-2">Žádní pacienti.</p>
          ) : (
            filtered?.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  onChange(p._id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent",
                  patientId === p._id && "bg-accent/60"
                )}
              >
                <span className="size-4 flex items-center justify-center">
                  {patientId === p._id && <Check className="size-3" />}
                </span>
                <span className="truncate">{p.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

function StatusPicker({
  status,
  onChange,
}: {
  status: ReviewStatus;
  onChange: (s: ReviewStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent transition-colors" />
        }
      >
        <StatusChip status={status} size="sm" className="border-none px-0" />
        <ChevronDown className="size-3 opacity-60" />
      </PopoverTrigger>
      <PopoverPopup className="w-44 p-1" align="start">
        <div className="flex flex-col">
          {REVIEW_STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent",
                status === s && "bg-accent/60"
              )}
            >
              <span className="size-4 flex items-center justify-center">
                {status === s && <Check className="size-3" />}
              </span>
              <StatusChip status={s} size="sm" className="border-none px-0" />
            </button>
          ))}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatDate(ts: number | null): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pluralRepliky(n: number): string {
  if (n === 1) return "replika";
  if (n >= 2 && n <= 4) return "repliky";
  return "replik";
}
