/*
 * STORAGE
 */

function getProgressHistoryStorage() {

    try {

        return readJSON(HISTORY_KEY, {});

    } catch (error) {

        return {};

    }
}


function saveProgressHistoryStorage(history) {

    writeJSON(HISTORY_KEY, history);
}


/*
 * DATE
 */

function getProgressDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/*
 * NORMALIZE RECORD
 *
 * Makes old and new history records
 * use the same structure.
 */

function normalizeProgressRecord(
    dateKey,
    record
) {

    record =
        record && typeof record === "object"
            ? record
            : {};


    const recordDate =
        typeof record.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            record.date
        )
            ? record.date
            : dateKey;


    let weight = null;


    if (
        record.weight !== null &&
        record.weight !== undefined &&
        Number.isFinite(
            Number(record.weight)
        )
    ) {

        weight =
            Number(record.weight);

    }


    return {

        date:
            recordDate,

        weight:
            weight,

        calories:
            Math.round(
                Number(
                    record.calories
                ) || 0
            ),

        protein:
            Math.round(
                Number(
                    record.protein
                ) || 0
            ),

        carbs:
            Math.round(
                Number(
                    record.carbs
                ) || 0
            ),

        fat:
            Math.round(
                Number(
                    record.fat
                ) || 0
            ),

        fiber:
            Math.round(
                Number(
                    record.fiber
                ) || 0
            ),

        foods:
            Array.isArray(record.foods) ? record.foods : [],

        water:
            Number(record.water) || 0,

        steps:
            Math.round(
                Number(
                    record.steps
                ) || 0
            ),

        workouts:
            Array.isArray(record.workouts) ? record.workouts : [],

        completedWorkouts:
            Math.round(Number(record.completedWorkouts ?? record.workouts) || 0),

        tasks:
            Math.round(
                Number(
                    record.tasks
                ) || 0
            )

    };
}


/*
 * GET NUTRITION FOR DATE
 */

function getProgressNutrition(dateKey) {

    let nutrition = {};

    try {

        nutrition =
            readJSON(NUTRITION_KEY, {});

    } catch (error) {

        nutrition = {};

    }


    return nutrition[dateKey] || {

        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        water: 0

    };
}


/*
 * GET PLANNER FOR DATE
 */

function getProgressPlanner(dateKey) {

    let planners = {};

    try {

        planners =
            readJSON(PLANNER_KEY, {});

    } catch (error) {

        planners = {};

    }


    return planners[dateKey] || {

        date: dateKey,
        steps: 0,
        weight: null,
        workouts: [],
        tasks: []

    };
}


/*
 * CREATE DAILY RECORD
 */

function createProgressRecord(dateKey) {

    const nutrition =
        getProgressNutrition(
            dateKey
        );


    const planner =
        getProgressPlanner(
            dateKey
        );


    const workouts =
        Array.isArray(
            planner.workouts
        )
            ? planner.workouts
            : [];


    const tasks =
        Array.isArray(
            planner.tasks
        )
            ? planner.tasks
            : [];


    const completedWorkouts =
        workouts.filter(
            function (workout) {

                return (
                    workout &&
                    workout.completed === true
                );

            }
        ).length;


    const completedTasks =
        tasks.filter(
            function (task) {

                return (
                    task &&
                    task.completed === true
                );

            }
        ).length;


    let weight = null;


    if (
        planner.weight !== null &&
        planner.weight !== undefined &&
        Number.isFinite(
            Number(planner.weight)
        )
    ) {

        weight =
            Number(
                planner.weight
            );

    }


    return {

        date:
            dateKey,

        weight:
            weight,

        calories:
            Math.round(
                Number(
                    nutrition.calories
                ) || 0
            ),

        protein:
            Math.round(
                Number(
                    nutrition.protein
                ) || 0
            ),

        carbs:
            Math.round(
                Number(
                    nutrition.carbs
                ) || 0
            ),

        fat:
            Math.round(
                Number(
                    nutrition.fat
                ) || 0
            ),

        fiber:
            Math.round(
                Number(
                    nutrition.fiber
                ) || 0
            ),

        foods:
            Array.isArray(nutrition.foods) ? nutrition.foods : [],

        steps:
            Math.round(
                Number(
                    planner.steps
                ) || 0
            ),

        water:
            Number(nutrition.water) || 0,

        workouts:
            workouts.filter(function (workout) { return workout && workout.completed === true; }),

        completedWorkouts:
            completedWorkouts,

        tasks:
            completedTasks

    };
}


