import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // USERS
  // Extended to include phone for SMS notifications
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()), // Useful for public profiles
    phone: v.optional(v.string()), // Important for ticket delivery

    role: v.union(
      v.literal("admin"),
      v.literal("organizer"),
      v.literal("attendee")
    ),
    status: v.union(v.literal("active"), v.literal("suspended")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // CATEGORIES
  // Normalized list of event types (Music, Tech, Art, etc.)
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()), // Emoji or icon identifier
    color: v.optional(v.string()), // Hex code for UI theming
  }).index("by_slug", ["slug"]),

  // EVENTS
  // The core event data. Pricing moved to TicketTypes.
  events: defineTable({
    title: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()), // For card views
    slug: v.string(),

    // Organization
    organizerId: v.id("users"),
    categoryId: v.id("categories"),

    // Logistics
    locationName: v.string(),
    address: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(), // e.g., "America/New_York"

    // Media
    coverImageUrl: v.string(),
    galleryImages: v.optional(v.array(v.string())),

    // Capacity & Settings
    isPublished: v.boolean(), // Soft launch capability
    totalCapacity: v.optional(v.number()), // Hard limit for the venue
    minOrder: v.number(), // Min tickets per order (default 1)
    maxOrder: v.number(), // Max tickets per order (e.g., 10)

    // Admin Approval
          approvalStatus: v.optional(
            v.union(
              v.literal("pending"),
              v.literal("approved"),
              v.literal("rejected")
            )
          ), // Approval workflow for admins
    approvalNotes: v.optional(v.string()), // Admin notes for approval/rejection
    reviewedBy: v.optional(v.id("users")), // Admin who reviewed the event
    reviewedAt: v.optional(v.number()), // When it was reviewed

    // Metadata
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_slug", ["slug"])
    .index("by_startDate", ["startDate"])
    .index("by_category", ["categoryId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublished", "startDate"],
    }),

  // TICKET TYPES (TIERS)
  // Defines the kinds of tickets available for an event (VIP, GA, etc.)
  ticketTypes: defineTable({
    eventId: v.id("events"),
    name: v.string(), // e.g., "General Admission"
    description: v.optional(v.string()), // e.g., "Access to main floor"

    // Pricing
    price: v.number(), // In cents (0 for free)
    currency: v.string(), // e.g., "ETB"

    // Availability
    totalQuantity: v.number(), // Total tickets available for this tier
    soldQuantity: v.number(), // Counter for sales
    saleStart: v.number(), // Unix timestamp when sales start
    saleEnd: v.number(), // Unix timestamp when sales end

    // Settings
    isVisible: v.boolean(), // Can be hidden (e.g., secret "Early Bird")
    minPerOrder: v.number(),
    maxPerOrder: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_saleDates", ["saleStart", "saleEnd"]),

  // ORDERS
  // Represents the financial transaction. One Order can contain multiple Tickets.
  // "Payment part for later" -> We track status here, but don't link to Stripe yet.
  orders: defineTable({
    eventId: v.id("events"),
    buyerId: v.id("users"),

    // Financials (Placeholder for future payment integration)
    totalAmount: v.number(), // Sum of ticket prices
    currency: v.string(),
    paymentProvider: v.optional(v.string()), // e.g., "stripe", "paypal"
    paymentIntentId: v.optional(v.string()), // External ID from Stripe (later)

    // Status
    status: v.union(
      v.literal("pending"), // Order created, awaiting payment
      v.literal("completed"), // Paid/Confirmed
      v.literal("cancelled"), // Timed out or user cancelled
      v.literal("refunded")
    ),

    // Metadata
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // For pending payment hold
  })
    .index("by_buyer", ["buyerId"])
    .index("by_event", ["eventId", "status"])
    .index("by_status", ["status"]),

  // TICKETS
  // The actual passes issued to attendees. Linked to a TicketType.
  tickets: defineTable({
    orderId: v.id("orders"),
    eventId: v.id("events"),
    ticketTypeId: v.id("ticketTypes"),
    userId: v.id("users"), // The attendee (might be same as buyer)

    // Identification
    ticketNumber: v.string(), // Human readable ID (e.g., #EVT-8821)
    qrCodeSecret: v.string(), // The raw string data for the QR code

    // Check-in Status
    status: v.union(
      v.literal("valid"),
      v.literal("checked_in"),
      v.literal("voided")
    ),
    checkedInAt: v.optional(v.number()),
    checkedInBy: v.optional(v.id("users")), // Who scanned the ticket

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["orderId"])
    .index("by_user", ["userId"])
    .index("by_event_checkin", ["eventId", "status"]),

  // WAITLIST
  // Captures intent when tickets are sold out
  waitlist: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketTypesInterested: v.optional(v.array(v.id("ticketTypes"))),
    status: v.union(
      v.literal("waiting"),
      v.literal("notified"),
      v.literal("claimed")
    ),
    createdAt: v.number(),
  })
    .index("by_event_user", ["eventId", "userId"])
    .index("by_user", ["userId"]),

  // ACTIVITY LOG
  // Tracks actions for analytics and audit trails
  activities: defineTable({
    action: v.string(), // "ticket_purchased", "event_created", "check_in_occurred"
    actorId: v.optional(v.id("users")), // Who performed the action
    eventId: v.optional(v.id("events")),
    orderId: v.optional(v.id("orders")),
    metadata: v.optional(v.any()), // Flexible JSON object for details
    ipAddress: v.optional(v.string()), // For security/fraud analysis later
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_actor", ["actorId"])
    .index("by_createdAt", ["createdAt"]),
});
