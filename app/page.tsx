export default function Home() {
  return (
    <main style={{fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial", padding: 32}}>
      <h1>Travel App is Live ✅</h1>
      <p>Welcome! Try the health endpoints:</p>
      <ul>
        <li><a href="/api/email/test">/api/email/test</a></li>
        <li><a href="/api/twilio/health">/api/twilio/health</a></li>
      </ul>
    </main>
  );
}