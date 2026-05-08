import type { Id } from "../../../convex/_generated/dataModel";

export type AppView =
  | "dashboard"
  | "patients"
  | "patient"
  | "sessions"
  | "templates"
  | "idle"
  | "recording"
  | "review";

export type ReviewStatus = "draft" | "reviewed" | "signed";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: "Koncept",
  reviewed: "K revizi",
  signed: "Podepsáno",
};

export const REVIEW_STATUS_ORDER: ReviewStatus[] = ["draft", "reviewed", "signed"];

export type PatientId = Id<"patients">;
export type SessionId = Id<"sessions">;
