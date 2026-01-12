import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useConvexAuth } from "convex/react";

/**
 * Hook to get the current authenticated user from Convex.
 * Returns:
 *   isLoading: true while auth or user data is being fetched
 *   isAuthenticated: true if user is logged in with Clerk
 *   user: the user document from Convex, or null (if webhook hasn't synced)
 */
export function useCurrentUser() {
  const { isLoading: isAuthLoading, isAuthenticated: isClerkAuthenticated } =
    useConvexAuth();

  // Only query for user if authenticated with Clerk
  const user = useQuery(api.users.current, isClerkAuthenticated ? {} : "skip");

  // Determine loading state:
  // 1. Still checking auth -> loading
  // 2. Authenticated but user query hasn't returned yet (undefined) -> loading
  // Note: user can be null if webhook hasn't synced yet - that's NOT a loading state
  const isLoading =
    isAuthLoading || (isClerkAuthenticated && user === undefined);

  // User is authenticated if Clerk says so
  // We use Clerk as the source of truth for auth status
  const isAuthenticated = isClerkAuthenticated;

  return {
    isLoading,
    isAuthenticated,
    user: user ?? null, // Normalize undefined to null for consistency
  };
}

/**
 * Type helper for components that need the user to be defined
 */
export type AuthenticatedUser = NonNullable<
  ReturnType<typeof useCurrentUser>["user"]
>;
