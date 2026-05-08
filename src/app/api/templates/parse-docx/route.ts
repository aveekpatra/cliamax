import mammoth from "mammoth";

/**
 * Parse an uploaded .docx file into plain text + a suggested template name.
 * Used by the Templates UI to extract the structure a doctor wants the AI
 * to follow when generating clinical notes.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Basic guard
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "Soubor je příliš velký (max 5 MB)." },
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });

    // Collapse 3+ blank lines down to 2 for cleaner template structure.
    const content = (result.value || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
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
