export const runtime = "nodejs";

import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { T } from "@/lib/dbTables";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.trip_id || !body?.customer_email) {
    return new Response("trip_id and customer_email required", { status: 400 });
  }
  const qty = Math.max(1, Number(body.qty ?? 1));

  const sb = getAdminClient();

  const { data: trip, error: tripErr } = await sb.from(T.trips).select("*").eq("id", body.trip_id).single();
  if (tripErr || !trip) return new Response("Trip not found", { status: 404 });

  // lazy-init here (no top-level throw during build)
  const stripe = getStripe();

  const { data: booking, error: bookingErr } = await sb.from(T.bookings).insert({
    trip_id: trip.id,
    customer_email: body.customer_email,
    customer_name: body.customer_name ?? null,
    qty,
    status: "pending"
  }).select("*").single();
  if (bookingErr) return new Response(bookingErr.message, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: trip.currency ?? "usd",
        product_data: { name: trip.title, description: trip.description ?? undefined },
        unit_amount: trip.price_cents
      },
      quantity: qty
    }],
    success_url: "https://trips.boltaitools.com/?checkout=success",
    cancel_url: "https://trips.boltaitools.com/?checkout=cancel",
    metadata: { booking_id: booking.id, trip_id: trip.id }
  });

  await sb.from(T.bookings).update({ stripe_checkout_id: session.id }).eq("id", booking.id);
  return new Response(JSON.stringify({ checkout_url: session.url }), { status: 200, headers: { "Content-Type": "application/json" }});
}