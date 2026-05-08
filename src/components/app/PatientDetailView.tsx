"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ArrowLeft,
  Mic,
  Pencil,
  Trash2,
  Calendar,
  Phone,
  Mail,
  IdCard,
  FileAudio,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { PatientFormDialog } from "./PatientFormDialog";
import { PatientAvatar } from "./PatientAvatar";
import { StatusChip } from "./StatusChip";
import type { PatientId, ReviewStatus, SessionId } from "./types";

interface PatientDetailViewProps {
  patientId: PatientId;
  onBack: () => void;
  onNewSessionForPatient: (patientId: PatientId) => void;
  onOpenSession: (id: SessionId) => void;
  onDeleted: () => void;
}

export function PatientDetailView({
  patientId,
  onBack,
  onNewSessionForPatient,
  onOpenSession,
  onDeleted,
}: PatientDetailViewProps) {
  const data = useQuery(api.patients.getWithSessions, { id: patientId });
  const updatePatient = useMutation(api.patients.update);
  const removePatient = useMutation(api.patients.remove);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const groups = useMemo(() => {
    if (!data) return [];
    return groupByMonth(data.sessions);
  }, [data]);

  if (data === undefined) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-4 w-32 mt-4" />
        <Skeleton className="h-16 w-full max-w-2xl" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Pacient nebyl nalezen.</p>
        <Button onClick={onBack} size="sm" variant="ghost">
          Zpět
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-6 flex flex-col gap-6">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="size-3" />
          Pacienti
        </button>

        {/* Profile header */}
        <div className="flex items-start gap-5">
          <PatientAvatar name={data.name} className="size-14 text-base" />
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {data.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
              {data.birthDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  {formatDob(data.birthDate)}
                </span>
              )}
              {data.mrn && (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <IdCard className="size-3" />
                  {data.mrn}
                </span>
              )}
              {data.phone && (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Phone className="size-3" />
                  {data.phone}
                </span>
              )}
              {data.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3" />
                  {data.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" />
              Upravit
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onNewSessionForPatient(patientId)}
            >
              <Mic className="size-3.5" />
              Nová relace
            </Button>
          </div>
        </div>

        {data.notes && (
          <>
            <Separator />
            <div>
              <h3 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                Poznámky
              </h3>
              <p className="text-sm whitespace-pre-wrap text-foreground/80">
                {data.notes}
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Session timeline */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              Relace ({data.sessions.length})
            </h2>
          </div>

          {data.sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border bg-card/50 text-center">
              <FileAudio className="size-5 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60">
                Zatím žádné relace pro tohoto pacienta.
              </p>
              <Button
                size="sm"
                className="gap-1.5 mt-2"
                onClick={() => onNewSessionForPatient(patientId)}
              >
                <Mic className="size-3.5" />
                Zahájit relaci
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
                    {group.label}
                  </h3>
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <ul className="divide-y">
                      {group.sessions.map((s) => (
                        <li key={s._id}>
                          <button
                            onClick={() => onOpenSession(s._id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {formatDay(s.createdAt)}
                                </span>
                                <StatusChip
                                  status={(s.reviewStatus ?? "draft") as ReviewStatus}
                                  size="sm"
                                />
                              </div>
                              <div className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-2">
                                <span>{s.transcript.length} položek</span>
                                {s.durationMs && (
                                  <>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span>{formatDuration(s.durationMs)}</span>
                                  </>
                                )}
                                {s.note && (
                                  <>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span>Zpráva uložena</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground/30" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator />

        <div className="flex justify-start">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive-foreground"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Smazat pacienta
          </Button>
        </div>
      </div>

      <PatientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Upravit pacienta"
        initial={{
          name: data.name,
          birthDate: data.birthDate,
          mrn: data.mrn,
          phone: data.phone,
          email: data.email,
          notes: data.notes,
        }}
        onSubmit={async (values) => {
          await updatePatient({ id: patientId, ...values });
          setEditOpen(false);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat pacienta?</AlertDialogTitle>
            <AlertDialogDescription>
              Existující relace budou zachovány, ale nebudou již propojeny s tímto pacientem.
              Akci nelze vrátit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Zrušit</AlertDialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                await removePatient({ id: patientId });
                setDeleteOpen(false);
                onDeleted();
              }}
            >
              Smazat
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}


function formatDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
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

type SessionLike = {
  _id: SessionId;
  createdAt: number;
  transcript: unknown[];
  note?: string;
  reviewStatus?: string;
  durationMs?: number;
};

function groupByMonth(sessions: SessionLike[]) {
  const map = new Map<string, { key: string; label: string; sessions: SessionLike[] }>();
  for (const s of sessions) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: d.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" }),
        sessions: [],
      });
    }
    map.get(key)!.sessions.push(s);
  }
  return Array.from(map.values());
}
