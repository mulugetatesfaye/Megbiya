// convex/waitlist.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const joinWaitlist = mutation({
  args: {
    eventId: v.id("events"),
    ticketTypesInterested: v.optional(v.array(v.id("ticketTypes"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    if (existing) return;

    await ctx.db.insert("waitlist", {
      eventId: args.eventId,
      userId: user._id,
      ticketTypesInterested: args.ticketTypesInterested,
      status: "waiting",
      createdAt: Date.now(),
    });
  },
});
