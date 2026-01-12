import {
  internalMutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";

// ============== QUERIES ==============

// Get the current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Get user by ID (useful for other parts of your app)
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// ============== INTERNAL MUTATIONS (Webhook Only) ==============

// Called by Webhook: Create or Update user
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, email, firstName, lastName, imageUrl, username, phone } =
      args;

    // Check if user already exists
    const existingUser = await userByClerkId(ctx, clerkId);
    const now = Date.now();

    if (existingUser === null) {
      // CREATE: New user from Clerk
      await ctx.db.insert("users", {
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl,
        username,
        phone,
        role: "attendee", // Default role for new users
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created new user for Clerk ID: ${clerkId}`);
    } else {
      // UPDATE: Existing user - only update Clerk-managed fields
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        imageUrl,
        username,
        phone,
        updatedAt: now,
        // Note: We don't update role/status here - those are managed by your app
      });
      console.log(`Updated user for Clerk ID: ${clerkId}`);
    }
  },
});

// Called by Webhook: Delete user
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await userByClerkId(ctx, clerkId);

    if (user !== null) {
      await ctx.db.delete(user._id);
      console.log(`Deleted user for Clerk ID: ${clerkId}`);
    } else {
      console.warn(`Can't delete user, none found for Clerk ID: ${clerkId}`);
    }
  },
});

// ============== HELPER FUNCTIONS ==============

// Get the current user from auth context
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) {
    return null;
  }

  return await userByClerkId(ctx, identity.subject);
}

// Find user by Clerk ID - works in both queries and mutations
async function userByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}
