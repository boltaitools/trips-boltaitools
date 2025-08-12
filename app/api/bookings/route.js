export const runtime = "nodejs";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { T } from "@/lib/dbTables";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body?.trip_id || !body?.customer_email) return new Response("trip_id and customer_email required", { status: 400 });
  const qty = Math.max(1, Number(body.qty ?? 1));
  const sb = getAdminClient();

  const { data: trip, error: tripErr } = await sb.from(T.trips).select("*").eq("id", body.trip_id).single();
  if (tripErr || !trip) return new Response("Trip not found", { status: 404 });

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return new Response("email required", { status: 400 });
  const sb = getAdminClient();

  const { data, error } = await sb
    .from(T.bookings)
    .select("*, trips:trip_id(*)")   // if your FK/table name differs, we can tweak this
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" }});
}
