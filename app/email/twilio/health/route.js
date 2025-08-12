export async function GET() {
  return new Response(JSON.stringify({ ok: true, message: "Twilio health is good" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}