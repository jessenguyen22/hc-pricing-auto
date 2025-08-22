import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(
      request
    );

    if (!session) {
      // If the session is invalid, Shopify will retry the webhook, so we should respond with a 401 Unauthorized.
      return new Response("Unauthorized", { status: 401 });
    }

    switch (topic) {
      case "APP_UNINSTALLED":
        if (session) {
          console.log(`App uninstalled for shop: ${shop}. Cleaning up session.`);
          await db.session.deleteMany({ where: { shop } });
        }
        break;

      case "INVENTORY_LEVELS_UPDATE":
        console.log("Received inventory_levels/update webhook:");
        console.log("Shop:", shop);
        console.log("Payload:", JSON.stringify(payload, null, 2));
        // You can add more logic here to process the inventory update
        break;

      case "CUSTOMERS_DATA_REQUEST":
      case "CUSTOMERS_REDACT":
      case "SHOP_REDACT":
      default:
        // For now, we'll just log other webhooks and respond with a 200 OK.
        console.log(`Received webhook for topic: ${topic}`);
        break;
    }

    // Shopify expects a 200 OK response to acknowledge receipt of the webhook.
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return a 500 Internal Server Error response if something goes wrong
    return new Response("Internal Server Error", { status: 500 });
  }
};