(function () {
  const STORAGE_KEY_ALL = "important-days-all";
  const STORAGE_KEY_LEGACY = "important-days-custom";
  const TYPE_ANNIVERSARY = "纪念日";
  const TYPE_FUTURE = "未来";

  var BUILTIN_IDS = { london: "london", together: "together", known: "known", birthday: "birthday" };
  var BUILTIN_DEFAULTS = [
    { id: "london", title: "来伦敦", date: "2026-02-17", type: TYPE_FUTURE, builtIn: true },
    { id: "together", title: "纪念日", date: "2025-01-23", type: TYPE_ANNIVERSARY, builtIn: true },
    { id: "known", title: "第一次相遇", date: "2024-12-13", type: TYPE_ANNIVERSARY, builtIn: true },
    { id: "birthday", title: "她的生日", date: "2024-12-26", type: TYPE_FUTURE, builtIn: true, recurring: true },
  ];

  var shareKey = (function () {
    var p = new URLSearchParams(window.location.search);
    return (p.get("k") || "").trim();
  })();
  var sharedEventsCache = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function randomShareId() {
    var s = "abcdefghijklmnopqrstuvwxyz0123456789";
    var id = "";
    for (var i = 0; i < 14; i++) id += s[Math.floor(Math.random() * s.length)];
    return id;
  }

  function getEvents() {
    if (shareKey && sharedEventsCache) return sharedEventsCache;
    var raw = localStorage.getItem(STORAGE_KEY_ALL);
    var list = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {}
    }
    if (list.length === 0) {
      list = BUILTIN_DEFAULTS.slice();
      var legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
      if (legacy) {
        try {
          var custom = JSON.parse(legacy);
          var now = new Date();
          custom.forEach(function (ev) {
            if (!ev.id || ev.id.indexOf("id-") !== 0) return;
            if (!ev.type) ev.type = new Date(ev.date) > now ? TYPE_FUTURE : TYPE_ANNIVERSARY;
            list.push(ev);
          });
        } catch (e) {}
      }
      saveEvents(list);
      return list;
    }
    var ids = {};
    list.forEach(function (ev) { ids[ev.id] = true; });
    BUILTIN_DEFAULTS.forEach(function (def) {
      if (!ids[def.id]) list.push(def);
    });
    saveEvents(list);
    return list;
  }

  function saveEvents(events) {
    if (shareKey) {
      sharedEventsCache = events;
      syncToServer(events);
    }
    localStorage.setItem(STORAGE_KEY_ALL, JSON.stringify(events));
  }

  function syncToServer(events) {
    if (!shareKey) return;
    var url = "/api/data?k=" + encodeURIComponent(shareKey);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: events }),
    }).catch(function () {});
  }

  function getNextBirthdayFrom(dateStr) {
    var d = new Date(dateStr);
    var month = d.getMonth();
    var day = d.getDate();
    var now = new Date();
    var next = new Date(now.getFullYear(), month, day);
    if (next <= now) next = new Date(now.getFullYear() + 1, month, day);
    return next;
  }

  function diffInDays(from, to) {
    var a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    var b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
  }

  function formatDateDisplay(d, recurring) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    if (recurring) return m + "月" + day + "日";
    var y = d.getFullYear();
    return y + "年" + m + "月" + day + "日";
  }

  function dateToInputValue(dateStr) {
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function orderFuture(a, b) {
    var o = { london: 0, birthday: 1 };
    var ao = o[a.id] !== undefined ? o[a.id] : 2;
    var bo = o[b.id] !== undefined ? o[b.id] : 2;
    return ao - bo;
  }

  function orderAnniversary(a, b) {
    var o = { together: 0, known: 1 };
    var ao = o[a.id] !== undefined ? o[a.id] : 2;
    var bo = o[b.id] !== undefined ? o[b.id] : 2;
    return ao - bo;
  }

  function getCountdownTarget(ev) {
    if (ev.recurring) return getNextBirthdayFrom(ev.date);
    return new Date(ev.date);
  }

  function renderCard(ev, container, isFirstFuture) {
    var card = document.createElement("section");
    card.className = "card user-card" + (isFirstFuture ? " card-hero" : "");
    card.dataset.id = ev.id;
    if (ev.recurring) card.dataset.recurring = "true";
    if (ev.recurring) card.dataset.date = ev.date;

    var dateObj = new Date(ev.date);
    var isFuture = ev.type === TYPE_FUTURE;
    var dateStr = formatDateDisplay(dateObj, ev.recurring);
    var targetDate = isFuture ? getCountdownTarget(ev) : null;
    var targetStr = targetDate ? targetDate.toISOString().slice(0, 10) : "";

    var countdownHtml = isFuture
      ? '<div class="countdown countdown-user" data-target="' + (ev.recurring ? "" : ev.date) + '" data-recurring="' + (ev.recurring ? "1" : "") + '" data-date="' + (ev.recurring ? ev.date : "") + '">' +
        '<div class="countdown-item"><span class="countdown-num countdown-days">--</span><span class="countdown-unit">天</span></div>' +
        '<div class="countdown-item"><span class="countdown-num countdown-hours">--</span><span class="countdown-unit">时</span></div>' +
        '<div class="countdown-item"><span class="countdown-num countdown-mins">--</span><span class="countdown-unit">分</span></div>' +
        '<div class="countdown-item"><span class="countdown-num countdown-secs">--</span><span class="countdown-unit">秒</span></div></div>'
      : '<div class="stat"><span class="stat-num stat-days">--</span><span class="stat-unit">天</span></div>';

    var hintHtml = ev.recurring ? '<p class="card-hint card-hint-recurring"></p>' : "";

    card.innerHTML =
      '<div class="card-actions">' +
        '<button type="button" class="card-edit" aria-label="编辑">编辑</button>' +
        '<button type="button" class="card-remove" aria-label="删除">×</button>' +
      '</div>' +
      '<h2 class="card-title">' + escapeHtml(ev.title) + "</h2>" +
      '<p class="card-date">' + dateStr + "</p>" +
      countdownHtml +
      hintHtml;

    card.querySelector(".card-remove").addEventListener("click", function () {
      removeEvent(ev.id);
    });
    card.querySelector(".card-edit").addEventListener("click", function () {
      startEdit(ev);
    });
    container.appendChild(card);
  }

  function renderAllCards() {
    var events = getEvents();
    var futureEl = document.getElementById("user-cards-future");
    var anniversaryEl = document.getElementById("user-cards-anniversary");
    futureEl.innerHTML = "";
    anniversaryEl.innerHTML = "";

    var futureList = events.filter(function (ev) { return ev.type === TYPE_FUTURE; }).sort(orderFuture);
    var anniversaryList = events.filter(function (ev) { return ev.type === TYPE_ANNIVERSARY; }).sort(orderAnniversary);

    futureList.forEach(function (ev, i) {
      renderCard(ev, futureEl, i === 0);
    });
    anniversaryList.forEach(function (ev) {
      renderCard(ev, anniversaryEl, false);
    });
  }

  function updateCountdowns() {
    var now = new Date();
    document.querySelectorAll(".countdown-user").forEach(function (el) {
      var target;
      if (el.dataset.recurring === "1" && el.dataset.date) {
        target = getNextBirthdayFrom(el.dataset.date);
      } else if (el.dataset.target) {
        target = new Date(el.dataset.target);
      } else {
        return;
      }
      if (now >= target) {
        el.querySelector(".countdown-days").textContent = "0";
        el.querySelector(".countdown-hours").textContent = "00";
        el.querySelector(".countdown-mins").textContent = "00";
        el.querySelector(".countdown-secs").textContent = "00";
        return;
      }
      var ms = target - now;
      el.querySelector(".countdown-days").textContent = Math.floor(ms / (1000 * 60 * 60 * 24));
      el.querySelector(".countdown-hours").textContent = pad(Math.floor((ms / (1000 * 60 * 60)) % 24));
      el.querySelector(".countdown-mins").textContent = pad(Math.floor((ms / (1000 * 60)) % 60));
      el.querySelector(".countdown-secs").textContent = pad(Math.floor((ms / 1000) % 60));
    });

    document.querySelectorAll(".user-card .stat-days").forEach(function (el) {
      var card = el.closest(".user-card");
      var id = card.dataset.id;
      var events = getEvents();
      var ev = events.find(function (e) { return e.id === id; });
      if (!ev) return;
      var target = new Date(ev.date);
      var days = diffInDays(target, now);
      el.textContent = days >= 0 ? days : "0";
    });

    document.querySelectorAll(".card-hint-recurring").forEach(function (el) {
      var card = el.closest(".user-card");
      if (!card || !card.dataset.date) return;
      var next = getNextBirthdayFrom(card.dataset.date);
      var hint = next.getFullYear() === now.getFullYear() ? "今年" : "明年";
      el.textContent = hint + " " + next.getFullYear() + " 年 " + (next.getMonth() + 1) + " 月 " + next.getDate() + " 日";
    });
  }

  function addEvent(title, dateStr, type) {
    var events = getEvents();
    events.push({ id: "id-" + Date.now(), title: title, date: dateStr, type: type });
    saveEvents(events);
    renderAllCards();
    updateCountdowns();
  }

  function updateEvent(id, title, dateStr, type) {
    var events = getEvents();
    var idx = events.findIndex(function (e) { return e.id === id; });
    if (idx === -1) return;
    var ev = events[idx];
    events[idx] = {
      id: ev.id,
      title: title,
      date: dateStr,
      type: type,
      builtIn: ev.builtIn,
      recurring: ev.recurring,
    };
    saveEvents(events);
    cancelEdit();
    renderAllCards();
    updateCountdowns();
  }

  function removeEvent(id) {
    var events = getEvents().filter(function (e) { return e.id !== id; });
    saveEvents(events);
    renderAllCards();
    if (document.getElementById("edit-id").value === id) cancelEdit();
  }

  function startEdit(ev) {
    document.getElementById("edit-id").value = ev.id;
    document.getElementById("add-title").value = ev.title;
    document.getElementById("add-date").value = dateToInputValue(ev.date);
    var typeRadio = document.querySelector('input[name="add-type"][value="' + ev.type + '"]');
    if (typeRadio) typeRadio.checked = true;
    document.getElementById("add-form-title").textContent = "编辑时间点";
    document.getElementById("add-submit-btn").textContent = "保存";
    document.getElementById("add-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    document.getElementById("edit-id").value = "";
    document.getElementById("add-title").value = "";
    document.getElementById("add-date").value = "";
    var futureRadio = document.querySelector('input[name="add-type"][value="未来"]');
    if (futureRadio) futureRadio.checked = true;
    document.getElementById("add-form-title").textContent = "添加时间点";
    document.getElementById("add-submit-btn").textContent = "添加";
  }

  document.getElementById("add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = document.getElementById("add-title").value.trim();
    var date = document.getElementById("add-date").value;
    var typeEl = document.querySelector('input[name="add-type"]:checked');
    var type = typeEl ? typeEl.value : TYPE_FUTURE;
    var editId = document.getElementById("edit-id").value;
    if (!title || !date) return;
    if (editId) {
      updateEvent(editId, title, date, type);
    } else {
      addEvent(title, date, type);
    }
    cancelEdit();
  });

  function showGenerateLinkUI() {
    document.getElementById("share-banner").style.display = "block";
    document.getElementById("share-link-bar").style.display = "none";
    document.getElementById("share-generate-btn").onclick = function () {
      var k = randomShareId();
      window.location.href = window.location.pathname + "?k=" + k;
    };
  }

  function showShareLinkBar() {
    document.getElementById("share-banner").style.display = "none";
    var bar = document.getElementById("share-link-bar");
    bar.style.display = "flex";
    var fullUrl = window.location.origin + window.location.pathname + "?k=" + shareKey;
    document.getElementById("share-link-input").value = fullUrl;
    document.getElementById("share-copy-btn").onclick = function () {
      var input = document.getElementById("share-link-input");
      input.select();
      input.setSelectionRange(0, 99999);
      try {
        document.execCommand("copy");
      } catch (e) {}
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl);
      }
    };
  }

  function startWithShared() {
    showShareLinkBar();
    var url = "/api/data?k=" + encodeURIComponent(shareKey);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var list = (data && data.events && data.events.length) ? data.events : BUILTIN_DEFAULTS.slice();
        var ids = {};
        list.forEach(function (ev) { ids[ev.id] = true; });
        BUILTIN_DEFAULTS.forEach(function (def) {
          if (!ids[def.id]) list.push(def);
        });
        sharedEventsCache = list;
        saveEvents(list);
        renderAllCards();
        updateCountdowns();
        setInterval(updateCountdowns, 1000);
      })
      .catch(function () {
        sharedEventsCache = BUILTIN_DEFAULTS.slice();
        saveEvents(sharedEventsCache);
        renderAllCards();
        updateCountdowns();
        setInterval(updateCountdowns, 1000);
      });
  }

  if (!shareKey) {
    showGenerateLinkUI();
    renderAllCards();
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  } else {
    startWithShared();
  }
})();
