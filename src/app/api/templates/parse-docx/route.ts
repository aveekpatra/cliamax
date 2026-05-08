/**
 * Parse an uploaded .docx file into plain text + a suggested template name.
 * Used by the Templates UI to extract the structure a doctor wants the AI
 * to follow when generating clinical notes.
 *
 * mammoth requires Node runtime (uses Buffer + node streams). Pinning the
 * runtime explicitly so Vercel doesn't try to run this on the Edge.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Vercel serverless body cap is 4.5 MB; keep us comfortably under that.
    if (file.size > 4 * 1024 * 1024) {
      return Response.json(
        { error: "Soubor je příliš velký (max 4 MB)." },
        { status: 400 }
      );
    }
    if (
      !file.name.toLowerCase().endsWith(".docx") &&
      file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return Response.json(
        { error: "Nahrajte soubor ve formátu .docx" },
        { status: 400 }
      );
    }

    // Lazy-load mammoth so it's only included in the Node bundle for this
    // route, not pulled in eagerly during route discovery / type-check.
    const mammoth = (await import("mammoth")).default;

    const buffer = Buffer.from(await file.arrayBuffer());
    // convertToHtml preserves headings (h1/h2/h3), paragraphs, lists,
    // tables, and inline images (as base64 data URIs). This is what we
    // want — the structure is the whole point of a template.
    const result = await mammoth.convertToHtml({ buffer });

    const content = (result.value || "").trim();
    if (!content) {
      return Response.json(
        { error: "Soubor neobsahuje žádný text." },
        { status: 400 }
      );
    }

    // Suggested name = filename without extension
    const suggestedName = file.name.replace(/\.docx$/i, "").trim() || "Šablona";

    return Response.json({
      content,
      suggestedName,
      originalFileName: file.name,
    });
  } catch (error) {
    console.error("parse-docx error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Parsování selhalo" },
      { status: 500 }
    );
  }
}
