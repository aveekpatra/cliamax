import { chat } from "@/lib/openrouter";

const SYSTEM_PROMPT = `Jsi lékařský korektor přepisů v češtině. Opravuješ přepisy rozhovorů mezi lékařem a pacientem.

Pravidla:
- Oprav chyby v lékařské terminologii (názvy léků, diagnóz, procedur, anatomie)
- Oprav gramatické chyby a překlepy z automatického přepisu
- Zachovej přesný význam a styl řeči — NEPŘEPISUJ celé věty
- Pokud je text správný, vrať ho beze změny
- Odpovídej POUZE opraveným textem, bez vysvětlení nebo komentářů
- Každý řádek na vstupu = jeden segment. Vrať stejný počet řádků.

Formát vstupu:
ID|MLUVČÍ|TEXT

Formát výstupu:
ID|OPRAVENÝ_TEXT`;

interface CorrectionEntry {
  id: string;
  speaker: string;
  text: string;
}

export async function POST(request: Request) {
  try {
    const { entries } = (await request.json()) as { entries: CorrectionEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return Response.json({ corrections: [] });
    }

    const input = entries
      .map((e) => `${e.id}|${e.speaker === "doctor" ? "Lékař" : "Pacient"}|${e.text}`)
      .join("\n");

    const result = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ]);

    // Parse corrections
    const corrections: Array<{ id: string; correctedText: string }> = [];
    const lines = result.trim().split("\n");

    for (const line of lines) {
      const pipeIdx = line.indexOf("|");
      if (pipeIdx === -1) continue;
      const id = line.slice(0, pipeIdx).trim();
      const correctedText = line.slice(pipeIdx + 1).trim();
      if (id && correctedText) {
        corrections.push({ id, correctedText });
      }
    }

    return Response.json({ corrections });
  } catch (error) {
    console.error("Transcript correction error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Correction failed" },
      { status: 500 }
    );
  }
}
