import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOrganizer } from "./lib/requireOrganizer";
import { slugify } from "./lib/slugify";

export const createEvent = mutation({
  args: {
    title: v.string(),
    shortDescription: v.optional(v.string()),
    description: v.string(),

    categoryId: v.id("categories"),

    coverImageUrl: v.string(),

    locationName: v.string(),
    address: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    timezone: v.string(),

    startDate: v.number(),
    endDate: v.number(),

    totalCapacity: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    maxOrder: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    ticketTypes: v.optional(v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(), // in cents
      currency: v.string(),
      totalQuantity: v.number(),
      saleStart: v.number(),
      saleEnd: v.number(),
      isVisible: v.boolean(),
      minPerOrder: v.number(),
      maxPerOrder: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const organizer = await requireOrganizer(ctx);
    const now = Date.now();

    // Generate a unique slug
    let baseSlug = slugify(args.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug already exists and append number if needed
    while (true) {
      const existing = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const eventId = await ctx.db.insert("events", {
      title: args.title,
      shortDescription: args.shortDescription,
      description: args.description,
      slug,

      organizerId: organizer._id,
      categoryId: args.categoryId,

      locationName: args.locationName,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      timezone: args.timezone,
      startDate: args.startDate,
      endDate: args.endDate,

      coverImageUrl: args.coverImageUrl,

      isPublished: false, // DRAFT
      minOrder: args.minOrder || 1,
      maxOrder: args.maxOrder || 10,
      totalCapacity: args.totalCapacity,

      tags: args.tags,

      // Admin approval workflow
      approvalStatus: "pending", // Events start as pending approval
      approvalNotes: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,

      createdAt: now,
      updatedAt: now,
    });

    // Create ticket types if provided
    if (args.ticketTypes && args.ticketTypes.length > 0) {
      for (const ticketType of args.ticketTypes) {
        await ctx.db.insert("ticketTypes", {
          eventId,
          name: ticketType.name,
          description: ticketType.description,
          price: ticketType.price,
          currency: ticketType.currency,
          totalQuantity: ticketType.totalQuantity,
          soldQuantity: 0,
          saleStart: ticketType.saleStart,
          saleEnd: ticketType.saleEnd,
          isVisible: ticketType.isVisible,
          minPerOrder: ticketType.minPerOrder,
          maxPerOrder: ticketType.maxPerOrder,
        });
      }
    }

    return { eventId, slug };
  },
});

// Get featured events for home page
export const getFeaturedEvents = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Sort by start date (upcoming first) and take top 5
    const upcomingEvents = events
      .filter(e => e.startDate > Date.now())
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 5);

    // Get related data
    const eventsWithDetails = await Promise.all(
      upcomingEvents.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        // Get ticket types to calculate price range
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("isVisible"), true))
          .collect();

        const prices = ticketTypes.map((t) => t.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        // Calculate available tickets
        const availableTickets = ticketTypes.reduce(
          (sum, t) => sum + (t.totalQuantity - t.soldQuantity),
          0
        );

        return {
          ...event,
          category,
          organizer: organizer
            ? {
                name: `${organizer.firstName} ${organizer.lastName}`,
                imageUrl: organizer.imageUrl,
              }
            : null,
          priceRange: {
            min: minPrice,
            max: maxPrice,
            currency: ticketTypes[0]?.currency || "ETB",
          },
          availableTickets,
          isSoldOut: availableTickets === 0,
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get all published events with filters
export const getPublishedEvents = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { categoryId, search, limit = 50 } = args;

    let eventsQuery = ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPublished"), true),
          q.eq(q.field("approvalStatus"), "approved")
        )
      );

    // Apply category filter
    if (categoryId) {
      eventsQuery = eventsQuery.filter((q) =>
        q.eq(q.field("categoryId"), categoryId)
      );
    }

    let events = await eventsQuery.collect();

    // Apply search filter
    if (search && search.length > 0) {
      const searchLower = search.toLowerCase();
      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.locationName.toLowerCase().includes(searchLower) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by start date (upcoming first)
    events.sort((a, b) => a.startDate - b.startDate);

    // Limit results
    events = events.slice(0, limit);

    // Get related data
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        // Get ticket types to calculate price range
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("isVisible"), true))
          .collect();

        const prices = ticketTypes.map((t) => t.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        // Calculate available tickets
        const availableTickets = ticketTypes.reduce(
          (sum, t) => sum + (t.totalQuantity - t.soldQuantity),
          0
        );

        return {
          ...event,
          category,
          organizer: organizer
            ? {
                name: `${organizer.firstName} ${organizer.lastName}`,
                imageUrl: organizer.imageUrl,
              }
            : null,
          priceRange: {
            min: minPrice,
            max: maxPrice,
            currency: ticketTypes[0]?.currency || "ETB",
          },
          availableTickets,
          isSoldOut: availableTickets === 0,
        };
      })
    );

    return eventsWithDetails;
  },
});

