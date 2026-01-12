import { Doc, Id } from "@/convex/_generated/dataModel";

export type EventWithDetails = Doc<"events"> & {
  category: Doc<"categories"> | null;
  organizer: {
    name: string;
    imageUrl?: string;
  } | null;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  availableTickets: number;
  isSoldOut: boolean;
};

export type CategoryType = Doc<"categories">;

export type EventDetail = Doc<"events"> & {
  category: Doc<"categories"> | null;
  organizer: {
    name: string;
    imageUrl?: string;
  } | null;
  ticketTypes: Doc<"ticketTypes">[];
};
