// POST /api/create-order
// Body: { amount: rupees (number), invoice: "invoice number" }
// Creates a Razorpay order and returns { order_id, amount, currency, key_id }.

const MIN_PAISE = 100;          // Razorpay minimum: ₹1
const MAX_PAISE = 1000000 * 100; // ₹10,00,000 cap, to catch typos like an extra zero

export async function onRequestPost({ request, env }) {
  if (!hasKeys(env)) return json({ error: "Payments aren't set up yet. Please email hello@sidthaly.com." }, 500);

  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  const rupees = Number(body.amount);
  const paise = Math.round(rupees * 100);
  if (!Number.isFinite(rupees) || paise < MIN_PAISE) return json({ error: "Enter an amount of at least ₹1." }, 400);
  if (paise > MAX_PAISE) return json({ error: "That amount is too large to pay online. Please email hello@sidthaly.com." }, 400);

  const invoice = String(body.invoice || "").trim().slice(0, 40);
  if (!invoice) return json({ error: "Enter your invoice number." }, 400);

  let res;
  try {
    res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(env.RAZORPAY_KEY_ID + ":" + env.RAZORPAY_KEY_SECRET),
      },
      body: JSON.stringify({ amount: paise, currency: "INR", receipt: invoice, notes: { invoice } }),
    });
  } catch (e) {
    return json({ error: "Couldn't reach the payment service. Please try again." }, 500);
  }

  if (res.status === 401) return json({ error: "The payment service rejected the site's keys. Please email hello@sidthaly.com." }, 401);
  if (!res.ok) return json({ error: "The payment service couldn't start this payment. Please try again." }, 500);

  const order = await res.json();
  return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: env.RAZORPAY_KEY_ID });
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