// Recommended events for the current user (home page)
export const getRecommendedEventsForUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();
    const limit = args.limit ?? 6;

    // Base query: upcoming, published, approved events
    let events = await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPublished"), true),
          q.eq(q.field("approvalStatus"), "approved"),
          q.gt(q.field("startDate"), now)
        )
      )
      .collect();

    // Fallback: if no auth, just return upcoming events by date
    if (!identity) {
      events.sort((a, b) => a.startDate - b.startDate);
      events = events.slice(0, limit);
    } else {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (user) {
        // Get user's tickets to infer preferences
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        if (tickets.length > 0) {
          const attendedEventIds = new Set(tickets.map((t) => t.eventId));

          // Load attended events to extract categories and tags
          const attendedEvents = (
            await Promise.all(
              Array.from(attendedEventIds).map((id) => ctx.db.get(id))
            )
          ).filter((e): e is NonNullable<typeof e> => Boolean(e));

          const preferredCategoryIds = new Set(
            attendedEvents.map((e) => e.categoryId)
          );
          const preferredTags = new Set(
            attendedEvents
              .flatMap((e) => e.tags ?? [])
              .map((tag) => tag.toLowerCase())
          );

          // Score candidate events by category / tags and recency
          const scored = events
            .filter((e) => !attendedEventIds.has(e._id))
            .map((e) => {
              let score = 0;
              if (preferredCategoryIds.has(e.categoryId)) score += 3;
              if (e.tags && preferredTags.size > 0) {
                const overlap = e.tags.filter((tag) =>
                  preferredTags.has(tag.toLowerCase())
                ).length;
                score += overlap;
              }
              // Slight boost for events happening within the next 7 days
              const oneWeek = 7 * 24 * 60 * 60 * 1000;
              if (e.startDate - now < oneWeek) score += 1;

              return { event: e, score };
            })
            .filter((item) => item.score > 0);

          if (scored.length > 0) {
            scored.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return a.event.startDate - b.event.startDate;
            });
            events = scored.slice(0, limit).map((s) => s.event);
          } else {
            // No scored results – fallback to earliest upcoming events
            events.sort((a, b) => a.startDate - b.startDate);
            events = events.slice(0, limit);
          }
        } else {
          // No ticket history – fallback
          events.sort((a, b) => a.startDate - b.startDate);
          events = events.slice(0, limit);
        }
      } else {
        // No user record – fallback
        events.sort((a, b) => a.startDate - b.startDate);
        events = events.slice(0, limit);
      }
    }

    // Attach category, organizer, price range, and availability (same shape as getPublishedEvents)
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("isVisible"), true))
          .collect();

        const prices = ticketTypes.map((t) => t.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        const availableTickets = ticketTypes.reduce(
          (sum, t) => sum + (t.totalQuantity - t.soldQuantity),
          0
        );

        return {
          ...event,
          category,
          organizer: organizer
            ? {
                name: `${organizer.firstName || "Unknown"} ${
                  organizer.lastName || ""
                }`.trim(),
                imageUrl: organizer.imageUrl,
              }
            : null,
          priceRange: {
            min: minPrice,
            max: maxPrice,
            currency: ticketTypes[0]?.currency || "ETB",
          },
          availableTickets,
          isSoldOut: availableTickets === 0,
        };
      })
    );

    return eventsWithDetails;
  },
});


