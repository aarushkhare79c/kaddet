import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * MUTATION: ensureUser
 * Use this when the app starts. It checks if the player exists.
 * If they do, it returns their ID. If not, it creates them with 0 points.
 */
export const ensureUser = mutation({
  // 'args' defines what the Frontend MUST send to this function
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // 1. Search the 'users' table using the index we made in schema.ts
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    // 2. If the user is found, just return their existing data
    if (existing) return existing._id;

    // 3. Otherwise, insert a new record and start them at 0 points
    return await ctx.db.insert("users", { 
      username: args.username, 
      points: 0 
    });
  },
});

/**
 * MUTATION: addPoints
 * This is called by the AI Agent (convex/agent.ts) when a quest is completed.
 * It "Patches" (updates) the user's score.
 */
export const addPoints = mutation({
  args: { username: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (user) {
      // .patch only changes the fields you specify (points), leaving others alone
      await ctx.db.patch(user._id, { 
        points: user.points + args.amount 
      });
    }
  },
});

/**
 * QUERY: getLeaderboard
 * This is "Reactive." When points change, any React component 
 * using this query will automatically re-render with the new scores!
 */
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .order("desc") // Sort by newest/highest points
      .take(10);     // Only grab the top 10 to keep it fast
  },
});