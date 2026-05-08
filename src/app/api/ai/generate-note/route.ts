import { chat } from "@/lib/openrouter";
import { TEMPLATES } from "@/lib/templates";

export async function POST(request: Request) {
  try {
    const {
      transcript,
      templateId,
      systemPrompt: customSystemPrompt,
      templateName: customTemplateName,
    }: {
      transcript: Array<{ speaker: string; text: string }>;
      templateId?: string;
      systemPrompt?: string;
      templateName?: string;
    } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return Response.json({ error: "Transcript is required" }, { status: 400 });
    }

    // Resolve the system prompt + display name. Custom (doctor-uploaded)
    // templates pass their pre-built systemPrompt directly; built-in
    // templates resolve from the static TEMPLATES table by id.
    let systemPrompt: string;
    let templateName: string;
    if (customSystemPrompt && customSystemPrompt.trim()) {
      systemPrompt = customSystemPrompt;
      templateName = customTemplateName || "vlastní šablona";
    } else {
      const template =
        TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
      systemPrompt = template.systemPrompt;
      templateName = template.name;
    }

    const formatted = transcript
      .map(
        (entry) =>
          `${entry.speaker === "doctor" ? "Lékař" : "Pacient"}: ${entry.text}`
      )
      .join("\n");

    const note = await chat([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate a ${templateName} from this conversation:\n\n${formatted}`,
      },
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