// Search events using searchIndex
export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, limit = 10 } = args;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }

    // Search in title, description, and location
    const searchLower = trimmedQuery.toLowerCase();

    const allEvents = await ctx.db
      .query("events")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPublished"), true),
          q.eq(q.field("approvalStatus"), "approved")
        )
      )
      .collect();

    const searchResults = allEvents
      .filter((event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.locationName?.toLowerCase().includes(searchLower) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, limit);


    // Get related data for results
    const eventsWithDetails = await Promise.all(
      searchResults.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        // Get ticket types to calculate price range
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .filter((q) => q.eq(q.field("isVisible"), true))
          .collect();

        const prices = ticketTypes.map((t) => t.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        return {
          ...event,
          category,
          organizer: organizer
            ? {
                name: `${organizer.firstName || 'Unknown'} ${organizer.lastName || ''}`.trim(),
                imageUrl: organizer.imageUrl,
              }
            : null,
          priceRange: {
            min: minPrice,
            max: maxPrice,
            currency: ticketTypes[0]?.currency || "ETB",
          },
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get single event by slug (handles duplicate slugs by taking most recent approved)
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();

    const published = events.filter(
      (e) => e.isPublished && e.approvalStatus === "approved"
    );
    const event =
      published.length > 0
        ? published.sort((a, b) => b.createdAt - a.createdAt)[0]
        : null;

    if (!event) {
      return null;
    }

    const category = await ctx.db.get(event.categoryId);
    const organizer = await ctx.db.get(event.organizerId);

    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    return {
      ...event,
      category,
      organizer: organizer
        ? {
            name: `${organizer.firstName} ${organizer.lastName}`,
            imageUrl: organizer.imageUrl,
          }
        : null,
      ticketTypes,
    };
  },
});

// Get events for the current organizer (both published and drafts)
export const getOrganizerEvents = query({
  handler: async (ctx) => {
    const organizer = await requireOrganizer(ctx);

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", organizer._id))
      .collect();

    // Sort by start date (upcoming first, then past)
    const now = Date.now();
    events.sort((a, b) => {
      // Both upcoming: sort by start date
      if (a.startDate > now && b.startDate > now) {
        return a.startDate - b.startDate;
      }
      // Both past: sort by start date (most recent first)
      if (a.startDate <= now && b.startDate <= now) {
        return b.startDate - a.startDate;
      }
      // One upcoming, one past: upcoming first
      return a.startDate > now ? -1 : 1;
    });

    // Get related data
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);

        // Get ticket types
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        // Get ticket sales
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_event_checkin", (q) => q.eq("eventId", event._id))
          .collect();

        const totalTicketsSold = tickets.filter(t => t.status !== "voided").length;
        const totalCheckedIn = tickets.filter(t => t.status === "checked_in").length;
        const totalRevenue = tickets.reduce((sum, ticket) => {
          const ticketType = ticketTypes.find(tt => tt._id === ticket.ticketTypeId);
          return sum + (ticketType?.price || 0);
        }, 0);

        return {
          ...event,
          category,
          ticketTypes,
          stats: {
            totalTicketsSold,
            totalCheckedIn,
            totalRevenue,
            totalCapacity: ticketTypes.reduce((sum, tt) => sum + tt.totalQuantity, 0),
          },
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get organizer dashboard statistics
export const getOrganizerStats = query({
  handler: async (ctx) => {
    const organizer = await requireOrganizer(ctx);

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", organizer._id))
      .collect();

    const now = Date.now();
    const upcomingEvents = events.filter(e => e.startDate > now);
    const pastEvents = events.filter(e => e.startDate <= now);
    const publishedEvents = events.filter(e => e.isPublished);

    // Get all tickets for organizer's events
    const allTickets = await Promise.all(
      events.map(async (event) => {
        return await ctx.db
          .query("tickets")
          .withIndex("by_event_checkin", (q) => q.eq("eventId", event._id))
          .collect();
      })
    );

    const flattenedTickets = allTickets.flat();
    const totalTicketsSold = flattenedTickets.filter(t => t.status !== "voided").length;
    const totalCheckedIn = flattenedTickets.filter(t => t.status === "checked_in").length;

    // Calculate total revenue
    const totalRevenue = await Promise.all(
      events.map(async (event) => {
        const tickets = flattenedTickets.filter(t => t.eventId === event._id);
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        return tickets.reduce((sum, ticket) => {
          const ticketType = ticketTypes.find(tt => tt._id === ticket.ticketTypeId);
          return sum + (ticketType?.price || 0);
        }, 0);
      })
    );

    const totalRevenueSum = totalRevenue.reduce((sum, rev) => sum + rev, 0);

    return {
      totalEvents: events.length,
      publishedEvents: publishedEvents.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      totalTicketsSold,
      totalCheckedIn,
      totalRevenue: totalRevenueSum,
    };
  },
});

// ADMIN QUERIES AND MUTATIONS

// Get all events for admin review
export const getAllEventsForAdmin = query({
  handler: async (ctx) => {
    // This should be protected by admin middleware
    const events = await ctx.db.query("events").collect();

    // Get related data for each event
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        return {
          ...event,
          category,
          organizer: organizer ? {
            name: `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim() || organizer.email,
            email: organizer.email,
          } : null,
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get pending events for admin review
export const getPendingEventsForAdmin = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("approvalStatus"), "pending"))
      .collect();

    // Get related data
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const category = await ctx.db.get(event.categoryId);
        const organizer = await ctx.db.get(event.organizerId);

        return {
          ...event,
          category,
          organizer: organizer ? {
            name: `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim() || organizer.email,
            email: organizer.email,
          } : null,
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get event for organizer management (includes drafts)
export const getEventForManagement = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    // Only allow organizer or admin to view
    if (event.organizerId !== user._id && user.role !== "admin") {
      return null;
    }

    // Get related data
    const category = await ctx.db.get(event.categoryId);
    const organizer = await ctx.db.get(event.organizerId);

    // Get ticket types
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect();

    // Calculate available tickets
    const availableTickets = ticketTypes.reduce(
      (sum, t) => sum + (t.totalQuantity - t.soldQuantity),
      0
    );

    const prices = ticketTypes.map((t) => t.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      ...event,
      category,
      organizer: organizer
        ? {
            name: `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim() || organizer.email,
            email: organizer.email,
          }
        : null,
      ticketTypes,
      availableTickets,
      totalCapacity: ticketTypes.reduce((sum, tt) => sum + tt.totalQuantity, 0),
      priceRange: {
        min: minPrice,
        max: maxPrice,
        currency: ticketTypes[0]?.currency || "ETB",
      },
    };
  },
});

// Approve or reject an event
export const reviewEvent = mutation({
  args: {
    eventId: v.id("events"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user (should be admin)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const now = Date.now();
    const approvalStatus = args.action === "approve" ? "approved" : "rejected";

    await ctx.db.patch(args.eventId, {
      approvalStatus,
      approvalNotes: args.notes,
      reviewedBy: user._id,
      reviewedAt: now,
      isPublished: args.action === "approve", // Auto-publish approved events
      updatedAt: now,
    });

    return { success: true, status: approvalStatus };
  },
});

// Get admin dashboard statistics
export const getAdminStats = query({
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("events").collect();
    const allUsers = await ctx.db.query("users").collect();

    const pendingEvents = allEvents.filter(e => e.approvalStatus === "pending");
    const approvedEvents = allEvents.filter(e => e.approvalStatus === "approved");
    const rejectedEvents = allEvents.filter(e => e.approvalStatus === "rejected");
    const publishedEvents = allEvents.filter(e => e.isPublished);

    const organizers = allUsers.filter(u => u.role === "organizer");
    const attendees = allUsers.filter(u => u.role === "attendee");
    const admins = allUsers.filter(u => u.role === "admin");

    // Get total tickets sold
    const allTickets = await ctx.db.query("tickets").collect();
    const soldTickets = allTickets.filter(t => t.status !== "voided");

    // Calculate total revenue
    const totalRevenue = await Promise.all(
      allEvents.map(async (event) => {
        const eventTickets = soldTickets.filter(t => t.eventId === event._id);
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        return eventTickets.reduce((sum, ticket) => {
          const ticketType = ticketTypes.find(tt => tt._id === ticket.ticketTypeId);
          return sum + (ticketType?.price || 0);
        }, 0);
      })
    );

    return {
      totalEvents: allEvents.length,
      pendingEvents: pendingEvents.length,
      approvedEvents: approvedEvents.length,
      rejectedEvents: rejectedEvents.length,
      publishedEvents: publishedEvents.length,
      totalUsers: allUsers.length,
      organizers: organizers.length,
      attendees: attendees.length,
      admins: admins.length,
      totalTicketsSold: soldTickets.length,
      totalRevenue: totalRevenue.reduce((sum, rev) => sum + rev, 0),
    };
  },
});

// Get attendees for an event
export const getEventAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const event = await ctx.db.get(args.eventId);
    if (!event) return [];

    // Only allow organizer or admin to view
    if (event.organizerId !== user._id && user.role !== "admin") {
      return [];
    }

    // Get all tickets for this event
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event_checkin", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get unique users and their ticket details
    const attendeeMap = new Map();
    
    for (const ticket of tickets) {
      if (ticket.status === "voided") continue;
      
      const attendee = await ctx.db.get(ticket.userId);
      const ticketType = await ctx.db.get(ticket.ticketTypeId);
      
      if (!attendee) continue;

      const attendeeId = attendee._id;
      if (!attendeeMap.has(attendeeId)) {
        attendeeMap.set(attendeeId, {
          user: attendee,
          tickets: [],
          totalPaid: 0,
        });
      }

      const attendeeData = attendeeMap.get(attendeeId);
      attendeeData.tickets.push({
        ...ticket,
        ticketType,
      });
      
      if (ticketType) {
        attendeeData.totalPaid += ticketType.price;
      }
    }

    return Array.from(attendeeMap.values()).map((data) => ({
      ...data,
      ticketCount: data.tickets.length,
    }));
  },
});

// Create ticket type for an event
export const createTicketType = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // in cents
    currency: v.string(),
    totalQuantity: v.number(),
    saleStart: v.number(),
    saleEnd: v.number(),
    isVisible: v.boolean(),
    minPerOrder: v.number(),
    maxPerOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const organizer = await requireOrganizer(ctx);
    
    // Verify the event belongs to the organizer
    const event = await ctx.db.get(args.eventId);
    if (!event || event.organizerId !== organizer._id) {
      throw new Error("Event not found or access denied");
    }

    const ticketTypeId = await ctx.db.insert("ticketTypes", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      price: args.price,
      currency: args.currency,
      totalQuantity: args.totalQuantity,
      soldQuantity: 0,
      saleStart: args.saleStart,
      saleEnd: args.saleEnd,
      isVisible: args.isVisible,
      minPerOrder: args.minPerOrder,
      maxPerOrder: args.maxPerOrder,
    });

    return ticketTypeId;
  },
});