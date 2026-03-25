import { chat } from "@/lib/openrouter";
import { getCodesForSpecialty, formatCodesForPrompt } from "@/lib/vykony-data";

export async function POST(request: Request) {
  try {
    const { transcript, specialtyId = "001" } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return Response.json({ error: "Transcript is required" }, { status: 400 });
    }

    const codes = getCodesForSpecialty(specialtyId);
    const codesContext = formatCodesForPrompt(codes);

    const formatted = transcript
      .map(
        (entry: { speaker: string; text: string }) =>
          `${entry.speaker === "doctor" ? "Lékař" : "Pacient"}: ${entry.text}`
      )
      .join("\n");

    const response = await chat([
      {
        role: "system",
        content: `You are a Czech medical billing assistant.
Based on the doctor-patient conversation, identify which health insurance procedure codes (výkony) should be reported.

Available codes for this specialty:
${codesContext}

Analyze the conversation and select ALL relevant codes that apply. Consider:
- What type of examination was performed (comprehensive, targeted, follow-up)?
- Were any procedures mentioned (injections, wound care, blood draws)?
- Were any diagnostic tests discussed (blood work, imaging, ECG)?
- Was patient education or consultation provided?

Return ONLY a JSON array in this format:
[{"code":"09513","name":"...","points":350,"reason":"brief reason why this code applies"}]

Return the most relevant codes. If unsure, include the code with a note. Return valid JSON only, no markdown.`,
      },
      {
        role: "user",
        content: formatted,
      },
    ]);

    let results = [];
    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
      results = JSON.parse(cleaned);
    } catch {
      results = [];
    }

    return Response.json({ results });
  } catch (error) {
    console.error("Vykony auto-detect error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to detect codes" },
      { status: 500 }
    );
  }
}
