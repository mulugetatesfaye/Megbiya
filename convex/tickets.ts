import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/* -------------------------------------------
   GET MY TICKETS (GROUPED BY EVENT)
------------------------------------------- */
export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // DEV fallback
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", "dev@test.com"))
          .first();

    if (!user) return [];

    // Fetch tickets owned by the user
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (tickets.length === 0) return [];

    // Group tickets by eventId (NO `any`)
    const ticketsByEvent = new Map<Id<"events">, typeof tickets>();

    for (const ticket of tickets) {
      const existing = ticketsByEvent.get(ticket.eventId);
      if (existing) {
        existing.push(ticket);
      } else {
        ticketsByEvent.set(ticket.eventId, [ticket]);
      }
    }

    // Build final response
    const result: {
      event: Awaited<ReturnType<typeof ctx.db.get>>;
      tickets: typeof tickets;
    }[] = [];

    for (const [eventId, eventTickets] of ticketsByEvent) {
      const event = await ctx.db.get(eventId);
      if (!event) continue;

      result.push({
        event,
        tickets: eventTickets,
      });
    }

    return result;
  },
});
