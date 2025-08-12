export const runtime = "nodejs";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return new Response("Missing env", { status: 500 });

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.from("pg_catalog.pg_tables").select("tablename").limit(1);
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
}