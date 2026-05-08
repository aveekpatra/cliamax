"use client";

import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  value,
  onChange,
  disabled,
}: TemplateSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TEMPLATES.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground"
            )}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
