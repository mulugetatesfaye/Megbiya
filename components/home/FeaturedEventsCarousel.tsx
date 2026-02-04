"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventWithDetails } from "@/types";
import { format } from "date-fns";

interface FeaturedEventsCarouselProps {
  events: EventWithDetails[];
  isLoading?: boolean;
}

function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
  }).format(cents / 100);
}

function getPriceLabel(priceRange: { min: number; max: number }) {
  if (priceRange.min === 0 && priceRange.max === 0) return "Free";
  if (priceRange.min === priceRange.max) return formatPrice(priceRange.min);
  return `From ${formatPrice(priceRange.min)}`;
}

export function FeaturedEventsCarousel({
  events,
  isLoading,
}: FeaturedEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = events.length;
  const hasMultipleSlides = totalSlides > 1;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const goNext = useCallback(
    () => goTo(currentIndex + 1),
    [currentIndex, goTo]
  );
  const goPrev = useCallback(
    () => goTo(currentIndex - 1),
    [currentIndex, goTo]
  );

  useEffect(() => {
    if (!hasMultipleSlides || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(goNext, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleSlides, isPaused, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }

    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  if (isLoading) return <CarouselSkeleton />;

  if (events.length === 0) {
    return <EmptyState />;
  }

  return (
    <section
      className="relative overflow-hidden bg-gray-50 px-2 py-2 dark:bg-gray-950 sm:px-4 sm:py-4 lg:px-6 lg:py-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[21/9] sm:rounded-2xl lg:aspect-[3/1] lg:rounded-3xl">
        {events.map((event, index) => (
          <Slide
            key={event._id || index}
            event={event}
            isActive={index === currentIndex}
          />
        ))}

        {/* Navigation Controls */}
        {hasMultipleSlides && (
          <>
            {/* Arrow Buttons - Hidden on mobile, shown on tablet+ */}
            <div className="absolute inset-y-0 left-0 hidden items-center sm:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="ml-3 h-10 w-10 rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/40 sm:ml-5 sm:h-11 sm:w-11"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute inset-y-0 right-0 hidden items-center sm:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="mr-3 h-10 w-10 rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/40 sm:mr-5 sm:h-11 sm:w-11"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:bottom-6 sm:gap-3">
              {/* Dots */}
              <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur-md sm:px-3 sm:py-2">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${
                      index === currentIndex
                        ? "w-5 bg-white shadow-sm sm:w-6"
                        : "w-1.5 bg-white/40 hover:bg-white/60 sm:w-2"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === currentIndex ? "true" : "false"}
                  />
                ))}
              </div>

              {/* Pause/Play */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
                className="h-7 w-7 rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/50 sm:h-8 sm:w-8"
                aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {isPaused ? (
                  <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
              </Button>
            </div>

            {/* Slide Counter */}
            <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-md sm:right-6 sm:top-6 sm:px-3 sm:py-1.5 sm:text-sm">
              <span className="text-white">{currentIndex + 1}</span>
              <span className="mx-0.5 text-white/50 sm:mx-1">/</span>
              <span className="text-white/70">{totalSlides}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Slide({
  event,
  isActive,
}: {
  event: EventWithDetails;
  isActive: boolean;
}) {
  const priceLabel = getPriceLabel(event.priceRange);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        isActive ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Full Background Image */}
      <Image
        src={event.coverImageUrl}
        alt={event.title}
        fill
        className="object-cover"
        priority={isActive}
        sizes="100vw"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 sm:from-black/75 sm:via-black/40 sm:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:from-black/50" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-16 sm:items-center sm:pb-0">
        <div className="w-full px-4 sm:px-12 lg:px-20">
          <div className="max-w-2xl space-y-2 sm:space-y-4 lg:space-y-5">
            {/* Category */}
            {event.category && (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm sm:px-3 sm:py-1 sm:text-sm">
                {event.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-5xl">
              {event.title}
            </h1>

            {/* Description - Hidden on mobile */}
            {event.shortDescription && (
              <p className="hidden text-sm leading-relaxed text-white/70 sm:line-clamp-2 sm:block sm:text-base lg:text-lg">
                {event.shortDescription}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5">
                <Calendar className="h-3 w-3 text-white/80 sm:h-3.5 sm:w-3.5" />
                <span className="whitespace-nowrap">
                  {format(new Date(event.startDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5">
                <MapPin className="h-3 w-3 flex-shrink-0 text-white/80 sm:h-3.5 sm:w-3.5" />
                <span className="max-w-[120px] truncate sm:max-w-[200px]">
                  {event.locationName}
                </span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:gap-4 sm:pt-2">
              <div className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2">
                <span className="text-lg font-bold text-white sm:text-2xl">
                  {priceLabel}
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-full bg-white px-4 text-xs font-semibold text-gray-900 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl sm:h-11 sm:px-6 sm:text-base"
                >
                  <Link href={`/events/${event.slug}`}>Get Tickets</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden h-9 rounded-full border-white/30 bg-white/5 px-4 text-xs font-medium text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10 sm:inline-flex sm:h-11 sm:px-6 sm:text-base"
                >
                  <Link href="/events">View All</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="flex min-h-[50vh] items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-md space-y-6 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 shadow-sm sm:h-20 sm:w-20 dark:bg-gray-800">
          <Calendar className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
            No Featured Events
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check back soon for exciting upcoming events.
          </p>
        </div>
        <Button asChild className="rounded-full px-6" size="sm">
          <Link href="/events">Browse All Events</Link>
        </Button>
      </div>
    </section>
  );
}

function CarouselSkeleton() {
  return (
    <section className="bg-gray-50 px-2 py-2 dark:bg-gray-950 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[21/9] sm:rounded-2xl lg:aspect-[3/1] lg:rounded-3xl">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />
          <div className="absolute inset-0 flex items-end pb-16 sm:items-center sm:pb-0">
            <div className="w-full px-4 sm:px-12 lg:px-20">
              <div className="max-w-2xl space-y-2 sm:space-y-4 lg:space-y-5">
                <Skeleton className="h-6 w-20 rounded-full bg-white/10 sm:h-7 sm:w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full bg-white/10 sm:h-10 lg:h-12" />
                  <Skeleton className="h-6 w-3/4 bg-white/10 sm:h-10 lg:h-12" />
                </div>
                <div className="hidden space-y-2 sm:block">
                  <Skeleton className="h-4 w-full bg-white/10 sm:h-5" />
                  <Skeleton className="h-4 w-2/3 bg-white/10 sm:h-5" />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Skeleton className="h-7 w-28 rounded-full bg-white/10 sm:h-8 sm:w-32" />
                  <Skeleton className="h-7 w-28 rounded-full bg-white/10 sm:h-8 sm:w-32" />
                </div>
                <div className="flex items-center gap-2 pt-1 sm:gap-3">
                  <Skeleton className="h-8 w-20 rounded-full bg-white/10 sm:h-10 sm:w-24" />
                  <Skeleton className="h-9 w-28 rounded-full bg-white/10 sm:h-11 sm:w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}