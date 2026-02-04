"use client";

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

interface OrganizerLayoutProps {
  children: ReactNode;
}

export default function OrganizerLayout({
  children,
}: OrganizerLayoutProps) {
  const user = useQuery(api.users.current);
  const router = useRouter();

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (user.role !== "organizer" && user.role !== "admin") {
    router.push("/");
    return null;
  }

  return <>{children}</>;
}
