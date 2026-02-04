"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FeaturedEventsCarousel } from "@/components/home/FeaturedEventsCarousel";
import { EventsList } from "@/components/events/EventsList";
import { api } from "@/convex/_generated/api";

export default function HomePage() {
  const featuredEvents = useQuery(api.events.getFeaturedEvents);
  const allEvents = useQuery(api.events.getPublishedEvents, { limit: 12 });
  const recommendedEvents = useQuery(api.events.getRecommendedEventsForUser, {
    limit: 6,
  });

  const featuredEventsLoading = featuredEvents === undefined;
  const allEventsLoading = allEvents === undefined;
  const recommendedLoading = recommendedEvents === undefined;

  return (
    <div className="min-h-screen">
      {/* Featured Events Hero Carousel */}
      <FeaturedEventsCarousel
        events={featuredEvents || []}
        isLoading={featuredEventsLoading}
      />

      {/* Recommended for You */}
      {recommendedEvents && recommendedEvents.length > 0 && (
        <section className="bg-background py-8 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-left sm:mb-8">
              <h2 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                Recommended for you
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Events picked based on your interests and past tickets.
              </p>
            </div>

            <EventsList
              events={recommendedEvents}
              isLoading={recommendedLoading}
            />
          </div>
        </section>
      )}

      {/* All Events Section */}
      <section className="bg-background py-8 sm:py-10 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-6 text-left sm:mb-8">
            <h2 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Discover events
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Explore our complete collection of upcoming events. From conferences to concerts,
              find your next unforgettable experience.
            </p>
          </div>

          {/* Events Grid */}
          <EventsList events={allEvents || []} isLoading={allEventsLoading} />

          {/* View All Events CTA */}
          <div className="mt-8 flex justify-center sm:mt-10">
            <Link href="/events">
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-full px-5 text-sm font-medium"
              >
                View All Events
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-10 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
            <div className="col-span-2 space-y-3 md:col-span-1">
              <div className="flex items-center">
                <div className="relative h-8 w-28 overflow-hidden rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Megbiya Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Enterprise-grade event management platform. Professional tools
                for organizers, seamless experiences for attendees.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Platform
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <Link
                    href="/events"
                    className="transition-colors hover:text-foreground"
                  >
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="transition-colors hover:text-foreground"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-tickets"
                    className="transition-colors hover:text-foreground"
                  >
                    My Tickets
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Organizers
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <Link
                    href="/dashboard/organizer"
                    className="transition-colors hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/organizer/events/new"
                    className="transition-colors hover:text-foreground"
                  >
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/organizer/analytics"
                    className="transition-colors hover:text-foreground"
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Support
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:text-sm">
            <p>&copy; 2024 Megbiya. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                href="#"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="transition-colors hover:text-foreground"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}