"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { TranscriptEntry, SessionStatus, WordConfidence } from "@/types/session";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useElevenLabsScribe } from "@/hooks/use-elevenlabs-scribe";
import { useTranscriptCorrection } from "@/hooks/use-transcript-correction";
import { type MedicalSpecialty } from "@/lib/medical-vocabulary";
import { NavBar } from "@/components/NavBar";
import { SessionsList } from "@/components/SessionsList";
import { IdleScreen } from "@/components/IdleScreen";
import { RecordingView } from "@/components/RecordingView";
import { ReviewScreen } from "@/components/ReviewScreen";
import type { Id } from "../../convex/_generated/dataModel";

type AppView = "list" | "idle" | "recording" | "review";

export function SessionContainer() {
  const [view, setView] = useState<AppView>("idle");
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialty>("general");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [interimText, setInterimText] = useState("");
  const [interimSpeaker, setInterimSpeaker] = useState<"doctor" | "patient">("doctor");
  const [isReprocessing, setIsReprocessing] = useState(false);

  const entriesBufferRef = useRef<TranscriptEntry[]>([]);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const entriesRef = useRef<TranscriptEntry[]>([]);

  const createSession = useMutation(api.sessions.create);
  const appendTranscript = useMutation(api.sessions.appendTranscript);
  const replaceTranscript = useMutation(api.sessions.replaceTranscript);
  const completeSession = useMutation(api.sessions.complete);
  const updateStatus = useMutation(api.sessions.updateStatus);
  const saveNote = useMutation(api.sessions.saveNote);
  const saveBillingCodes = useMutation(api.sessions.saveBillingCodes);

  // For loading a saved session
  const savedSession = useQuery(
    api.sessions.get,
    sessionId && view === "review" && status === "completed" ? { id: sessionId } : "skip"
  );

  // --- On-demand LLM suggestion (doctor clicks to request) ---
  const getEntries = useCallback(() => entriesRef.current, []);

  const { requestCorrection } = useTranscriptCorrection({
    getEntries,
    specialty: selectedSpecialty,
  });

  const handleRequestSuggestion = useCallback(
    async (entryId: string) => {
      setEntries((prev) => {
        const updated = prev.map((e) =>
          e.id === entryId ? { ...e, loadingSuggestion: true } : e
        );
        entriesRef.current = updated;
        return updated;
      });

      const suggestedText = await requestCorrection(entryId);

      setEntries((prev) => {
        const updated = prev.map((e) => {
          if (e.id !== entryId) return e;
          if (suggestedText) {
            return { ...e, loadingSuggestion: false, suggestion: suggestedText };
          }
          return { ...e, loadingSuggestion: false };
        });
        entriesRef.current = updated;
        return updated;
      });
    },
    [requestCorrection]
  );

  const handleAcceptSuggestion = useCallback((entryId: string) => {
    setEntries((prev) => {
      const updated = prev.map((entry) => {
        if (entry.id !== entryId || !entry.suggestion) return entry;
        return {
          ...entry,
          originalText: entry.text,
          text: entry.suggestion,
          suggestion: undefined,
          corrected: true,
        };
      });
      entriesRef.current = updated;
      return updated;
    });
  }, []);

  const handleDismissSuggestion = useCallback((entryId: string) => {
    setEntries((prev) => {
      const updated = prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        return { ...entry, suggestion: undefined };
      });
      entriesRef.current = updated;
      return updated;
    });
  }, []);

  const handleTranscript = useCallback(
    (entry: TranscriptEntry) => {
      setEntries((prev) => {
        const updated = [...prev, entry];
        entriesRef.current = updated;
        return updated;
      });
      entriesBufferRef.current.push(entry);
    },
    []
  );

  const handleInterim = useCallback((text: string, speaker: "doctor" | "patient") => {
    setInterimText(text);
    setInterimSpeaker(speaker);
  }, []);

  // --- ElevenLabs Scribe v2 Realtime ---
  const { connect, disconnect, sendAudio } = useElevenLabsScribe({
    language: "ces",
    onTranscript: handleTranscript,
    onInterim: handleInterim,
  });

  const { start: startRecording, stop: stopRecording, pause, resume, getRecording } =
    useAudioRecorder({
      deviceId: selectedDeviceId || undefined,
      sampleRate: 16000,
      onAudioData: sendAudio,
    });

  /** Strip entries to only the fields Convex schema accepts */
  const toConvexEntries = (entries: TranscriptEntry[]) =>
    entries.map((e) => ({ id: e.id, speaker: e.speaker, text: e.text, timestamp: e.timestamp }));

  const startFlushing = useCallback(
    (id: Id<"sessions">) => {
      flushIntervalRef.current = setInterval(async () => {
        if (entriesBufferRef.current.length === 0) return;
        const batch = entriesBufferRef.current.splice(0);
        try {
          await appendTranscript({ id, entries: toConvexEntries(batch) });
        } catch {
          entriesBufferRef.current.unshift(...batch);
        }
      }, 5000);
    },
    [appendTranscript]
  );

  const stopFlushing = useCallback(
    async (id: Id<"sessions">) => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      if (entriesBufferRef.current.length > 0) {
        const batch = entriesBufferRef.current.splice(0);
        try {
          await appendTranscript({ id, entries: toConvexEntries(batch) });
        } catch {
          // silent
        }
      }
    },
    [appendTranscript]
  );

  // --- Scribe v2 Batch reprocessing (post-recording accuracy pass) ---
  const runScribeBatch = useCallback(async () => {
    const audioBlob = getRecording();
    if (!audioBlob) return;

    setIsReprocessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("specialty", selectedSpecialty);

      const res = await fetch("/api/ai/scribe-batch", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.skipped || !data.entries || data.entries.length === 0) return;

      // Replace realtime transcript with batch result (more accurate)
      const now = Date.now();
      const batchEntries: TranscriptEntry[] = data.entries.map(
        (
          e: {
            speaker: "doctor" | "patient";
            text: string;
            words: Array<{ word: string; confidence: number; start: number; end: number }>;
          },
          i: number
        ) => ({
          id: `batch-${now}-${i}`,
          speaker: e.speaker,
          text: e.text,
          timestamp: now,
          words: e.words as WordConfidence[],
          corrected: false,
        })
      );

      setEntries(batchEntries);
      entriesRef.current = batchEntries;

      // Persist the batch result to Convex
      if (sessionId) {
        try {
          await replaceTranscript({
            id: sessionId,
            entries: toConvexEntries(batchEntries),
          });
        } catch {
          // Silent — UI still has the batch result
        }
      }
    } catch {
      // Silent — realtime transcript is still available
    } finally {
      setIsReprocessing(false);
    }
  }, [getRecording, selectedSpecialty, sessionId, replaceTranscript]);

  // --- Navigation ---

  const handleNewSession = useCallback(() => {
    setView("idle");
    setStatus("idle");
    setEntries([]);
    entriesRef.current = [];
    setSessionId(null);
    setStartedAt(null);
    setInterimText("");
  }, []);

  const handleOpenSession = useCallback(
    (id: Id<"sessions">) => {
      setSessionId(id);
      setView("review");
      setStatus("completed");
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setView("list");
    setStatus("idle");
    setEntries([]);
    entriesRef.current = [];
    setSessionId(null);
    setStartedAt(null);
  }, []);

  // --- Recording lifecycle ---

  const handleStart = useCallback(async () => {
    setEntries([]);
    entriesRef.current = [];
    setStartedAt(Date.now());
    setInterimText("");

    const id = await createSession({
      title: `Relace ${new Date().toLocaleString("cs-CZ")}`,
    });
    setSessionId(id);
    setStatus("recording");
    setView("recording");

    await connect();
    await startRecording();
    startFlushing(id);
  }, [createSession, connect, startRecording, startFlushing]);

  const handleStop = useCallback(async () => {
    stopRecording();
    disconnect();
    setInterimText("");

    const durationMs = startedAt ? Date.now() - startedAt : 0;

    if (sessionId) {
      await stopFlushing(sessionId);
      await completeSession({ id: sessionId, durationMs });
    }

    setStatus("completed");
    setView("review");

    // Fire Scribe v2 Batch in the background (non-blocking)
    runScribeBatch();
  }, [stopRecording, disconnect, sessionId, startedAt, stopFlushing, completeSession, runScribeBatch]);

  const handlePause = useCallback(() => {
    pause();
    setStatus("paused");
    if (sessionId) updateStatus({ id: sessionId, status: "paused" });
  }, [pause, sessionId, updateStatus]);

  const handleResume = useCallback(() => {
    resume();
    setStatus("recording");
    if (sessionId) updateStatus({ id: sessionId, status: "recording" });
  }, [resume, sessionId, updateStatus]);

  // --- Save handlers ---

  const handleSaveNote = useCallback(
    async (note: string, templateId: string) => {
      if (sessionId) await saveNote({ id: sessionId, note, noteTemplateId: templateId });
    },
    [sessionId, saveNote]
  );

  const handleSaveBillingCodes = useCallback(
    async (codes: Array<{ code: string; name: string; points: number; reason: string }>) => {
      if (sessionId) await saveBillingCodes({ id: sessionId, billingCodes: codes });
    },
    [sessionId, saveBillingCodes]
  );

  // Resolve entries: either from live state or from saved session
  const resolvedEntries =
    entries.length > 0
      ? entries
      : savedSession?.transcript?.map((t) => ({
          id: t.id,
          speaker: t.speaker as "doctor" | "patient",
          text: t.text,
          timestamp: t.timestamp,
        })) || [];

  const resolvedStartedAt = startedAt || (savedSession?.createdAt ?? null);
  const resolvedDurationMs = savedSession?.durationMs ?? (startedAt ? Date.now() - startedAt : 0);

  return (
    <div className="flex h-full flex-col">
      <NavBar status={status} />
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <SessionsList
              key="list"
              onNewSession={handleNewSession}
              onOpenSession={handleOpenSession}
            />
          )}

          {view === "idle" && (
            <IdleScreen
              key="idle"
              selectedDeviceId={selectedDeviceId}
              selectedSpecialty={selectedSpecialty}
              onStart={handleStart}
              onDeviceChange={setSelectedDeviceId}
              onSpecialtyChange={setSelectedSpecialty}
              onShowHistory={() => setView("list")}
            />
          )}

          {view === "recording" && (
            <RecordingView
              key="recording"
              status={status}
              entries={entries}
              selectedDeviceId={selectedDeviceId}
              startedAt={startedAt}
              interimText={interimText}
              interimSpeaker={interimSpeaker}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onNewSession={handleBackToList}
              onDeviceChange={setSelectedDeviceId}
              onRequestSuggestion={handleRequestSuggestion}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissSuggestion={handleDismissSuggestion}
            />
          )}

          {view === "review" && (
            <ReviewScreen
              key="review"
              entries={resolvedEntries}
              startedAt={resolvedStartedAt}
              durationMs={resolvedDurationMs}
              savedNote={savedSession?.note || ""}
              savedTemplateId={savedSession?.noteTemplateId || "summary"}
              savedBillingCodes={savedSession?.billingCodes || []}
              isReprocessing={isReprocessing}
              onSaveNote={handleSaveNote}
              onSaveBillingCodes={handleSaveBillingCodes}
              onRequestSuggestion={handleRequestSuggestion}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissSuggestion={handleDismissSuggestion}
              onNewSession={handleNewSession}
              onBackToList={handleBackToList}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
