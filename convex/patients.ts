import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db.query("patients").order("desc").collect();
    return Promise.all(
      patients.map(async (p) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_patient", (q) => q.eq("patientId", p._id))
          .collect();
        const lastVisit = sessions.reduce(
          (max, s) => (s.createdAt > max ? s.createdAt : max),
          0
        );
        return {
          ...p,
          sessionCount: sessions.length,
          lastVisit: lastVisit || undefined,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithSessions = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.id);
    if (!patient) return null;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.id))
      .order("desc")
      .collect();
    return { ...patient, sessions };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    birthDate: v.optional(v.string()),
    mrn: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patients", {
      ...args,
      archived: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("patients"),
    name: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    mrn: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const archive = mutation({
  args: { id: v.id("patients"), archived: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { archived: args.archived });
  },
});

export const remove = mutation({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.id))
      .collect();
    for (const s of sessions) {
      await ctx.db.patch(s._id, { patientId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});
