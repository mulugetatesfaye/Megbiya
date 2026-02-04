"use client";

import { useState, use, useMemo } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  Minus,
  Plus,
  Share2,
  Heart,
  Info,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { EventDetail } from "@/types";
import EventMap from "@/components/maps/EventMap";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Utility functions
function formatPrice(cents: number, currency: string = "ETB") {
  if (cents === 0) return "Free";
  
  const amount = cents / 100;
  
  // Format for Ethiopian Birr
  if (currency === "ETB") {
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ETB`;
  }
  
  // Fallback for other currencies
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

function getPriceRange(ticketTypes: EventDetail["ticketTypes"]) {
  if (!ticketTypes.length) return { label: "Free", min: 0, max: 0 };

  const prices = ticketTypes.map((t) => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currency = ticketTypes[0].currency || "ETB";

  if (min === 0 && max === 0) return { label: "Free", min: 0, max: 0 };
  if (min === max) return { label: formatPrice(min, currency), min, max };

  return {
    label: `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`,
    min,
    max,
  };
}

// Main Component
export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const event = useQuery(api.events.getEventBySlug, { slug }) as
    | EventDetail
    | null
    | undefined;
  const similarEvents = useQuery(api.events.getPublishedEvents, {
    categoryId: event ? (event as any).categoryId : undefined,
    limit: 12,
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);

  // Calculate totals
  const orderSummary = useMemo(() => {
    if (!event) return { items: [], total: 0, count: 0 };

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ticketId, qty]) => {
        const ticket = event.ticketTypes.find((t) => t._id === ticketId);
        return ticket ? { ticket, qty, subtotal: ticket.price * qty } : null;
      })
      .filter(Boolean) as { ticket: any; qty: number; subtotal: number }[];

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const count = items.reduce((sum, item) => sum + item.qty, 0);

    return { items, total, count };
  }, [event, quantities]);

  if (event === undefined) return <EventDetailSkeleton />;
  if (!event) notFound();

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const priceRange = getPriceRange(event.ticketTypes);

  // Compute simple similar events (same category, exclude current)
  const similar =
    (similarEvents || [])
      .filter((e: any) => e._id !== event._id)
      .slice(0, 4) ?? [];

  function updateQty(ticketId: string, delta: number, max: number) {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(current + delta, max));
      return { ...prev, [ticketId]: next };
    });
  }

  function handleCheckout() {
    // Store cart data in localStorage for checkout page
    const cartData = {
      eventId: event!._id,
      items: Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => ({
          ticketTypeId: ticketId,
          quantity: qty,
        })),
      total: orderSummary.total,
      currency: event!.ticketTypes[0]?.currency || "ETB",
    };

    localStorage.setItem(`cart-${event!.slug}`, JSON.stringify(cartData));
    router.push(`/events/${event!.slug}/checkout`);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Image with Overlay Navigation */}
      <div className="relative">
        {/* Hero Image Container */}
        <div className="relative mx-auto h-[50vh] max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="relative h-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            
            {/* Category Badge - Inside Image */}
            {event.category && (
              <Badge className="absolute left-4 top-4 bg-white/90 text-gray-900 backdrop-blur-sm dark:bg-gray-900/90 dark:text-white">
                {event.category.name}
              </Badge>
            )}

            {/* Action Buttons - Inside Image, Top Right */}
            <div className="absolute right-4 top-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 ${
                  isFavorite ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/90 text-gray-700 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-3">
            {/* Event Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
                  {event.title}
                </h1>
                {event.shortDescription && (
                  <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                    {event.shortDescription}
                  </p>
                )}
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 shrink-0" />
                  <span className="text-sm sm:text-base">{format(startDate, "EEE, MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 shrink-0" />
                  <span className="text-sm sm:text-base">
                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <span className="text-sm sm:text-base">{event.locationName}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                About This Event
              </h2>
              <div className="prose prose-gray max-w-none dark:prose-invert">
                <p className="whitespace-pre-line text-gray-600 dark:text-gray-400">
                  {event.description}
                </p>
              </div>
            </section>

            {/* Location */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Location
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <EventMap
                  locationName={event.locationName}
                  address={event.address}
                  latitude={event.latitude}
                  longitude={event.longitude}
                />
                <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.locationName}
                  </p>
                  {event.address && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {event.address}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Organizer */}
            {event.organizer && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Organizer
                </h2>
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <Avatar className="h-14 w-14">
                    {event.organizer.imageUrl && (
                      <AvatarImage
                        src={event.organizer.imageUrl}
                        alt={event.organizer.name}
                      />
                    )}
                    <AvatarFallback className="text-lg">
                      {event.organizer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {event.organizer.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Event Organizer
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Ticket Selection */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card className="border-gray-200 shadow-lg dark:border-gray-800">
                <CardContent className="p-6">
                  {/* Price Display */}
                  <div className="mb-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {priceRange.min === priceRange.max ? "Price" : "From"}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {priceRange.label}
                    </p>
                  </div>

                  <Separator className="mb-6" />

                  {/* Ticket Types */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Select Tickets
                    </h3>

                    {event.ticketTypes.map((ticket) => {
                      const remaining = ticket.totalQuantity - ticket.soldQuantity;
                      const maxAllowed = Math.min(ticket.maxPerOrder, remaining);
                      const qty = quantities[ticket._id] || 0;
                      const soldOut = remaining <= 0;
                      const isLow = remaining > 0 && remaining <= 10;

                      return (
                        <TicketRow
                          key={ticket._id}
                          name={ticket.name}
                          description={ticket.description}
                          price={formatPrice(ticket.price, ticket.currency || "ETB")}
                          quantity={qty}
                          remaining={remaining}
                          isLow={isLow}
                          soldOut={soldOut}
                          onIncrement={() =>
                            updateQty(ticket._id, 1, maxAllowed)
                          }
                          onDecrement={() =>
                            updateQty(ticket._id, -1, maxAllowed)
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  {orderSummary.count > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-3">
                        {orderSummary.items.map(({ ticket, qty, subtotal }) => (
                          <div
                            key={ticket._id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600 dark:text-gray-400">
                              {ticket.name} × {qty}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatPrice(subtotal, ticket.currency || "ETB")}
                            </span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Total
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(
                              orderSummary.total,
                              event.ticketTypes[0]?.currency || "ETB"
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Checkout Button */}
                  <Button
                    className="mt-6 h-12 w-full text-base font-medium"
                    disabled={orderSummary.count === 0}
                    onClick={handleCheckout}
                  >
                    {orderSummary.count > 0 ? (
                      <>
                        Get {orderSummary.count} Ticket
                        {orderSummary.count > 1 ? "s" : ""}
                      </>
                    ) : (
                      "Select Tickets"
                    )}
                  </Button>

                  {/* Trust Indicators */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Secure checkout
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Instant delivery
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Event Notes */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 shrink-0 text-gray-400" />
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>Doors open 30 minutes before the event.</p>
                    <p>Digital tickets will be sent to your email.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Events */}
        {similar.length > 0 && (
          <section className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                You may also like
              </h2>
              <Link
                href="/events"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all events
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {similar.map((e: any) => (
                <Link
                  key={e._id}
                  href={`/events/${e.slug}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden border border-gray-200 transition-shadow hover:shadow-md dark:border-gray-800">
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <Image
                        src={e.coverImageUrl}
                        alt={e.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                        {e.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(e.startDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {e.locationName}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div className="min-w-0 flex-shrink">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {orderSummary.count > 0 ? `${orderSummary.count} tickets` : "From"}
            </p>
            <p className="truncate text-lg font-bold text-gray-900 dark:text-white">
              {orderSummary.count > 0
                ? formatPrice(
                    orderSummary.total,
                    event.ticketTypes[0]?.currency || "ETB"
                  )
                : priceRange.label}
            </p>
          </div>
          <Button
            className="h-12 flex-1 font-medium"
            disabled={orderSummary.count === 0}
            onClick={handleCheckout}
          >
            {orderSummary.count > 0 ? "Continue" : "Select Tickets"}
          </Button>
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}

// Ticket Row Component
function TicketRow({
  name,
  description,
  price,
  quantity,
  remaining,
  isLow,
  soldOut,
  onIncrement,
  onDecrement,
}: {
  name: string;
  description?: string;
  price: string;
  quantity: number;
  remaining: number;
  isLow: boolean;
  soldOut: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        quantity > 0
          ? "border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-900"
          : "border-gray-200 dark:border-gray-800"
      } ${soldOut ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
            {soldOut && (
              <Badge variant="secondary" className="text-xs">
                Sold out
              </Badge>
            )}
            {isLow && !soldOut && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
              >
                {remaining} left
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {price}
          </p>
        </div>

        {!soldOut && (
          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onDecrement}
              disabled={quantity === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-medium tabular-nums text-gray-900 dark:text-white">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton
function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="relative">
        <div className="relative mx-auto h-[50vh] max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <Skeleton className="h-full rounded-2xl" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="space-y-8 lg:col-span-3">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <div className="flex gap-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}