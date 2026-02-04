"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = useQuery(api.users.current);

  // Default dashboard destination per role
  const homeHref =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "organizer"
        ? "/dashboard/organizer"
        : "/";

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 text-sm">
          <NavLink href={homeHref}>Overview</NavLink>

          {/* Attendee */}
          <SectionLabel>Account</SectionLabel>
          <NavLink href="/my-tickets">My Tickets</NavLink>

          {/* Organizer */}
          {(user.role === "organizer" || user.role === "admin") && (
            <>
              <SectionLabel>Organizer</SectionLabel>
              <NavLink href="/dashboard/organizer">Dashboard</NavLink>
              <NavLink href="/dashboard/organizer/events">Events</NavLink>
              <NavLink href="/dashboard/organizer/events/new">Create Event</NavLink>
            </>
          )}

          {/* Admin */}
          {user.role === "admin" && (
            <>
              <SectionLabel>Admin</SectionLabel>
              <NavLink href="/dashboard/admin">Admin Overview</NavLink>
              <NavLink href="/dashboard/admin/users">Users</NavLink>
              <NavLink href="/dashboard/admin/categories">Categories</NavLink>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t p-4 text-xs text-muted-foreground">
          Signed in as
          <br />
          <span className="font-medium text-foreground">{user.email}</span>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col">
        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 transition-colors",
        "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}
