"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Mic, Users, FileAudio, AlertCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "./StatusChip";
import { PatientAvatar } from "./PatientAvatar";
import type { ReviewStatus, PatientId, SessionId } from "./types";

interface DashboardViewProps {
  onNewSession: () => void;
  onOpenPatients: () => void;
  onOpenSessions: () => void;
  onOpenPatient: (id: PatientId) => void;
  onOpenSession: (id: SessionId) => void;
}

export function DashboardView({
  onNewSession,
  onOpenPatients,
  onOpenSessions,
  onOpenPatient,
  onOpenSession,
}: DashboardViewProps) {
  const stats = useQuery(api.sessions.dashboardStats);
  const sessions = useQuery(api.sessions.list, {});
  const patients = useQuery(api.patients.list);

  const recentSessions = (sessions ?? []).slice(0, 6);
  const recentPatients = (patients ?? []).slice(0, 5);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-10">
        {/* Greeting + primary CTA */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {greeting()}
            </h1>
            <p className="text-sm text-muted-foreground/85 mt-1">
              Zahajte novou relaci nebo pokračujte ve své práci.
            </p>
          </div>
          <Button onClick={onNewSession} size="sm" className="gap-1.5">
            <Mic className="size-3.5" />
            Nová relace
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Dnes"
            value={stats?.today}
            icon={<Mic className="size-3.5" />}
          />
          <StatCard
            label="Tento týden"
            value={stats?.week}
            icon={<Clock className="size-3.5" />}
          />
          <StatCard
            label="Nepodepsané"
            value={stats?.unsigned}
            icon={<AlertCircle className="size-3.5" />}
            tone={stats?.unsigned ? "warning" : "default"}
          />
          <StatCard
            label="Pacienti"
            value={stats?.totalPatients}
            icon={<Users className="size-3.5" />}
          />
        </div>

        {/* Two columns: recent sessions + recent patients */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
          {/* Recent sessions */}
          <section className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                Nedávné relace
              </h2>
              <button
                onClick={onOpenSessions}
                className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors flex items-center gap-1"
              >
                Všechny
                <ArrowRight className="size-3" />
              </button>
            </header>

            <div className="rounded-xl border bg-card overflow-hidden">
              {sessions === undefined ? (
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <FileAudio className="size-5 text-muted-foreground/45" />
                  <p className="text-sm text-muted-foreground/80">
                    Zatím žádné relace
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {recentSessions.map((s) => (
                    <li key={s._id}>
                      <button
                        onClick={() => onOpenSession(s._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {s.patient?.name ?? s.title}
                            </span>
                            <StatusChip
                              status={(s.reviewStatus ?? "draft") as ReviewStatus}
                              size="sm"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                            <span>{formatRelative(s.createdAt)}</span>
                            <span className="text-muted-foreground/45">·</span>
                            <span>{s.transcript.length} položek</span>
                            {s.durationMs && (
                              <>
                                <span className="text-muted-foreground/45">·</span>
                                <span>{formatDuration(s.durationMs)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground/45" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Recent patients */}
          <section className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                Pacienti
              </h2>
              <button
                onClick={onOpenPatients}
                className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors flex items-center gap-1"
              >
                Všichni
                <ArrowRight className="size-3" />
              </button>
            </header>

            <div className="rounded-xl border bg-card overflow-hidden">
              {patients === undefined ? (
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                  <Users className="size-5 text-muted-foreground/45" />
                  <p className="text-sm text-muted-foreground/80">
                    Zatím žádní pacienti
                  </p>
                  <p className="text-xs text-muted-foreground/65">
                    Přidejte pacienta přes stránku Pacienti.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {recentPatients.map((p) => (
                    <li key={p._id}>
                      <button
                        onClick={() => onOpenPatient(p._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <PatientAvatar name={p.name} className="size-7 text-xs" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground/80">
                            {p.sessionCount} relací
                            {p.lastVisit && (
                              <>
                                <span className="text-muted-foreground/45 mx-1">·</span>
                                {formatRelative(p.lastVisit)}
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1.5">
      <div
        className={
          tone === "warning"
            ? "flex items-center gap-1.5 text-warning-foreground"
            : "flex items-center gap-1.5 text-muted-foreground/80"
        }
      >
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-heading text-2xl font-semibold tabular-nums">
        {value === undefined ? (
          <Skeleton className="h-7 w-8" />
        ) : (
          value.toLocaleString("cs-CZ")
        )}
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Dobrou noc";
  if (h < 12) return "Dobré ráno";
  if (h < 18) return "Dobré odpoledne";
  return "Dobrý večer";
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "právě teď";
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `před ${days} d`;
  return new Date(ts).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
  });
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

