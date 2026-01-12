import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/* -------------------------------------------
   DEV USER HELPERS
------------------------------------------- */

async function getDevUserReadonly(ctx: QueryCtx) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", "dev@test.com"))
    .first();
}

async function getOrCreateDevUser(ctx: MutationCtx) {
  const now = Date.now();

  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", "dev@test.com"))
    .first();

  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    clerkId: "dev",
    email: "dev@test.com",
    firstName: "Dev",
    lastName: "User",
    role: "attendee",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Failed to create dev user");

  return user;
}

/* -------------------------------------------
   CREATE FREE ORDER
------------------------------------------- */
export const createFreeOrder = mutation({
  args: {
    eventId: v.id("events"),
    ticketTypeId: v.id("ticketTypes"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : await getOrCreateDevUser(ctx);

    if (!user) {
      throw new Error("User not found");
    }

    /* Prevent duplicate registration */
    const existingOrder = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) =>
        q.eq("eventId", args.eventId).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("buyerId"), user._id))
      .first();

    if (existingOrder) {
      throw new Error("Already registered for this event");
    }

    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (!ticketType || ticketType.price !== 0) {
      throw new Error("Invalid free ticket");
    }

    const remaining = ticketType.totalQuantity - ticketType.soldQuantity;

    if (remaining < args.quantity) {
      throw new Error("Not enough tickets");
    }

    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId: user._id,
      totalAmount: 0,
      currency: ticketType.currency,
      status: "completed",
      createdAt: now,
    });

    for (let i = 0; i < args.quantity; i++) {
      await ctx.db.insert("tickets", {
        orderId,
        eventId: args.eventId,
        ticketTypeId: args.ticketTypeId,
        userId: user._id,
        ticketNumber: `FREE-${crypto.randomUUID().slice(0, 8)}`,
        qrCodeSecret: crypto.randomUUID(),
        status: "valid",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.ticketTypeId, {
      soldQuantity: ticketType.soldQuantity + args.quantity,
    });

    return { orderId };
  },
});

/* -------------------------------------------
   CHECK DUPLICATE REGISTRATION
------------------------------------------- */
export const hasCompletedOrderForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : await getDevUserReadonly(ctx);

    if (!user) return false;

    const order = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) =>
        q.eq("eventId", args.eventId).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("buyerId"), user._id))
      .first();

    return !!order;
  },
});

/* -------------------------------------------
   CONFIRMATION PAGE DATA
------------------------------------------- */
export const getLatestOrderWithTickets = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : await getDevUserReadonly(ctx);

    if (!user) return null;

    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!event) return null;

    const order = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) =>
        q.eq("eventId", event._id).eq("status", "completed")
      )
      .filter((q) => q.eq(q.field("buyerId"), user._id))
      .order("desc")
      .first();

    if (!order) return null;

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .collect();

    return { event, tickets };
  },
});
