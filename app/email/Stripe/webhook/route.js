export const runtime = "nodejs"; // keep webhook on Node runtime

export async function POST(request) {
  // Placeholder: responds 200 so Stripe deliveries show green.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}