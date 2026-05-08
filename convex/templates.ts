import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    originalFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const systemPrompt = buildSystemPrompt(args.content);
    return await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      content: args.content,
      systemPrompt,
      originalFileName: args.originalFileName,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, description, content }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Template not found");
    const newContent = content ?? existing.content;
    await ctx.db.patch(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(content !== undefined && {
        content,
        systemPrompt: buildSystemPrompt(newContent),
      }),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

/**
 * Wrap the doctor's uploaded structure into an LLM system prompt.
 * Keeps the prompt in Czech to match the rest of the app and ensure
 * the model writes in Czech regardless of the uploaded structure language.
 */
function buildSystemPrompt(content: string): string {
  return `Jsi asistent pro lékařskou dokumentaci. Vygeneruj klinickou zprávu z rozhovoru lékaře a pacienta. Piš v češtině.

Použij přesně tuto strukturu šablony:
"""
${content}
"""

Pravidla:
- Dodržuj sekce, nadpisy a styl psaní z šablony výše
- Nahraď zástupné texty obsahem extrahovaným z rozhovoru
- Vynechej sekce, které nebyly v rozhovoru zmíněny
- Buď stručný a klinický
- Nevymýšlej fakta, která nezazněla v rozhovoru`;
}
