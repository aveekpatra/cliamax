import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    title: v.string(),
    date: v.string(),
    status: v.string(),
    transcript: v.array(
      v.object({
        id: v.string(),
        speaker: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    summary: v.optional(v.string()), // legacy field
    prescription: v.optional(v.string()), // legacy field
    note: v.optional(v.string()),
    noteTemplateId: v.optional(v.string()),
    billingCodes: v.optional(
      v.array(
        v.object({
          code: v.string(),
          name: v.string(),
          points: v.number(),
          reason: v.string(),
        })
      )
    ),
    durationMs: v.optional(v.number()),
    createdAt: v.number(),
  }),
});
