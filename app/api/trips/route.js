export const runtime = "nodejs";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { T } from "@/lib/dbTables";

export async function GET() {
  const sb = getAdminClient();
  const { data, error } = await sb.from(T.trips).select("*").order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" }});
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  if (!payload?.title || typeof payload?.price_cents !== "number") {
    return new Response("Missing title or price_cents", { status: 400 });
  }
  const sb = getAdminClient();
  const { data, error } = await sb.from(T.trips).insert({
    title: payload.title,
    description: payload.description ?? null,
    price_cents: payload.price_cents,
    currency: payload.currency ?? "usd",
    start_date: payload.start_date ?? null,
    end_date: payload.end_date ?? null,
  }).select("*").single();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" }});
}
