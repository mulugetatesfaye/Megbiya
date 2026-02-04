"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { EventsList } from "@/components/events/EventsList";
import { EventFilters } from "@/components/events/EventFilters";
import { SearchBar } from "@/components/events/SearchBar";
import { Separator } from "@/components/ui/separator";

// Wrapper page with Suspense boundary to satisfy Next.js CSR bailout requirements
export default function EventsPage() {
  return (
    <Suspense fallback={<div className="container py-8">Loading events...</div>}>
      <EventsPageInner />
    </Suspense>
  );
}

function EventsPageInner() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] =
    useState<Id<"categories"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle URL parameters for category filtering
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam as Id<"categories">);
    }
  }, [searchParams]);

  // Fetch data
  const categories = useQuery(api.categories.getAllCategories);
  const events = useQuery(api.events.getPublishedEvents, {
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
  });

  const isLoading = events === undefined || categories === undefined;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Discover Events</h1>
        <p className="text-lg text-muted-foreground">
          Find and book tickets to amazing events near you
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by event name, location, or tags..."
        />
      </div>

      {/* Filters */}
      {categories && (
        <div className="mb-8">
          <EventFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      )}

      <Separator className="mb-8" />

      {/* Results Count */}
      {!isLoading && events && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"} found
            {selectedCategory && categories && (
              <span>
                {" "}
                in{" "}
                <span className="font-medium">
                  {categories.find((c) => c._id === selectedCategory)?.name}
                </span>
              </span>
            )}
            {searchQuery && (
              <span>
                {" "}
                for{" "}
                <span className="font-medium">&quot;{searchQuery}&quot;</span>
              </span>
            )}
          </p>
        </div>
      )}

      {/* Events List */}
      <EventsList events={events || []} isLoading={isLoading} />
    </div>
  );
}
