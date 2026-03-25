"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { TranscriptEntry, SessionStatus } from "@/types/session";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useDeepgram } from "@/hooks/use-deepgram";
import { useTranscriptCorrection } from "@/hooks/use-transcript-correction";
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
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const entriesBufferRef = useRef<TranscriptEntry[]>([]);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createSession = useMutation(api.sessions.create);
  const appendTranscript = useMutation(api.sessions.appendTranscript);
  const completeSession = useMutation(api.sessions.complete);
  const updateStatus = useMutation(api.sessions.updateStatus);
  const saveNote = useMutation(api.sessions.saveNote);
  const saveBillingCodes = useMutation(api.sessions.saveBillingCodes);

  // For loading a saved session
  const savedSession = useQuery(
    api.sessions.get,
    sessionId && view === "review" && status === "completed" ? { id: sessionId } : "skip"
  );

  // --- LLM correction layer ---
  const handleCorrected = useCallback(
    (corrections: Array<{ id: string; correctedText: string }>) => {
      setEntries((prev) =>
        prev.map((entry) => {
          const correction = corrections.find((c) => c.id === entry.id);
          if (!correction) return entry;
          return {
            ...entry,
            originalText: entry.text,
            text: correction.correctedText,
            corrected: true,
          };
        })
      );
    },
    []
  );

  const { enqueue: enqueueCorrection, flushRemaining: flushCorrections } =
    useTranscriptCorrection({ onCorrected: handleCorrected });

  const handleTranscript = useCallback(
    (entry: TranscriptEntry) => {
      setEntries((prev) => [...prev, entry]);
      entriesBufferRef.current.push(entry);
      // Send to LLM correction if it has low-confidence words
      enqueueCorrection(entry);
    },
    [enqueueCorrection]
  );

  const { connect, disconnect, sendAudio } = useDeepgram({
    language: "cs",
    onTranscript: handleTranscript,
  });

  const { start: startRecording, stop: stopRecording, pause, resume } =
    useAudioRecorder({
      deviceId: selectedDeviceId || undefined,
      sampleRate: 16000,
      onAudioData: sendAudio,
    });

  const startFlushing = useCallback(
    (id: Id<"sessions">) => {
      flushIntervalRef.current = setInterval(async () => {
        if (entriesBufferRef.current.length === 0) return;
        const batch = entriesBufferRef.current.splice(0);
        try {
          await appendTranscript({ id, entries: batch });
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
          await appendTranscript({ id, entries: batch });
        } catch {
          // silent
        }
      }
    },
    [appendTranscript]
  );

  // --- Navigation ---

  const handleNewSession = useCallback(() => {
    setView("idle");
    setStatus("idle");
    setEntries([]);
    setSessionId(null);
    setStartedAt(null);
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
    setSessionId(null);
    setStartedAt(null);
  }, []);

  // --- Recording lifecycle ---

  const handleStart = useCallback(async () => {
    setEntries([]);
    setStartedAt(Date.now());

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
    flushCorrections(); // Flush any remaining LLM corrections

    const durationMs = startedAt ? Date.now() - startedAt : 0;

    if (sessionId) {
      await stopFlushing(sessionId);
      await completeSession({ id: sessionId, durationMs });
    }

    setStatus("completed");
    setView("review");
  }, [stopRecording, disconnect, flushCorrections, sessionId, startedAt, stopFlushing, completeSession]);

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
              onStart={handleStart}
              onDeviceChange={setSelectedDeviceId}
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
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onNewSession={handleBackToList}
              onDeviceChange={setSelectedDeviceId}
            />
          )}

          {view === "review" && (
            <ReviewScreen
              key="review"
              entries={resolvedEntries}
              startedAt={resolvedStartedAt}
              durationMs={resolvedDurationMs}
              savedNote={savedSession?.note || ""}
              savedTemplateId={savedSession?.noteTemplateId || "soap"}
              savedBillingCodes={savedSession?.billingCodes || []}
              onSaveNote={handleSaveNote}
              onSaveBillingCodes={handleSaveBillingCodes}
              onNewSession={handleNewSession}
              onBackToList={handleBackToList}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
