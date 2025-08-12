export async function GET() {
  return new Response(JSON.stringify({ ok: true, message: "Email test route responding" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}