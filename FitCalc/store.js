/*
 * store.js: the ONLY file that reads/writes localStorage JSON for shared data.
 * Reads never write. Load right after constants.js.
 */
function readJSON(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value === null || value === undefined ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
            window.dispatchEvent(new CustomEvent("fitcalc:storage-error", { detail: { key: key } }));
        }
        throw error;
    }
}

function getDateKey(date) {
    const d = date || new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

function getProfile() { return readJSON(PROFILE_KEY, {}); }
function saveProfile(profile) { writeJSON(PROFILE_KEY, profile); }
function updateProfile(data) { saveProfile(Object.assign(getProfile(), data)); }
function getTargets() { return readJSON(TARGETS_KEY, {}); }

function emptyNutritionDay() {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0, foods: [] };
}

function emptyPlannerDay(dateKey) {
    return { date: dateKey, steps: 0, weight: null, workouts: [], tasks: [] };
}

// Read-only: returns an empty day if nothing is stored (does NOT save it).
function getNutritionFor(dateKey) {
    return Object.assign(emptyNutritionDay(), readJSON(NUTRITION_KEY, {})[dateKey] || {});
}

function getPlannerFor(dateKey) {
    return Object.assign(emptyPlannerDay(dateKey), readJSON(PLANNER_KEY, {})[dateKey] || {});
}

function saveNutritionFor(dateKey, nutrition) {
    const allDays = readJSON(NUTRITION_KEY, {});
    allDays[dateKey] = Object.assign(emptyNutritionDay(), nutrition || {});
    writeJSON(NUTRITION_KEY, allDays);
    announceDataChange(dateKey);
    return allDays[dateKey];
}

function savePlannerFor(dateKey, planner) {
    const allDays = readJSON(PLANNER_KEY, {});
    allDays[dateKey] = Object.assign(emptyPlannerDay(dateKey), planner || {}, { date: dateKey });
    writeJSON(PLANNER_KEY, allDays);
    announceDataChange(dateKey);
    return allDays[dateKey];
}

function persistWorkoutTemplates(templates) {
    writeJSON(WORKOUT_TEMPLATES_KEY, Array.isArray(templates) ? templates : []);
}

function announceDataChange(dateKey) {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("fitcalc:data-change", { detail: { date: dateKey } }));
    }
}
