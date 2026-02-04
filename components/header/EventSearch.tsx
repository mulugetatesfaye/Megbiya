"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function EventSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Search events
  const searchResults = useQuery(
    api.events.searchEvents,
    { query: searchQuery.trim(), limit: 20 }
  );


  // Don't show results until we have actual search content
  const shouldShowResults = open && searchQuery.trim().length > 2 && searchResults && searchResults.length > 0;

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (slug: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(`/events/${slug}`);
  };

  function formatPrice(cents: number, currency: string = "ETB") {
    if (cents === 0) return "Free";

    const amount = cents / 100;

    if (currency === "ETB") {
      return `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} ETB`;
    }

    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-9 justify-start text-sm text-muted-foreground border-border/50 hover:border-border",
            "md:w-full md:pr-12",
            "w-9 md:min-w-[200px] lg:min-w-[300px]"
          )}
        >
          <Search className="h-4 w-4 shrink-0 md:mr-2" />
          <span className="hidden md:inline-flex lg:hidden">Search...</span>
          <span className="hidden lg:inline-flex">Search events...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!shouldShowResults ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {searchQuery.length === 0
                  ? "Start typing to search events..."
                  : "No events found."}
              </div>
            ) : (
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">
                  {searchResults.length} event{searchResults.length > 1 ? 's' : ''} found
                </div>
                {searchResults.map((event: any) => (
                  <div
                    key={event._id}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent rounded-md transition-colors"
                    onClick={() => handleSelect(event.slug)}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border">
                      <Image
                        src={event.coverImageUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium leading-tight line-clamp-1 text-sm">
                        {event.title}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(event.startDate), "MMM d")}</span>
                        <span>•</span>
                        <span>{event.locationName}</span>
                      </div>

                      {event.priceRange && (
                        <div className="text-xs font-medium text-primary">
                          {event.priceRange.min === event.priceRange.max
                            ? formatPrice(event.priceRange.min, event.priceRange.currency)
                            : `From ${formatPrice(event.priceRange.min, event.priceRange.currency)}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
  );
}