"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PatientFormValues {
  name: string;
  birthDate?: string;
  mrn?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PatientFormValues;
  title?: string;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
}

export function PatientFormDialog({
  open,
  onOpenChange,
  initial,
  title = "Nový pacient",
  onSubmit,
}: PatientFormDialogProps) {
  const [values, setValues] = useState<PatientFormValues>(initial ?? { name: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setValues(initial ?? { name: "" });
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        birthDate: values.birthDate?.trim() || undefined,
        mrn: values.mrn?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Informace o pacientovi pro propojení s relacemi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="flex flex-col gap-3">
            <Field id="name" label="Jméno" required>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                autoFocus
                nativeInput
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="birthDate" label="Datum narození">
                <Input
                  id="birthDate"
                  type="date"
                  value={values.birthDate ?? ""}
                  onChange={(e) => setValues({ ...values, birthDate: e.target.value })}
                  nativeInput
                />
              </Field>
              <Field id="mrn" label="Pojištěnec">
                <Input
                  id="mrn"
                  value={values.mrn ?? ""}
                  onChange={(e) => setValues({ ...values, mrn: e.target.value })}
                  placeholder="XXXXXX/XXXX"
                  nativeInput
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="phone" label="Telefon">
                <Input
                  id="phone"
                  value={values.phone ?? ""}
                  onChange={(e) => setValues({ ...values, phone: e.target.value })}
                  nativeInput
                />
              </Field>
              <Field id="email" label="E-mail">
                <Input
                  id="email"
                  type="email"
                  value={values.email ?? ""}
                  onChange={(e) => setValues({ ...values, email: e.target.value })}
                  nativeInput
                />
              </Field>
            </div>
            <Field id="notes" label="Poznámky">
              <Textarea
                id="notes"
                value={values.notes ?? ""}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
                className="min-h-[80px] text-sm"
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>
              Zrušit
            </DialogClose>
            <Button type="submit" disabled={submitting || !values.name.trim()}>
              {submitting ? "Ukládání…" : "Uložit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground/70">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
