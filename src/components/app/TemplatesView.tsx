"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogPanel,
} from "@/components/ui/dialog";

type TemplateId = Id<"templates">;

export function TemplatesView() {
  const templates = useQuery(api.templates.list);
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const removeTemplate = useMutation(api.templates.remove);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id?: TemplateId;
    name: string;
    description: string;
    content: string;
    originalFileName?: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<TemplateId | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/templates/parse-docx", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parsování selhalo");
      // Open the editor with parsed content; user reviews/saves.
      setEditing({
        name: data.suggestedName ?? "",
        description: "",
        content: data.content ?? "",
        originalFileName: data.originalFileName,
      });
      setEditorOpen(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Parsování selhalo");
    } finally {
      setUploading(false);
    }
  };

  const handleNewBlank = () => {
    setEditing({ name: "", description: "", content: "" });
    setEditorOpen(true);
  };

  const handleEdit = (t: NonNullable<typeof templates>[number]) => {
    setEditing({
      id: t._id,
      name: t.name,
      description: t.description ?? "",
      content: t.content,
      originalFileName: t.originalFileName,
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.content.trim()) return;
    if (editing.id) {
      await updateTemplate({
        id: editing.id,
        name: editing.name.trim(),
        description: editing.description.trim() || undefined,
        content: editing.content,
      });
    } else {
      await createTemplate({
        name: editing.name.trim(),
        description: editing.description.trim() || undefined,
        content: editing.content,
        originalFileName: editing.originalFileName,
      });
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await removeTemplate({ id: deleteId });
    setDeleteId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-8 pt-8 pb-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Šablony</h1>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {templates ? `${templates.length} vlastních šablon` : "Načítání…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleNewBlank}
          >
            <Plus className="size-3.5" />
            Nová prázdná
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Upload className="size-3.5" />
            {uploading ? "Nahrávám…" : "Nahrát .docx"}
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="px-8 pb-2">
          <p className="text-xs text-destructive">{uploadError}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 pb-8">
        {templates === undefined ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : templates.length === 0 ? (
          <Empty className="mt-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Zatím žádné šablony</EmptyTitle>
              <EmptyDescription>
                Nahrajte .docx s vaší preferovanou strukturou zprávy nebo
                vytvořte šablonu od nuly. AI bude tuto strukturu sledovat při
                generování zpráv.
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleNewBlank}
              >
                <Plus className="size-3.5" />
                Nová prázdná
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <Upload className="size-3.5" />
                Nahrát .docx
              </Button>
            </div>
          </Empty>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <ul className="divide-y">
              {templates.map((t) => (
                <li
                  key={t._id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="size-4 text-muted-foreground/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-2">
                      {t.description ? (
                        <span className="truncate">{t.description}</span>
                      ) : t.originalFileName ? (
                        <span className="truncate">{t.originalFileName}</span>
                      ) : (
                        <span className="italic text-muted-foreground/50">
                          Bez popisu
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleEdit(t)}
                    title="Upravit šablonu"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeleteId(t._id)}
                    title="Smazat šablonu"
                    className="text-muted-foreground/60 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogPopup className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Upravit šablonu" : "Nová šablona"}
            </DialogTitle>
            <DialogDescription>
              Pojmenujte šablonu a upravte strukturu, kterou má AI dodržovat
              při generování zpráv.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <DialogPanel className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">
                  Název
                </label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  placeholder="např. SOAP zápis kardio"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">
                  Popis (volitelné)
                </label>
                <Input
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="K čemu šablonu používáte"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">
                  Struktura šablony
                </label>
                <Textarea
                  value={editing.content}
                  onChange={(e) =>
                    setEditing({ ...editing, content: e.target.value })
                  }
                  className="min-h-[280px] font-mono text-xs"
                  placeholder={"## Anamnéza\n[…]\n\n## Vyšetření\n[…]\n\n## Diagnóza\n[…]\n\n## Plán\n[…]"}
                />
                <p className="text-[11px] text-muted-foreground/60">
                  Tip: Použijte nadpisy (## Sekce) a hranaté závorky [...] pro
                  zástupné texty. AI doplní obsah z přepisu.
                </p>
              </div>
            </DialogPanel>
          )}

          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              <X className="size-3.5" />
              Zrušit
            </DialogClose>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                !editing?.name.trim() || !editing?.content.trim()
              }
            >
              Uložit
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat šablonu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuto akci nelze vrátit. Šablona bude trvale odstraněna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" size="sm" />}>
              Zrušit
            </AlertDialogClose>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Smazat
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
