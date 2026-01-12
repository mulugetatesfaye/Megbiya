"use client";

import { useState, use } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import type { EventDetail } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ---------------- helpers ---------------- */

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function getPriceLabel(ticketTypes: EventDetail["ticketTypes"]) {
  if (!ticketTypes.length) return "Free";

  const prices = ticketTypes.map((t) => t.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currency = ticketTypes[0].currency;

  if (min === 0 && max === 0) return "Free";
  if (min === max) return formatPrice(min, currency);

  return `From ${formatPrice(min, currency)}`;
}

/* ---------------- page ---------------- */

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const event = useQuery(api.events.getEventBySlug, {
    slug,
  }) as EventDetail | null | undefined;

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (event === undefined) return null;
  if (!event) notFound();

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  function updateQty(
    ticketId: string,
    next: number,
    min: number,
    max: number
  ) {
    if (next < min || next > max) return;
    setQuantities((prev) => ({ ...prev, [ticketId]: next }));
  }

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  function handleContinue() {
    router.push(`/events/${event!.slug}/checkout`);
  }

  return (
    <div className="container py-8">
      {/* HERO */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-muted">
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          width={1600}
          height={600}
          className="h-[320px] w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          {event.category && (
            <Badge className="mb-2 bg-white/90 text-black">
              {event.category.name}
            </Badge>
          )}
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {event.shortDescription && (
            <p className="mt-2 max-w-2xl text-white/90">
              {event.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* META */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "h:mm a")} –{" "}
                  {format(endDate, "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{event.locationName}</p>
                <p className="text-sm text-muted-foreground">
                  {event.address}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* DESCRIPTION */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">
              About this event
            </h2>
            <p className="whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* PRICE */}
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Starting price
            </p>
            <p className="text-2xl font-semibold">
              {getPriceLabel(event.ticketTypes)}
            </p>

            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={!hasSelection}
              onClick={handleContinue}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Continue
            </Button>

            {!hasSelection && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Select at least one ticket
              </p>
            )}
          </div>

          {/* TICKETS */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Ticket options
            </h3>

            {event.ticketTypes.map((ticket) => {
              const remaining =
                ticket.totalQuantity - ticket.soldQuantity;
              const maxAllowed = Math.min(
                ticket.maxPerOrder,
                remaining
              );
              const qty = quantities[ticket._id] || 0;
              const soldOut = remaining <= 0;

              return (
                <div
                  key={ticket._id}
                  className="rounded-lg bg-background p-4 shadow-sm"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground">
                          {ticket.description}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold">
                        {formatPrice(
                          ticket.price,
                          ticket.currency
                        )}
                      </p>
                    </div>

                    {!soldOut && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateQty(
                              ticket._id,
                              qty - 1,
                              0,
                              maxAllowed
                            )
                          }
                          disabled={qty === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <Input
                          className="w-12 text-center"
                          value={qty}
                          readOnly
                        />

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateQty(
                              ticket._id,
                              qty + 1,
                              0,
                              maxAllowed
                            )
                          }
                          disabled={qty >= maxAllowed}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {soldOut
                      ? "Sold out"
                      : `${remaining} remaining · Max ${ticket.maxPerOrder} per order`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
