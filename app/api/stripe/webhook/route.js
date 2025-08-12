export const runtime = "nodejs";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { T } from "@/lib/dbTables";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const sb = getAdminClient();

  // store event (idempotent)
  try {
    const payload = JSON.parse(rawBody);
    await sb.from(T.webhookEvents).insert({ id: payload.id, type: payload.type, payload });
  } catch {}

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const bookingId = s.metadata?.booking_id || null;
        const paymentIntentId = s.payment_intent || null;

        if (bookingId) {
          await sb.from(T.bookings)
            .update({ status: "paid", stripe_payment_intent: paymentIntentId })
            .eq("id", bookingId);
        }

        await sb.from(T.payments).insert({
          booking_id: bookingId,
          stripe_payment_intent: paymentIntentId,
          amount_cents: s.amount_total ?? 0,
          currency: s.currency ?? "usd",
          status: "succeeded",
          raw: event
        });

        const email = s.customer_details?.email;
        if (email) {
          try {
            await resend.emails.send({
              from: "noreply@boltaitools.com",
              to: email,
              subject: "Booking Confirmed",
              text: "Thanks! Your booking is confirmed.",
            });
          } catch {}
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        await sb.from(T.payments).insert({
          stripe_payment_intent: pi.id,
          amount_cents: pi.amount ?? 0,
          currency: pi.currency ?? "usd",
          status: "failed",
          raw: event
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return new Response(`Handler Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
}