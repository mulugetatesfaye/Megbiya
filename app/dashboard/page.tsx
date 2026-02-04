"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardPage() {
  const user = useQuery(api.users.current);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!user || hasRedirected.current) return; // Wait for user data or prevent double redirects

    // Redirect based on user role
    const destination =
      user.role === "admin"
        ? "/dashboard/admin"
        : user.role === "organizer"
          ? "/dashboard/organizer"
          : "/"; // Attendees go to homepage

    hasRedirected.current = true;
    router.replace(destination);
  }, [user, router]);

  // Loading state while determining where to redirect
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  // Brief loading state during redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}