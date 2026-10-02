let selectedDate = new Date();

const collapsedWorkouts = {};


/*
 * DATE
 */



function updateSelectedDay() {
    const today = new Date();

    const selectedKey = getDateKey(selectedDate);
    const todayKey = getDateKey(today);

    let label;

    if (selectedKey === todayKey) {
        label = "Today";
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (selectedKey === getDateKey(yesterday)) {
            label = "Yesterday";
        } else if (selectedKey === getDateKey(tomorrow)) {
            label = "Tomorrow";
        } else {
            label = selectedDate.toLocaleDateString("en-US", {
                weekday: "long"
            });
        }
    }

    document.getElementById(
        "selected-day-label"
    ).textContent = label;

    document.getElementById(
        "selected-date"
    ).textContent = selectedDate.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


/*
 * STORAGE
 */

function savePlanner(planner) {
    return savePlannerFor(planner.date, planner);
}


function getPlanner() {
    const dateKey = getDateKey(selectedDate);
    return getPlannerFor(dateKey);
}

/*
 * STEPS
 */

function saveSteps() {
    const planner = getPlanner();

    const steps = Number(
        document.getElementById(
            "steps-input"
        ).value
    );

    if (
        !Number.isFinite(steps) ||
        steps < 0
    ) {
        window.fitcalcToast("Enter a positive step count.", "error");
        return;
    }

    planner.steps += steps;

    savePlanner(planner);

    updateStepsDisplay();
    window.fitcalcToast("Steps updated for this day.");

    document.getElementById(
        "steps-input"
    ).value = "";
}


function updateStepsDisplay() {
    const planner = getPlanner();

    const stepsElement =
        document.getElementById(
            "planner-steps"
        );

    if (stepsElement) {
        stepsElement.textContent =
            planner.steps;
    }

    const progressElement =
        document.getElementById(
            "steps-progress"
        );

    if (progressElement) {
        progressElement.style.width =
            Math.min(
                (planner.steps / 10000) * 100,
                100
            ) + "%";
        const meter = progressElement.closest('[role="progressbar"]');
        if (meter) meter.setAttribute("aria-valuenow", String(Math.min(Math.round((planner.steps / 10000) * 100), 100)));
    }
}

function updateWeightDisplay() {
    const planner = getPlanner();
    const value = document.getElementById("planner-weight-value");
    const detailValue = document.getElementById("planner-weight-value-display");
    const date = document.getElementById("planner-weight-date");
    const input = document.getElementById("planner-weight-input");
    if (value) value.textContent = planner.weight === null || planner.weight === undefined ? "—" : Number(planner.weight).toFixed(1);
    if (detailValue) detailValue.textContent = planner.weight === null || planner.weight === undefined ? "—" : Number(planner.weight).toFixed(1);
    if (date) date.textContent = selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (input) input.value = planner.weight === null || planner.weight === undefined ? "" : planner.weight;
}

function saveWeight() {
    const input = document.getElementById("planner-weight-input");
    const weight = Number(input && input.value);
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
        window.fitcalcToast("Enter a weight from 30 to 300 kg.", "error");
        return;
    }
    const planner = getPlanner();
    planner.weight = weight;
    savePlanner(planner);
    updateWeightDisplay();
    window.fitcalcToast("Weight check-in saved.");
}

const saveWeightButton = document.getElementById("save-weight");
if (saveWeightButton) saveWeightButton.addEventListener("click", saveWeight);


const saveStepsButton =
    document.getElementById(
        "save-steps"
    );

if (saveStepsButton) {
    saveStepsButton.addEventListener(
        "click",
        saveSteps
    );
}


const resetStepsButton =
    document.getElementById(
        "reset-steps"
    );

if (resetStepsButton) {
    resetStepsButton.addEventListener(
        "click",
        function () {

            const planner = getPlanner();

            planner.steps = 0;

            savePlanner(planner);

            updateStepsDisplay();
            updateWeightDisplay();
            window.fitcalcToast("Step count reset.");
        }
    );
}


/*
 * WORKOUTS
 */

