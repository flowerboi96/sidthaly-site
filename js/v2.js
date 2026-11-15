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
    var EASE = "cubic-bezier(.22,.7,.2,1)", DUR = 560;
    var render = function () {
      var n = list.length, k = Math.min(n, 5), start = -Math.floor((k - 1) / 2);
      var rowBox = row.getBoundingClientRect(), before = {};
      if (!reduce) Array.prototype.forEach.call(row.children, function (el) {
        var r = el.getBoundingClientRect(); before[el.getAttribute("data-i")] = { x: r.left, y: r.top, w: r.width, h: r.height, el: el };
      });
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
          var tag = document.createElement("span");   // name banner, shown over the selected painting
          tag.className = "tag"; tag.setAttribute("aria-hidden", "true"); tag.textContent = item.t;
          el.appendChild(tag);
          nodes[key] = el;
        }
        el.className = "c" + (d === 0 ? " on" : Math.abs(d) === 1 ? " d1" : "");
        el.setAttribute("data-step", String(d));
        el.style.transform = "";
        keep[key] = 1; want.push(el);
      }
      var leaving = [];
      Object.keys(nodes).forEach(function (key) { if (!keep[key]) { leaving.push(key); delete nodes[key]; } });
      Array.prototype.slice.call(row.children).forEach(function (el) { if (want.indexOf(el) < 0) row.removeChild(el); });
      want.forEach(function (el, idx) { if (row.children[idx] !== el) row.insertBefore(el, row.children[idx] || null); });
      if (!reduce && !firstRender && row.animate) {
        // Position and size move together on one timer (a "filmstrip" glide), so neighbouring cards never overlap.
        var slot = 0;
        if (want.length > 1) { var r0 = want[0].getBoundingClientRect(), r1 = want[1].getBoundingClientRect(); slot = r1.left - r0.left; }
        want.forEach(function (el) {
          var key = el.getAttribute("data-i"), r = el.getBoundingClientRect(), b0 = before[key];
          var from;
          if (b0) from = { x: b0.x, y: b0.y, s: b0.h / r.height };
          else from = { x: r.left + lastDir * slot, y: r.top, s: 1 };   // a new card slides in from just beyond the edge
          var dx = from.x - r.left, dy = from.y - r.top;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(from.s - 1) < 0.002) return;
          el.animate([{ transformOrigin: "0 0", transform: "translate(" + dx + "px," + dy + "px) scale(" + from.s + ")" },
                      { transformOrigin: "0 0", transform: "none" }], { duration: DUR, easing: EASE });
        });
        // the card leaving at the edge slides out the same way instead of vanishing
        leaving.forEach(function (key) {
          var b0 = before[key]; if (!b0) return;
          var g = b0.el; g.className = "c ghost"; g.style.transform = "";
          g.style.position = "absolute"; g.style.left = (b0.x - rowBox.left) + "px"; g.style.top = (b0.y - rowBox.top) + "px";
          g.style.width = b0.w + "px"; g.style.height = b0.h + "px"; g.style.margin = "0";
          row.appendChild(g);
          var an = g.animate([{ transform: "none", opacity: g.style.opacity || 0.6 }, { transform: "translateX(" + (-lastDir * slot) + "px)", opacity: 0.6 }], { duration: DUR, easing: EASE });
          an.onfinish = function () { if (g.parentNode) g.parentNode.removeChild(g); };
        });
        var on = row.querySelector(".c.on");
        if (on) { on.classList.remove("sweep"); void on.offsetWidth; on.classList.add("sweep"); }
        if (title) title.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
      }
      firstRender = false;
      if (title) title.textContent = list[active].t;
    };
    var step = function (s) { lastDir = s > 0 ? 1 : -1; active = ((active + s) % list.length + list.length) % list.length; render(); };
    // When the visitor changes painting themselves, the new painting's name banner shows for a few seconds.
    var tagTimer = null;
    var userStep = function (s) {
      step(s);
      var on = row.querySelector(".c.on"); if (!on) return;
      Array.prototype.forEach.call(row.querySelectorAll(".c.show"), function (c) { c.classList.remove("show"); });
      on.classList.add("show");
      clearTimeout(tagTimer);
      tagTimer = setTimeout(function () { on.classList.remove("show"); }, 3000);
    };

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
      // Moves on by itself every 5 seconds; pauses while someone is hovering, using the controls, or scrolled away.
      var paused = false, visible = true, lastTouch = 0;
      var hold = function () { lastTouch = Date.now(); };
      ["pointerenter", "focusin", "touchstart"].forEach(function (ev) { row.addEventListener(ev, function () { paused = true; hold(); }, { passive: true }); });
      ["pointerleave", "focusout"].forEach(function (ev) { row.addEventListener(ev, function () { paused = false; hold(); }); });
      ["edge-prev", "edge-next"].forEach(function (id) { var b = $(id); if (b) b.addEventListener("click", hold); });
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(row);
      setInterval(function () {
        var lb = $("lb");
        if (paused || !visible || document.hidden || (lb && lb.open) || Date.now() - lastTouch < 9000) return;
        step(1);
      }, 5000);
    }

    // arrows on the sides of the carousel
    if ($("edge-prev")) $("edge-prev").addEventListener("click", function () { userStep(-1); });
    if ($("edge-next")) $("edge-next").addEventListener("click", function () { userStep(1); });
    row.addEventListener("click", function (e) {
      var c = e.target.closest(".c");
      if (!c) return;
      var d = parseInt(c.getAttribute("data-step"), 10) || 0;
      if (d === 0) openBox(ALL.indexOf(list[active])); else userStep(d);
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
      setZoom(false);
      im.removeAttribute("srcset"); im.removeAttribute("sizes"); im.src = it.src; im.alt = it.alt;
      $("lb-t").textContent = it.t;
    }
    // tap or click the painting to see it at full size, then drag or scroll around it
    function setZoom(on, ev) {
      if (!box) return;
      var im = $("lb-img"), pane = box.querySelector(".lb-in"), r = im.getBoundingClientRect();
      var fx = ev ? (ev.clientX - r.left) / r.width : 0.5, fy = ev ? (ev.clientY - r.top) / r.height : 0.5;
      box.classList.toggle("zoom", on);
      if (on) {
        pane.scrollLeft = Math.max(0, im.offsetLeft + fx * im.offsetWidth - pane.clientWidth / 2);
        pane.scrollTop = Math.max(0, im.offsetTop + fy * im.offsetHeight - pane.clientHeight / 2);
      } else { pane.scrollLeft = 0; pane.scrollTop = 0; }
    }
    // remember whether the viewer was opened by keyboard, so a mouse or tap user doesn't get a focus ring when it closes
    var lastKey = false, openedByKey = false, lockY = 0;
    document.addEventListener("keydown", function () { lastKey = true; }, true);
    document.addEventListener("pointerdown", function () { lastKey = false; }, true);
    function lockPage(on) {
      var b = document.body;
      if (on) {
        lockY = window.scrollY || window.pageYOffset || 0;
        b.style.position = "fixed"; b.style.top = -lockY + "px"; b.style.left = "0"; b.style.right = "0"; b.style.width = "100%";
        document.documentElement.classList.add("lb-lock");
      } else {
        b.style.position = b.style.top = b.style.left = b.style.right = b.style.width = "";
        document.documentElement.classList.remove("lb-lock");
        window.scrollTo({ top: lockY, left: 0, behavior: "instant" });
      }
    }
    function openBox(i) {
      if (!box || typeof box.showModal !== "function") return;
      openedByKey = lastKey;
      showBox(i < 0 ? 0 : i);
      lockPage(true);
      box.showModal();
    }
    if (box) {
      $("lb-x").addEventListener("click", function () { box.close(); });
      $("lb-p").addEventListener("click", function () { showBox(boxI - 1); });
      $("lb-n").addEventListener("click", function () { showBox(boxI + 1); });
      $("lb-img").addEventListener("click", function (e) { setZoom(!box.classList.contains("zoom"), e); });
      box.addEventListener("close", function () {
        setZoom(false); lockPage(false);
        if (!openedByKey && document.activeElement && document.activeElement.blur) document.activeElement.blur();
      });
      box.addEventListener("click", function (e) { if (box.classList.contains("zoom")) return; if (e.target === box || e.target.classList.contains("lb-in")) box.close(); });
      // swipe left or right on a phone to change painting (when not zoomed in)
      var bx = null, by = null;
      box.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { bx = e.touches[0].clientX; by = e.touches[0].clientY; } else bx = null; }, { passive: true });
      box.addEventListener("touchend", function (e) {
        if (bx === null || box.classList.contains("zoom")) { bx = null; return; }
        var dx = e.changedTouches[0].clientX - bx, dy = e.changedTouches[0].clientY - by; bx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showBox(boxI + (dx < 0 ? 1 : -1));
      }, { passive: true });
      box.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") showBox(boxI - 1);
        if (e.key === "ArrowRight") showBox(boxI + 1);
      });
    }
    row.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); userStep(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); userStep(1); }
    });
    var x0 = null;
    row.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    row.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) userStep(dx < 0 ? 1 : -1);
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
