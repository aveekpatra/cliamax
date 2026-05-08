"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { PatientFormDialog } from "./PatientFormDialog";
import { PatientAvatar } from "./PatientAvatar";
import type { PatientId } from "./types";

interface PatientsViewProps {
  onOpenPatient: (id: PatientId) => void;
}

export function PatientsView({ onOpenPatient }: PatientsViewProps) {
  const patients = useQuery(api.patients.list);
  const createPatient = useMutation(api.patients.create);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [patients, query]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-8 pt-8 pb-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Pacienti</h1>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {patients ? `${patients.length} záznamů` : "Načítání…"}
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
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" />
            Nový pacient
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {patients === undefined ? (
          <div className="flex flex-col gap-2 mt-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : patients.length === 0 ? (
          <Empty className="mt-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Žádní pacienti</EmptyTitle>
              <EmptyDescription>
                Přidejte svého prvního pacienta, abyste k němu mohli připojovat relace.
              </EmptyDescription>
            </EmptyHeader>
            <Button size="sm" className="gap-1.5 mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" />
              Nový pacient
            </Button>
          </Empty>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-12">
            Žádné výsledky pro „{query}".
          </p>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Jméno</TableHead>
                  <TableHead>Pojištěnec</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead className="text-right">Relací</TableHead>
                  <TableHead className="text-right pr-4">Poslední návštěva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p._id}
                    className="cursor-pointer"
                    onClick={() => onOpenPatient(p._id)}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <PatientAvatar name={p.name} className="size-7 text-xs" />
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          {p.birthDate && (
                            <div className="text-[11px] text-muted-foreground/60">
                              {formatDob(p.birthDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/70 tabular-nums">
                      {p.mrn ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/70">
                      {p.phone ?? p.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {p.sessionCount}
                    </TableCell>
                    <TableCell className="text-right pr-4 text-sm text-muted-foreground/70">
                      {p.lastVisit ? formatRelative(p.lastVisit) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PatientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => {
          const id = await createPatient(data);
          setDialogOpen(false);
          onOpenPatient(id);
        }}
      />
    </div>
  );
}

function formatDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return "před chvílí";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `před ${days} d`;
  return new Date(ts).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
  });
}
