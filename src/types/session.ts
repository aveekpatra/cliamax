export interface WordConfidence {
  word: string;
  confidence: number;
  start: number;
  end: number;
}

export interface TranscriptEntry {
  id: string;
  speaker: "doctor" | "patient";
  text: string;
  timestamp: number;
  /** Word-level confidence scores from Deepgram */
  words?: WordConfidence[];
  /** Whether LLM correction has been applied */
  corrected?: boolean;
  /** Original text before LLM correction (for undo) */
  originalText?: string;
}

export type SessionStatus = "idle" | "recording" | "paused" | "completed";
