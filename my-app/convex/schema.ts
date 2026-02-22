import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(), 
    password: v.string(), // The SHA-256 hash
    teamName: v.string(), // Which team they belong to
    points: v.number(),
  }).index("by_username", ["username"]),

  // NEW: Teams table to track if a team already exists
  teams: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  quests: defineTable({
    title: v.string(),
    description: v.string(),
    points: v.number(),
    type: v.string(), 
    isCompleted: v.boolean(),
  }),
});