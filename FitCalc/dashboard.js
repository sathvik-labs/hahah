/*
 * Dashboard only READS shared state (store.js). No duplicate storage code.
 */
function getDashboardDateKey(date) { return getDateKey(date); }
function getDashboardNutrition() { return getNutritionFor(getDateKey(new Date())); }
function getDashboardTargets() { return getTargets(); }
function getDashboardPlanner() { return getPlannerFor(getDateKey(new Date())); }


/*
 * NUMBER HELPERS
 */

function dashboardNumber(value) {

    return Number(value) || 0;

}


function dashboardPercentage(
    current,
    target
) {

    const currentValue =
        dashboardNumber(current);

    const targetValue =
        dashboardNumber(target);


    if (targetValue <= 0) {

        return 0;

    }


    return Math.max(0, Math.min((currentValue / targetValue) * 100, 100));
}


/*
 * DAILY PROGRESS
 */

function getDashboardDailyProgress() {

    const nutrition =
        getDashboardNutrition();

    const targets =
        getDashboardTargets();

    const planner =
        getDashboardPlanner();


    const metrics = [];
    const calorieTarget = dashboardNumber(targets.calories);
    if (calorieTarget > 0) metrics.push(Math.max(0, 100 - Math.abs(1 - dashboardNumber(nutrition.calories) / calorieTarget) * 100));
    ["protein", "carbs", "fat", "fiber"].forEach(function (key) {
        if (dashboardNumber(targets[key]) > 0) metrics.push(dashboardPercentage(nutrition[key], targets[key]));
    });
    metrics.push(dashboardPercentage(nutrition.water, WATER_GOAL_L));
    metrics.push(dashboardPercentage(planner.steps, STEPS_GOAL));
    const workouts = Array.isArray(planner.workouts) ? planner.workouts : [];
    const tasks = Array.isArray(planner.tasks) ? planner.tasks : [];
    if (workouts.length) metrics.push(dashboardPercentage(workouts.filter(function (w) { return w && w.completed; }).length, workouts.length));
    if (tasks.length) metrics.push(dashboardPercentage(tasks.filter(function (t) { return t && (t.completed || t.done); }).length, tasks.length));
    return metrics.length ? Math.round(metrics.reduce(function (sum, value) { return sum + value; }, 0) / metrics.length) : 0;
}


/*
 * UPDATE TEXT + BARS
 * (the HTML already has the "/" and the units, so each span gets just one value)
 */

function setDashboardText(id, text) {
    const el = document.getElementById(id);
    if (el) { el.textContent = text; }
}

function setDashboardBar(id, percent) {
    const el = document.getElementById(id);
    if (el) {
        const value = Math.round(percent);
        el.style.width = value + "%";
        const meter = el.closest('[role="progressbar"]');
        if (meter) meter.setAttribute("aria-valuenow", String(value));
    }
}

function dashboardCalorieProgress(eaten, target) {
    const t = dashboardNumber(target);
    if (t <= 0) { return 0; }
    return Math.max(0, 100 - Math.abs(1 - dashboardNumber(eaten) / t) * 100);
}

function updateDashboardText() {
    const n = getDashboardNutrition();
    const t = getDashboardTargets();
    const p = getDashboardPlanner();
    const r = function (v) { return Math.round(dashboardNumber(v)).toLocaleString(); };
    const target = function (v) { return dashboardNumber(v) > 0 ? r(v) : "—"; };

    setDashboardText("terminal-calories", r(n.calories));
    setDashboardText("terminal-calorie-target", target(t.calories));
    setDashboardText("terminal-protein", r(n.protein));
    setDashboardText("terminal-protein-target", target(t.protein));
    setDashboardText("terminal-carbs", r(n.carbs));
    setDashboardText("terminal-carbs-target", target(t.carbs));
    setDashboardText("terminal-fat", r(n.fat));
    setDashboardText("terminal-fat-target", target(t.fat));
    setDashboardText("terminal-fiber", r(n.fiber));
    setDashboardText("terminal-fiber-target", target(t.fiber));
    setDashboardText("terminal-water", dashboardNumber(n.water).toFixed(2));
    setDashboardText("terminal-water-target", Number(WATER_GOAL_L).toFixed(1));
    setDashboardText("terminal-steps", r(p.steps));

    const workouts = Array.isArray(p.workouts) ? p.workouts : [];
    const tasks = Array.isArray(p.tasks) ? p.tasks : [];
    const completedWorkouts = workouts.filter(function (w) { return w && w.completed; }).length;
    setDashboardText("terminal-workout",
        completedWorkouts + " / " + workouts.length + " complete");
    setDashboardText("terminal-workout-name", workouts.map(function (w) {
        const name = String(w && w.name || "Workout");
        return name + (w && w.completed ? " · done" : " · planned");
    }).join(", ") || "None planned");
    setDashboardText("terminal-tasks",
        tasks.filter(function (x) { return x && (x.completed || x.done); }).length + " / " + tasks.length + " complete");

    setDashboardBar("terminal-calorie-progress", dashboardCalorieProgress(n.calories, t.calories));
    setDashboardBar("terminal-protein-progress", dashboardPercentage(n.protein, t.protein));
    setDashboardBar("terminal-carbs-progress", dashboardPercentage(n.carbs, t.carbs));
    setDashboardBar("terminal-fat-progress", dashboardPercentage(n.fat, t.fat));
    setDashboardBar("terminal-fiber-progress", dashboardPercentage(n.fiber, t.fiber));
    setDashboardBar("terminal-water-progress", dashboardPercentage(n.water, WATER_GOAL_L));
    setDashboardBar("terminal-steps-progress", dashboardPercentage(p.steps, STEPS_GOAL));
}

function updateDashboardProgress() {
    const progress = getDashboardDailyProgress();
    setDashboardText("terminal-daily-progress", progress + "%");
    setDashboardBar("terminal-daily-progress-bar", progress);
    const meter = document.querySelector(".daily-progress-track[role='progressbar']");
    if (meter) meter.setAttribute("aria-valuenow", String(progress));
}


/*
 * PRIORITY
 */

function updateDashboardPriority() {
    if (typeof displayAdaptivePlan === "function") { displayAdaptivePlan(); }
}


/*
 * INITIALIZE
 */

function updateDashboard() {

    updateDashboardText();

    updateDashboardProgress();

    updateDashboardPriority();

    const date = document.getElementById("today-date");
    if (date) {
        const now = new Date();
        date.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
        date.dateTime = getDateKey(now);
    }

    const setup = document.getElementById("dashboard-profile-setup");
    if (setup) setup.hidden = dashboardNumber(getDashboardTargets().calories) > 0;

}


updateDashboard();


/*
 * REFRESH WHEN RETURNING TO PAGE
 */

window.addEventListener(
    "focus",
    function () {

        updateDashboard();

    }
);


window.addEventListener(
    "storage",
    function () {

        updateDashboard();

    }
);

window.addEventListener("fitcalc:data-change", updateDashboard);
