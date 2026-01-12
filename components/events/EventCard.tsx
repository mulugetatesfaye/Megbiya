"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventWithDetails } from "@/types";
import { format } from "date-fns";

interface EventCardProps {
  event: EventWithDetails;
}

export function EventCard({ event }: EventCardProps) {
  const formatPrice = (cents: number) =>
    cents === 0 ? "Free" : `$${(cents / 100).toFixed(0)}`;

  const isFree = event.priceRange.min === 0 && event.priceRange.max === 0;

  const priceLabel = isFree
    ? "Free"
    : event.priceRange.min === event.priceRange.max
      ? formatPrice(event.priceRange.min)
      : `From ${formatPrice(event.priceRange.min)}`;

  // ⚠️ Recommended: pass formattedDate & formattedTime from server
  const date = new Date(event.startDate);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-background transition hover:shadow-sm"
      aria-label={`View event ${event.title}`}
    >
      {/* Image */}
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />

        {/* Status */}
        <div className="absolute left-2 top-2 flex gap-1">
          {event.isSoldOut ? (
            <Badge variant="destructive" className="text-xs">
              Sold out
            </Badge>
          ) : event.availableTickets < 50 && event.availableTickets > 0 ? (
            <Badge className="bg-amber-500 text-white border-transparent text-xs">
              Fast
            </Badge>
          ) : null}
        </div>

        {event.category && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="text-xs backdrop-blur-sm">
              {event.category.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 flex-grow">
        {/* Date */}
        <div className="text-xs text-muted-foreground">
          {format(date, "EEE, MMM d")} • {format(date, "h:mm a")}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{event.locationName}</span>
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-5 w-5">
              {event.organizer.imageUrl && (
                <AvatarImage
                  src={event.organizer.imageUrl}
                  alt={event.organizer.name}
                />
              )}
              <AvatarFallback className="text-[10px]">
                {event.organizer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {event.organizer.name}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold">{priceLabel}</span>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary">
            View
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
