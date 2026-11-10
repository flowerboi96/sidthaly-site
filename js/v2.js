/* Version 2: menu, cover row, quote form */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  // Phone menu
  var menuBtn = $("menu-btn"), nav = $("main-nav");
  if (menuBtn && nav) {
    var header = menuBtn.closest(".hd");
    var setMenu = function (open) {
      header.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", function () { setMenu(!header.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // Cover row: five pieces around the active one
  var row = $("row");
  if (row) {
    var ALL = [
      { src: "images/paintings/wood-mist.jpg", t: "Wood Mist", alt: "An elf in a teal gown with a gold serpent coiled around her, green mist curling from her hand", c: "characters" },
      { src: "images/paintings/jade-blade.jpg", t: "Jade Blade", alt: "A hooded woman in a green cloak resting a curved blade on her shoulder", c: "characters" },
      { src: "images/paintings/the-scholar.jpg", t: "The Scholar", alt: "A warrior scholar reading a glowing red book, leaping through a beam of light", c: "characters" },
      { src: "images/paintings/spirit-bear.jpg", t: "Spirit Bear", alt: "A white-haired sorceress summoning a green spirit bear", c: "characters" },
      { src: "images/paintings/wraith.jpg", t: "Wraith", alt: "A cloaked figure seen from behind, a green blade glowing against a burning sky", c: "characters" },
      { src: "images/paintings/demon.jpg", t: "Demon", alt: "A pale horned woman in black holding a white blade", c: "characters" }
    ];
    var list = ALL.slice(), active = 2;
    var title = $("now-title");
    var srcset = function (src) {
      var b = src.replace(/\.jpg$/, "");
      return b + "-600.webp 600w, " + b + "-1200.webp 1200w";
    };
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));

    var render = function () {
      var n = list.length, k = Math.min(n, 5), start = -Math.floor((k - 1) / 2);
      row.innerHTML = "";
      for (var d = start; d < start + k; d++) {
        var i = ((active + d) % n + n) % n, item = list[i];
        var el = document.createElement("span");
        el.className = "c" + (d === 0 ? " on" : Math.abs(d) === 1 ? " d1" : "");
        el.setAttribute("data-step", String(d));
        var img = document.createElement("img");
        img.src = item.src; img.alt = item.alt;
        img.srcset = srcset(item.src); img.sizes = "(max-width: 820px) 60vw, 30vw"; img.decoding = "async";
        el.appendChild(img);
        row.appendChild(el);
      }
      if (title) title.textContent = list[active].t;
    };
    var step = function (s) { active = ((active + s) % list.length + list.length) % list.length; render(); };

    $("prev").addEventListener("click", function () { step(-1); });
    $("next").addEventListener("click", function () { step(1); });
    row.addEventListener("click", function (e) {
      var c = e.target.closest(".c");
      if (!c) return;
      var d = parseInt(c.getAttribute("data-step"), 10) || 0;
      if (d === 0) openBox(ALL.indexOf(list[active])); else step(d);
    });

    // "View all work" grid and the full-size viewer
    var viewAll = $("view-all"), grid = $("all-work"), box = $("lb");
    if (viewAll && grid) {
      viewAll.addEventListener("click", function () {
        var open = grid.hasAttribute("hidden");
        if (open) grid.removeAttribute("hidden"); else grid.setAttribute("hidden", "");
        viewAll.setAttribute("aria-expanded", open ? "true" : "false");
        viewAll.querySelector("span").textContent = open ? "Hide all work" : "View all work";
      });
      grid.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (b) openBox(parseInt(b.getAttribute("data-i"), 10));
      });
    }
    var boxI = 0;
    function showBox(i) {
      boxI = (i + ALL.length) % ALL.length;
      var it = ALL[boxI], im = $("lb-img");
      im.src = it.src; im.alt = it.alt; im.removeAttribute("srcset");
      $("lb-t").textContent = it.t;
    }
    function openBox(i) {
      if (!box || typeof box.showModal !== "function") return;
      showBox(i < 0 ? 0 : i);
      box.showModal();
    }
    if (box) {
      $("lb-x").addEventListener("click", function () { box.close(); });
      $("lb-p").addEventListener("click", function () { showBox(boxI - 1); });
      $("lb-n").addEventListener("click", function () { showBox(boxI + 1); });
      box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("lb-in")) box.close(); });
      box.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") showBox(boxI - 1);
        if (e.key === "ArrowRight") showBox(boxI + 1);
      });
    }
    row.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });
    var x0 = null;
    row.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    row.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        list = f === "all" ? ALL.slice() : ALL.filter(function (it) { return it.c === f; });
        active = f === "all" ? 3 : 0;
        render();
      });
    });
    render();
  }

  // Newsletter sign-up (Formspree)
  var news = $("news-form"), ns = $("news-status");
  if (news && ns) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      if (news.action.indexOf("YOUR_FORM_ID") !== -1) {
        ns.textContent = "Sign-ups open soon. For now, email hello@sidthaly.com and I’ll add you.";
        return;
      }
      ns.textContent = "Adding you…";
      fetch(news.action, { method: "POST", body: new FormData(news), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw 0; news.reset(); ns.textContent = "You’re on the list. Thank you!"; })
        .catch(function () { ns.textContent = "That didn’t go through. Please try again."; });
    });
  }

  // Quote form (Formspree), same behaviour as the live site
  var form = $("brief-form"), status = $("form-status");
  if (form && status) {
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
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("bad response");
          form.reset();
          status.textContent = "Brief sent. I’ll reply within two working days.";
          status.classList.add("is-ok");
        })
        .catch(function () {
          status.textContent = "The brief didn’t send. Check your connection and try again, or email hello@sidthaly.com.";
          status.classList.add("is-error");
        })
        .then(function () { button.disabled = false; });
    });
  }
})();
