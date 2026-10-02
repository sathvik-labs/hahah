function getRemainingTargets() {
    const key = getDateKey(new Date());
    const t = getTargets(), n = getNutritionFor(key), p = getPlannerFor(key);
    const left = function (target, now) { return Math.max((Number(target) || 0) - (Number(now) || 0), 0); };
    return {
        calories: left(t.calories, n.calories),
        protein: left(t.protein, n.protein),
        water: left(WATER_GOAL_L, n.water),
        steps: left(STEPS_GOAL, p.steps),
        hasTargets: Number(t.calories) > 0
    };
}

function getWorkoutProgressionInsights() {
    const history = readJSON(HISTORY_KEY, {});
    const today = getDateKey(new Date());
    const records = Object.keys(history).filter(function (date) { return date <= today; }).sort().map(function (date) { return history[date]; });
    const exposures = {};
    records.forEach(function (record) {
        (Array.isArray(record.workouts) ? record.workouts : []).forEach(function (workout) {
            (Array.isArray(workout.exercises) ? workout.exercises : []).forEach(function (exercise) {
                const name = String(exercise.name || "").trim();
                const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
                if (!name || !sets.length) return;
                const timed = sets.filter(function (set) { return Number(set.durationMinutes) > 0; });
                const loaded = sets.filter(function (set) { return Number(set.reps) > 0; });
                let signature;
                let summary;
                if (timed.length && !loaded.length) {
                    const best = Math.max.apply(null, timed.map(function (set) { return Number(set.durationMinutes); }));
                    signature = "time:" + best;
                    summary = best + " min";
                } else if (loaded.length) {
                    const best = loaded.reduce(function (current, set) {
                        const score = Number(set.weight || 0) * 100000 + Number(set.reps || 0);
                        return score > current.score ? { score: score, set: set } : current;
                    }, { score: -1, set: loaded[0] }).set;
                    signature = "load:" + Number(best.weight || 0) + ":reps:" + Number(best.reps || 0);
                    summary = Number(best.weight || 0) + " kg × " + Number(best.reps || 0);
                }
                if (!signature) return;
                const key = name.toLowerCase();
                if (!exposures[key]) exposures[key] = { name: name, rows: [] };
                const rows = exposures[key].rows;
                const exposure = { date: record.date, signature: signature, summary: summary };
                if (rows.length && rows[rows.length - 1].date === record.date) rows[rows.length - 1] = exposure;
                else rows.push(exposure);
            });
        });
    });
    return Object.keys(exposures).map(function (key) {
        const item = exposures[key];
        const last = item.rows.slice(-3);
        if (last.length === 3 && last.every(function (row) { return row.signature === last[0].signature; })) {
            return "Review progression for " + item.name + ": its top logged set has stayed at " + last[0].summary + " across three sessions.";
        }
        return null;
    }).filter(Boolean).slice(0, 2);
}

function getAdaptivePlan() {
    const r = getRemainingTargets();
    const out = [];
    if (!r.hasTargets) return ["Set up your profile to get daily targets."];
    if (r.protein > 20) out.push("Prioritize protein. About " + Math.round(r.protein) + "g remains.");
    if (r.calories > 200) out.push("You have about " + Math.round(r.calories) + " kcal remaining.");
    else out.push("Calories are near target. No need for extra food.");
    if (r.water > 0.5) out.push("Drink about " + r.water.toFixed(1) + "L more water.");
    if (r.steps > 1000) out.push("You have about " + Math.round(r.steps) + " steps remaining.");
    getWorkoutProgressionInsights().forEach(function (insight) { out.push(insight); });
    return out;
}

function displayAdaptivePlan() {
    const suggestions = getAdaptivePlan();

    const container =
        document.getElementById("adaptive-suggestions");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (suggestions.length === 0) {
        container.innerHTML =
            "<p>Your logged nutrition and activity are on track.</p>";

        return;
    }
    suggestions.forEach(function (suggestion) {
        const item = document.createElement("p");

        item.textContent = suggestion;

        container.appendChild(item);
    });
}


function setupAdaptiveToggle() {
    const toggle =
        document.getElementById("adaptive-toggle");

    const panel =
        document.getElementById("adaptive-panel");

    if (!toggle || !panel) {
        return;
    }

    toggle.addEventListener("click", function () {
        const isOpen =
            toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        panel.hidden = isOpen;

    });
}


displayAdaptivePlan();
setupAdaptiveToggle();
