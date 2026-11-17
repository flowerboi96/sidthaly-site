// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Succeeds only if the signature matches HMAC-SHA256(order_id + "|" + payment_id, key secret).

export async function onRequestPost({ request, env }) {
  if (!hasKeys(env)) return json({ ok: false, error: "Payments aren't set up yet." }, 500);

  const b = await readJson(request);
  const orderId = b && b.razorpay_order_id, paymentId = b && b.razorpay_payment_id, signature = b && b.razorpay_signature;
  if (!orderId || !paymentId || !signature) return json({ ok: false, error: "Missing payment details." }, 400);

  const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, orderId + "|" + paymentId);
  if (!safeEqual(expected, String(signature))) return json({ ok: false, error: "This payment couldn't be verified." }, 400);

  return json({ ok: true, payment_id: paymentId });
}

// ---- helpers ----
// Keys come from Cloudflare environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET), never from this code.

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function readJson(request) {
  try { return await request.json(); } catch (e) { return null; }
}

function hasKeys(env) {
  return !!(env && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

// HMAC-SHA256 of message with the key secret, as lowercase hex
async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// compare two strings without leaking where they differ
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
