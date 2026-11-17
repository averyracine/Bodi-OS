(function () {
  var crm = document.getElementById("pv-crm");
  var toastEl = document.getElementById("pv-toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 2600);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function nowLabel() {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Phoenix", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());
  }

  /* Navigation highlight */
  function markNav(name) {
    crm.querySelectorAll("aside a[href^='#crm'], nav[aria-label=CRM] a[href^='#crm']").forEach(function (a) {
      var r = a.getAttribute("href").slice(1);
      var on = r === "crm" ? name === "crm" : (name === r || name.indexOf(r + "-") === 0);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* Every CRM form: handle in the page, never submit */
  crm.addEventListener("submit", function (e) {
    var form = e.target;
    e.preventDefault();
    var body = form.querySelector("textarea[name=body]");
    var title = form.querySelector("input[name=title]");
    if (form.closest("aside") && /sign out/i.test(form.textContent)) { location.hash = "home"; return; }
    if (body && body.value.trim()) return addNote(form, body.value.trim());
    if (title && form.querySelector("input[name=dueDate]") && title.value.trim()) return addTask(form, title.value.trim(), form.querySelector("input[name=dueDate]").value);
    if ((form.getAttribute("method") || "").toLowerCase() !== "post" && form.querySelector("input[name=q]")) { toast("Search works in the live CRM"); return; }
    toast("Saved (demo: changes aren't stored)");
  }, true);

  function addNote(form, text) {
    var panel = form.closest("section") || form.parentElement;
    var list = panel.querySelector("ol") || panel.querySelector("ul");
    var li = document.createElement("li");
    if (list && list.tagName === "OL") {
      li.className = "relative pb-5";
      li.innerHTML = '<span aria-hidden="true" class="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"></span>' +
        '<p class="text-xs text-muted"><span class="font-medium uppercase tracking-wider">Note</span> · ' + esc(nowLabel()) + ' · Noah Burris</p>' +
        '<p class="mt-1 whitespace-pre-wrap text-sm rounded-lg bg-sand-50 p-3">' + esc(text) + "</p>";
    } else {
      li.className = "rounded-lg bg-sand-50 p-3 text-sm";
      li.innerHTML = '<p class="whitespace-pre-wrap">' + esc(text) + '</p><p class="mt-1 text-xs text-muted">' + esc(nowLabel()) + " · Noah Burris</p>";
    }
    if (list) list.insertBefore(li, list.firstChild);
    form.reset();
    toast("Note added (demo)");
  }

  function addTask(form, text, due) {
    var panel = form.closest("section") || form.parentElement;
    var list = panel.querySelector("ul.divide-y");
    var empty = panel.querySelector("p.border-dashed");
    if (!list) {
      list = document.createElement("ul");
      list.className = "divide-y divide-line";
      (empty || form).insertAdjacentElement("afterend", list);
      if (empty) empty.remove();
    }
    var d = due ? new Date(due + "T12:00:00Z") : null;
    var label = d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d) : "";
    var li = document.createElement("li");
    li.className = "flex items-start gap-3 py-3";
    li.innerHTML = '<input type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]" aria-label="Mark ' + esc(text) + ' done">' +
      '<div class="min-w-0 flex-1"><p class="text-sm">' + esc(text) + '</p><p class="mt-0.5 text-xs text-muted">' + (label ? "Due " + esc(label) : "") + "</p></div>";
    list.insertBefore(li, list.firstChild);
    form.reset();
    toast("Task added (demo)");
  }

  /* Task checkboxes */
  crm.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches("input[type=checkbox]") && t.closest("li")) {
      var p = t.closest("li").querySelector("p");
      if (p) {
        p.classList.toggle("line-through", t.checked);
        p.classList.toggle("text-muted", t.checked);
      }
      toast(t.checked ? "Task completed (demo)" : "Task reopened (demo)");
    }
    if (t.matches("input[type=file]")) { toast("Photos upload from your phone in the live CRM"); t.value = ""; }
  });

  /* Lead status buttons */
  crm.addEventListener("click", function (e) {
    var b = e.target.closest("[role=group][aria-label='Lead status'] button");
    if (!b) return;
    b.parentElement.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    toast("Status set to " + b.textContent.trim() + " (demo)");
  });

  /* Pipeline board */
  function wirePipeline(root) {
    var sections = Array.prototype.slice.call(root.querySelectorAll("section[aria-label]")).filter(function (s) { return s.querySelector("ul"); });
    if (!sections.length) return;
    var dragged = null;

    function cardValue(li) {
      var spans = li.querySelectorAll("p span");
      var v = spans.length ? spans[spans.length - 1].textContent.replace(/[^0-9]/g, "") : "";
      return v ? Number(v) : 0;
    }
    function refresh() {
      sections.forEach(function (sec) {
        var cards = sec.querySelectorAll("ul > li");
        var sum = 0; cards.forEach(function (c) { sum += cardValue(c); });
        var count = sec.querySelector("header h2 span"); if (count) count.textContent = cards.length;
        var total = sec.querySelector("header > span"); if (total) total.textContent = money(sum);
      });
      paintMobile();
    }
    function moveTo(li, sec) {
      var from = li.closest("section").getAttribute("aria-label");
      sec.querySelector("ul").appendChild(li);
      refresh();
      if (from !== sec.getAttribute("aria-label")) toast("Moved to " + sec.getAttribute("aria-label") + " (demo)");
    }

    sections.forEach(function (sec) {
      var ul = sec.querySelector("ul");
      ul.querySelectorAll("li").forEach(function (li) {
        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", function (e) { dragged = li; li.style.opacity = "0.4"; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "card"); } catch (x) {} });
        li.addEventListener("dragend", function () { li.style.opacity = ""; dragged = null; sections.forEach(function (s) { s.classList.remove("ring-2", "ring-accent/40"); }); });
      });
      sec.addEventListener("dragover", function (e) { if (dragged) { e.preventDefault(); sec.classList.add("ring-2", "ring-accent/40"); } });
      sec.addEventListener("dragleave", function (e) { if (!sec.contains(e.relatedTarget)) sec.classList.remove("ring-2", "ring-accent/40"); });
      sec.addEventListener("drop", function (e) { e.preventDefault(); sec.classList.remove("ring-2", "ring-accent/40"); if (dragged) moveTo(dragged, sec); });
    });

    Array.prototype.forEach.call(root.querySelectorAll("p"), function (tip) {
      if (/^Tip:/.test(tip.textContent.trim())) tip.textContent = "Tip: drag cards between columns to change a project's stage.";
    });

    /* Phone view: rebuilt from the board so both stay in sync */
    var pick = root.querySelector("#stage-pick");
    var mlist = pick ? pick.parentElement.querySelector("ul") : null;
    function paintMobile() {
      if (!pick || !mlist) return;
      var idx = pick.selectedIndex;
      Array.prototype.forEach.call(pick.options, function (o, i) {
        var sec = sections[i]; if (!sec) return;
        var cards = sec.querySelectorAll("ul > li"); var sum = 0; cards.forEach(function (c) { sum += cardValue(c); });
        o.textContent = sec.getAttribute("aria-label") + " (" + cards.length + ") · " + money(sum);
      });
      var sec = sections[idx];
      var cards = sec ? sec.querySelectorAll("ul > li") : [];
      var opts = sections.map(function (s, i) { return '<option value="' + i + '"' + (i === idx ? " selected" : "") + ">" + esc(s.getAttribute("aria-label")) + "</option>"; }).join("");
      mlist.innerHTML = cards.length ? "" : '<li class="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No projects in this stage.</li>';
      Array.prototype.forEach.call(cards, function (c, ci) {
        var li = document.createElement("li");
        li.className = "card p-4";
        li.innerHTML = c.innerHTML + '<label class="mt-3 flex items-center gap-2 text-sm"><span class="text-muted">Move to</span><select class="field min-h-10 flex-1 py-2 text-sm">' + opts + "</select></label>";
        li.querySelector("select").addEventListener("change", function (e) { moveTo(c, sections[Number(e.target.value)]); });
        mlist.appendChild(li);
      });
    }
    if (pick) pick.addEventListener("change", paintMobile);
    refresh();
  }

  window.pvCrmWire = function (name, root) {
    markNav(name);
    window.scrollTo(0, 0);
    wirePipeline(root);
  };
})();
