"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface ResolvedTemplate {
  id: string;
  name: string;
  /** When set, send this verbatim as the system prompt to the LLM. */
  customSystemPrompt?: string;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string, resolved: ResolvedTemplate) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  value,
  onChange,
  disabled,
}: TemplateSelectorProps) {
  const userTemplates = useQuery(api.templates.list);

  const builtIns: ResolvedTemplate[] = TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const customs: ResolvedTemplate[] = (userTemplates ?? []).map((t) => ({
    id: `custom:${t._id}`,
    name: t.name,
    customSystemPrompt: t.systemPrompt,
  }));

  const all = [...builtIns, ...customs];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {all.map((t) => {
        const active = value === t.id;
        const isCustom = !!t.customSystemPrompt;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id, t)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground"
            )}
            title={isCustom ? "Vlastní šablona" : undefined}
          >
            {isCustom && (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-primary-foreground/70" : "bg-primary/50"
                )}
              />
            )}
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
