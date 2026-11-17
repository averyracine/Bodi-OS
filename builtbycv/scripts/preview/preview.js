(function () {
  var D = JSON.parse(document.getElementById("pv-data").textContent);
  var main = document.getElementById("main");
  var header = document.getElementById("pv-header");
  var menuSlot = document.getElementById("pv-menu-slot");
  var current = null;
  var menuOpen = false;

  var SOLID = "sticky top-0 z-50 transition-colors duration-300 border-b border-line bg-paper/95 text-ink backdrop-blur";
  var CLEAR = "sticky top-0 z-50 transition-colors duration-300 border-b border-transparent bg-transparent text-white";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /* ---------- Header ---------- */
  function paintHeader() {
    var clear = current === "home" && window.scrollY <= 40 && !menuOpen;
    var want = clear ? "clear" : "solid";
    if (header.dataset.variant !== want) {
      header.className = clear ? CLEAR : SOLID;
      header.innerHTML = clear ? D.headerHome : D.headerSolid;
      header.dataset.variant = want;
    }
    header.querySelectorAll("nav[aria-label=Main] a").forEach(function (a) {
      var r = a.getAttribute("href").slice(1);
      if (current === r || current.indexOf(r + "-") === 0) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var btn = header.querySelector("button[aria-controls=mobile-menu]");
    if (btn) {
      btn.setAttribute("aria-expanded", menuOpen ? "true" : "false");
      btn.querySelector(".sr-only").textContent = menuOpen ? "Close menu" : "Open menu";
      var path = btn.querySelector("path");
      if (path) path.setAttribute("d", menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 8h16M4 16h16");
    }
  }

  function setMenu(open) {
    menuOpen = open;
    header.dataset.variant = "";
    if (open) {
      var links = D.nav.map(function (n) {
        return '<li><a href="#' + n[1] + '" class="block py-4 font-serif text-2xl">' + esc(n[0]) + "</a></li>";
      }).join("");
      menuSlot.innerHTML =
        '<div id="mobile-menu" class="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-paper text-ink lg:hidden">' +
        '<nav aria-label="Mobile" class="container-x pb-28 pt-8"><ul class="divide-y divide-line border-y border-line">' + links + "</ul>" +
        '<div class="mt-8 grid gap-3"><a href="#contact" class="btn-primary">' + esc(D.cta) + '</a>' +
        '<a href="' + D.phoneHref + '" class="btn-ghost">Call ' + esc(D.phone) + '</a></div></nav></div>';
      var top = Math.max(0, header.getBoundingClientRect().bottom);
      menuSlot.firstChild.style.top = top + "px";
      document.body.style.overflow = "hidden";
    } else {
      menuSlot.innerHTML = "";
      document.body.style.overflow = "";
    }
    paintHeader();
  }

  /* ---------- Router ---------- */
  function show(name, scrollTo) {
    var tpl = document.getElementById("r-" + name);
    if (!tpl) return false;
    if (name !== current) {
      current = name;
      var isCrm = tpl.hasAttribute("data-crm");
      document.getElementById("pv-site").hidden = isCrm;
      document.getElementById("pv-crm").hidden = !isCrm;
      var target = isCrm ? document.getElementById("crm-main") : main;
      target.innerHTML = "";
      target.appendChild(tpl.content.cloneNode(true));
      document.title = D.titles[name] || "CV Capital";
      if (isCrm) { if (window.pvCrmWire) window.pvCrmWire(name, target); }
      else wire();
    }
    if (menuOpen) setMenu(false);
    header.dataset.variant = "";
    if (scrollTo) {
      var el = document.getElementById(scrollTo);
      if (el) { el.scrollIntoView({ block: "start" }); paintHeader(); return true; }
    }
    window.scrollTo(0, 0);
    paintHeader();
    return true;
  }

  function route() {
    var h = (location.hash || "").slice(1);
    if (!h) { show("home"); return; }
    if (!document.getElementById("r-" + h)) return; // in-page anchor, not a page
    show(h);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    var btn = e.target.closest("button[aria-controls=mobile-menu]");
    if (btn) { e.preventDefault(); setMenu(!menuOpen); return; }
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return;
    var target = href.slice(1);
    var scroll = a.getAttribute("data-scroll");
    if (document.getElementById("r-" + target)) {
      e.preventDefault();
      if (location.hash !== "#" + target) {
        try { history.pushState(null, "", "#" + target); } catch { location.hash = target; }
      }
      show(target, scroll);
    } else if (scroll || target) {
      var el = document.getElementById(scroll || target);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  window.addEventListener("scroll", function () { if (current === "home") paintHeader(); }, { passive: true });

  /* ---------- Page widgets ---------- */
  function wire() {
    main.querySelectorAll("input.ba-range").forEach(wireSlider);
    var calcSteps = main.querySelector('ol[aria-label="Calculator steps"]');
    if (calcSteps) wireCalculator(calcSteps.parentElement);
    var ef = main.querySelector("#ef-name");
    if (ef) wireEstimate(ef.closest("form"));
  }

  function wireSlider(input) {
    var box = input.parentElement;
    var clip = box.querySelector("div[style*=clip-path]");
    var line = box.querySelector("div[aria-hidden=true][style*=left]");
    input.addEventListener("input", function () {
      var v = Number(input.value);
      if (clip) clip.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
      if (line) line.style.left = v + "%";
      input.setAttribute("aria-valuetext", v + "% before");
    });
  }

  /* Price calculator: results are exported from src/content/pricing.ts by dump-content.ts */
  function calculate(p, finishKey) {
    return D.results[p.key][finishKey];
  }

  function wireCalculator(card) {
    var st = { step: 1, type: D.pricing[0].key, size: "", finish: "premium", zip: "", name: "" };
    var body = card.querySelector(".p-5");
    var steps = card.querySelectorAll("ol li");

    function paintSteps() {
      steps.forEach(function (li, i) {
        var on = st.step === i + 1;
        li.className = "px-2 py-3 " + (on ? "bg-sand-50 text-ink" : "text-muted");
        if (on) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
    }
    function pricingFor() { return D.pricing.filter(function (p) { return p.key === st.type; })[0]; }

    function step1() {
      var p = pricingFor();
      var opts = D.pricing.map(function (x) { return '<option value="' + x.key + '"' + (x.key === st.type ? " selected" : "") + ">" + esc(x.label) + "</option>"; }).join("");
      var sizes = p.sizes.map(function (s) {
        return '<label class="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-sand-50"><input type="radio" name="size" value="' + esc(s) + '"' + (st.size === s ? " checked" : "") + ' class="accent-[var(--color-accent)]"> ' + esc(s) + "</label>";
      }).join("");
      var fins = D.finishes.map(function (f) {
        return '<label class="flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-sand-50"><span class="flex items-center gap-2 font-medium"><input type="radio" name="finish" value="' + f.key + '"' + (st.finish === f.key ? " checked" : "") + ' class="accent-[var(--color-accent)]"> ' + esc(f.label) + '</span><span class="text-xs leading-snug text-muted">' + esc(f.description) + "</span></label>";
      }).join("");
      body.innerHTML =
        '<form class="grid gap-6" id="pv-calc1">' +
        '<div><label for="calc-type" class="label">Project type</label><select id="calc-type" class="field">' + opts + "</select></div>" +
        '<fieldset><legend class="label">' + esc(p.sizeLabel) + '</legend><div class="grid gap-2 sm:grid-cols-2">' + sizes + "</div></fieldset>" +
        '<fieldset><legend class="label">Finish level</legend><div class="grid gap-2 sm:grid-cols-3">' + fins + "</div></fieldset>" +
        '<div class="max-w-[12rem]"><label for="calc-zip" class="label">Project ZIP code</label><input id="calc-zip" class="field" inputmode="numeric" maxlength="5" value="' + esc(st.zip) + '"></div>' +
        '<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p class="text-sm text-muted">Takes about a minute. No obligation.</p><button class="btn-primary" id="pv-continue">Continue</button></div></form>';
      var form = body.querySelector("form");
      var cont = body.querySelector("#pv-continue");
      function check() { cont.disabled = !(st.size && /^\d{5}$/.test(st.zip)); }
      body.querySelector("#calc-type").addEventListener("change", function (e) { st.type = e.target.value; st.size = ""; step1(); });
      form.addEventListener("change", function (e) {
        if (e.target.name === "size") st.size = e.target.value;
        if (e.target.name === "finish") st.finish = e.target.value;
        check();
      });
      body.querySelector("#calc-zip").addEventListener("input", function (e) { e.target.value = e.target.value.replace(/\D/g, ""); st.zip = e.target.value; check(); });
      form.addEventListener("submit", function (e) { e.preventDefault(); if (!cont.disabled) { st.step = 2; render(); } });
      check();
    }

    function step2() {
      body.innerHTML =
        '<form class="grid gap-5" novalidate id="pv-calc2"><p class="text-stone">Where should we send your figure? We\'ll show it right here, and a project advisor may follow up. No spam, ever.</p>' +
        '<div class="grid gap-5 sm:grid-cols-3">' +
        '<div><label for="calc-name" class="label">Name</label><input id="calc-name" class="field" autocomplete="name"></div>' +
        '<div><label for="calc-phone" class="label">Phone</label><input id="calc-phone" type="tel" class="field" autocomplete="tel"></div>' +
        '<div><label for="calc-email" class="label">Email</label><input id="calc-email" type="email" class="field" autocomplete="email"></div></div>' +
        '<p role="alert" class="text-sm text-danger" id="pv-calc-err"></p>' +
        '<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" class="btn-ghost" id="pv-back">Back</button><button class="btn-primary">See my estimate</button></div></form>';
      body.querySelector("#pv-back").addEventListener("click", function () { st.step = 1; render(); });
      body.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var n = body.querySelector("#calc-name").value.trim();
        var ph = body.querySelector("#calc-phone").value.replace(/\D/g, "");
        var em = body.querySelector("#calc-email").value.trim();
        var err = n.length < 2 ? "Please enter your name." : ph.length < 10 ? "Please enter a valid phone number." : !/^\S+@\S+\.\S+$/.test(em) ? "Please enter a valid email." : "";
        body.querySelector("#pv-calc-err").textContent = err;
        if (err) return;
        st.name = n; st.step = 3; render();
      });
    }

    function step3() {
      var p = pricingFor();
      var r = calculate(p, st.finish);
      var fl = D.finishes.filter(function (x) { return x.key === st.finish; })[0].label;
      var n = Number(st.zip.slice(0, 3));
      var outside = !(n >= 850 && n <= 853);
      body.innerHTML =
        '<div tabindex="-1" class="outline-none" aria-live="polite" id="pv-result"><p class="eyebrow">' + esc(p.label) + " · " + esc(st.size) + " · " + esc(fl) + "</p>" +
        '<p class="mt-4 font-serif text-4xl font-light tracking-tight sm:text-5xl">' + esc(r.headline) + "</p>" +
        '<p class="mt-4 max-w-2xl text-stone">' + esc(r.detail) + "</p>" +
        (outside ? '<p class="mt-4 rounded-lg bg-sand-100 p-4 text-sm">ZIP ' + esc(st.zip) + " looks outside our usual Phoenix-metro service area. We'll confirm availability when we call.</p>" : "") +
        '<p class="mt-6 border-l-2 border-sand-400 pl-4 text-sm leading-relaxed text-muted">' + esc(D.disclaimer) + "</p>" +
        '<p class="pv-demo"><b>Preview:</b> on the live site this saves ' + esc(st.name) + " as a new lead in your CRM, emails you, and creates a \"Call new lead\" task for the next business day.</p>" +
        '<div class="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#contact" class="btn-primary">' + esc(D.cta) + '</a><button type="button" class="btn-ghost" id="pv-again">Price another project</button></div></div>';
      body.querySelector("#pv-again").addEventListener("click", function () { st.step = 1; st.size = ""; render(); });
      body.querySelector("#pv-result").focus({ preventScroll: true });
    }

    function render() { paintSteps(); if (st.step === 1) step1(); else if (st.step === 2) step2(); else step3(); }
    render();
  }

  function wireEstimate(form) {
    var file = form.querySelector("#ef-photos");
    if (file) file.addEventListener("change", function () {
      var msg = file.parentElement.querySelector("p[aria-live]");
      var n = Math.min(file.files.length, 6);
      if (msg) msg.textContent = n + " photo" + (n === 1 ? "" : "s") + " ready.";
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var get = function (id) { var el = form.querySelector("#ef-" + id); return el ? el.value.trim() : ""; };
      var fields = { name: get("name").length >= 2 ? "" : "Please enter your name",
        phone: get("phone").replace(/\D/g, "").length >= 10 ? "" : "Please enter a valid phone number",
        email: /^\S+@\S+\.\S+$/.test(get("email")) ? "" : "Please enter a valid email",
        zip: /^\d{5}$/.test(get("zip")) ? "" : "Please enter a 5-digit ZIP",
        projectType: get("projectType") ? "" : "Please choose a project type" };
      var bad = false;
      Object.keys(fields).forEach(function (k) {
        var el = form.querySelector("#ef-" + k);
        if (!el) return;
        var old = el.parentElement.querySelector(".pv-err");
        if (old) old.remove();
        el.setAttribute("aria-invalid", fields[k] ? "true" : "false");
        if (fields[k]) {
          bad = true;
          var p = document.createElement("p");
          p.className = "pv-err mt-1 text-sm text-danger";
          p.textContent = fields[k];
          el.insertAdjacentElement("afterend", p);
        }
      });
      if (bad) return;
      var card = document.createElement("div");
      card.className = "card p-8 outline-none sm:p-10";
      card.setAttribute("role", "status");
      card.tabIndex = -1;
      card.innerHTML = '<p class="eyebrow">Request received</p><h2 class="h3 mt-3">Thank you. We\'ll be in touch within one business day.</h2>' +
        '<p class="mt-4 text-stone">Need us sooner? Call (602) 743-6957, Monday–Friday, 8 AM–5 PM.</p>' +
        '<p class="pv-demo"><b>Preview:</b> on the live site this request, its photos and where the visitor came from land in your CRM, and you get an email right away.</p>';
      form.replaceWith(card);
      card.focus();
    });
  }

  route();
})();
