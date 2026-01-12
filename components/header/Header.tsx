"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoading, user } = useCurrentUser();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navigation = [
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Categories", href: "/categories", icon: Search },
  ];

  const authenticatedNavigation = [
    { name: "My Tickets", href: "/my-tickets", icon: Ticket },
    ...(user?.role === "organizer" || user?.role === "admin"
      ? [
          { name: "Create Event", href: "/events/create", icon: PlusCircle },
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Ticket className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">EventHub</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex md:items-center md:gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side - Auth & User Actions */}
            <div className="flex items-center gap-2">
              {/* Authenticated Navigation - Desktop */}
              <SignedIn>
                <div className="hidden md:flex md:items-center md:gap-1">
                  {authenticatedNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "secondary" : "ghost"}
                          size="sm"
                          className="gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                {/* User Badge & Avatar - Desktop */}
                <div className="hidden md:flex md:items-center md:gap-3">
                  {/* Only show badge when user data is loaded */}
                  {!isLoading && user && user.role !== "attendee" && (
                    <Badge variant="outline" className="font-normal">
                      {user.role}
                    </Badge>
                  )}
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8",
                      },
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              </SignedIn>

              {/* Sign In / Sign Up - Desktop */}
              <SignedOut>
                <div className="hidden md:flex md:items-center md:gap-2">
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

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed right-0 top-16 bottom-0 w-full max-w-sm border-l bg-background p-6 shadow-lg overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* User Info - Mobile */}
              <SignedIn>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </>
                  ) : user ? (
                    <>
                      {user.imageUrl ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                          <Image
                            src={user.imageUrl}
                            alt={user.firstName || "User"}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      {user.role !== "attendee" && (
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Setting up your account...
                    </p>
                  )}
                </div>
                <Separator />
              </SignedIn>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}

                <SignedIn>
                  <Separator className="my-2" />
                  {authenticatedNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive(item.href) ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </SignedIn>
              </nav>

              {/* Auth Buttons - Mobile */}
              <SignedOut>
                <Separator />
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
