"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Mic, History, Stethoscope, User, X, ArrowLeft, Check } from "lucide-react";
import { MicSelector } from "@/components/ui/mic-selector";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { SPECIALTY_LABELS, type MedicalSpecialty } from "@/lib/medical-vocabulary";
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

interface IdleScreenProps {
  selectedDeviceId: string;
  selectedSpecialty: MedicalSpecialty;
  selectedPatientId: Id<"patients"> | null;
  onStart: () => void;
  onDeviceChange: (deviceId: string) => void;
  onSpecialtyChange: (specialty: MedicalSpecialty) => void;
  onPatientChange: (id: Id<"patients"> | null) => void;
  onShowHistory: () => void;
  onBack?: () => void;
}

const specialtyEntries = Object.entries(SPECIALTY_LABELS) as [MedicalSpecialty, string][];

export function IdleScreen({
  selectedDeviceId,
  selectedSpecialty,
  selectedPatientId,
  onStart,
  onDeviceChange,
  onSpecialtyChange,
  onPatientChange,
  onShowHistory,
  onBack,
}: IdleScreenProps) {
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Zpět
        </button>
      )}

      <div className="flex flex-col items-center gap-8">
        {/* Patient chip (optional) */}
        <PatientPickerChip
          selectedId={selectedPatientId}
          onChange={onPatientChange}
        />

        {/* Record button */}
        <motion.button
          onClick={onStart}
          className="group relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
          whileHover={{ scale: 1.06, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Mic className="size-7" />
        </motion.button>

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Stethoscope className="size-3.5 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50">Specializace</span>
          </div>
          <Select
            value={selectedSpecialty}
            onValueChange={(val) => onSpecialtyChange(val as MedicalSpecialty)}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Vyberte specializaci" />
            </SelectTrigger>
            <SelectPopup>
              {specialtyEntries.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <MicSelector
            value={selectedDeviceId}
            onValueChange={onDeviceChange}
          />
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Stiskněte pro zahájení nahrávání
        </motion.p>
      </div>

      <motion.button
        onClick={onShowHistory}
        className="absolute bottom-6 flex items-center gap-1.5 text-xs text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <History className="size-3" />
        Předchozí relace
      </motion.button>
    </motion.div>
  );
}

function PatientPickerChip({
  selectedId,
  onChange,
}: {
  selectedId: Id<"patients"> | null;
  onChange: (id: Id<"patients"> | null) => void;
}) {
  const patients = useQuery(api.patients.list);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = patients?.find((p) => p._id === selectedId);
  const filtered = patients?.filter(
    (p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-dashed text-muted-foreground/60 hover:bg-accent"
            )}
          />
        }
      >
        <User className="size-3" />
        {selected ? (
          <>
            <span>{selected.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="opacity-60 hover:opacity-100"
              aria-label="Odpojit pacienta"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <span>Přiřadit pacienta</span>
        )}
      </PopoverTrigger>
      <PopoverPopup className="w-64 p-1.5" align="center">
        <div className="flex items-center gap-2 border-b pb-1.5 mb-1.5 px-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat pacienta…"
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
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors",
              !selectedId && "bg-accent/60"
            )}
          >
            <span className="size-4 flex items-center justify-center">
              {!selectedId && <Check className="size-3" />}
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
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors",
                  selectedId === p._id && "bg-accent/60"
                )}
              >
                <span className="size-4 flex items-center justify-center">
                  {selectedId === p._id && <Check className="size-3" />}
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
