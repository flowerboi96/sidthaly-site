// Sid Thaly: menu, cover carousel, filters, full-size viewer and quote form.
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  // Footer year
  var year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  // Phone menu
  var menuBtn = $("menu-btn");
  var nav = $("main-nav");
  if (menuBtn && nav) {
    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // Cover carousel
  var track = $("track");
  if (!track) return;
  var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
  var filters = Array.prototype.slice.call(document.querySelectorAll(".pill[data-filter]"));
  var title = $("now-title"), meta = $("now-meta"), countI = $("count-i"), countN = $("count-n"), bar = $("progress-bar");
  var active = -1;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function visible() { return slides.filter(function (s) { return !s.hidden; }); }

  function centreOf(slide) { return slide.offsetLeft + slide.offsetWidth / 2; }

  function setActive(i) {
    var list = visible();
    if (!list.length) return;
    i = Math.max(0, Math.min(list.length - 1, i));
    active = i;
    slides.forEach(function (s) { s.classList.remove("is-active"); s.removeAttribute("data-dist"); });
    list.forEach(function (s, k) {
      var d = Math.abs(k - i);
      if (d === 0) s.classList.add("is-active");
      else if (d <= 2) s.setAttribute("data-dist", String(d));
    });
    var s = list[i];
    title.textContent = s.dataset.title || "";
    meta.textContent = s.dataset.meta || "";
    countI.textContent = pad(i + 1);
    countN.textContent = pad(list.length);
    bar.style.width = ((i + 1) / list.length * 100) + "%";
  }

  function nearest() {
    var list = visible();
    var mid = track.scrollLeft + track.clientWidth / 2;
    var best = 0, bestD = Infinity;
    list.forEach(function (s, k) {
      var d = Math.abs(centreOf(s) - mid);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  }

  function goTo(i, instant) {
    var list = visible();
    if (!list.length) return;
    i = Math.max(0, Math.min(list.length - 1, i));
    setActive(i);
    track.scrollTo({ left: centreOf(list[i]) - track.clientWidth / 2, behavior: instant || reduceMotion ? "auto" : "smooth" });
  }

  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var n = nearest();
      if (n !== active) setActive(n);
    });
  }, { passive: true });

  $("prev").addEventListener("click", function () { goTo(active - 1); });
  $("next").addEventListener("click", function () { goTo(active + 1); });

  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
  });

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.dataset.filter;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      slides.forEach(function (s) { s.hidden = !(cat === "all" || s.dataset.category === cat); });
      var n = visible().length;
      goTo(cat === "all" ? Math.min(3, n - 1) : Math.min(1, n - 1), true);
    });
  });

  // Full-size viewer
  var box = $("lightbox"), boxImg = $("lb-img"), boxCap = $("lb-caption");
  var canModal = box && typeof box.showModal === "function";

  function showInBox(i) {
    var list = visible();
    var s = list[i];
    if (!s) return;
    var img = s.querySelector("img");
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt;
    boxCap.textContent = s.dataset.title || "";
  }

  function boxStep(dir) {
    var list = visible();
    var i = (active + dir + list.length) % list.length;
    goTo(i);
    showInBox(i);
  }

  slides.forEach(function (s) {
    var btn = s.querySelector(".slide-btn");
    btn.addEventListener("click", function () {
      var i = visible().indexOf(s);
      if (i !== active) { goTo(i); return; }
      if (canModal) { showInBox(i); box.showModal(); }
    });
    btn.addEventListener("focus", function () {
      var i = visible().indexOf(s);
      if (i !== active) goTo(i);
    });
  });

  if (canModal) {
    $("lb-prev").addEventListener("click", function () { boxStep(-1); });
    $("lb-next").addEventListener("click", function () { boxStep(1); });
    $("lb-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") boxStep(-1);
      if (e.key === "ArrowRight") boxStep(1);
    });
  }

  // Start on the fourth cover so there is art on both sides
  function start() { goTo(Math.min(3, visible().length - 1), true); }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
  window.addEventListener("resize", function () { goTo(active, true); });
  setActive(3);

  // Quote form (Formspree)
  var form = $("brief-form");
  var status = $("form-status");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";

      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        status.textContent = "This form isn’t connected yet. Please email hello@sidthaly.com for now.";
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
