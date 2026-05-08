"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { TranscriptEntry, SessionStatus, WordConfidence } from "@/types/session";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useElevenLabsScribe } from "@/hooks/use-elevenlabs-scribe";
import { useTranscriptCorrection } from "@/hooks/use-transcript-correction";
import { type MedicalSpecialty } from "@/lib/medical-vocabulary";
import { IdleScreen } from "@/components/IdleScreen";
import { RecordingView } from "@/components/RecordingView";
import { ReviewScreen } from "@/components/ReviewScreen";
import { AppShell } from "@/components/app/AppShell";
import { DashboardView } from "@/components/app/DashboardView";
import { PatientsView } from "@/components/app/PatientsView";
import { PatientDetailView } from "@/components/app/PatientDetailView";
import { SessionsListView } from "@/components/app/SessionsListView";
import { CommandPalette } from "@/components/app/CommandPalette";
import { PatientFormDialog } from "@/components/app/PatientFormDialog";
import type {
  AppView,
  PatientId,
  ReviewStatus,
  SessionId,
} from "@/components/app/types";

interface SessionContainerProps {
  initialSidebarOpen?: boolean;
}

export function SessionContainer({
  initialSidebarOpen = true,
}: SessionContainerProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<AppView>(() => initialViewFromPath(pathname));
  const [status, setStatus] = useState<SessionStatus>(() =>
    parsePath(pathname).kind === "review" ? "completed" : "idle"
  );
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialty>("general");
  const [selectedPatientIdForNew, setSelectedPatientIdForNew] = useState<PatientId | null>(null);
  const [sessionId, setSessionId] = useState<SessionId | null>(() => {
    const parsed = parsePath(pathname);
    return parsed.sessionId;
  });
  const [patientDetailId, setPatientDetailId] = useState<PatientId | null>(() => {
    const parsed = parsePath(pathname);
    return parsed.patientId;
  });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [interimText, setInterimText] = useState("");
  const [interimSpeaker, setInterimSpeaker] = useState<"doctor" | "patient">("doctor");
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(initialSidebarOpen);

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
  const linkPatient = useMutation(api.sessions.linkPatient);
  const setReviewStatusMut = useMutation(api.sessions.setReviewStatus);
  const createPatient = useMutation(api.patients.create);

  const savedSession = useQuery(
    api.sessions.get,
    sessionId && view === "review" && status === "completed" ? { id: sessionId } : "skip"
  );

  // Cmd+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdkOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // URL → state sync (handles back/forward/direct nav/refresh).
  // Navigation handlers push URLs; this effect picks up external changes.
  useEffect(() => {
    const parsed = parsePath(pathname);

    if (parsed.kind === "newSession") {
      // Stay in recording if we're mid-session; otherwise show idle.
      setView((v) => (v === "recording" ? "recording" : "idle"));
      return;
    }

    if (parsed.kind === "review") {
      setSessionId((curr) => {
        if (curr === parsed.sessionId) return curr;
        // Switching to a different session — clear live entries so saved load.
        setEntries([]);
        entriesRef.current = [];
        setStatus("completed");
        return parsed.sessionId;
      });
      setView("review");
      return;
    }

    if (parsed.kind === "patient") {
      setPatientDetailId(parsed.patientId);
      setView("patient");
      return;
    }

    if (parsed.kind === "patients") {
      setView("patients");
      return;
    }

    if (parsed.kind === "sessions") {
      setView("sessions");
      return;
    }

    // dashboard / "/"
    setView("dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          if (suggestedText) return { ...e, loadingSuggestion: false, suggestion: suggestedText };
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
      const updated = prev.map((entry) =>
        entry.id !== entryId ? entry : { ...entry, suggestion: undefined }
      );
      entriesRef.current = updated;
      return updated;
    });
  }, []);

  const handleTranscript = useCallback((entry: TranscriptEntry) => {
    setEntries((prev) => {
      const updated = [...prev, entry];
      entriesRef.current = updated;
      return updated;
    });
    entriesBufferRef.current.push(entry);
  }, []);

  const handleInterim = useCallback((text: string, speaker: "doctor" | "patient") => {
    setInterimText(text);
    setInterimSpeaker(speaker);
  }, []);

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

  const toConvexEntries = (entries: TranscriptEntry[]) =>
    entries.map((e) => ({ id: e.id, speaker: e.speaker, text: e.text, timestamp: e.timestamp }));

  const startFlushing = useCallback(
    (id: SessionId) => {
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
    async (id: SessionId) => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      if (entriesBufferRef.current.length > 0) {
        const batch = entriesBufferRef.current.splice(0);
        try {
          await appendTranscript({ id, entries: toConvexEntries(batch) });
        } catch {}
      }
    },
    [appendTranscript]
  );

  const runScribeBatch = useCallback(async () => {
    const audioBlob = getRecording();
    if (!audioBlob) return;
    setIsReprocessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("specialty", selectedSpecialty);
      const res = await fetch("/api/ai/scribe-batch", { method: "POST", body: formData });
      if (!res.ok) return;
      const data = await res.json();
      if (data.skipped || !data.entries || data.entries.length === 0) return;
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
      if (sessionId) {
        try {
          await replaceTranscript({ id: sessionId, entries: toConvexEntries(batchEntries) });
        } catch {}
      }
    } catch {} finally {
      setIsReprocessing(false);
    }
  }, [getRecording, selectedSpecialty, sessionId, replaceTranscript]);

  // --- Navigation ---

  const handleNavigate = useCallback(
    (next: AppView) => {
      if (next !== "patient") setPatientDetailId(null);
      setView(next);
      router.push(pathFor(next));
    },
    [router]
  );

  const handleNewSession = useCallback(
    (prefilledPatient?: PatientId | null) => {
      setEntries([]);
      entriesRef.current = [];
      setSessionId(null);
      setStartedAt(null);
      setInterimText("");
      setStatus("idle");
      setSelectedPatientIdForNew(prefilledPatient ?? null);
      setView("idle");
      router.push("/sessions/new");
    },
    [router]
  );

  const handleOpenPatient = useCallback(
    (id: PatientId) => {
      setPatientDetailId(id);
      setView("patient");
      router.push(`/patients/${id}`);
    },
    [router]
  );

  const handleOpenSession = useCallback(
    (id: SessionId) => {
      setSessionId(id);
      setEntries([]);
      entriesRef.current = [];
      setView("review");
      setStatus("completed");
      router.push(`/sessions/${id}`);
    },
    [router]
  );

  // --- Recording lifecycle ---

  const handleStart = useCallback(async () => {
    setEntries([]);
    entriesRef.current = [];
    setStartedAt(Date.now());
    setInterimText("");

    const id = await createSession({
      title: `Relace ${new Date().toLocaleString("cs-CZ")}`,
      patientId: selectedPatientIdForNew ?? undefined,
    });
    setSessionId(id);
    setStatus("recording");
    setView("recording");

    await connect();
    await startRecording();
    startFlushing(id);
  }, [createSession, connect, startRecording, startFlushing, selectedPatientIdForNew]);

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
    if (sessionId) router.push(`/sessions/${sessionId}`);
    runScribeBatch();
  }, [stopRecording, disconnect, sessionId, startedAt, stopFlushing, completeSession, runScribeBatch, router]);

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

  const handleLinkPatientInReview = useCallback(
    async (id: PatientId | null) => {
      if (!sessionId) return;
      await linkPatient({ id: sessionId, patientId: id ?? undefined });
    },
    [sessionId, linkPatient]
  );

  const handleChangeReviewStatus = useCallback(
    async (s: ReviewStatus) => {
      if (!sessionId) return;
      await setReviewStatusMut({ id: sessionId, reviewStatus: s });
    },
    [sessionId, setReviewStatusMut]
  );

  const handleBackToDashboard = useCallback(() => {
    setSessionId(null);
    setEntries([]);
    entriesRef.current = [];
    setStartedAt(null);
    setStatus("idle");
    setView("dashboard");
    router.push("/");
  }, [router]);

  // Resolve entries: live state or saved session
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
  const resolvedPatientId =
    (savedSession?.patientId as PatientId | undefined) ?? selectedPatientIdForNew;
  const resolvedReviewStatus = (savedSession?.reviewStatus ?? "draft") as ReviewStatus;

  const inFocusedMode = view === "idle" || view === "recording";

  if (inFocusedMode) {
    return (
      <div className="flex h-full flex-col">
        <AnimatePresence mode="wait">
          {view === "idle" && (
            <IdleScreen
              key="idle"
              selectedDeviceId={selectedDeviceId}
              selectedSpecialty={selectedSpecialty}
              selectedPatientId={selectedPatientIdForNew}
              onStart={handleStart}
              onDeviceChange={setSelectedDeviceId}
              onSpecialtyChange={setSelectedSpecialty}
              onPatientChange={setSelectedPatientIdForNew}
              onShowHistory={() => handleNavigate("sessions")}
              onBack={handleBackToDashboard}
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
              onNewSession={handleBackToDashboard}
              onDeviceChange={setSelectedDeviceId}
              onRequestSuggestion={handleRequestSuggestion}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissSuggestion={handleDismissSuggestion}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AppShell
      view={view}
      onViewChange={handleNavigate}
      onOpenCommandPalette={() => setCmdkOpen(true)}
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
    >
      {view === "dashboard" && (
        <DashboardView
          key="dashboard"
          onNewSession={() => handleNewSession(null)}
          onOpenPatients={() => handleNavigate("patients")}
          onOpenSessions={() => handleNavigate("sessions")}
          onOpenPatient={handleOpenPatient}
          onOpenSession={handleOpenSession}
        />
      )}

      {view === "patients" && (
        <PatientsView key="patients" onOpenPatient={handleOpenPatient} />
      )}

      {view === "patient" && patientDetailId && (
        <PatientDetailView
          key={`patient-${patientDetailId}`}
          patientId={patientDetailId}
          onBack={() => handleNavigate("patients")}
          onNewSessionForPatient={(id) => handleNewSession(id)}
          onOpenSession={handleOpenSession}
          onDeleted={() => {
            setPatientDetailId(null);
            router.push("/patients");
          }}
        />
      )}

      {view === "sessions" && (
        <SessionsListView
          key="sessions"
          onNewSession={() => handleNewSession(null)}
          onOpenSession={handleOpenSession}
        />
      )}

      {view === "review" && (
        <ReviewScreen
          key={`review-${sessionId}`}
          sessionId={sessionId}
          entries={resolvedEntries}
          startedAt={resolvedStartedAt}
          durationMs={resolvedDurationMs}
          savedNote={savedSession?.note || ""}
          savedTemplateId={savedSession?.noteTemplateId || "summary"}
          savedBillingCodes={savedSession?.billingCodes || []}
          patientId={resolvedPatientId ?? null}
          reviewStatus={resolvedReviewStatus}
          isReprocessing={isReprocessing}
          onSaveNote={handleSaveNote}
          onSaveBillingCodes={handleSaveBillingCodes}
          onRequestSuggestion={handleRequestSuggestion}
          onAcceptSuggestion={handleAcceptSuggestion}
          onDismissSuggestion={handleDismissSuggestion}
          onLinkPatient={handleLinkPatientInReview}
          onChangeReviewStatus={handleChangeReviewStatus}
          onNewSession={() => handleNewSession(resolvedPatientId ?? null)}
          onBackToList={() => handleNavigate("sessions")}
        />
      )}

      <CommandPalette
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        onOpenPatient={handleOpenPatient}
        onOpenSession={handleOpenSession}
        onNewSession={() => handleNewSession(null)}
        onNewPatient={() => setNewPatientOpen(true)}
      />

      <PatientFormDialog
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSubmit={async (data) => {
          const id = (await createPatient(data)) as PatientId;
          setNewPatientOpen(false);
          handleOpenPatient(id);
        }}
      />
    </AppShell>
  );
}

// --- URL helpers ---

type ParsedPath =
  | { kind: "dashboard"; sessionId: null; patientId: null }
  | { kind: "sessions"; sessionId: null; patientId: null }
  | { kind: "newSession"; sessionId: null; patientId: null }
  | { kind: "review"; sessionId: SessionId; patientId: null }
  | { kind: "patients"; sessionId: null; patientId: null }
  | { kind: "patient"; sessionId: null; patientId: PatientId };

function parsePath(pathname: string): ParsedPath {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { kind: "dashboard", sessionId: null, patientId: null };
  }
  if (parts[0] === "sessions") {
    if (parts[1] === "new") {
      return { kind: "newSession", sessionId: null, patientId: null };
    }
    if (parts[1]) {
      return {
        kind: "review",
        sessionId: parts[1] as SessionId,
        patientId: null,
      };
    }
    return { kind: "sessions", sessionId: null, patientId: null };
  }
  if (parts[0] === "patients") {
    if (parts[1]) {
      return {
        kind: "patient",
        sessionId: null,
        patientId: parts[1] as PatientId,
      };
    }
    return { kind: "patients", sessionId: null, patientId: null };
  }
  return { kind: "dashboard", sessionId: null, patientId: null };
}

function initialViewFromPath(pathname: string): AppView {
  const parsed = parsePath(pathname);
  switch (parsed.kind) {
    case "dashboard":
      return "dashboard";
    case "sessions":
      return "sessions";
    case "newSession":
      return "idle";
    case "review":
      return "review";
    case "patients":
      return "patients";
    case "patient":
      return "patient";
  }
}

function pathFor(view: AppView): string {
  switch (view) {
    case "dashboard":
      return "/";
    case "sessions":
      return "/sessions";
    case "patients":
      return "/patients";
    case "idle":
    case "recording":
      return "/sessions/new";
    case "review":
    case "patient":
      // These need an id; callers should push the specific path directly.
      return "/";
  }
}
