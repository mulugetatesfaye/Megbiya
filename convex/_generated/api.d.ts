/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib_requireOrganizer from "../lib/requireOrganizer.js";
import type * as lib_slugify from "../lib/slugify.js";
import type * as orders from "../orders.js";
import type * as seed from "../seed.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  events: typeof events;
  http: typeof http;
  "lib/requireOrganizer": typeof lib_requireOrganizer;
  "lib/slugify": typeof lib_slugify;
  orders: typeof orders;
  seed: typeof seed;
  tickets: typeof tickets;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
