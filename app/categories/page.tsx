"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function CategoriesPage() {
  const categories = useQuery(api.categories.getAllCategories);
  const events = useQuery(api.events.getPublishedEvents, { limit: 50 });

  const isLoading = categories === undefined || events === undefined;

  // Group events by category
  const eventsByCategory = events?.reduce((acc, event) => {
    const categoryId = event.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(event);
    return acc;
  }, {} as Record<string, typeof events>) || {};

  if (isLoading) {
    return <CategoriesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Browse by Category
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Discover events that match your interests
          </p>
        </div>

        {/* Categories Grid */}
        <div className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories?.map((category) => {
            const categoryEvents = eventsByCategory[category._id] || [];
            const eventCount = categoryEvents.length;

            return (
              <Link
                key={category._id}
                href={`/events?category=${category._id}`}
                className="group"
              >
                <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-900 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-white">
                  {/* Icon */}
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                    }}
                  >
                    {category.icon}
                  </div>

                  {/* Category Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {eventCount} {eventCount === 1 ? "event" : "events"}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured Events Section */}
        {events && events.length > 0 && (
          <section>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Featured Events
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Popular events happening soon
                </p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:flex">
                <Link href="/events">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event.slug}`}
                  className="group"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-950">
                    {/* Event Image */}
                    {event.coverImageUrl && (
                      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <Image
                          src={event.coverImageUrl}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {event.category && (
                          <Badge className="absolute left-3 top-3 bg-white/90 text-gray-900 backdrop-blur-sm dark:bg-gray-900/90 dark:text-white">
                            {event.category.name}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{event.locationName}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {event.availableTickets > 0 ? (
                            <>{event.availableTickets} tickets left</>
                          ) : (
                            <>Sold out</>
                          )}
                        </span>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
                          View details →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Mobile */}
            <div className="mt-8 text-center sm:hidden">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/events">
                  View All Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Empty State */}
        {categories?.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No categories available
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Categories will appear once events are published.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Header Skeleton */}
        <div className="mb-12">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-3 h-6 w-96" />
        </div>

        {/* Categories Grid Skeleton */}
        <div className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
            >
              <Skeleton className="mb-4 h-12 w-12 rounded-lg" />
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Featured Events Skeleton */}
        <div>
          <div className="mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <Skeleton className="aspect-[16/9] w-full" />
                <div className="p-5">
                  <Skeleton className="mb-2 h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}