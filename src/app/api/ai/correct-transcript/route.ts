import { chat } from "@/lib/openrouter";
import { getMedicalContext, type MedicalSpecialty } from "@/lib/medical-vocabulary";

function buildSystemPrompt(specialty: MedicalSpecialty): string {
  const vocabContext = getMedicalContext(specialty);

  return `Jsi lékařský korektor přepisů v češtině. Opravuješ přepisy rozhovorů mezi lékařem a pacientem.

Pravidla:
- Oprav chyby v lékařské terminologii (názvy léků, diagnóz, procedur, anatomie)
- Oprav gramatické chyby a překlepy z automatického přepisu
- Oprav špatně rozpoznaná slova na základě kontextu rozhovoru
- Zachovej přesný význam a styl řeči — NEPŘEPISUJ celé věty
- Pokud je text správný, vrať ho beze změny
- Odpovídej POUZE opraveným textem, bez vysvětlení nebo komentářů
- Každý řádek na vstupu = jeden segment. Vrať stejný počet řádků.
- Opravuj POUZE řádky označené [OPRAVIT], kontextové řádky [KONTEXT] neopravuj a nevypisuj.

${vocabContext}

Formát vstupu:
[OPRAVIT] ID|MLUVČÍ|TEXT
[KONTEXT] ID|MLUVČÍ|TEXT

Formát výstupu (pouze řádky [OPRAVIT]):
ID|OPRAVENÝ_TEXT`;
}

interface CorrectionEntry {
  id: string;
  speaker: string;
  text: string;
}

export async function POST(request: Request) {
  try {
    const { entries, context, specialty } = (await request.json()) as {
      entries: CorrectionEntry[];
      context?: CorrectionEntry[];
      specialty?: MedicalSpecialty;
    };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return Response.json({ corrections: [] });
    }

    // Build input with context lines for disambiguation
    const contextLines = (context || [])
      .map((e) => `[KONTEXT] ${e.id}|${e.speaker === "doctor" ? "Lékař" : "Pacient"}|${e.text}`)
      .join("\n");

    const correctionLines = entries
      .map((e) => `[OPRAVIT] ${e.id}|${e.speaker === "doctor" ? "Lékař" : "Pacient"}|${e.text}`)
      .join("\n");

    const input = contextLines
      ? `${contextLines}\n${correctionLines}`
      : correctionLines;

    const systemPrompt = buildSystemPrompt(specialty || "general");

    const result = await chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      { temperature: 0 }
    );

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
