import { Resend } from "resend";

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return new Response("RESEND_API_KEY missing", { status: 500 });

  let payload;
  try {
    payload = await request.json(); // { to, subject, text, html? }
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { to, subject, text, html } = payload || {};
  if (!to || !subject || (!text && !html)) {
    return new Response("Missing 'to', 'subject', and 'text' or 'html'", { status: 400 });
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: "noreply@boltaitools.com", // use a verified sender for your Resend account
      to,
      subject,
      text,
      html,
    });

    return new Response(JSON.stringify({ ok: true, id: result?.data?.id ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(`Email Error: ${err.message}`, { status: 500 });
  }
}
