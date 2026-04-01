import { getKeytermsForBatch, type MedicalSpecialty } from "@/lib/medical-vocabulary";

/**
 * Scribe v2 Batch: Post-recording reprocess with full accuracy features.
 * Sends the complete WAV to ElevenLabs with keyterms, diarization, and
 * word-level timestamps. Returns speaker-labeled, terminology-boosted transcript.
 */

interface ScribeWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | "audio_event";
  speaker_id?: string;
  logprob?: number;
}

interface ScribeBatchResponse {
  language_code: string;
  text: string;
  words: ScribeWord[];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return Response.json({ skipped: true, reason: "ELEVENLABS_API_KEY not configured" });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const specialty = (formData.get("specialty") as MedicalSpecialty) || "general";

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Build the ElevenLabs batch request
    const scribeForm = new FormData();
    scribeForm.append("model_id", "scribe_v2");
    scribeForm.append("file", audioFile, "recording.wav");
    scribeForm.append("language_code", "ces");
    scribeForm.append("diarize", "true");
    scribeForm.append("num_speakers", "2");
    scribeForm.append("timestamps_granularity", "word");
    scribeForm.append("tag_audio_events", "false");

    // Add up to 1000 Czech medical keyterms
    const keyterms = getKeytermsForBatch(specialty);
    for (const term of keyterms) {
      scribeForm.append("keyterms", term);
    }

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: scribeForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Scribe batch error:", err);
      return Response.json({ skipped: true, reason: "Scribe batch API error" });
    }

    const data: ScribeBatchResponse = await res.json();

    // Transform into our transcript format
    const textWords = data.words.filter((w) => w.type === "word");

    if (textWords.length === 0) {
      return Response.json({ skipped: true, reason: "No words in transcript" });
    }

    // Group words by speaker into entries
    const entries: Array<{
      speaker: "doctor" | "patient";
      text: string;
      words: Array<{ word: string; confidence: number; start: number; end: number }>;
    }> = [];

    let currentSpeaker = textWords[0].speaker_id ?? "speaker_0";
    let currentWords: ScribeWord[] = [];

    const flushGroup = () => {
      if (currentWords.length === 0) return;
      entries.push({
        speaker: currentSpeaker === "speaker_0" ? "doctor" : "patient",
        text: currentWords.map((w) => w.text).join(" "),
        words: currentWords.map((w) => ({
          word: w.text,
          confidence: w.logprob != null ? Math.min(1, Math.max(0, Math.exp(w.logprob))) : 1,
          start: w.start,
          end: w.end,
        })),
      });
    };

    for (const w of textWords) {
      const spk = w.speaker_id ?? "speaker_0";
      if (spk !== currentSpeaker) {
        flushGroup();
        currentSpeaker = spk;
        currentWords = [w];
      } else {
        currentWords.push(w);
      }
    }
    flushGroup();

    return Response.json({
      entries,
      fullText: data.text,
      languageCode: data.language_code,
      source: "scribe-batch",
    });
  } catch (error) {
    console.error("Scribe batch error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Batch reprocess failed" },
      { status: 500 }
    );
  }
}
