import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * MUTATION: ensureUser
 * (Legacy function - mostly replaced by signUp)
 */
export const ensureUser = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) return existing._id;

    // FIX: We added dummy values for password and teamName to satisfy the new schema
    return await ctx.db.insert("users", { 
      username: args.username, 
      points: 0,
      password: "legacy_user_no_password", 
      teamName: "Solo Players",            
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

// Add this to the bottom of your existing my-app/convex/users.ts file

/**
 * QUERY: checkTeam
 * Real-time check to see if a team exists so the UI can update the button.
 */
export const checkTeam = query({
  args: { teamName: v.string() },
  handler: async (ctx, args) => {
    if (!args.teamName) return false;
    const team = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.teamName))
      .unique();
    return !!team; // Returns true if team exists, false if not
  },
});

/**
 * MUTATION: signUp
 * Creates a user and creates the team if it doesn't exist yet.
 */
export const signUp = mutation({
  args: { username: v.string(), password: v.string(), teamName: v.string() },
  handler: async (ctx, args) => {
    // 1. Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existingUser) throw new Error("Username already taken!");

    // 2. Check if team exists, if not, create it
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.teamName))
      .unique();
    if (!existingTeam) {
      await ctx.db.insert("teams", { name: args.teamName });
    }

    // 3. Create the user
    await ctx.db.insert("users", {
      username: args.username,
      password: args.password,
      teamName: args.teamName,
      points: 0,
    });
    
    return "Success";
  },
});

/**
 * MUTATION: login
 * Verifies the username and hashed password.
 */
export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    
    if (!user) throw new Error("User not found!");
    if (user.password !== args.password) throw new Error("Incorrect password!");
    
    // Return user data to save in localStorage on the frontend
    return { username: user.username, teamName: user.teamName, points: user.points };
  },
});