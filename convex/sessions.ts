import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      title: args.title,
      date: new Date().toISOString(),
      status: "recording",
      transcript: [],
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").order("desc").collect();
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

export const updateStatus = mutation({
  args: {
    id: v.id("sessions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
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
