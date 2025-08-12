export const runtime = "nodejs"; // keep this on Node, not Edge

export async function POST(request) {
  // Minimal placeholder so Stripe can POST successfully.
  // Later: verify signature using STRIPE_WEBHOOK_SECRET and read raw body.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export function GET() {
  // For non-POST methods, let Stripe (and you) know it's method-limited
  return new Response("Method Not Allowed", { status: 405 });
}