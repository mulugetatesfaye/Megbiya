"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const user = useQuery(api.users.current);
  const router = useRouter();

  // Loading state while fetching user data
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  // If user exists but is not an admin, redirect to home page
  if (user.role !== "admin") {
    router.push("/");
    return null;
  }

  return <>{children}</>;
}
