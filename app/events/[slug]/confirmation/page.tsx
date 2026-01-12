"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { QRCodeCanvas } from "qrcode.react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ConfirmationPage({ params }: PageProps) {
  const { slug } = use(params);

  const data = useQuery(api.orders.getLatestOrderWithTickets, {
    slug,
  });

  if (data === undefined) return null;
  if (!data) notFound();

  const { event, tickets } = data;

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-2xl font-semibold">You’re registered 🎉</h1>

      <div className="mt-8 space-y-6">
        {tickets.map((ticket) => (
          <div key={ticket._id} className="rounded-lg border p-4 text-center">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-muted-foreground">
              Ticket #{ticket.ticketNumber}
            </p>

            <div className="mt-4 flex justify-center">
              <QRCodeCanvas value={ticket.qrCodeSecret} size={180} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
