"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { notFound, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Ticket } from "lucide-react";
import type { EventDetail } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CheckoutPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  /* ---------------- HOOKS (ALL FIRST) ---------------- */

  const event = useQuery(api.events.getEventBySlug, { slug }) as
    | EventDetail
    | null
    | undefined;

  const createFreeOrder = useMutation(api.orders.createFreeOrder);

  const alreadyRegistered = useQuery(
    api.orders.hasCompletedOrderForEvent,
    event ? { eventId: event._id } : "skip"
  );

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ---------------- EARLY RETURNS (AFTER HOOKS) ---------------- */

  if (!isLoaded || event === undefined) return null;
  if (!event) notFound();

  const freeTicket = event.ticketTypes.find((t) => t.price === 0);
  if (!freeTicket) {
    return <div className="container py-12">Paid events coming soon</div>;
  }

  if (alreadyRegistered) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">You’re already registered</h1>
      </div>
    );
  }

  const remaining = freeTicket.totalQuantity - freeTicket.soldQuantity;

  const maxAllowed = Math.min(freeTicket.maxPerOrder, remaining);

  /* ---------------- ACTION ---------------- */

  async function handleConfirm() {
    if (!user) {
      router.push(`/sign-in?redirect_url=/events/${slug}/checkout`);
      return;
    }

    setLoading(true);

    await createFreeOrder({
      eventId: event!._id,
      ticketTypeId: freeTicket!._id,
      quantity,
    });

    router.push(`/events/${slug}/confirmation`);
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="container max-w-xl py-12">
      <h1 className="text-2xl font-semibold">Confirm registration</h1>

      <Separator className="my-6" />

      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          disabled={quantity <= freeTicket.minPerOrder}
          onClick={() => setQuantity(quantity - 1)}
        >
          <Minus />
        </Button>

        <span className="text-lg font-semibold">{quantity}</span>

        <Button
          size="icon"
          variant="outline"
          disabled={quantity >= maxAllowed}
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus />
        </Button>
      </div>

      <Button
        className="mt-8 w-full"
        size="lg"
        onClick={handleConfirm}
        disabled={loading}
      >
        <Ticket className="mr-2 h-4 w-4" />
        Confirm (Free)
      </Button>
    </div>
  );
}
