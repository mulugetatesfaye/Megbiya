import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error verifying webhook signature", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const { data } = event;

        // Get primary email
        const primaryEmailId = data.primary_email_address_id;

        if (!primaryEmailId) {
          console.warn(`No primary email ID found for user ${data.id}`);
          return new Response("No primary email ID", { status: 200 });
        }

        const emailObject = data.email_addresses.find(
          (e) => e.id === primaryEmailId
        );

        if (!emailObject) {
          console.warn(
            `No email address found matching primary ID for user ${data.id}`
          );
          return new Response("No email found", { status: 200 });
        }

        // Call mutation with properly typed arguments
        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkId: data.id,
          email: emailObject.email_address,
          firstName: data.first_name ?? undefined,
          lastName: data.last_name ?? undefined,
          imageUrl: data.image_url ?? undefined,
          username: data.username ?? undefined,
          phone: data.phone_numbers?.[0]?.phone_number ?? undefined,
        });
        break;
      }

      case "user.deleted": {
        const clerkUserId = event.data.id;
        if (clerkUserId) {
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkId: clerkUserId,
          });
        }
        break;
      }

      default:
        console.log("Ignored Clerk webhook event:", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not defined");
    return null;
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing svix headers");
    return null;
  }

  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  const wh = new Webhook(webhookSecret);

  try {
    return wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event:", error);
    return null;
  }
}

export default http;
