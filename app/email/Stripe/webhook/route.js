// app/api/stripe/webhook/route.js
import Stripe from "stripe";

export const runtime = "nodejs"; // keep webhook on Node runtime (not Edge)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // or your account's default
});

export async function POST(request) {
  // Stripe sends a raw body; do NOT parse JSON here
  const sig = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the events you care about
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // TODO: fulfill order, update DB, send email, etc.
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        // TODO: mark payment success
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        // TODO: log/alert failure
        break;
      }
      default:
        // Optional: log unhandled events
        break;
    }
  } catch (err) {
    // If your business logic throws, respond 500 so Stripe may retry
    return new Response(`Handler Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// For non-POST methods, be explicit
export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}