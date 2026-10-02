(function () {
  "use strict";

  var BASE = new URL(".", document.currentScript.src).href;
  var root = document.documentElement;
  var NAV = [
    { path: "profile/index.html", label: "Profile" },
    { path: "index.html", label: "Home" },
    { path: "nutrition/index.html", label: "Nutrition" },
    { path: "planner/index.html", label: "Planner" },
    { path: "history/index.html", label: "History" },
    { path: "index.html#calculators", label: "Tools" }
  ];
  var TOOLS = [
    ["bmi/", "BMI"], ["bmr/", "BMR"], ["calories/", "Calories"], ["macro/", "Macros"],
    ["bodyfat/", "Body fat"], ["protein/", "Protein"], ["idealweight/", "Healthy weight"],
    ["water/", "Water"], ["sleep/", "Sleep"], ["maxhr/", "Heart rate"],
    ["steptocalories/", "Step calories"], ["exercisecalories/", "Workout calories"],
    ["resttimer/", "Rest timer"]
  ];
  var ICONS = {
    Home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    Nutrition: '<path d="M4 4v6a3 3 0 0 0 6 0V4M7 4v16M17 4v16m0-16c2 2 3 5 3 8h-3"/>',
    Planner: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    History: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/>',
    Profile: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>'
  };
  function normalizedPath(url) {
    var path = url.pathname.replace(/index\.html$/, "").replace(/\/$/, "");
    return path || "/";
  }
  var currentPath = normalizedPath(new URL(window.location.href));
  function navAnchor(item, className) {
    var url = new URL(item.path, BASE);
    var active = item.label === "Tools" ? !!document.body.dataset.calc : normalizedPath(url) === currentPath;
    return '<a class="' + className + (active ? " active" : "") + '" href="' + url.href + '"' +
      (active ? ' aria-current="page"' : "") + '>' + item.label + '</a>';
  }
  var desktopNav = document.querySelector(".desktop-nav");
  if (desktopNav) desktopNav.innerHTML = NAV.map(function (item) { return navAnchor(item, ""); }).join("");

  var mobileMenu = document.getElementById("mobile-menu");
  var hamburger = document.getElementById("hamburger-btn");
  if (mobileMenu) {
    mobileMenu.innerHTML = '<span class="mobile-menu-heading">FitCalc</span>' +
      NAV.map(function (item) { return navAnchor(item, ""); }).join("") +
      '<span class="mobile-menu-heading">Calculators</span><div class="mobile-tool-list">' +
      TOOLS.map(function (tool) {
        return '<a href="' + new URL(tool[0], BASE).href + '">' + tool[1] + '</a>';
      }).join("") + '</div>';
  }

  function closeMenu(returnFocus) {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove("open");
    mobileMenu.hidden = true;
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
    if (returnFocus) hamburger.focus();
  }
  if (mobileMenu && hamburger) {
    hamburger.addEventListener("click", function () {
      var open = hamburger.getAttribute("aria-expanded") !== "true";
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.hidden = !open;
      mobileMenu.classList.toggle("open", open);
      if (open) {
        var firstLink = mobileMenu.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      }
    });
    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("click", function (event) {
      if (hamburger.getAttribute("aria-expanded") === "true" &&
          !mobileMenu.contains(event.target) && !hamburger.contains(event.target)) closeMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && hamburger.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
  }

  var storedPreferences = typeof readJSON === "function" ? readJSON(PREFERENCES_KEY, {}) : {};
  var initialTheme = storedPreferences && storedPreferences.theme === "light" ? "light" : "dark";
  root.dataset.theme = initialTheme;
  function syncThemeButton(button) {
    var light = root.dataset.theme === "light";
    button.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    button.title = light ? "Switch to dark theme" : "Switch to light theme";
    button.innerHTML = light
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.7 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';
  }
  document.querySelectorAll(".theme-toggle").forEach(function (button) {
    syncThemeButton(button);
    button.addEventListener("click", function () {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      syncThemeButton(button);
      if (typeof writeJSON === "function") {
        try { writeJSON(PREFERENCES_KEY, Object.assign({}, storedPreferences, { theme: root.dataset.theme })); }
        catch (error) { /* Storage failure is already announced by store.js. */ }
      }
    });
  });

  var mobileNav = document.createElement("nav");
  mobileNav.className = "bottom-nav";
  mobileNav.setAttribute("aria-label", "Primary navigation");
  var primaryItems = NAV.slice(0, 5);
  mobileNav.innerHTML = primaryItems.map(function (item) {
    var url = new URL(item.path, BASE);
    var active = normalizedPath(url) === currentPath;
    var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[item.label] + '</svg>';
    return '<a class="mobile-tab' + (active ? " active" : "") + '" href="' + url.href + '"' +
      (active ? ' aria-current="page"' : "") + '>' + icon + '<span>' + item.label + '</span></a>';
  }).join("");
  document.body.appendChild(mobileNav);

  function ensureToast() {
    var toast = document.getElementById("fitcalc-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "fitcalc-toast";
      toast.className = "fitcalc-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.hidden = true;
      document.body.appendChild(toast);
    }
    return toast;
  }
  window.fitcalcToast = function (message, kind) {
    var toast = ensureToast();
    toast.textContent = String(message || "");
    toast.dataset.kind = kind || "info";
    toast.hidden = false;
    window.clearTimeout(toast.hideTimer);
    toast.hideTimer = window.setTimeout(function () { toast.hidden = true; }, 4200);
  };

  var dialog;
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "fitcalc-dialog";
    dialog.setAttribute("aria-labelledby", "fitcalc-dialog-title");
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog && dialog.open) dialog.close("cancel");
    });
    document.body.appendChild(dialog);
    return dialog;
  }
  function showDialog(options) {
    var settings = options || {};
    var modal = ensureDialog();
    var form = document.createElement("form");
    form.className = "fitcalc-dialog-content";
    form.method = "dialog";
    var title = document.createElement("h2");
    title.id = "fitcalc-dialog-title";
    title.textContent = settings.title || "FitCalc";
    form.appendChild(title);
    if (settings.message) {
      var message = document.createElement("p");
      message.textContent = settings.message;
      form.appendChild(message);
    }
    var input;
    if (settings.prompt) {
      var field = document.createElement("div");
      field.className = "field";
      var label = document.createElement("label");
      label.textContent = settings.label || "Value";
      input = document.createElement("input");
      input.type = settings.type === "number" ? "number" : "text";
      if (settings.type === "number") input.step = "any";
      input.inputMode = settings.inputMode || (settings.type === "number" ? "decimal" : "text");
      input.autocomplete = "off";
      input.value = settings.value || "";
      input.required = !!settings.required;
      label.htmlFor = "fitcalc-dialog-input";
      input.id = "fitcalc-dialog-input";
      field.append(label, input);
      form.appendChild(field);
    }
    var actions = document.createElement("div");
    actions.className = "fitcalc-dialog-actions";
    if (settings.cancel !== false) {
      var cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "secondary-btn";
      cancel.textContent = settings.cancelLabel || "Cancel";
      cancel.addEventListener("click", function () { modal.close("cancel"); });
      actions.appendChild(cancel);
    }
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "primary-btn";
    submit.value = "confirm";
    submit.textContent = settings.confirmLabel || "Continue";
    actions.appendChild(submit);
    form.appendChild(actions);
    modal.replaceChildren(form);
    modal.returnValue = "";
    return new Promise(function (resolve) {
      function finish() {
        modal.removeEventListener("close", finish);
        resolve(modal.returnValue === "confirm" ? (input ? input.value : true) : (settings.prompt ? null : false));
      }
      modal.addEventListener("close", finish);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (input && !input.reportValidity()) return;
        modal.close("confirm");
      });
      modal.showModal();
      window.setTimeout(function () { (input || submit).focus(); }, 0);
    });
  }
  window.fitcalcDialog = {
    alert: function (message, title) { return showDialog({ title: title || "A quick note", message: message, cancel: false, confirmLabel: "Got it" }); },
    confirm: function (message, title, confirmLabel) { return showDialog({ title: title || "Please confirm", message: message, confirmLabel: confirmLabel || "Confirm" }); },
    prompt: function (options) { return showDialog(Object.assign({ prompt: true }, options || {})); }
  };

  window.addEventListener("fitcalc:storage-error", function () {
    var notice = document.getElementById("fitcalc-storage-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "fitcalc-storage-notice";
      notice.className = "storage-notice";
      notice.setAttribute("role", "alert");
      notice.setAttribute("aria-live", "assertive");
      document.body.appendChild(notice);
    }
    notice.textContent = "FitCalc could not save this change. Check browser storage and try again.";
    notice.hidden = false;
    window.clearTimeout(notice.hideTimer);
    notice.hideTimer = window.setTimeout(function () { notice.hidden = true; }, 6000);
  });

  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    navigator.serviceWorker.register(new URL("service-worker.js", BASE).href).catch(function () {});
  }
})();
