"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TranscriptEntry } from "@/types/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RotateCcw, Check, X } from "lucide-react";

interface BillingCode {
  code: string;
  name: string;
  points: number;
  reason: string;
}

interface BillingCodesProps {
  transcript: TranscriptEntry[];
  specialtyId?: string;
  savedCodes?: BillingCode[];
  onSave?: (codes: BillingCode[]) => void;
}

export function BillingCodes({
  transcript,
  specialtyId = "001",
  savedCodes = [],
  onSave,
}: BillingCodesProps) {
  const [codes, setCodes] = useState<BillingCode[]>(savedCodes);
  const [removedCodes, setRemovedCodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDetected, setHasDetected] = useState(savedCodes.length > 0);

  const detect = async () => {
    if (transcript.length === 0) return;
    setIsLoading(true);
    setError(null);
    setRemovedCodes(new Set());
    try {
      const res = await fetch("/api/vykony/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, specialtyId }),
      });
      if (!res.ok) throw new Error("Detekce selhala");
      const data = await res.json();
      setCodes(data.results || []);
      setHasDetected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detekce výkonů selhala");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transcript.length > 0 && !hasDetected) {
      detect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCode = (code: string) => {
    setRemovedCodes((prev) => new Set(prev).add(code));
  };

  const activeCodes = codes.filter((c) => !removedCodes.has(c.code));
  const totalPoints = activeCodes.reduce((sum, c) => sum + c.points, 0);

  const handleSave = () => {
    onSave?.(activeCodes);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button
          onClick={detect}
          size="sm"
          variant="ghost"
          className="gap-1.5 text-muted-foreground"
          disabled={isLoading || transcript.length === 0}
        >
          <RotateCcw className="size-3.5" />
          Detekovat znovu
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Sparkles className="size-3 animate-pulse" />
            Analyzuji rozhovor…
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : activeCodes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-muted-foreground/70">
            {hasDetected
              ? "Z rozhovoru nebyly detekovány žádné výkony."
              : "Spusťte detekci výkonů z rozhovoru."}
          </p>
          <Button
            onClick={detect}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={transcript.length === 0}
          >
            {hasDetected ? (
              <>
                <RotateCcw className="size-3.5" />
                Detekovat znovu
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Detekovat výkony
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {activeCodes.map((c, i) => (
              <motion.div
                key={c.code}
                className="flex items-start gap-3 rounded-lg border bg-background p-3"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10, height: 0, padding: 0, margin: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Badge variant="outline" size="sm" className="font-mono shrink-0 mt-0.5">
                  {c.code}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{c.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground/70 tabular-nums">
                    {c.points}b
                  </span>
                  <button
                    onClick={() => removeCode(c.code)}
                    className="text-muted-foreground/45 hover:text-destructive transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            className="flex items-center justify-between pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Check className="size-3" />
              {activeCodes.length}{" "}
              {activeCodes.length === 1 ? "výkon vybrán" : "výkony vybrány"}
              <span className="text-muted-foreground/40">·</span>
              <span className="tabular-nums">{totalPoints} b celkem</span>
            </div>
            {onSave && (
              <Button
                onClick={handleSave}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                Uložit výkony
              </Button>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