/*
 * SAVE DAILY RECORD
 */

function saveProgressRecord(dateKey) {

    const history =
        getProgressHistoryStorage();


    const existing =
        history[dateKey];


    const record =
        createProgressRecord(
            dateKey
        );

    const hasData = record.weight !== null || record.calories > 0 ||
        record.protein > 0 || record.carbs > 0 || record.fat > 0 ||
        record.fiber > 0 || record.foods.length > 0 || record.water > 0 || record.steps > 0 ||
        record.workouts.length > 0 || record.tasks > 0;

    // A read or an empty edit should never manufacture a blank history day.
    if (!hasData && !existing) return null;


    /*
     * Preserve historical weight if
     * planner currently has no weight.
     */

    if (
        record.weight === null &&
        existing &&
        existing.weight !== null &&
        existing.weight !== undefined &&
        Number.isFinite(
            Number(existing.weight)
        )
    ) {

        record.weight =
            Number(
                existing.weight
        );

    }

    if (existing && JSON.stringify(normalizeProgressRecord(dateKey, existing)) === JSON.stringify(normalizeProgressRecord(dateKey, record))) {
        return normalizeProgressRecord(dateKey, existing);
    }


    history[dateKey] =
        record;


    if (Object.keys(history).length > 0) {
        saveProgressHistoryStorage(history);
    }


    return record;
}


/*
 * GET ONE RECORD
 */

function getProgressRecord(dateKey) {

    const history =
        getProgressHistoryStorage();


    if (!history[dateKey]) {

        return null;

    }


    return normalizeProgressRecord(
        dateKey,
        history[dateKey]
    );
}


/*
 * GET ALL RECORDS
 */

function getProgressRecords() {

    const history =
        getProgressHistoryStorage();


    return Object.entries(history)

        .map(
            function ([dateKey, record]) {

                return normalizeProgressRecord(
                    dateKey,
                    record
                );

            }
        )

        .filter(
            function (record) {

                return (
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        record.date
                    ) && record.date <= getProgressDateKey(new Date())
                );

            }
        )

        .sort(
            function (a, b) {

                return a.date.localeCompare(
                    b.date
                );

            }
        );
}


/*
 * GET LAST N RECORDS
 */

function getProgressRecordsForDays(
    days
) {

    const records =
        getProgressRecords();


    const count =
        Number(days);


    if (
        !Number.isFinite(count) ||
        count <= 0
    ) {

        return records;

    }


    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - Math.ceil(count) + 1);
    const firstKey = getProgressDateKey(start);
    const lastKey = getProgressDateKey(end);
    return records.filter(function (record) {
        return record.date >= firstKey && record.date <= lastKey;
    });
}


/*
 * WEIGHT HISTORY
 */

function getWeightProgress() {

    return getProgressRecords()

        .filter(
            function (record) {

                return (
                    record.weight !== null &&
                    Number.isFinite(
                        Number(record.weight)
                    )
                );

            }
        )

        .map(
            function (record) {

                return {

                    date:
                        record.date,

                    weight:
                        Number(
                            record.weight
                        )

                };

            }
        );
}


/*
 * AVERAGE
 */

function getProgressAverage(
    field,
    days
) {

    const records =
        days
            ? getProgressRecordsForDays(
                days
            )
            : getProgressRecords();


    const values =
        records

            .map(
                function (record) {

                    return Number(
                        record[field]
                    );

                }
            )

            .filter(
                function (value) {

                    return Number.isFinite(
                        value
                    );

                }
            );


    if (
        values.length === 0
    ) {

        return 0;

    }


    const total =
        values.reduce(
            function (
                sum,
                value
            ) {

                return sum + value;

            },
            0
        );


    return total / values.length;
}


