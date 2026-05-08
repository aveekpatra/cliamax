"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Code2, FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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
  const [showSource, setShowSource] = useState(false);
  const [deleteId, setDeleteId] = useState<TemplateId | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const BLANK_HTML = `<h2>Anamnéza</h2>
<p>[Anamnéza pacienta]</p>
<h2>Vyšetření</h2>
<p>[Nálezy z vyšetření]</p>
<h2>Diagnóza</h2>
<p>[Diagnóza]</p>
<h2>Plán</h2>
<p>[Léčebný plán]</p>`;

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
    setEditing({ name: "", description: "", content: BLANK_HTML });
    setShowSource(false);
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
    setShowSource(false);
    setEditorOpen(true);
  };

  // Replace the structure of the currently-editing template with a fresh
  // .docx upload. Keeps the name/description in place so the doctor can
  // swap underlying structure without retyping metadata.
  const handleReplaceFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;
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
      setEditing({
        ...editing,
        content: data.content ?? "",
        originalFileName: data.originalFileName,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Parsování selhalo");
    } finally {
      setUploading(false);
    }
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground/80">
                    Struktura šablony
                    {editing.originalFileName && (
                      <span className="ml-2 font-normal text-muted-foreground/60">
                        · {editing.originalFileName}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      ref={replaceInputRef}
                      type="file"
                      accept=".docx"
                      onChange={handleReplaceFile}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={() => replaceInputRef.current?.click()}
                      disabled={uploading}
                      type="button"
                    >
                      <Upload className="size-3" />
                      {uploading ? "Nahrávám…" : "Nahradit .docx"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs"
                      onClick={() => setShowSource((s) => !s)}
                      type="button"
                    >
                      <Code2 className="size-3" />
                      {showSource ? "Náhled" : "Zdroj"}
                    </Button>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-xs text-destructive">{uploadError}</p>
                )}

                {showSource ? (
                  <Textarea
                    value={editing.content}
                    onChange={(e) =>
                      setEditing({ ...editing, content: e.target.value })
                    }
                    className="min-h-[320px] font-mono text-[11px]"
                    placeholder="<h2>Sekce</h2>\n<p>[Obsah]</p>"
                  />
                ) : (
                  <div
                    className="docx-preview min-h-[320px] max-h-[420px] overflow-auto rounded-lg border bg-card p-5 text-sm"
                    dangerouslySetInnerHTML={{ __html: editing.content }}
                  />
                )}
                <p className="text-[11px] text-muted-foreground/60">
                  AI nahradí placeholdery v hranatých závorkách [...] obsahem
                  z rozhovoru a zachová strukturu šablony.
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
