import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  patients: defineTable({
    name: v.string(),
    birthDate: v.optional(v.string()),
    mrn: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  sessions: defineTable({
    title: v.string(),
    date: v.string(),
    status: v.string(),
    reviewStatus: v.optional(v.string()),
    patientId: v.optional(v.id("patients")),
    transcript: v.array(
      v.object({
        id: v.string(),
        speaker: v.string(),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    summary: v.optional(v.string()),
    prescription: v.optional(v.string()),
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
  })
    .index("by_patient", ["patientId"])
    .index("by_reviewStatus", ["reviewStatus"]),
});
