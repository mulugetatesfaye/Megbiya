"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";

export default function MyTicketsPage() {
  const tickets = useQuery(api.orders.getUserTickets);

  if (tickets === undefined) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <Ticket className="h-12 w-12 text-muted-foreground" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">No tickets yet</h1>
            <p className="text-muted-foreground mt-2">
              You haven't purchased any tickets. Browse events to get started.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href="/events">
              <Calendar className="mr-2 h-4 w-4" />
              Browse Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Group tickets by event
  const ticketsByEvent = tickets.reduce((acc, ticket) => {
    if (!ticket.event) return acc;

    const eventId = ticket.event._id;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: ticket.event,
        tickets: [],
      };
    }
    acc[eventId].tickets.push(ticket);
    return acc;
  }, {} as Record<string, { event: any; tickets: any[] }>);

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your event tickets
        </p>
      </div>

      {/* Tickets by Event */}
      <div className="space-y-8">
        {Object.values(ticketsByEvent).map(({ event, tickets: eventTickets }) => (
          <div key={event._id} className="space-y-6">
            {/* Event Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Image
                    src={event.coverImageUrl}
                    alt={event.title}
                    width={120}
                    height={120}
                    className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold mb-2">{event.title}</h2>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.startDate), "MMM d, yyyy")}
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.startDate), "h:mm a")}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.locationName}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button asChild variant="outline">
                      <Link href={`/events/${event.slug}`}>
                        View Event
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Tickets */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventTickets.map((ticket) => (
                <Card key={ticket._id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {ticket.ticketType?.name || "Ticket"}
                      </CardTitle>

                      <Badge
                        variant={
                          ticket.status === "valid"
                            ? "default"
                            : ticket.status === "checked_in"
                            ? "secondary"
                            : "destructive"
                        }
                        className="capitalize"
                      >
                        {ticket.status === "checked_in" ? "Checked In" : ticket.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground font-mono">
                      {ticket.ticketNumber}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <QRCodeCanvas
                          value={ticket.qrCodeSecret}
                          size={120}
                          className="rounded-lg border p-2"
                        />
                        {ticket.status === "checked_in" && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">
                          {ticket.status === "checked_in" ? "Used" : "Valid"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchased:</span>
                        <span>{format(new Date(ticket.createdAt), "MMM d")}</span>
                      </div>

                      {ticket.checkedInAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Checked in:</span>
                          <span>{format(new Date(ticket.checkedInAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Could open a modal with larger QR code
                        const qrCanvas = document.querySelector(`[data-ticket="${ticket._id}"] canvas`) as HTMLCanvasElement;
                        if (qrCanvas) {
                          // Create download link for QR code
                          const link = document.createElement('a');
                          link.download = `ticket-${ticket.ticketNumber}.png`;
                          link.href = qrCanvas.toDataURL();
                          link.click();
                        }
                      }}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                  </CardContent>

                  {/* Hidden canvas for download */}
                  <div
                    className="hidden"
                    data-ticket={ticket._id}
                  >
                    <QRCodeCanvas value={ticket.qrCodeSecret} size={300} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-12 pt-8 border-t">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {tickets.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {tickets.filter(t => t.status === "valid").length}
              </div>
              <div className="text-sm text-muted-foreground">Valid Tickets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {tickets.filter(t => t.status === "checked_in").length}
              </div>
              <div className="text-sm text-muted-foreground">Used Tickets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Object.keys(ticketsByEvent).length}
              </div>
              <div className="text-sm text-muted-foreground">Events</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}