function createWorkout() {
    const input =
        document.getElementById(
            "workout-name"
        );

    const workoutName =
        input.value.trim();

    if (!workoutName) {
        window.fitcalcToast("Enter a workout name first.", "error");
        return;
    }

    const planner = getPlanner();

    planner.workouts.push({
        name: workoutName,
        completed: false,
        exercises: []
    });

    savePlanner(planner);

    input.value = "";

    updateWorkoutList();
    updateDailyProgress();
    window.fitcalcToast("Workout added to this day.");
}


function updateWorkoutList() {
    const planner = getPlanner();

    const workoutList =
        document.getElementById(
            "workout-list"
        );

    workoutList.innerHTML = "";

    if (planner.workouts.length === 0) {
            workoutList.innerHTML =
            '<p><strong>No workouts planned</strong><span>Add a workout above to start logging.</span></p>';

        return;
    }

    planner.workouts.forEach(
        function (workout, workoutIndex) {

            const workoutSection =
                document.createElement("div");

            workoutSection.className =
                "workout-section";

            workoutSection.innerHTML = `
                <div class="workout-header">

                    <button
                        type="button"
                        class="workout-toggle"
                        data-index="${workoutIndex}"
                        aria-expanded="${!collapsedWorkouts[workoutIndex]}"
                        aria-controls="workout-content-${workoutIndex}"
                    >
                        <span>
                            ${escapeHTML(workout.name)}
                        </span>

                        <span class="workout-toggle-icon">
                            ${
                                collapsedWorkouts[workoutIndex]
                                    ? "›"
                                    : "⌄"
                            }
                        </span>
                    </button>

                    <button
                        type="button"
                        class="delete-workout"
                        data-index="${workoutIndex}"
                        aria-label="Delete ${escapeHTML(workout.name)}"
                    >
                        Delete
                    </button>

                </div>

                <div
                    class="workout-content"
                    id="workout-content-${workoutIndex}"
                    style="${
                        collapsedWorkouts[workoutIndex]
                            ? "display:none;"
                            : ""
                    }"
                >

                    <div class="exercise-list">

                        ${
                            workout.exercises.length > 0

                                ? workout.exercises
                                    .map(
                                        function (
                                            exercise,
                                            exerciseIndex
                                        ) {

                                            const sets =
                                                exercise.sets || [];

                                            return `
                                                <div class="exercise-item">

                                                    <h4>
                                                        ${escapeHTML(exercise.name)}
                                                    </h4>

                                                    ${
                                                        sets.length > 0

                                                            ? `
                                                                <div class="sets-inline">

                                                                    ${
                                                                        sets
                                                                            .map(
                                                                                function (
                                                                                    set,
                                                                                    setIndex
                                                                                ) {

                                                                                    return `
                                                                                        <span class="set-chip">

                                                                                            ${setIndex + 1})
                                                                                            ${formatWorkoutSet(set)}

                                                    <button
                                                        type="button"
                                                        class="remove-set"
                                                        data-workout="${workoutIndex}"
                                                        data-exercise="${exerciseIndex}"
                                                        data-set="${setIndex}"
                                                        aria-label="Remove set ${setIndex + 1}"
                                                                                            >
                                                                                                ✕
                                                                                            </button>

                                                                                        </span>
                                                                                    `;
                                                                                }
                                                                            )
                                                                            .join("")
                                                                    }

                                                                </div>
                                                            `

                                                            : `
                                                                <p>
                                                                    No sets yet.
                                                                </p>
                                                            `
                                                    }

                                                    <button
                                                        type="button"
                                                        class="primary-btn add-set"
                                                        data-workout="${workoutIndex}"
                                                        data-exercise="${exerciseIndex}"
                                                    >
                                                        Add Set
                                                    </button>

                                                    <button
                                                        type="button"
                                                        class="secondary-btn remove-exercise"
                                                        data-workout="${workoutIndex}"
                                                        data-exercise="${exerciseIndex}"
                                                    >
                                                        Remove
                                                    </button>

                                                </div>
                                            `;
                                        }
                                    )
                                    .join("")

                                : `
                                    <p>
                                        No exercises yet.
                                    </p>
                                `
                        }

                    </div>


                    <div class="add-exercise-form">

                        <div class="field">
                            <label for="exercise-name-${workoutIndex}">Exercise</label>

                            <input
                                type="text"
                                class="exercise-name-input"
                                id="exercise-name-${workoutIndex}"
                                placeholder="e.g. Bench Press"
                            >

                        </div>

                        <div class="exercise-library-tools">
                            <div class="inline-input-action">
                                <input type="search" class="exercise-library-query" placeholder="Search exercise library" aria-label="Search exercise library">
                                <button type="button" class="secondary-btn search-exercise-library" data-index="${workoutIndex}">Search library</button>
                            </div>
                            <div class="exercise-library-results" aria-live="polite"></div>
                        </div>


                        <button
                            type="button"
                            class="primary-btn add-exercise"
                            data-index="${workoutIndex}"
                        >
                            Add
                        </button>


                        <button
                            type="button"
                            class="primary-btn complete-workout${workout.completed ? " is-complete" : ""}"
                            data-index="${workoutIndex}"
                        >
                            ${
                                workout.completed
                                    ? "Undo completion"
                                    : "Complete"
                            }
                        </button>


                        <button
                            type="button"
                            class="secondary-btn save-template"
                            data-index="${workoutIndex}"
                        >
                            Save
                        </button>

                    </div>

                </div>
            `;

            workoutList.appendChild(
                workoutSection
            );
        }
    );


    /*
     * COLLAPSE WORKOUT
     */

    workoutList
        .querySelectorAll(".workout-toggle")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const workoutIndex =
                        Number(
                            button.dataset.index
                        );

                    collapsedWorkouts[
                        workoutIndex
                    ] =
                        !collapsedWorkouts[
                            workoutIndex
                        ];

                    updateWorkoutList();
                }
            );
        });


    /*
     * ADD EXERCISE
     */

    workoutList
        .querySelectorAll(".add-exercise")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const workoutIndex =
                        Number(
                            button.dataset.index
                        );

                    const form =
                        button.closest(
                            ".add-exercise-form"
                        );

                    const input =
                        form.querySelector(
                            ".exercise-name-input"
                        );

                    const exerciseName =
                        input.value.trim();

                    if (!exerciseName) {
                        window.fitcalcToast("Enter an exercise name first.", "error");

                        return;
                    }

                    const planner =
                        getPlanner();

                    planner
                        .workouts[workoutIndex]
                        .exercises
                        .push({
                            name: exerciseName,
                            sets: []
                        });

                    savePlanner(planner);

                    updateWorkoutList();
                    window.fitcalcToast("Exercise added.");
                }
            );
        });

    workoutList.querySelectorAll(".search-exercise-library").forEach(function (button) {
        button.addEventListener("click", function () {
            const form = button.closest(".add-exercise-form");
            const query = form.querySelector(".exercise-library-query").value;
            const results = form.querySelector(".exercise-library-results");
            if (typeof searchExerciseLibrary === "function") {
                searchExerciseLibrary(query, Number(button.dataset.index), results);
            } else {
                results.textContent = "Exercise lookup is unavailable. You can still add exercises by name.";
            }
        });
    });


    /*
     * ADD SET
     */

    workoutList
        .querySelectorAll(".add-set")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const workoutIndex =
                        Number(
                            button.dataset.workout
                        );

                    const exerciseIndex =
                        Number(
                            button.dataset.exercise
                        );

                    const repsText = await window.fitcalcDialog.prompt({
                        title: "Log actual performance",
                        message: "Enter the reps you completed. Leave it blank to log an activity by duration.",
                        label: "Reps completed",
                        inputMode: "decimal"
                    });
                    if (repsText === null) return;
                    let actualSet;
                    if (repsText.trim() !== "") {
                        const reps = Number(repsText);
                        if (!Number.isFinite(reps) || reps <= 0) { window.fitcalcToast("Enter a positive rep count.", "error"); return; }
                        const weightText = await window.fitcalcDialog.prompt({
                            title: "Log the load",
                            message: "Record the weight used for this set. Enter 0 for bodyweight.",
                            label: "Weight in kg",
                            type: "number",
                            required: true
                        });
                        if (weightText === null) return;
                        const weight = Number(weightText);
                        if (!Number.isFinite(weight) || weight < 0) { window.fitcalcToast("Enter a valid weight.", "error"); return; }
                        actualSet = { reps: reps, weight: weight };
                    } else {
                        const durationText = await window.fitcalcDialog.prompt({
                            title: "Log activity duration",
                            message: "Enter how long you actually performed this exercise.",
                            label: "Duration in minutes",
                            type: "number",
                            required: true
                        });
                        if (durationText === null) return;
                        const durationMinutes = Number(durationText);
                        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) { window.fitcalcToast("Enter a positive duration.", "error"); return; }
                        actualSet = { durationMinutes: durationMinutes };
                    }

                    const planner =
                        getPlanner();

                    const exercise =
                        planner
                            .workouts[workoutIndex]
                            .exercises[exerciseIndex];

                    if (!exercise.sets) {
                        exercise.sets = [];
                    }

                    exercise.sets.push(actualSet);

                    savePlanner(planner);

                    updateWorkoutList();
                    window.fitcalcToast("Set logged.");
                }
            );
        });


    /*
     * REMOVE SET
     */

    workoutList
        .querySelectorAll(".remove-set")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const workoutIndex =
                        Number(
                            button.dataset.workout
                        );

                    const exerciseIndex =
                        Number(
                            button.dataset.exercise
                        );

                    const setIndex =
                        Number(
                            button.dataset.set
                        );

                    const planner =
                        getPlanner();

                    planner
                        .workouts[workoutIndex]
                        .exercises[exerciseIndex]
                        .sets
                        .splice(
                            setIndex,
                            1
                        );

                    savePlanner(planner);

                    updateWorkoutList();
                }
            );
        });


    /*
     * REMOVE EXERCISE
     */

    workoutList
        .querySelectorAll(".remove-exercise")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const workoutIndex =
                        Number(
                            button.dataset.workout
                        );

                    const exerciseIndex =
                        Number(
                            button.dataset.exercise
                        );

                    if (!await window.fitcalcDialog.confirm("Remove this exercise from today's workout?", "Remove exercise", "Remove")) {
                        return;
                    }

                    const planner =
                        getPlanner();

                    planner
                        .workouts[workoutIndex]
                        .exercises
                        .splice(
                            exerciseIndex,
                            1
                        );

                    savePlanner(planner);

                    updateWorkoutList();
                }
            );
        });


    /*
     * DELETE WORKOUT
     */

    workoutList
        .querySelectorAll(".delete-workout")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const workoutIndex =
                        Number(
                            button.dataset.index
                        );

                    if (!await window.fitcalcDialog.confirm("Delete this workout and its logged sets from this day?", "Delete workout", "Delete")) {
                        return;
                    }

                    const planner =
                        getPlanner();

                    planner.workouts.splice(
                        workoutIndex,
                        1
                    );

                    savePlanner(planner);

                    updateWorkoutList();
                    updateDailyProgress();
                }
            );
        });


    /*
     * COMPLETE WORKOUT
     */

    workoutList
        .querySelectorAll(".complete-workout")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const workoutIndex =
                        Number(
                            button.dataset.index
                        );

                    const planner =
                        getPlanner();

                    const workout = planner.workouts[workoutIndex];
                    if (!workout) return;
                    const nextCompleted = !workout.completed;
                    if (nextCompleted && !hasWorkoutPerformance(workout)) {
                        window.fitcalcToast("Log at least one actual set or duration before completing this workout.", "error");
                        return;
                    }
                    workout.completed = nextCompleted;

                    savePlanner(planner);

                    updateWorkoutList();
                    updateDailyProgress();
                }
            );
        });


    /*
     * SAVE WORKOUT AS TEMPLATE
     */

    workoutList
        .querySelectorAll(".save-template")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const workoutIndex =
                        Number(
                            button.dataset.index
                        );

                    const planner =
                        getPlanner();

                    const workout =
                        planner.workouts[
                            workoutIndex
                        ];

                    if (!workout) {
                        return;
                    }

                    createWorkoutTemplate(
                        workout.name,
                        workout.exercises
                    );

                    renderWorkoutTemplates();

                    window.fitcalcToast("Workout saved as a reusable template.");
                }
            );
        });
}


