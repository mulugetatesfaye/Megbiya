import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to generate future dates
const daysFromNow = (days: number): number =>
  Date.now() + days * 24 * 60 * 60 * 1000;
const hoursFromNow = (hours: number): number =>
  Date.now() + hours * 60 * 60 * 1000;

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if database already has data
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      throw new Error(
        "Database already seeded! Clear it first if you want to re-seed."
      );
    }

    console.log("🌱 Starting database seed...");

    // ==================== CATEGORIES ====================
    console.log("Creating categories...");
    const categories = [
      {
        name: "Music & Concerts",
        slug: "music-concerts",
        icon: "🎵",
        color: "#8B5CF6",
      },
      {
        name: "Technology & Innovation",
        slug: "technology",
        icon: "💻",
        color: "#3B82F6",
      },
      {
        name: "Sports & Fitness",
        slug: "sports-fitness",
        icon: "⚽",
        color: "#10B981",
      },
      {
        name: "Arts & Culture",
        slug: "arts-culture",
        icon: "🎨",
        color: "#F59E0B",
      },
      {
        name: "Food & Drink",
        slug: "food-drink",
        icon: "🍕",
        color: "#EF4444",
      },
      {
        name: "Business & Professional",
        slug: "business",
        icon: "💼",
        color: "#6366F1",
      },
      {
        name: "Health & Wellness",
        slug: "health-wellness",
        icon: "🧘",
        color: "#14B8A6",
      },
      {
        name: "Education & Learning",
        slug: "education",
        icon: "📚",
        color: "#EC4899",
      },
    ];

    const categoryIds: Record<string, Id<"categories">> = {};
    for (const category of categories) {
      const categoryId = await ctx.db.insert("categories", category);
      categoryIds[category.slug] = categoryId;
    }
    console.log(`✅ Created ${categories.length} categories`);

    // ==================== USERS ====================
    console.log("Creating users...");
    const now = Date.now();

    // Admin user
    const adminId: Id<"users"> = await ctx.db.insert("users", {
      clerkId: "seed_admin_001",
      email: "admin@eventhub.com",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      phone: "+1234567890",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Organizers
    const organizer1Id: Id<"users"> = await ctx.db.insert("users", {
      clerkId: "seed_org_001",
      email: "sarah.events@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      username: "sarahevents",
      phone: "+1234567891",
      role: "organizer",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const organizer2Id: Id<"users"> = await ctx.db.insert("users", {
      clerkId: "seed_org_002",
      email: "mike.concerts@example.com",
      firstName: "Mike",
      lastName: "Chen",
      username: "mikechen",
      phone: "+1234567892",
      role: "organizer",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const organizer3Id: Id<"users"> = await ctx.db.insert("users", {
      clerkId: "seed_org_003",
      email: "emma.tech@example.com",
      firstName: "Emma",
      lastName: "Williams",
      username: "emmatech",
      phone: "+1234567893",
      role: "organizer",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Attendees
    const attendeeIds: Id<"users">[] = [];
    const attendees = [
      {
        clerkId: "seed_att_001",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
      },
      {
        clerkId: "seed_att_002",
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        username: "janesmith",
      },
      {
        clerkId: "seed_att_003",
        email: "alex.brown@example.com",
        firstName: "Alex",
        lastName: "Brown",
        username: "alexbrown",
      },
      {
        clerkId: "seed_att_004",
        email: "maria.garcia@example.com",
        firstName: "Maria",
        lastName: "Garcia",
        username: "mariagarcia",
      },
      {
        clerkId: "seed_att_005",
        email: "david.lee@example.com",
        firstName: "David",
        lastName: "Lee",
        username: "davidlee",
      },
    ];

    for (const attendee of attendees) {
      const attendeeId: Id<"users"> = await ctx.db.insert("users", {
        ...attendee,
        phone: `+123456789${attendeeIds.length}`,
        role: "attendee",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      attendeeIds.push(attendeeId);
    }

    console.log(`✅ Created ${1 + 3 + attendees.length} users`);

    // ==================== EVENTS ====================
    console.log("Creating events...");

    const events = [
      {
        title: "Summer Music Festival 2024",
        slug: "summer-music-festival-2024",
        shortDescription:
          "Three days of amazing live music featuring top artists",
        description:
          "Join us for the biggest music festival of the summer! Featuring over 50 artists across 5 stages, food trucks, art installations, and more. This is an experience you won't want to miss!",
        organizerId: organizer2Id,
        categoryId: categoryIds["music-concerts"],
        locationName: "Central Park Amphitheater",
        address: "123 Park Avenue, New York, NY 10001",
        latitude: 40.7829,
        longitude: -73.9654,
        startDate: daysFromNow(45),
        endDate: daysFromNow(47),
        timezone: "America/New_York",
        coverImageUrl:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
        galleryImages: [
          "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
          "https://images.unsplash.com/photo-1506157786151-b8491531f063",
        ],
        isPublished: true,
        totalCapacity: 5000,
        minOrder: 1,
        maxOrder: 10,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["music", "festival", "outdoor", "summer"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Tech Innovation Summit 2024",
        slug: "tech-innovation-summit-2024",
        shortDescription: "Leading tech conference for innovators and founders",
        description:
          "Connect with industry leaders, attend workshops, and discover the latest in AI, Web3, and emerging technologies. Network with 1000+ attendees from top tech companies.",
        organizerId: organizer3Id,
        categoryId: categoryIds["technology"],
        locationName: "Convention Center",
        address: "456 Tech Street, San Francisco, CA 94102",
        latitude: 37.7749,
        longitude: -122.4194,
        startDate: daysFromNow(30),
        endDate: daysFromNow(32),
        timezone: "America/Los_Angeles",
        coverImageUrl:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        isPublished: true,
        totalCapacity: 1000,
        minOrder: 1,
        maxOrder: 5,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["technology", "AI", "networking", "conference"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Yoga & Wellness Retreat",
        slug: "yoga-wellness-retreat-2024",
        shortDescription: "Weekend retreat for mind, body, and soul",
        description:
          "Escape to nature for a transformative weekend of yoga, meditation, healthy cuisine, and wellness workshops. All levels welcome!",
        organizerId: organizer1Id,
        categoryId: categoryIds["health-wellness"],
        locationName: "Mountain View Retreat Center",
        address: "789 Peaceful Lane, Boulder, CO 80302",
        latitude: 40.015,
        longitude: -105.2705,
        startDate: daysFromNow(20),
        endDate: daysFromNow(22),
        timezone: "America/Denver",
        coverImageUrl:
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
        isPublished: true,
        totalCapacity: 50,
        minOrder: 1,
        maxOrder: 4,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["wellness", "yoga", "meditation", "retreat"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Food & Wine Tasting Evening",
        slug: "food-wine-tasting-evening",
        shortDescription: "An elegant evening of gourmet food and fine wines",
        description:
          "Experience curated wine pairings with chef-prepared dishes. Meet local winemakers and learn about wine selection from sommeliers.",
        organizerId: organizer1Id,
        categoryId: categoryIds["food-drink"],
        locationName: "The Grand Ballroom",
        address: "321 Culinary Blvd, Chicago, IL 60601",
        latitude: 41.8781,
        longitude: -87.6298,
        startDate: daysFromNow(15),
        endDate: daysFromNow(15) + 4 * 60 * 60 * 1000,
        timezone: "America/Chicago",
        coverImageUrl:
          "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3",
        isPublished: false,
        totalCapacity: 100,
        minOrder: 1,
        maxOrder: 6,
        // Admin approval workflow
        approvalStatus: "pending" as const,
        tags: ["food", "wine", "tasting", "luxury"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Art Gallery Opening: Modern Expressions",
        slug: "modern-expressions-gallery-opening",
        shortDescription: "Opening night for contemporary art exhibition",
        description:
          "Join us for the opening of our latest contemporary art exhibition featuring local and international artists. Complimentary drinks and hors d'oeuvres.",
        organizerId: organizer2Id,
        categoryId: categoryIds["arts-culture"],
        locationName: "Downtown Art Gallery",
        address: "555 Art District, Portland, OR 97201",
        latitude: 45.5152,
        longitude: -122.6784,
        startDate: daysFromNow(10),
        endDate: daysFromNow(10) + 3 * 60 * 60 * 1000,
        timezone: "America/Los_Angeles",
        coverImageUrl:
          "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e",
        isPublished: true,
        totalCapacity: 200,
        minOrder: 1,
        maxOrder: 4,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["art", "gallery", "exhibition", "culture"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Marathon Training Workshop",
        slug: "marathon-training-workshop",
        shortDescription: "Professional coaching for marathon preparation",
        description:
          "Get expert training tips, nutrition advice, and injury prevention strategies from professional marathon coaches.",
        organizerId: organizer3Id,
        categoryId: categoryIds["sports-fitness"],
        locationName: "City Sports Complex",
        address: "888 Runner Road, Austin, TX 78701",
        latitude: 30.2672,
        longitude: -97.7431,
        startDate: daysFromNow(7),
        endDate: daysFromNow(7) + 6 * 60 * 60 * 1000,
        timezone: "America/Chicago",
        coverImageUrl:
          "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3",
        isPublished: true,
        totalCapacity: 75,
        minOrder: 1,
        maxOrder: 3,
        // Admin approval workflow
        approvalStatus: "pending" as const,
        tags: ["sports", "running", "marathon", "fitness"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Startup Pitch Competition",
        slug: "startup-pitch-competition-2024",
        shortDescription: "Win funding and mentorship for your startup",
        description:
          "Present your startup to leading VCs and angel investors. $100K in prizes plus mentorship opportunities.",
        organizerId: organizer3Id,
        categoryId: categoryIds["business"],
        locationName: "Innovation Hub",
        address: "999 Venture Way, Boston, MA 02101",
        latitude: 42.3601,
        longitude: -71.0589,
        startDate: daysFromNow(25),
        endDate: daysFromNow(25) + 5 * 60 * 60 * 1000,
        timezone: "America/New_York",
        coverImageUrl:
          "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
        isPublished: true,
        totalCapacity: 300,
        minOrder: 1,
        maxOrder: 8,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["business", "startup", "pitch", "entrepreneurship"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Photography Masterclass",
        slug: "photography-masterclass-weekend",
        shortDescription: "Learn from award-winning photographers",
        description:
          "Intensive weekend workshop covering composition, lighting, editing, and portfolio development. Includes hands-on shooting sessions.",
        organizerId: organizer1Id,
        categoryId: categoryIds["education"],
        locationName: "Creative Arts Center",
        address: "777 Focus Lane, Seattle, WA 98101",
        latitude: 47.6062,
        longitude: -122.3321,
        startDate: daysFromNow(35),
        endDate: daysFromNow(37),
        timezone: "America/Los_Angeles",
        coverImageUrl:
          "https://images.unsplash.com/photo-1452587925148-ce544e77e70d",
        isPublished: true,
        totalCapacity: 30,
        minOrder: 1,
        maxOrder: 2,
        // Admin approval workflow
        approvalStatus: "approved" as const,
        approvalNotes: "Auto-approved during seed data creation",
        reviewedBy: adminId,
        reviewedAt: now,
        tags: ["photography", "education", "workshop", "creative"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Jazz Night Under the Stars",
        slug: "jazz-night-under-stars",
        shortDescription: "Intimate evening of live jazz music",
        description:
          "Enjoy world-class jazz musicians in an intimate outdoor setting. Bring blankets and enjoy the music under the stars.",
        organizerId: organizer2Id,
        categoryId: categoryIds["music-concerts"],
        locationName: "Riverside Amphitheater",
        address: "222 Melody Drive, Nashville, TN 37201",
        latitude: 36.1627,
        longitude: -86.7816,
        startDate: daysFromNow(12),
        endDate: daysFromNow(12) + 4 * 60 * 60 * 1000,
        timezone: "America/Chicago",
        coverImageUrl:
          "https://images.unsplash.com/photo-1511192336575-5a79af67a629",
        isPublished: false,
        totalCapacity: 500,
        minOrder: 1,
        maxOrder: 8,
        // Admin approval workflow
        approvalStatus: "pending" as const,
        tags: ["music", "jazz", "outdoor", "concert"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Upcoming Event - Draft",
        slug: "upcoming-draft-event",
        shortDescription: "This event is not published yet",
        description: "This is a draft event for testing purposes.",
        organizerId: organizer1Id,
        categoryId: categoryIds["business"],
        locationName: "TBD",
        address: "TBD",
        startDate: daysFromNow(60),
        endDate: daysFromNow(61),
        timezone: "America/New_York",
        coverImageUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
        isPublished: false, // Draft event
        totalCapacity: 100,
        minOrder: 1,
        maxOrder: 5,
        // Admin approval workflow
        approvalStatus: "pending" as const,
        tags: ["draft"],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const eventIds: Id<"events">[] = [];
    for (const event of events) {
      const eventId = await ctx.db.insert("events", event);
      eventIds.push(eventId);
    }
    console.log(`✅ Created ${events.length} events`);

    // ==================== TICKET TYPES ====================
    console.log("Creating ticket types...");

    const ticketTypesData = [
      // Summer Music Festival
      {
        eventId: eventIds[0],
        tickets: [
          {
            name: "General Admission",
            description: "Access to all stages and general viewing areas",
            price: 15000,
            currency: "ETB",
            totalQuantity: 3000,
            soldQuantity: 450,
            minPerOrder: 1,
            maxPerOrder: 10,
          },
          {
            name: "VIP Pass",
            description:
              "Premium viewing areas, exclusive lounge, complimentary drinks",
            price: 35000,
            currency: "ETB",
            totalQuantity: 500,
            soldQuantity: 127,
            minPerOrder: 1,
            maxPerOrder: 6,
          },
          {
            name: "Early Bird",
            description: "Limited early bird pricing for general admission",
            price: 12000,
            currency: "ETB",
            totalQuantity: 200,
            soldQuantity: 200,
            minPerOrder: 1,
            maxPerOrder: 4,
          },
        ],
      },
      // Tech Summit
      {
        eventId: eventIds[1],
        tickets: [
          {
            name: "Conference Pass",
            description: "Access to all talks and workshops",
            price: 50000,
            currency: "ETB",
            totalQuantity: 800,
            soldQuantity: 234,
            minPerOrder: 1,
            maxPerOrder: 5,
          },
          {
            name: "Networking Only",
            description: "Evening networking events only",
            price: 10000,
            currency: "ETB",
            totalQuantity: 200,
            soldQuantity: 45,
            minPerOrder: 1,
            maxPerOrder: 3,
          },
        ],
      },
      // Yoga Retreat
      {
        eventId: eventIds[2],
        tickets: [
          {
            name: "Full Retreat Package",
            description: "Accommodation, meals, and all activities included",
            price: 65000,
            currency: "ETB",
            totalQuantity: 40,
            soldQuantity: 18,
            minPerOrder: 1,
            maxPerOrder: 4,
          },
          {
            name: "Day Pass",
            description: "Single day access without accommodation",
            price: 15000,
            currency: "ETB",
            totalQuantity: 30,
            soldQuantity: 8,
            minPerOrder: 1,
            maxPerOrder: 4,
          },
        ],
      },
      // Food & Wine
      {
        eventId: eventIds[3],
        tickets: [
          {
            name: "Standard Ticket",
            description: "Entry and wine tastings",
            price: 7500,
            currency: "ETB",
            totalQuantity: 100,
            soldQuantity: 67,
            minPerOrder: 1,
            maxPerOrder: 6,
          },
        ],
      },
      // Art Gallery
      {
        eventId: eventIds[4],
        tickets: [
          {
            name: "Free Entry",
            description: "Open to the public",
            price: 0,
            currency: "ETB",
            totalQuantity: 200,
            soldQuantity: 89,
            minPerOrder: 1,
            maxPerOrder: 4,
          },
        ],
      },
      // Marathon Workshop
      {
        eventId: eventIds[5],
        tickets: [
          {
            name: "Workshop Ticket",
            description: "Includes training materials and lunch",
            price: 5000,
            currency: "ETB",
            totalQuantity: 75,
            soldQuantity: 42,
            minPerOrder: 1,
            maxPerOrder: 3,
          },
        ],
      },
      // Startup Pitch
      {
        eventId: eventIds[6],
        tickets: [
          {
            name: "Audience Ticket",
            description: "Watch the pitches",
            price: 2500,
            currency: "ETB",
            totalQuantity: 250,
            soldQuantity: 156,
            minPerOrder: 1,
            maxPerOrder: 8,
          },
          {
            name: "Founder Ticket",
            description: "For pitching founders only",
            price: 0,
            currency: "ETB",
            totalQuantity: 50,
            soldQuantity: 23,
            minPerOrder: 1,
            maxPerOrder: 1,
          },
        ],
      },
      // Photography Masterclass
      {
        eventId: eventIds[7],
        tickets: [
          {
            name: "Masterclass Ticket",
            description: "Full weekend access and materials",
            price: 45000,
            currency: "ETB",
            totalQuantity: 30,
            soldQuantity: 19,
            minPerOrder: 1,
            maxPerOrder: 2,
          },
        ],
      },
      // Jazz Night
      {
        eventId: eventIds[8],
        tickets: [
          {
            name: "General Seating",
            description: "First come, first served seating",
            price: 3500,
            currency: "ETB",
            totalQuantity: 400,
            soldQuantity: 234,
            minPerOrder: 1,
            maxPerOrder: 8,
          },
          {
            name: "Reserved Seating",
            description: "Premium reserved seats near the stage",
            price: 6000,
            currency: "ETB",
            totalQuantity: 100,
            soldQuantity: 78,
            minPerOrder: 1,
            maxPerOrder: 6,
          },
        ],
      },
    ];

    const ticketTypeIds: Id<"ticketTypes">[] = [];
    for (const eventTickets of ticketTypesData) {
      for (const ticket of eventTickets.tickets) {
        const ticketTypeId = await ctx.db.insert("ticketTypes", {
          eventId: eventTickets.eventId,
          name: ticket.name,
          description: ticket.description,
          price: ticket.price,
          currency: ticket.currency,
          totalQuantity: ticket.totalQuantity,
          soldQuantity: ticket.soldQuantity,
          saleStart: now - 7 * 24 * 60 * 60 * 1000,
          saleEnd:
            eventTickets.eventId === eventIds[0]
              ? daysFromNow(44)
              : daysFromNow(100),
          isVisible: true,
          minPerOrder: ticket.minPerOrder,
          maxPerOrder: ticket.maxPerOrder,
        });
        ticketTypeIds.push(ticketTypeId);
      }
    }
    console.log(`✅ Created ${ticketTypeIds.length} ticket types`);

    // ==================== SAMPLE ORDERS & TICKETS ====================
    console.log("Creating sample orders and tickets...");

    const order1Id: Id<"orders"> = await ctx.db.insert("orders", {
      eventId: eventIds[0],
      buyerId: attendeeIds[0],
      totalAmount: 30000,
      currency: "USD",
      status: "completed",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tickets", {
      orderId: order1Id,
      eventId: eventIds[0],
      ticketTypeId: ticketTypeIds[0],
      userId: attendeeIds[0],
      ticketNumber: "EVT-001-001",
      qrCodeSecret: "secret_" + Math.random().toString(36).substring(7),
      status: "valid",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      updatedAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tickets", {
      orderId: order1Id,
      eventId: eventIds[0],
      ticketTypeId: ticketTypeIds[0],
      userId: attendeeIds[0],
      ticketNumber: "EVT-001-002",
      qrCodeSecret: "secret_" + Math.random().toString(36).substring(7),
      status: "valid",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      updatedAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ Created sample orders and tickets");

    // ==================== ACTIVITY LOG ====================
    console.log("Creating activity logs...");

    await ctx.db.insert("activities", {
      action: "event_created",
      actorId: organizer2Id,
      eventId: eventIds[0],
      metadata: { eventName: "Summer Music Festival 2024" },
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("activities", {
      action: "ticket_purchased",
      actorId: attendeeIds[0],
      eventId: eventIds[0],
      orderId: order1Id,
      metadata: { quantity: 2, amount: 30000 },
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ Created activity logs");

    console.log("\n🎉 Database seeded successfully!\n");
    console.log("Summary:");
    console.log(`- ${categories.length} categories`);
    console.log(
      `- ${1 + 3 + attendees.length} users (1 admin, 3 organizers, ${attendees.length} attendees)`
    );
    console.log(
      `- ${events.length} events (${events.length - 1} published, 1 draft)`
    );
    console.log(`- ${ticketTypeIds.length} ticket types`);
    console.log("- Sample orders and tickets");
    console.log("- Activity logs\n");

    return {
      success: true,
      stats: {
        categories: categories.length,
        users: 1 + 3 + attendees.length,
        events: events.length,
        ticketTypes: ticketTypeIds.length,
      },
    };
  },
});

export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🗑️  Clearing database...");

    const tickets = await ctx.db.query("tickets").collect();
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }

    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }

    const waitlist = await ctx.db.query("waitlist").collect();
    for (const item of waitlist) {
      await ctx.db.delete(item._id);
    }

    const activities = await ctx.db.query("activities").collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    const ticketTypes = await ctx.db.query("ticketTypes").collect();
    for (const ticketType of ticketTypes) {
      await ctx.db.delete(ticketType._id);
    }

    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    console.log("✅ Database cleared");
    return { success: true };
  },
});
