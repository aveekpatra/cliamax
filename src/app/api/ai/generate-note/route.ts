import { chat } from "@/lib/openrouter";
import { TEMPLATES } from "@/lib/templates";

export async function POST(request: Request) {
  try {
    const { transcript, templateId } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return Response.json({ error: "Transcript is required" }, { status: 400 });
    }

    const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

    const formatted = transcript
      .map(
        (entry: { speaker: string; text: string }) =>
          `${entry.speaker === "doctor" ? "Lékař" : "Pacient"}: ${entry.text}`
      )
      .join("\n");

    const note = await chat([
      { role: "system", content: template.systemPrompt },
      { role: "user", content: `Generate a ${template.name} from this conversation:\n\n${formatted}` },
    ]);

    return Response.json({ note });
  } catch (error) {
    console.error("Note generation error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate note" },
      { status: 500 }
    );
  }
}
