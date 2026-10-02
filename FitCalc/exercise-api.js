/* Public read-only exercise discovery through wger. No account is needed for public lists. */
const WGER_EXERCISEINFO_URL = "https://wger.de/api/v2/exerciseinfo/";
let exerciseLibraryCache = null;

function normalizeWgerExercise(item) {
    if (!item || typeof item !== "object") return null;
    const base = item.exercise_base || item.exercise || {};
    const translations = Array.isArray(item.translations) ? item.translations : [];
    const english = translations.find(function (entry) { return Number(entry.language) === 2; });
    const name = String(item.name || (english && english.name) || base.name || "").trim();
    if (!name) return null;
    const description = String(item.description || (english && english.description) || base.description || "").trim();
    const label = function (value) { return value && typeof value === "object" ? String(value.name || value.id || "") : String(value || ""); };
    return {
        id: String(item.id || base.id || ""),
        name: name,
        description: description,
        category: label(item.category || base.category),
        equipment: (Array.isArray(item.equipment) ? item.equipment : []).map(label).filter(Boolean),
        muscles: (Array.isArray(item.muscles) ? item.muscles : []).map(label).filter(Boolean),
        provider: "wger"
    };
}

async function loadWgerExerciseLibrary() {
    if (exerciseLibraryCache) return exerciseLibraryCache;
    let url = WGER_EXERCISEINFO_URL + "?language=2&limit=100";
    const items = [];
    // Bound discovery requests to avoid paging through the full public dataset per search.
    for (let page = 0; url && page < 5; page++) {
        const response = await fetch(url, { headers: { Accept: "application/json" }, credentials: "omit" });
        if (!response.ok) throw new Error("Exercise library returned HTTP " + response.status + ".");
        const data = await response.json();
        if (!Array.isArray(data.results)) throw new Error("Exercise library returned an unexpected response.");
        items.push.apply(items, data.results.map(normalizeWgerExercise).filter(Boolean));
        url = data.next || null;
    }
    exerciseLibraryCache = items;
    return items;
}

async function searchExerciseLibrary(query, workoutIndex, resultsRoot) {
    const term = String(query || "").trim().toLocaleLowerCase();
    if (!resultsRoot) return;
    resultsRoot.replaceChildren();
    if (term.length < 2) {
        resultsRoot.textContent = "Enter at least two letters to search.";
        return;
    }
    resultsRoot.textContent = "Searching public exercise library…";
    try {
        const library = await loadWgerExerciseLibrary();
        const matches = library.filter(function (exercise) {
            return exercise.name.toLocaleLowerCase().includes(term) ||
                exercise.category.toLocaleLowerCase().includes(term) ||
                exercise.muscles.some(function (muscle) { return muscle.toLocaleLowerCase().includes(term); });
        }).slice(0, 12);
        resultsRoot.replaceChildren();
        if (!matches.length) {
            resultsRoot.textContent = "No matches in the currently loaded public results. You can still add an exercise by name.";
            return;
        }
        matches.forEach(function (exercise) {
            const row = document.createElement("div");
            row.className = "integration-result";
            const info = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = exercise.name;
            const details = document.createElement("small");
            details.textContent = [exercise.category, exercise.muscles.join(", ")].filter(Boolean).join(" · ");
            info.append(title, details);
            const add = document.createElement("button");
            add.type = "button";
            add.className = "secondary-btn";
            add.textContent = "Add";
            add.addEventListener("click", function () { addLibraryExerciseToWorkout(exercise, workoutIndex); });
            row.append(info, add);
            resultsRoot.appendChild(row);
        });
    } catch (error) {
        resultsRoot.textContent = error.message + " You can still add an exercise by name.";
    }
}

function addLibraryExerciseToWorkout(exercise, workoutIndex) {
    const planner = getPlanner();
    const workout = planner.workouts[workoutIndex];
    if (!workout) return;
    if (!Array.isArray(workout.exercises)) workout.exercises = [];
    workout.exercises.push({
        name: exercise.name,
        sets: [],
        library: {
            provider: exercise.provider,
            id: exercise.id,
            description: exercise.description,
            category: exercise.category,
            muscles: exercise.muscles.slice(),
            equipment: exercise.equipment.slice()
        }
    });
    savePlanner(planner);
    updateWorkoutList();
}