/*
 * TOTAL
 */

function getProgressTotal(
    field,
    days
) {

    const records =
        days
            ? getProgressRecordsForDays(
                days
            )
            : getProgressRecords();


    return records.reduce(
        function (
            total,
            record
        ) {

            const value =
                Number(
                    record[field]
                );


            return Number.isFinite(value)
                ? total + value
                : total;

        },
        0
    );
}


/*
 * WEIGHT CHANGE
 */

function getWeightChange(days) {

    let weights =
        getWeightProgress();


    if (
        Number.isFinite(
            Number(days)
        ) &&
        Number(days) > 0
    ) {

        weights =
            weights.slice(
                Math.max(
                    weights.length -
                    Number(days),
                    0
                )
            );

    }


    if (
        weights.length < 2
    ) {

        return 0;

    }


    const first =
        weights[0].weight;


    const last =
        weights[
            weights.length - 1
        ].weight;


    return last - first;
}


/*
 * UPDATE TODAY
 */

function updateTodayProgress() {

    const today =
        getProgressDateKey(
            new Date()
        );


    return saveProgressRecord(
        today
    );
}


/*
 * CLEAN OLD HISTORY
 *
 * Normalizes legacy records once and
 * removes malformed date entries.
 */

function normalizeStoredProgress() {

    const history =
        getProgressHistoryStorage();


    const normalized = {};


    Object.entries(history)
        .forEach(
            function ([dateKey, record]) {

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        dateKey
                    )
                ) {

                    return;

                }


                normalized[dateKey] =
                    normalizeProgressRecord(
                        dateKey,
                        record
                    );

            }
        );


    saveProgressHistoryStorage(
        normalized
    );
}

function backfillProgressFromActivity() {
    const nutritionDays = readJSON(NUTRITION_KEY, {});
    const plannerDays = readJSON(PLANNER_KEY, {});
    const dates = new Set(Object.keys(nutritionDays).concat(Object.keys(plannerDays)));
    dates.forEach(function (dateKey) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
        const nutrition = nutritionDays[dateKey] || {};
        const planner = plannerDays[dateKey] || {};
        const hasFood = Array.isArray(nutrition.foods) && nutrition.foods.length > 0;
        const hasActivity = Number(nutrition.calories) > 0 || Number(nutrition.protein) > 0 ||
            Number(nutrition.carbs) > 0 || Number(nutrition.fat) > 0 || Number(nutrition.fiber) > 0 ||
            Number(nutrition.water) > 0 || Number(planner.steps) > 0 ||
            planner.weight !== null && planner.weight !== undefined ||
            Array.isArray(planner.workouts) && planner.workouts.some(function (item) { return item && item.completed === true; }) ||
            Array.isArray(planner.tasks) && planner.tasks.some(function (item) { return item && item.completed === true; });
        if (hasFood || hasActivity) saveProgressRecord(dateKey);
    });
}


/*
 * INITIALIZATION
 */

if (typeof window !== "undefined") {
    window.addEventListener("fitcalc:data-change", function (event) {
        const dateKey = event.detail && event.detail.date;
        if (dateKey) saveProgressRecord(dateKey);
    });

    window.addEventListener("storage", function (event) {
        if (event.key !== NUTRITION_KEY && event.key !== PLANNER_KEY) return;
        try {
            const changedDays = event.newValue ? JSON.parse(event.newValue) : {};
            const previousDays = event.oldValue ? JSON.parse(event.oldValue) : {};
            const affectedDates = new Set(Object.keys(changedDays).concat(Object.keys(previousDays)));
            affectedDates.forEach(function (dateKey) {
                if (JSON.stringify(changedDays[dateKey]) !== JSON.stringify(previousDays[dateKey])) {
                    saveProgressRecord(dateKey);
                }
            });
        } catch (error) {
            // Ignore malformed external storage; normal reads remain non-mutating.
        }
    });
    backfillProgressFromActivity();
}
