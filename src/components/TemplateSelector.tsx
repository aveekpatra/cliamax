"use client";

import { TEMPLATES } from "@/lib/templates";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({ value, onChange, disabled }: TemplateSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)} disabled={disabled}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="Vyberte šablonu" />
      </SelectTrigger>
      <SelectPopup>
        {TEMPLATES.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
