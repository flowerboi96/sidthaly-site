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
      { src: "images/paintings/kalapy-mist-of-the-woodland.jpg", t: "Kalapy, Mist of the Woodland", alt: "Kalapy, an elf in a teal gown with a gold serpent coiled around her, green mist curling from her hand", c: "characters" },
      { src: "images/paintings/asahil-spirit-flame.jpg", t: "Asahil, Spirit Flame", alt: "Asahil, a hooded woman in a green cloak resting a curved blade on her shoulder", c: "characters" },
      { src: "images/paintings/ardnik-blade-walker.jpg", t: "Ardnik, Blade Walker", alt: "Ardnik, a warrior scholar reading a glowing red book, leaping through a beam of light", c: "characters" },
      { src: "images/paintings/ebba-and-fleux-spirit-dancer.jpg", t: "Ebba and Fleux, Spirit Dancer", alt: "Ebba, a white-haired sorceress dancing with Fleux, a green spirit bear", c: "characters" },
      { src: "images/paintings/doomwraith.jpg", t: "Doomwraith", alt: "Doomwraith, a cloaked figure seen from behind, a green blade glowing against a burning sky", c: "characters" },
      { src: "images/paintings/demona-lisa.jpg", t: "Demona Lisa", alt: "Demona Lisa, a pale horned woman in black holding a white blade", c: "characters" },
      { src: "images/paintings/inahsi-sylvawyrm.jpg", t: "Inahsi Sylvawyrm", alt: "Inahsi Sylvawyrm, a teal-haired woman in a red scarf sitting on a mossy branch high in the clouds", c: "characters" },
      { src: "images/paintings/x077a-submerged.jpg", t: "X077A Submerged", alt: "X077A, a dark armoured figure lit with gold lights, drifting underwater", c: "characters" },
      { src: "images/paintings/fenrir-kross-hobbit-hunter.jpg", t: "Fenrir Kross, Hobbit Hunter", alt: "Fenrir Kross, a grey-bearded hunter in plate armour holding a glowing trident", c: "characters" },
      { src: "images/paintings/gastine-royal-musketeer.jpg", t: "Gastine, Royal Musketeer", alt: "Gastine, a masked musketeer in a plumed hat and blue cape, holding a rapier and a lantern", c: "characters" },
      { src: "images/paintings/itra-lady-of-lust.jpg", t: "Itra Lady of Lust", alt: "Itra, a winged figure in flowing red silk soaring through the clouds", c: "characters" },
      { src: "images/paintings/kindred-spirit.jpg", t: "Kindred Spirit", alt: "Kindred Spirit, a dark-haired woman whose robes dissolve into a starry galaxy", c: "characters" },
      { src: "images/paintings/lechar-the-kitsune.jpg", t: "Le'Char the Kitsune", alt: "Le'Char, a kitsune in a red kimono with nine white tails and fox-fire in her hands", c: "characters" }
    ];
    var list = ALL.slice(), active = 2;
    var title = $("now-title");
    var srcset = function (src) {
      var b = src.replace(/\.jpg$/, "");
      return b + "-600.webp 600w, " + b + "-1200.webp 1200w";
    };
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));

    // Motion: paintings glide between positions, the new centre gets a light sweep, the caption fades in.
    // Everything here is skipped for visitors who ask their device for reduced motion.
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var nodes = {}, lastDir = 0, firstRender = true;
    var render = function () {
      var n = list.length, k = Math.min(n, 5), start = -Math.floor((k - 1) / 2);
      var before = {};
      if (!reduce) Array.prototype.forEach.call(row.children, function (el) { before[el.getAttribute("data-i")] = el.getBoundingClientRect().left; });
      var want = [], keep = {};
      for (var d = start; d < start + k; d++) {
        var i = ((active + d) % n + n) % n, item = list[i], key = item.src;
        var el = nodes[key];
        if (!el) {
          el = document.createElement("span");
          el.setAttribute("data-i", key);
          var img = document.createElement("img");
          img.src = item.src; img.alt = item.alt;
          img.srcset = srcset(item.src); img.sizes = "(max-width: 820px) 60vw, 30vw"; img.decoding = "async";
          el.appendChild(img);
          nodes[key] = el;
        }
        el.className = "c" + (d === 0 ? " on" : Math.abs(d) === 1 ? " d1" : "");
        el.setAttribute("data-step", String(d));
        el.style.transform = "";
        keep[key] = 1; want.push(el);
      }
      Object.keys(nodes).forEach(function (key) {
        if (!keep[key]) { if (nodes[key].parentNode === row) row.removeChild(nodes[key]); delete nodes[key]; }
      });
      Array.prototype.slice.call(row.children).forEach(function (el) { if (want.indexOf(el) < 0) row.removeChild(el); });
      want.forEach(function (el, idx) { if (row.children[idx] !== el) row.insertBefore(el, row.children[idx] || null); });
      if (!reduce && !firstRender && row.animate) {
        want.forEach(function (el) {
          var key = el.getAttribute("data-i"), x = el.getBoundingClientRect().left;
          if (before[key] !== undefined) {
            var dx = before[key] - x;
            if (Math.abs(dx) > 1) el.animate([{ transform: "translateX(" + dx + "px)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.22,.7,.2,1)" });
          } else {
            el.animate([{ opacity: 0, transform: "translateX(" + (lastDir * 90) + "px)" }, { opacity: getComputedStyle(el).opacity, transform: "none" }], { duration: 520, easing: "cubic-bezier(.22,.7,.2,1)" });
          }
        });
        var on = row.querySelector(".c.on");
        if (on) { on.classList.remove("sweep"); void on.offsetWidth; on.classList.add("sweep"); }
        if (title) title.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
      }
      firstRender = false;
      if (title) title.textContent = list[active].t;
    };
    var step = function (s) { lastDir = s > 0 ? 1 : -1; active = ((active + s) % list.length + list.length) % list.length; render(); };

    if (!reduce) {
      // The centre painting tilts gently towards the pointer (mouse and trackpad only).
      if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        row.addEventListener("pointermove", function (e) {
          var on = row.querySelector(".c.on"); if (!on) return;
          var r = on.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { on.style.transform = ""; return; }
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          on.style.transform = "perspective(1100px) rotateY(" + (px * 7).toFixed(2) + "deg) rotateX(" + (-py * 7).toFixed(2) + "deg)";
        });
        row.addEventListener("pointerleave", function () { var on = row.querySelector(".c.on"); if (on) on.style.transform = ""; });
      }
      // Moves on by itself every few seconds; pauses while someone is hovering, using the controls, or scrolled away.
      var paused = false, visible = true, lastTouch = 0;
      var hold = function () { lastTouch = Date.now(); };
      ["pointerenter", "focusin", "touchstart"].forEach(function (ev) { row.addEventListener(ev, function () { paused = true; hold(); }, { passive: true }); });
      ["pointerleave", "focusout"].forEach(function (ev) { row.addEventListener(ev, function () { paused = false; hold(); }); });
      ["prev", "next"].forEach(function (id) { var b = $(id); if (b) b.addEventListener("click", hold); });
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(row);
      setInterval(function () {
        var lb = $("lb");
        if (paused || !visible || document.hidden || (lb && lb.open) || Date.now() - lastTouch < 9000) return;
        step(1);
      }, 6500);
    }

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
