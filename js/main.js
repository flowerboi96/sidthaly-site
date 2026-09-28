// Sid Thaly: gallery filter, lightbox and quote form.
(function () {
  "use strict";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Filter
  var filters = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var pieces = Array.prototype.slice.call(document.querySelectorAll(".piece"));

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.dataset.filter;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      pieces.forEach(function (p) {
        p.hidden = !(cat === "all" || p.dataset.category === cat);
      });
    });
  });

  // Lightbox
  var box = document.getElementById("lightbox");
  var boxImg = document.getElementById("lightbox-img");
  var boxCap = document.getElementById("lightbox-caption");
  var current = -1;

  function visiblePieces() { return pieces.filter(function (p) { return !p.hidden; }); }

  function show(piece) {
    var img = piece.querySelector("img");
    var title = piece.querySelector(".piece-title");
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt;
    boxCap.textContent = title ? title.textContent : "";
    current = visiblePieces().indexOf(piece);
  }

  function step(dir) {
    var list = visiblePieces();
    if (!list.length) return;
    current = (current + dir + list.length) % list.length;
    show(list[current]);
  }

  if (box && typeof box.showModal === "function") {
    pieces.forEach(function (piece) {
      piece.querySelector(".piece-open").addEventListener("click", function () {
        show(piece);
        box.showModal();
      });
    });
    document.getElementById("lb-prev").addEventListener("click", function () { step(-1); });
    document.getElementById("lb-next").addEventListener("click", function () { step(1); });
    document.getElementById("lb-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  // Quote form (Formspree)
  var form = document.getElementById("brief-form");
  var status = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";

      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        status.textContent = "This form isn’t connected yet. Add your Formspree form ID in index.html to start receiving briefs.";
        status.classList.add("is-error");
        return;
      }

      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Sending your brief…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          status.textContent = "Brief sent. I’ll reply within two working days.";
          status.classList.add("is-ok");
        } else {
          throw new Error("bad response");
        }
      }).catch(function () {
        status.textContent = "The brief didn’t send. Check your connection and try again, or email hello@sidthaly.com.";
        status.classList.add("is-error");
      }).then(function () {
        button.disabled = false;
      });
    });
  }
})();
