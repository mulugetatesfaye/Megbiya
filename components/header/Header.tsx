"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EventSearch } from "./EventSearch";
import {
  Menu,
  X,
  Ticket,
  Calendar,
  Search,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------------------------------------------
   Header
--------------------------------------------- */
export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  /* ---------------------------------------------
     Role-aware dashboard link
  --------------------------------------------- */
  const dashboardHref = useMemo(() => {
    if (user?.role === "admin") return "/dashboard/admin";
    if (user?.role === "organizer") return "/dashboard/organizer";
    return "/";
  }, [user?.role]);

  /* ---------------------------------------------
     Public navigation
  --------------------------------------------- */
  const publicNav = [
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Categories", href: "/categories", icon: Search },
  ];

  /* ---------------------------------------------
     Authenticated navigation
  --------------------------------------------- */
  const authNav = useMemo(() => {
    if (!user) return [];

    const items = [{ name: "My Tickets", href: "/my-tickets", icon: Ticket }];

    if (user.role === "organizer" || user.role === "admin") {
      items.push(
        {
          name: "Create Event",
          href: "/dashboard/organizer/events/new",
          icon: PlusCircle,
        },
        {
          name: "Dashboard",
          href: dashboardHref,
          icon: LayoutDashboard,
        }
      );
    }

    return items;
  }, [user, dashboardHref]);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Logo + Search */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link href="/" className="flex items-center flex-shrink-0">
              <div className="relative h-10 w-32 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="Megbiya Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Search - Desktop */}
            <div className="hidden md:block flex-1 max-w-xl">
              <EventSearch />
            </div>

            {/* Mobile Search Button */}
            <div className="md:hidden">
              <EventSearch />
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNav.map(({ name, href, icon: Icon }) => (
              <Link key={name} href={href}>
                <Button
                  variant={isActive(href) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </Button>
              </Link>
            ))}

            <SignedIn>
              {authNav.map(({ name, href, icon: Icon }) => (
                <Link key={name} href={href}>
                  <Button
                    variant={isActive(href) ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </Button>
                </Link>
              ))}
            </SignedIn>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <SignedIn>
              {!isLoading && user && user.role !== "attendee" && (
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              )}
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: "h-8 w-8" } }}
              />
            </SignedIn>

            <SignedOut>
              <div className="hidden md:flex gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </div>
            </SignedOut>

            {/* Mobile toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-16 h-full w-full max-w-sm border-l bg-background p-6">
            <SignedIn>
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : user ? (
                  <>
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.firstName ?? "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
              <Separator />
            </SignedIn>

            <nav className="mt-4 space-y-1">
              {[...publicNav, ...authNav].map(({ name, href, icon: Icon }) => (
                <Link key={name} href={href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive(href) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </Button>
                </Link>
              ))}
            </nav>

            <SignedOut>
              <Separator className="my-4" />
              <SignInButton mode="modal">
                <Button className="w-full" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="mt-2 w-full">Sign Up</Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}
    </>
  );
}
