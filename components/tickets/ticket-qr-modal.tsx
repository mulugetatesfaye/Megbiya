"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";

interface Props {
  ticket: Doc<"tickets"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketQRModal({ ticket, open, onOpenChange }: Props) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center space-y-4">
        <Badge>
          {ticket.status === "checked_in" ? "Checked in" : "Valid ticket"}
        </Badge>

        <div className="flex justify-center py-4">
          <QRCodeCanvas value={ticket.qrCodeSecret} size={240} />
        </div>

        <p className="font-mono text-sm text-muted-foreground">
          {ticket.ticketNumber}
        </p>
      </DialogContent>
    </Dialog>
  );
}
