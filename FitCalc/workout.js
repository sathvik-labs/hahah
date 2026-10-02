function formatWorkoutSet(set) {
    if (Number(set.durationMinutes) > 0) return Number(set.durationMinutes) + " min";
    return Number(set.reps) + "×" + Number(set.weight || 0) + "kg";
}

function hasWorkoutPerformance(workout) {
    return !!workout && Array.isArray(workout.exercises) && workout.exercises.some(function (exercise) {
        return Array.isArray(exercise.sets) && exercise.sets.some(function (set) {
            return Number(set.reps) > 0 || Number(set.durationMinutes) > 0;
        });
    });
}

function getWorkoutTemplates() {
    return readJSON(WORKOUT_TEMPLATES_KEY, []);
}


function saveWorkoutTemplates(templates) {
    persistWorkoutTemplates(templates);
}


function createWorkoutTemplate(
    name,
    exercises = []
) {
    const templates =
        getWorkoutTemplates();

    const template = {
        name: name.trim(),

        exercises: exercises.map(
            function (exercise) {

                return { name: exercise.name };
            }
        )
    };

    const existingIndex =
        templates.findIndex(
            function (item) {
                return item.name === template.name;
            }
        );

    if (existingIndex !== -1) {
        templates[existingIndex] =
            template;
    } else {
        templates.push(template);
    }

    saveWorkoutTemplates(templates);

    return template;
}


function getWorkoutTemplate(name) {
    const templates =
        getWorkoutTemplates();

    return templates.find(
        function (template) {
            return template.name === name;
        }
    ) || null;
}


function deleteWorkoutTemplate(name) {
    const templates =
        getWorkoutTemplates();

    const updatedTemplates =
        templates.filter(
            function (template) {
                return template.name !== name;
            }
        );

    saveWorkoutTemplates(
        updatedTemplates
    );

    renderWorkoutTemplates();
}


function renderWorkoutTemplates() {
    const templateList =
        document.getElementById(
            "template-list"
        );

    if (!templateList) {
        return;
    }

    const templates =
        getWorkoutTemplates();

    templateList.innerHTML = "";

    if (templates.length === 0) {
        templateList.innerHTML =
            '<p class="empty-state"><strong>No templates saved</strong><span>Save a workout to reuse its structure.</span></p>';

        return;
    }

    templates.forEach(
        function (template, index) {

            const templateItem =
                document.createElement("div");

            templateItem.className =
                "workout-template-item";

            templateItem.innerHTML = `
                <strong>
                    ${escapeHTML(template.name)}
                </strong>

                <span>
                    ${template.exercises.length}
                    ${
                        template.exercises.length === 1
                            ? "exercise"
                            : "exercises"
                    }
                </span>

                <div class="workout-template-actions">
                <button
                    type="button"
                    class="primary-btn load-template"
                    data-index="${index}">
                    Load
                </button>

                <button
                    type="button"
                    class="ghost-btn delete-template"
                    data-index="${index}"
                    aria-label="Delete ${escapeHTML(template.name)} template">
                    Remove
                </button>
                </div>
            `;

            templateList.appendChild(
                templateItem
            );
        }
    );


    /*
     * Load Template
     */

    templateList
        .querySelectorAll(".load-template")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    const templates =
                        getWorkoutTemplates();

                    const template =
                        templates[index];

                    if (!template) {
                        return;
                    }

                    const planner =
                        getPlanner();

                    planner.workouts.push({

                        name:
                            template.name,

                        completed:
                            false,

                        exercises:
                            template.exercises.map(
                                function (exercise) {

                                    return { name: exercise.name, sets: [] };
                                }
                            )
                    });

                    savePlanner(planner);

                    updateWorkoutList();
                    updateDailyProgress();
                }
            );
        });


    /*
     * Delete Template
     */

    templateList
        .querySelectorAll(".delete-template")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    const templates =
                        getWorkoutTemplates();

                    const template =
                        templates[index];

                    if (!template) {
                        return;
                    }

                    if (!await window.fitcalcDialog.confirm(
                        `Delete the “${template.name}” workout template?`,
                        "Delete template",
                        "Delete"
                    )) {
                        return;
                    }

                    templates.splice(
                        index,
                        1
                    );

                    saveWorkoutTemplates(
                        templates
                    );

                    renderWorkoutTemplates();
                }
            );
        });
}


renderWorkoutTemplates();
