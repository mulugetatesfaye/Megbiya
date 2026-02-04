"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, CheckCircle, Ticket } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ConfirmationPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const data = useQuery(api.orders.getLatestOrderWithTickets, { slug });

  if (data === undefined) return null;
  if (!data) notFound();

  const { event, tickets } = data;
  const startDate = new Date(event.startDate);

  return (
    <div className="container py-8 space-y-10">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          width={1600}
          height={600}
          className="h-[300px] w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          <Badge className="mb-2 bg-green-500/90 text-white">
            Registration confirmed
          </Badge>
          <h1 className="text-3xl font-bold">{event.title}</h1>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* SUCCESS */}
          <div className="flex items-start gap-4 rounded-xl bg-green-50 p-4 text-green-800 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle className="mt-1 h-6 w-6" />
            <div>
              <p className="font-semibold">You’re all set!</p>
              <p className="text-sm">
                Your ticket{tickets.length > 1 && "s"} has been issued. Present
                the QR code at the entrance.
              </p>
            </div>
          </div>

          {/* META */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{event.locationName}</p>
                <p className="text-sm text-muted-foreground">{event.address}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* TICKETS */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Your tickets</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {tickets.map((ticket) => (
                <Card key={ticket._id} className="p-4 text-center space-y-4">
                  <Badge variant="secondary">Valid ticket</Badge>

                  <div className="flex justify-center">
                    <QRCodeCanvas value={ticket.qrCodeSecret} size={170} />
                  </div>

                  <p className="font-mono text-sm text-muted-foreground">
                    {ticket.ticketNumber}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Tickets issued</p>
            <p className="text-2xl font-semibold">{tickets.length}</p>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => router.push("/my-tickets")}
            >
              <Ticket className="mr-2 h-4 w-4" />
              View my tickets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
