import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // THE USERS TABLE: Stores player profiles and their progress
  users: defineTable({
    // 'v.string()' ensures we can't accidentally save a number or object here
    username: v.string(), 
    
    // Total points earned. We start at 0 and increase this via mutations
    points: v.number(),
  })
  // INDEXING: This is like a "Table of Contents" for the database.
  // It allows Convex to find a user by their name in 1ms instead of 
  // scanning the whole list of players.
  .index("by_username", ["username"]),

  // THE QUESTS TABLE: A list of challenges created by Person C
  quests: defineTable({
    // The name of the quest (e.g., "Find the Golden Gate Bridge")
    title: v.string(),
    
    // Specific instructions for the player
    description: v.string(),
    
    // How much the quest is worth (reward)
    points: v.number(),
    
    // Type helps Person B choose which icon or UI to show (speech, photo, etc.)
    type: v.string(), 
    
    // Tracks if this specific quest is finished globally or per-game
    isCompleted: v.boolean(),
  }),
});