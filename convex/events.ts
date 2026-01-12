import { query } from "./_generated/server";
import { v } from "convex/values";

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
      .filter((q) => q.eq(q.field("isPublished"), true));

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
            currency: ticketTypes[0]?.currency || "USD",
          },
          availableTickets,
          isSoldOut: availableTickets === 0,
        };
      })
    );

    return eventsWithDetails;
  },
});

// Get single event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!event || !event.isPublished) {
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
