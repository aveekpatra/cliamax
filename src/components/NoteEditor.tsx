"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import type { TranscriptEntry } from "@/types/session";
import { exportToDocx } from "@/lib/export-docx";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateSelector, type ResolvedTemplate } from "@/components/TemplateSelector";
import { Sparkles, Save, RotateCcw, Pencil, Eye, Download } from "lucide-react";

interface NoteEditorProps {
  transcript: TranscriptEntry[];
  savedNote: string;
  savedTemplateId: string;
  durationMs: number;
  onSave: (note: string, templateId: string) => void;
}

export function NoteEditor({
  transcript,
  savedNote,
  savedTemplateId,
  durationMs,
  onSave,
}: NoteEditorProps) {
  const [templateId, setTemplateId] = useState(savedTemplateId);
  const [resolved, setResolved] = useState<ResolvedTemplate | null>(null);
  const [note, setNote] = useState(savedNote);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (override?: ResolvedTemplate) => {
    const target = override ?? resolved;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          templateId: target?.id ?? templateId,
          systemPrompt: target?.customSystemPrompt,
          templateName: target?.name,
        }),
      });
      if (!res.ok) throw new Error("Generování selhalo");
      const data = await res.json();
      setNote(data.note);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Něco se pokazilo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateChange = (id: string, t: ResolvedTemplate) => {
    setTemplateId(id);
    setResolved(t);
    if (note) handleGenerate(t);
  };

  const handleSave = () => {
    onSave(note, templateId);
  };

  const handleExport = async () => {
    const duration = formatDuration(durationMs);
    await exportToDocx({
      title: `Relace ${new Date().toLocaleDateString("cs-CZ")}`,
      date: new Date().toISOString(),
      duration,
      transcript,
      note,
      billingCodes: [], // BillingCodes component handles its own export context
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TemplateSelector
            value={templateId}
            onChange={handleTemplateChange}
            disabled={isGenerating}
          />
        </div>
        {!note && !isGenerating && (
          <Button
            onClick={() => handleGenerate()}
            size="sm"
            className="gap-1.5 shrink-0"
            disabled={transcript.length === 0}
          >
            <Sparkles className="size-3.5" />
            Generovat
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            key="loading"
            className="flex flex-col gap-3 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
              <Sparkles className="size-3.5 animate-pulse" />
              Generuji zprávu...
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </motion.div>
        )}

        {!isGenerating && note && (
          <motion.div
            key="note"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isEditing ? (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm min-h-[400px] font-mono"
              />
            ) : (
              <div className="markdown-note">
                <ReactMarkdown>{note}</ReactMarkdown>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
              >
                {isEditing ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />}
                {isEditing ? "Náhled" : "Upravit"}
              </Button>
              <Button
                onClick={() => handleGenerate()}
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="size-3.5" />
                Znovu generovat
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  onClick={handleExport}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Export .docx
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  variant="default"
                  className="gap-1.5"
                >
                  <Save className="size-3.5" />
                  Uložit
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!isGenerating && !note && (
          <motion.p
            key="empty"
            className="text-sm text-muted-foreground/40 text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Vyberte šablonu a vygenerujte zprávu z vašeho rozhovoru.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}
