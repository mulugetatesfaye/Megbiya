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

    let user;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
          clerkId: identity.subject,
          email: identity.email ?? "unknown@email.com",
          firstName: identity.givenName ?? "User",
          lastName: identity.familyName ?? "",
          imageUrl: identity.pictureUrl,
          role: "attendee",
          status: "active",
          createdAt: now,
          updatedAt: now,
        });

        user = await ctx.db.get(userId);
      }
    } else {
      user = await getOrCreateDevUser(ctx);
    }

    if (!user) {
      throw new Error("User creation failed");
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
   CREATE PAID ORDER
------------------------------------------- */
export const createPaidOrder = mutation({
  args: {
    eventId: v.id("events"),
    items: v.array(
      v.object({
        ticketTypeId: v.id("ticketTypes"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const identity = await ctx.auth.getUserIdentity();

    let user;

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user) {
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
          clerkId: identity.subject,
          email: identity.email ?? "unknown@email.com",
          firstName: identity.givenName ?? "User",
          lastName: identity.familyName ?? "",
          imageUrl: identity.pictureUrl,
          role: "attendee",
          status: "active",
          createdAt: now,
          updatedAt: now,
        });

        user = await ctx.db.get(userId);
      }
    } else {
      user = await getOrCreateDevUser(ctx);
    }

    if (!user) {
      throw new Error("User creation failed");
    }

    // Validate all ticket types and calculate total
    let totalAmount = 0;
    let currency = "ETB";
    const ticketValidations = [];

    for (const item of args.items) {
      const ticketType = await ctx.db.get(item.ticketTypeId);
      if (!ticketType) {
        throw new Error(`Invalid ticket type: ${item.ticketTypeId}`);
      }

      const remaining = ticketType.totalQuantity - ticketType.soldQuantity;
      if (remaining < item.quantity) {
        throw new Error(`Not enough tickets available for ${ticketType.name}`);
      }

      totalAmount += ticketType.price * item.quantity;
      currency = ticketType.currency;
      ticketValidations.push({ ticketType, quantity: item.quantity });
    }

    if (totalAmount === 0) {
      throw new Error("Use createFreeOrder for free tickets");
    }

    // Create pending order (will be completed after payment)
    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId: user._id,
      totalAmount,
      currency,
      status: "pending",
      createdAt: now,
      expiresAt: now + 30 * 60 * 1000, // 30 minutes expiry
    });

    // Reserve tickets (but don't create them yet - wait for payment)
    for (const { ticketType, quantity } of ticketValidations) {
      await ctx.db.patch(ticketType._id, {
        soldQuantity: ticketType.soldQuantity + quantity,
      });
    }

    return {
      orderId,
      totalAmount,
      currency,
      expiresAt: now + 30 * 60 * 1000,
    };
  },
});

/* -------------------------------------------
   COMPLETE ORDER PAYMENT
------------------------------------------- */
export const completeOrderPayment = mutation({
  args: {
    orderId: v.id("orders"),
    paymentIntentId: v.string(),
    items: v.array(
      v.object({
        ticketTypeId: v.id("ticketTypes"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending") {
      throw new Error("Order is not pending payment");
    }

    // Check if order has expired
    if (order.expiresAt && order.expiresAt < now) {
      throw new Error("Order has expired");
    }

    // Update order to completed
    await ctx.db.patch(args.orderId, {
      status: "completed",
      paymentIntentId: args.paymentIntentId,
    });

    // Get event for ticket number generation
    const event = await ctx.db.get(order.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Create tickets based on order items
    let ticketsCreated = 0;

    for (const item of args.items) {
      const ticketType = await ctx.db.get(item.ticketTypeId);
      if (!ticketType) {
        throw new Error(`Ticket type not found: ${item.ticketTypeId}`);
      }

      for (let i = 0; i < item.quantity; i++) {
        await ctx.db.insert("tickets", {
          orderId: args.orderId,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
          userId: order.buyerId,
          ticketNumber: `${event.slug.toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`,
          qrCodeSecret: crypto.randomUUID(),
          status: "valid",
          createdAt: now,
          updatedAt: now,
        });
        ticketsCreated++;
      }
    }

    return { success: true, ticketsCreated };
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

/* -------------------------------------------
   GET USER'S TICKETS
------------------------------------------- */
export const getUserTickets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : await getDevUserReadonly(ctx);

    if (!user) return [];

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get event and ticket type details for each ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await ctx.db.get(ticket.eventId);
        const ticketType = await ctx.db.get(ticket.ticketTypeId);

        return {
          ...ticket,
          event,
          ticketType,
        };
      })
    );

    // Sort by creation date, newest first
    return ticketsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});