const createWorkoutButton =
    document.getElementById(
        "create-workout"
    );

if (createWorkoutButton) {
    createWorkoutButton.addEventListener(
        "click",
        createWorkout
    );
}


/*
 * TASKS
 */

function addTask() {
    const taskInput =
        document.getElementById(
            "task-name"
        );

    const taskName =
        taskInput.value.trim();

    if (!taskName) {
        window.fitcalcToast("Enter a task first.", "error");
        return;
    }

    const planner = getPlanner();

    planner.tasks.push({
        name: taskName,
        completed: false
    });

    savePlanner(planner);

    taskInput.value = "";

    updateTaskList();
    updateDailyProgress();
    window.fitcalcToast("Task added to this day.");
}


function updateTaskList() {
    const planner = getPlanner();

    const taskList =
        document.getElementById(
            "task-list"
        );

    taskList.innerHTML = "";

    if (planner.tasks.length === 0) {
        taskList.innerHTML =
            '<p><strong>No tasks yet</strong><span>Add one above to keep your day organized.</span></p>';

        return;
    }

    planner.tasks.forEach(
        function (task, index) {

            const taskItem =
                document.createElement("div");
            taskItem.className = "task-item" + (task.completed ? " is-complete" : "");

            taskItem.innerHTML = `
                <p>
                    ${escapeHTML(task.name)}
                </p>

                <button
                    type="button"
                    class="secondary-btn complete-task"
                    data-index="${index}"
                    aria-pressed="${!!task.completed}"
                >
                    ${
                        task.completed
                            ? "Completed"
                            : "Complete"
                    }
                </button>
                <button type="button" class="ghost-btn delete-task" data-index="${index}" aria-label="Remove ${escapeHTML(task.name)}">Remove</button>
            `;

            taskList.appendChild(
                taskItem
            );

            taskItem
                .querySelector(
                    ".complete-task"
                )
                .addEventListener(
                    "click",
                    function () {

                        const planner =
                            getPlanner();

                        planner
                            .tasks[index]
                            .completed = !planner.tasks[index].completed;

                        savePlanner(planner);

                        updateTaskList();
                        updateDailyProgress();
                        window.fitcalcToast(planner.tasks[index].completed ? "Task completed." : "Task marked incomplete.");
                    }
                );

            taskItem.querySelector(".delete-task").addEventListener("click", async function () {
                if (!await window.fitcalcDialog.confirm("Remove this task from the selected day?", "Remove task", "Remove")) return;
                const current = getPlanner();
                current.tasks.splice(index, 1);
                savePlanner(current);
                updateTaskList();
                updateDailyProgress();
            });
        }
    );
}


