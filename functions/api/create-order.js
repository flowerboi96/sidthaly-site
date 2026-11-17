// POST /api/create-order
// Body: { amount: in the currency's main unit (e.g. 150 for USD 150), currency: "INR" | "USD" | "EUR" | "GBP", invoice: "invoice number" }
// Creates a Razorpay order and returns { order_id, amount, currency, key_id }.

// Per-payment limits, in the currency's main unit. International card payments on this
// account are capped by Razorpay at ₹40,000 each; the USD/EUR/GBP caps keep under that.
// If Razorpay raises the limit, raise these too.
const LIMITS = {
  INR: { min: 1, max: 1000000, label: "₹" },
  USD: { min: 1, max: 450, label: "US$" },
  EUR: { min: 1, max: 400, label: "€" },
  GBP: { min: 1, max: 350, label: "£" },
};

export async function onRequestPost({ request, env }) {
  if (!hasKeys(env)) return json({ error: "Payments aren't set up yet. Please email hello@sidthaly.com." }, 500);

  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  const currency = String(body.currency || "INR").toUpperCase();
  const lim = LIMITS[currency];
  if (!lim) return json({ error: "That currency isn't accepted. Please pay in USD, EUR, GBP or INR." }, 400);

  const value = Number(body.amount);
  if (!Number.isFinite(value) || value < lim.min) return json({ error: "Enter an amount of at least " + lim.label + lim.min + "." }, 400);
  if (value > lim.max) return json({ error: "Card payments are limited to " + lim.label + lim.max.toLocaleString("en-IN") + " each. Please email hello@sidthaly.com and I'll split the invoice or send bank transfer details." }, 400);
  const subunits = Math.round(value * 100); // all four currencies use 2 decimal places

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
      body: JSON.stringify({ amount: subunits, currency, receipt: invoice, notes: { invoice } }),
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
