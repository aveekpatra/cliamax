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
 * Wrap the doctor's uploaded structure (HTML from mammoth) into an LLM
 * system prompt. Czech-language instructions and a HTML-only output rule
 * to prevent the model from echoing the transcript back at us.
 */
function buildSystemPrompt(content: string): string {
  return `Jsi asistent pro lékařskou dokumentaci. Generuješ klinickou zprávu na základě přepisu rozhovoru lékaře s pacientem. Piš výhradně v češtině.

ŠABLONA (HTML):
\`\`\`html
${content}
\`\`\`

ABSOLUTNĚ ZÁVAZNÁ PRAVIDLA:
1. Tvůj výstup MUSÍ být platný HTML, který přesně odpovídá struktuře šablony výše.
2. Zachovej všechny tagy, nadpisy, sekce, tabulky a třídy. Nepřidávej ani neodstraňuj sekce.
3. Nahraď zástupné texty (placeholdery v hranatých závorkách [...], podtržítka ___, nebo prázdné odstavce) konkrétním obsahem extrahovaným z rozhovoru.
4. Pokud v rozhovoru chybí informace pro nějakou sekci, napiš do ní "Neuvedeno".
5. NEVYPISUJ rozhovor, přepis, ani žádné meta-poznámky či vysvětlení.
6. NEPŘIDÁVEJ úvod, závěr ani jakýkoli text před nebo za vyplněnou šablonu.
7. Vrať ČISTÝ HTML — bez obalů jako \`\`\`html, bez komentářů, bez markdown.
8. Nevymýšlej fakta — používej pouze to, co skutečně zaznělo v rozhovoru.

Tvůj výstup = jeden HTML dokument odpovídající šabloně, vyplněný daty z rozhovoru. Nic víc.`;
}
