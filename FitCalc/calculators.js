// FitCalc — calculator logic
// Each page sets <body data-calc="slug">; this file wires up that page's form.

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function num(id) { var el = $(id); if (!el) return NaN; return parseFloat(el.value); }
  function checkedVal(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function round(n, d) {
    if (d === undefined) d = 1;
    var f = Math.pow(10, d);
    return Math.round(n * f) / f;
  }

  function showResult(html) {
    var empty = $("result-empty");
    var content = $("result-content");
    if (empty) empty.hidden = true;
    if (content) { content.hidden = false; content.innerHTML = html; }
  }
  function showError(msg) {
    var empty = $("result-empty");
    var content = $("result-content");
    if (content) content.hidden = true;
    if (empty) {
      empty.hidden = false;
      empty.replaceChildren();
      var message = document.createElement("p");
      message.className = "result-error";
      message.setAttribute("role", "alert");
      message.textContent = msg;
      empty.appendChild(message);
    }
  }

  function headline(value, unit, tagText, tagClass) {
    return (
      '<div class="result-headline"><strong>' + value + "</strong><span>" + unit + "</span></div>" +
      '<span class="result-tag ' + tagClass + '">' + tagText + "</span>"
    );
  }
  function row(label, value) {
    return '<div class="row"><span>' + label + "</span><b>" + value + "</b></div>";
  }
  function rows(items) {
    return '<div class="result-rows">' + items.join("") + "</div>";
  }
  function bar(pct, color, label, valueText) {
    return (
      '<div class="result-bar-wrap"><div class="row"><span>' + label + '</span><b>' + valueText + '</b></div>' +
      '<div class="result-bar"><i style="width:' + Math.min(100, Math.max(0, pct)) + '%;background:' + color + '"></i></div></div>'
    );
  }

  function onSubmit(fn) {
    var form = $("calc-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      try { fn(); } catch (err) { showError("check your inputs and try again"); }
    });
  }

  var calculators = {

    // ---------------- BMI ----------------
    bmi: function () {
      onSubmit(function () {
        var h = num("height"), w = num("weight");
        if (!h || !w || h <= 0 || w <= 0) return showError("enter height and weight");
        var m = h / 100;
        var bmi = w / (m * m);
        var cat, cls;
        if (bmi < 18.5) { cat = "underweight"; cls = "warn"; }
        else if (bmi < 25) { cat = "normal"; cls = "ok"; }
        else if (bmi < 30) { cat = "overweight"; cls = "warn"; }
        else { cat = "obese"; cls = "err"; }
        var lo = round(18.5 * m * m, 1), hi = round(24.9 * m * m, 1);
        showResult(
          headline(round(bmi, 1), "kg/m²", cat, cls) +
          rows([
            row("category", cat),
            row("healthy weight range", lo + " – " + hi + " kg"),
            row("height used", h + " cm")
          ])
        );
      });
    },

    // ---------------- Calories / TDEE ----------------
    calories: function () {
      onSubmit(function () {
        var age = num("age"), h = num("height"), w = num("weight");
        var sex = checkedVal("sex");
        var activity = $("activity") ? parseFloat($("activity").value) : NaN;
        var goal = $("goal") ? $("goal").value : "maintain";
        if (!age || !h || !w || !sex || !activity) return showError("fill in every field");
        var bmr = sex === "m" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
        var tdee = bmr * activity;
        var target = tdee;
        var goalLabel = "maintain weight";
        if (goal === "lose") { target = Math.max(tdee - 500, sex === "m" ? 1500 : 1200); goalLabel = "lose ~0.5kg/week"; }
        if (goal === "gain") { target = tdee + 300; goalLabel = "gain ~0.25kg/week"; }
        showResult(
          headline(Math.round(target), "kcal / day", goalLabel, "ok") +
          rows([
            row("bmr (resting)", Math.round(bmr) + " kcal"),
            row("maintenance tdee", Math.round(tdee) + " kcal"),
            row("goal calories", Math.round(target) + " kcal")
          ])
        );
      });
    },

    // ---------------- Body Fat (US Navy method) ----------------
    bodyfat: function () {
      var sexRadios = document.querySelectorAll('input[name="sex"]');
      var hipField = $("hip-field");
      function syncHip() {
        var sex = checkedVal("sex");
        if (hipField) hipField.style.display = sex === "f" ? "flex" : "none";
      }
      sexRadios.forEach(function (r) { r.addEventListener("change", syncHip); });
      syncHip();

      onSubmit(function () {
        var sex = checkedVal("sex");
        var h = num("height"), neck = num("neck"), waist = num("waist"), hip = num("hip");
        if (!sex || !h || !neck || !waist) return showError("fill in every field");
        if (sex === "f" && !hip) return showError("hip measurement is needed for the women's formula");
        if (waist - neck <= 0 || (sex === "f" && waist + hip - neck <= 0)) return showError("waist must be larger than neck");
        if (h < 100 || h > 250 || neck < 20 || waist < 40) return showError("check your measurements (cm)");
        var bf;
        if (sex === "m") {
          bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
        } else {
          bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
        }
        if (!isFinite(bf) || bf < 2 || bf > 70) return showError("those measurements give an unrealistic result");
        var cat, cls;
        var bands = sex === "m"
          ? [[0, 6, "essential fat"], [6, 14, "athletes"], [14, 18, "fitness"], [18, 25, "average"], [25, 100, "obese"]]
          : [[0, 14, "essential fat"], [14, 21, "athletes"], [21, 25, "fitness"], [25, 32, "average"], [32, 100, "obese"]];
        for (var i = 0; i < bands.length; i++) {
          if (bf >= bands[i][0] && bf < bands[i][1]) { cat = bands[i][2]; break; }
        }
        cls = cat === "obese" ? "err" : (cat === "average" ? "warn" : "ok");
        var leanMass = null;
        var w = num("weight");
        var extraRows = [row("category", cat)];
        if (w) {
          var fatMass = round(w * bf / 100, 1);
          leanMass = round(w - fatMass, 1);
          extraRows.push(row("fat mass", fatMass + " kg"));
          extraRows.push(row("lean mass", leanMass + " kg"));
        }
        showResult(headline(round(bf, 1), "% body fat", cat, cls) + rows(extraRows));
      });
    },

    // ---------------- Ideal Weight ----------------
    idealweight: function () {
      onSubmit(function () {
        var sex = checkedVal("sex"), h = num("height");
        if (!sex || !h) return showError("fill in every field");
        var inches = h / 2.54;
        var over5ft = inches - 60;
        var devine = sex === "m" ? 50 + 2.3 * over5ft : 45.5 + 2.3 * over5ft;
        var m = h / 100;
        var lo = round(18.5 * m * m, 1), hi = round(24.9 * m * m, 1);
        showResult(
          headline(round(devine, 1), "kg", "devine estimate", "ok") +
          rows([
            row("healthy bmi range", lo + " – " + hi + " kg"),
            row("height used", h + " cm")
          ])
        );
      });
    },

    // ---------------- Water Intake ----------------
    water: function () {
      onSubmit(function () {
        var w = num("weight");
        var ex = $("exercise") && $("exercise").value ? parseFloat($("exercise").value) : 0;
        var climate = checkedVal("climate") || "temperate";
        if (!w) return showError("enter your weight");
        var liters = w * 0.033 + (ex / 30) * 0.35;
        if (climate === "hot") liters += 0.5;
        var ml = Math.round(liters * 1000);
        var cups = round(ml / 240, 1);
        showResult(
          headline(round(liters, 1), "L / day", "daily target", "ok") +
          rows([
            row("in millilitres", ml + " ml"),
            row("in cups (240ml)", cups + " cups"),
            row("exercise added", ex > 0 ? round((ex / 30) * 0.35, 2) + " L" : "0 L")
          ])
        );
      });
    },

    // ---------------- BMR ----------------
    bmr: function () {
      onSubmit(function () {
        var sex = checkedVal("sex"), age = num("age"), h = num("height"), w = num("weight");
        if (!sex || !age || !h || !w) return showError("fill in every field");
        var bmr = sex === "m" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
        showResult(
          headline(Math.round(bmr), "kcal / day", "at complete rest", "ok") +
          rows([
            row("per week", Math.round(bmr * 7) + " kcal"),
            row("formula", "mifflin-st jeor")
          ])
        );
      });
    },

    // ---------------- Max Heart Rate ----------------
    maxhr: function () {
      onSubmit(function () {
        var age = num("age");
        if (!age || age <= 0) return showError("enter your age");
        var mhr = Math.round(208 - 0.7 * age);
        var classic = 220 - age;
        var zones = [
          ["warm up", 0.5, 0.6],
          ["fat burn", 0.6, 0.7],
          ["aerobic", 0.7, 0.8],
          ["anaerobic", 0.8, 0.9],
          ["max effort", 0.9, 1.0]
        ];
        var zoneRows = zones.map(function (z) {
          return row(z[0], Math.round(mhr * z[1]) + " – " + Math.round(mhr * z[2]) + " bpm");
        });
        showResult(
          headline(mhr, "bpm max", "tanaka formula", "ok") +
          rows(zoneRows.concat([row("classic 220-age", classic + " bpm")]))
        );
      });
    },

    // ---------------- Protein Intake ----------------
    protein: function () {
      onSubmit(function () {
        var w = num("weight");
        var goal = $("goal") ? $("goal").value : "active";
        if (!w) return showError("enter your weight");
        var ranges = { sedentary: [0.8, 1.0], active: [1.2, 1.6], muscle: [1.6, 2.2] };
        var r = ranges[goal] || ranges.active;
        var lo = round(w * r[0]), hi = round(w * r[1]);
        var mid = round((lo + hi) / 2);
        showResult(
          headline(mid, "g / day", "suggested target", "ok") +
          rows([
            row("range", lo + " – " + hi + " g"),
            row("per meal (÷4)", round(mid / 4) + " g")
          ])
        );
      });
    },

    // ---------------- Steps to Calories ----------------
    steptocalories: function () {
      onSubmit(function () {
        var steps = num("steps"), w = num("weight");
        if (!steps || !w) return showError("enter steps and weight");
        var calories = steps * w * 0.0005;
        var km = round(steps * 0.000762, 2);
        showResult(
          headline(Math.round(calories), "kcal burned", "estimate", "ok") +
          rows([
            row("distance", km + " km"),
            row("steps", Math.round(steps).toLocaleString())
          ])
        );
      });
    },

    // ---------------- Exercise Calories ----------------
    exercisecalories: function () {
      onSubmit(function () {
        var met = $("activity") ? parseFloat($("activity").value) : NaN;
        var w = num("weight"), mins = num("duration");
        if (!met || !w || !mins) return showError("fill in every field");
        var calories = met * w * (mins / 60);
        showResult(
          headline(Math.round(calories), "kcal burned", "estimate", "ok") +
          rows([
            row("met value used", met),
            row("duration", mins + " min"),
            row("rate", round(calories / mins, 1) + " kcal/min")
          ])
        );
      });
    },

    // ---------------- Macro Calculator ----------------
    macro: function () {
      onSubmit(function () {
        var cal = num("calories");
        var goal = $("goal") ? $("goal").value : "balanced";
        if (!cal || cal <= 0) return showError("enter a daily calorie target");
        var splits = {
          balanced: [0.4, 0.3, 0.3],
          highprotein: [0.4, 0.4, 0.2],
          lowcarb: [0.25, 0.45, 0.3],
          keto: [0.05, 0.25, 0.7]
        };
        var s = splits[goal] || splits.balanced;
        // split arrays are [carbs, protein, fat]
        var carbCal = cal * s[0], proteinCal = cal * s[1], fatCal = cal * s[2];
        var proteinG = Math.round(proteinCal / 4), carbG = Math.round(carbCal / 4), fatG = Math.round(fatCal / 9);
        showResult(
          headline(Math.round(cal), "kcal / day", ({ balanced: "balanced", highprotein: "high protein", lowcarb: "low carb", keto: "keto" })[goal] || goal, "ok") +
          '<div class="result-rows">' +
            bar(s[1] * 100, "var(--mauve)", "protein", proteinG + " g") +
            bar(s[0] * 100, "var(--blue)", "carbs", carbG + " g") +
            bar(s[2] * 100, "var(--peach)", "fat", fatG + " g") +
          "</div>"
        );
      });
    },

    // ---------------- Sleep Calculator ----------------
    sleep: function () {
      onSubmit(function () {
        var mode = $("mode") ? $("mode").value : "wake";
        var timeVal = $("time") ? $("time").value : null;
        if (!timeVal) return showError("pick a time");
        var parts = timeVal.split(":");
        var base = new Date();
        base.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);

        var cycles = [6, 5, 4, 3];
        var items = cycles.map(function (c) {
                    var d = new Date(base.getTime() + (mode === "wake" ? -1 : 1) * (c * 90) * 60000);
          // apply 15 min fall-asleep buffer only for the "when to go to bed" direction
          d.setMinutes(d.getMinutes() + (mode === "wake" ? -15 : 15));
          var hh = d.getHours(), mm = d.getMinutes();
          var label = (hh % 12 === 0 ? 12 : hh % 12) + ":" + (mm < 10 ? "0" + mm : mm) + (hh >= 12 ? " pm" : " am");
          var hours = round(c * 1.5, 1);
          return row(c + " cycles (" + hours + "h sleep)", label);
        });
        showResult(
          '<div class="result-tag ok" style="margin-bottom:6px;display:inline-block">' +
            (mode === "wake" ? "go to bed at…" : "wake up at…") +
          "</div>" +
          '<div class="sleep-list">' + items.join("") + "</div>" +
          '<p class="result-note" style="margin-top:10px">includes a 15-minute buffer to fall asleep. one sleep cycle ≈ 90 minutes.</p>'
        );
      });
    },

    // ---------------- Workout Rest Timer ----------------
    resttimer: function () {
      var ring = document.querySelector(".timer-ring .fg");
      var readout = $("timer-readout");
      var startBtn = $("timer-start");
      var resetBtn = $("timer-reset");
      var presetBtns = document.querySelectorAll("[data-preset]");
      if (!ring || !readout || !startBtn || !resetBtn) return;

      var radius = ring.r.baseVal.value;
      var circumference = 2 * Math.PI * radius;
      ring.style.strokeDasharray = circumference.toFixed(1);

      var total = 60, remaining = 60, timerId = null, running = false;

      function render() {
        var mm = Math.floor(remaining / 60), ss = remaining % 60;
        readout.innerHTML = "<strong>" + mm + ":" + (ss < 10 ? "0" + ss : ss) + "</strong>rest";
        var offset = circumference * (1 - remaining / total);
        ring.style.strokeDashoffset = offset.toFixed(1);
      }

      function beep() {
        try {
          var ctx = new (window.AudioContext || window.webkitAudioContext)();
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(); osc.stop(ctx.currentTime + 0.5);
        } catch (e) { /* audio not available, ignore */ }
      }

      function tick() {
        remaining -= 1;
        if (remaining <= 0) {
          remaining = 0; render(); stop(); beep();
          return;
        }
        render();
      }
      function start() {
        if (running) return;
        running = true;
        startBtn.textContent = "pause";
        timerId = setInterval(tick, 1000);
      }
      function stop() {
        running = false;
        startBtn.textContent = "start";
        clearInterval(timerId);
      }
      function reset() {
        stop(); remaining = total; render();
      }

      startBtn.addEventListener("click", function () { running ? stop() : start(); });
      resetBtn.addEventListener("click", reset);
      presetBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          total = parseInt(btn.dataset.preset, 10);
          remaining = total;
          stop();
          render();
        });
      });

      render();
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var slug = document.body.getAttribute("data-calc");
    if (slug && calculators[slug]) calculators[slug]();
  });
})();
