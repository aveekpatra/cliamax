"use client";

import { motion } from "motion/react";
import { Mic, History, Stethoscope } from "lucide-react";
import { MicSelector } from "@/components/ui/mic-selector";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { SPECIALTY_LABELS, type MedicalSpecialty } from "@/lib/medical-vocabulary";

interface IdleScreenProps {
  selectedDeviceId: string;
  selectedSpecialty: MedicalSpecialty;
  onStart: () => void;
  onDeviceChange: (deviceId: string) => void;
  onSpecialtyChange: (specialty: MedicalSpecialty) => void;
  onShowHistory: () => void;
}

const specialtyEntries = Object.entries(SPECIALTY_LABELS) as [MedicalSpecialty, string][];

export function IdleScreen({
  selectedDeviceId,
  selectedSpecialty,
  onStart,
  onDeviceChange,
  onSpecialtyChange,
  onShowHistory,
}: IdleScreenProps) {
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-8">
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

        {/* Specialty selector */}
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

        {/* Mic selector */}
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

        {/* Hint */}
        <motion.p
          className="text-sm text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Stiskněte pro zahájení nahrávání
        </motion.p>
      </div>

      {/* Past sessions link — bottom of screen */}
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
