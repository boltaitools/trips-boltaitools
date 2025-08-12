import twilio from "twilio";

export async function POST(request) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return new Response("Twilio env vars missing", { status: 500 });
  }

  let payload;
  try {
    payload = await request.json(); // { to, body }
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { to, body } = payload || {};
  if (!to || !body) return new Response("Missing 'to' or 'body'", { status: 400 });

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({ from: TWILIO_FROM, to, body });
    return new Response(JSON.stringify({ ok: true, sid: msg.sid }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(`Twilio Error: ${err.message}`, { status: 500 });
  }
}
