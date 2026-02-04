import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireOrganizer(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  // Allow both organizers and admins to manage events
  if (!user || (user.role !== "organizer" && user.role !== "admin")) {
    throw new Error("Forbidden");
  }

  return user;
}