const addTaskButton =
    document.getElementById(
        "add-task"
    );

if (addTaskButton) {
    addTaskButton.addEventListener(
        "click",
        addTask
    );
}


/*
 * DAILY PROGRESS
 */

function updateDailyProgress() {
    const planner = getPlanner();

    const completedWorkouts =
        planner.workouts.filter(
            function (workout) {
                return workout.completed;
            }
        ).length;

    const completedTasks =
        planner.tasks.filter(
            function (task) {
                return task.completed;
            }
        ).length;

    document.getElementById(
        "completed-workouts"
    ).textContent =
        completedWorkouts;

    document.getElementById(
        "completed-tasks"
    ).textContent =
        completedTasks;
}


/*
 * DAY NAVIGATION
 */

const previousDayButton =
    document.getElementById(
        "previous-day"
    );

if (previousDayButton) {

    previousDayButton.addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() - 1
            );

            Object.keys(
                collapsedWorkouts
            ).forEach(function (key) {
                delete collapsedWorkouts[key];
            });

            updateSelectedDay();
            updateStepsDisplay();
            updateWeightDisplay();
            updateWorkoutList();
            updateTaskList();
            updateDailyProgress();
        }
    );
}


const nextDayButton =
    document.getElementById(
        "next-day"
    );

if (nextDayButton) {

    nextDayButton.addEventListener(
        "click",
        function () {

            selectedDate.setDate(
                selectedDate.getDate() + 1
            );

            Object.keys(
                collapsedWorkouts
            ).forEach(function (key) {
                delete collapsedWorkouts[key];
            });

            updateSelectedDay();
            updateStepsDisplay();
            updateWorkoutList();
            updateTaskList();
            updateDailyProgress();
        }
    );
}


/*
 * INITIAL RENDER
 */

updateStepsDisplay();
updateWeightDisplay();
updateWorkoutList();
updateTaskList();
updateDailyProgress();
updateSelectedDay();
