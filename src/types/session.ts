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
  /** Whether the doctor accepted an LLM suggestion */
  corrected?: boolean;
  /** Original text before accepting a suggestion (for undo) */
  originalText?: string;
  /** LLM-suggested correction — shown inline, doctor must accept or dismiss */
  suggestion?: string;
  /** True while fetching an LLM suggestion for this entry */
  loadingSuggestion?: boolean;
}

export type SessionStatus = "idle" | "recording" | "paused" | "completed";
