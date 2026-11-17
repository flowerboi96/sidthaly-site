// "Pay an invoice" page: Razorpay Standard Checkout.
// Two forms: clients outside India pay by card in USD/EUR/GBP; clients in India pay in INR (UPI, card, net banking).
// The order is created by /api/create-order (server side, holds the secret key);
// the result is checked by /api/verify-payment before the page says it's paid.
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll("form.payf"));
  if (!forms.length) return;
  var SYMBOL = { INR: "₹", USD: "US$", EUR: "€", GBP: "£" };

  // a link like pay.html?invoice=SID-012&amount=150&currency=USD fills the right form in for the client
  try {
    var q = new URLSearchParams(location.search), cur = (q.get("currency") || "").toUpperCase();
    if (q.get("invoice") || q.get("amount")) {
      var target = cur && cur !== "INR" ? document.getElementById("pay-intl") : document.getElementById("pay-inr");
      if (target) {
        if (q.get("invoice")) target.elements.invoice.value = q.get("invoice").slice(0, 40);
        if (q.get("amount")) target.elements.amount.value = q.get("amount");
        if (target.elements.currency && SYMBOL[cur]) target.elements.currency.value = cur;
      }
    }
  } catch (e) {}

  var loading = null;
  function loadCheckout() {
    if (window.Razorpay) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = ok;
      s.onerror = function () { loading = null; fail(new Error("checkout")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function post(url, data) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, body: b }; }); });
  }

  forms.forEach(function (form) {
    var inv = form.elements.invoice, amt = form.elements.amount, curSel = form.elements.currency;
    var status = form.querySelector(".form-status"), btn = form.querySelector("button[type=submit]");
    function say(msg, kind) { status.textContent = msg; status.className = "form-status" + (kind ? " is-" + kind : ""); }
    function busy(on) { btn.disabled = on; }
    function currency() { return curSel ? curSel.value : (form.getAttribute("data-currency") || "INR"); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invoice = inv.value.trim(), amount = parseFloat(amt.value), cur = currency();
      if (!invoice) { say("Enter your invoice number.", "error"); inv.focus(); return; }
      if (!(amount >= 1)) { say("Enter the amount from your invoice, at least " + SYMBOL[cur] + "1.", "error"); amt.focus(); return; }

      busy(true); say("Opening secure checkout…");
      Promise.all([loadCheckout(), post("/api/create-order", { amount: amount, currency: cur, invoice: invoice })])
        .then(function (res) {
          var r = res[1];
          if (!r.ok || !r.body.order_id) throw new Error(r.body.error || "The payment couldn't start. Please try again.");
          var o = r.body;
          var rzp = new window.Razorpay({
            key: o.key_id,
            order_id: o.order_id,
            amount: o.amount,
            currency: o.currency,
            name: "Sid Thaly",
            description: "Invoice " + invoice,
            notes: { invoice: invoice },
            theme: { color: "#E3103E" },
            handler: function (p) {
              say("Confirming your payment…");
              post("/api/verify-payment", {
                razorpay_order_id: p.razorpay_order_id,
                razorpay_payment_id: p.razorpay_payment_id,
                razorpay_signature: p.razorpay_signature
              }).then(function (v) {
                busy(false);
                if (v.ok && v.body.ok) {
                  form.reset();
                  say("Payment received. Thank you! Your payment ID is " + p.razorpay_payment_id + ", and a receipt is on its way by email.", "ok");
                } else {
                  say("Your payment went through but couldn't be confirmed here. Please email hello@sidthaly.com with payment ID " + p.razorpay_payment_id + ".", "error");
                }
              }).catch(function () {
                busy(false);
                say("Your payment went through but couldn't be confirmed here. Please email hello@sidthaly.com with payment ID " + p.razorpay_payment_id + ".", "error");
              });
            },
            modal: {
              ondismiss: function () { busy(false); if (!/received|Confirming|didn't go through/.test(status.textContent)) say("Payment cancelled. You can try again whenever you're ready."); }
            }
          });
          rzp.on("payment.failed", function (resp) {
            var reason = resp && resp.error && resp.error.description;
            if (reason && !/[.!?]$/.test(reason)) reason += ".";
            busy(false);
            say("The payment didn't go through" + (reason ? ": " + reason : ".") + " You can try again, or use another method.", "error");
          });
          say("");
          rzp.open();
        })
        .catch(function (err) {
          busy(false);
          say(err && err.message && err.message !== "checkout" ? err.message : "Couldn't load the secure checkout. Check your connection and try again.", "error");
        });
    });
  });
})();
