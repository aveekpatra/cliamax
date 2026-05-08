import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      title: args.title,
      patientId: args.patientId,
      date: new Date().toISOString(),
      status: "recording",
      reviewStatus: "draft",
      transcript: [],
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    const patient = session.patientId ? await ctx.db.get(session.patientId) : null;
    return { ...session, patient };
  },
});

export const list = query({
  args: {
    patientId: v.optional(v.id("patients")),
    reviewStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let sessions;
    if (args.patientId) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
        .order("desc")
        .collect();
    } else if (args.reviewStatus) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", args.reviewStatus))
        .order("desc")
        .collect();
    } else {
      sessions = await ctx.db.query("sessions").order("desc").collect();
    }

    const patientIds = Array.from(
      new Set(sessions.map((s) => s.patientId).filter((id): id is NonNullable<typeof id> => !!id))
    );
    const patients = await Promise.all(patientIds.map((id) => ctx.db.get(id)));
    const patientMap = new Map(
      patients.filter((p): p is NonNullable<typeof p> => !!p).map((p) => [p._id, p])
    );

    return sessions.map((s) => ({
      ...s,
      patient: s.patientId ? patientMap.get(s.patientId) ?? null : null,
    }));
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("sessions").collect();
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 6);

    const today = all.filter((s) => s.createdAt >= startOfDay.getTime()).length;
    const week = all.filter((s) => s.createdAt >= startOfWeek.getTime()).length;
    const unsigned = all.filter(
      (s) => s.status === "completed" && (s.reviewStatus ?? "draft") !== "signed"
    ).length;

    const patients = await ctx.db.query("patients").collect();

    return {
      today,
      week,
      unsigned,
      totalSessions: all.length,
      totalPatients: patients.length,
      _generatedAt: now,
    };
  },
});

export const appendTranscript = mutation({
  args: {
    id: v.id("sessions"),
    entries: v.array(
      v.object({
        id: v.string(),
        speaker: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    await ctx.db.patch(args.id, {
      transcript: [...session.transcript, ...args.entries],
    });
  },
});

export const replaceTranscript = mutation({
  args: {
    id: v.id("sessions"),
    entries: v.array(
      v.object({
        id: v.string(),
        speaker: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { transcript: args.entries });
  },
});

// Flip a single transcript entry's speaker (doctor ↔ patient).
// Used when the user manually corrects a misclassified line.
export const toggleEntrySpeaker = mutation({
  args: { id: v.id("sessions"), entryId: v.string() },
  handler: async (ctx, { id, entryId }) => {
    const session = await ctx.db.get(id);
    if (!session) throw new Error("Session not found");
    const transcript = session.transcript.map((e) =>
      e.id === entryId
        ? { ...e, speaker: e.speaker === "doctor" ? "patient" : "doctor" }
        : e
    );
    await ctx.db.patch(id, { transcript });
  },
});

// Flip every entry's speaker. Used when diarization labeled the entire
// transcript inverted (e.g., patient happened to speak first).
export const swapAllSpeakers = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, { id }) => {
    const session = await ctx.db.get(id);
    if (!session) throw new Error("Session not found");
    const transcript = session.transcript.map((e) => ({
      ...e,
      speaker: e.speaker === "doctor" ? "patient" : "doctor",
    }));
    await ctx.db.patch(id, { transcript });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("sessions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const setReviewStatus = mutation({
  args: {
    id: v.id("sessions"),
    reviewStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { reviewStatus: args.reviewStatus });
  },
});

export const linkPatient = mutation({
  args: {
    id: v.id("sessions"),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { patientId: args.patientId });
  },
});

export const complete = mutation({
  args: {
    id: v.id("sessions"),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      durationMs: args.durationMs,
    });
  },
});

export const saveNote = mutation({
  args: {
    id: v.id("sessions"),
    note: v.string(),
    noteTemplateId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      note: args.note,
      noteTemplateId: args.noteTemplateId,
    });
  },
});

export const saveBillingCodes = mutation({
  args: {
    id: v.id("sessions"),
    billingCodes: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        points: v.number(),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { billingCodes: args.billingCodes });
  },
});

export const remove = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
