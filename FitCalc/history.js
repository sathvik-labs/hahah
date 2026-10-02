/*
 * FITCALC HISTORY
 *
 * Progress / History page UI
 */


/*
 * ELEMENTS
 */

const historyList =
    document.querySelector(
        "#history-list"
    );


/*
 * STATE
 */

let historyRange = 7;


/*
 * FORMAT DATE
 */

function formatHistoryDate(dateKey) {

    const date =
        new Date(
            dateKey + "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateKey;

    }


    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/*
 * FORMAT SHORT DATE
 */

function formatChartDate(dateKey) {

    const date =
        new Date(
            dateKey + "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateKey;

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
    );
}


/*
 * FORMAT NUMBER
 */

function formatHistoryNumber(value) {

    return Number(
        value || 0
    ).toLocaleString();
}


/*
 * FORMAT DECIMAL
 */

function formatHistoryDecimal(value) {

    return Number(
        value || 0
    ).toFixed(1);
}


/*
 * CREATE SUMMARY CARD
 */

function createSummaryCard(
    label,
    value,
    unit
) {

    return `
        <div class="history-summary-card">

            <span>
                ${label}
            </span>

            <strong>
                ${value}
            </strong>

            <small>
                ${unit}
            </small>

        </div>
    `;
}


/*
 * CREATE SUMMARY
 */

function createHistorySummaryHTML() {

    const averageCalories =
        Math.round(
            getProgressAverage(
                "calories",
                historyRange
            )
        );


    const averageProtein =
        Math.round(
            getProgressAverage(
                "protein",
                historyRange
            )
        );


    const averageSteps =
        Math.round(
            getProgressAverage(
                "steps",
                historyRange
            )
        );


    const weightChange =
        getWeightChange(
            historyRange
        );


    return `

        <section class="history-summary">

            ${createSummaryCard(
                `${historyRange} DAY AVG CALORIES`,
                formatHistoryNumber(
                    averageCalories
                ),
                "kcal / day"
            )}


            ${createSummaryCard(
                `${historyRange} DAY AVG PROTEIN`,
                formatHistoryNumber(
                    averageProtein
                ),
                "g / day"
            )}


            ${createSummaryCard(
                `${historyRange} DAY AVG STEPS`,
                formatHistoryNumber(
                    averageSteps
                ),
                "steps / day"
            )}


            ${createSummaryCard(
                "WEIGHT CHANGE",
                formatHistoryDecimal(
                    weightChange
                ),
                `kg / ${historyRange} days`
            )}

        </section>

    `;
}


/*
 * RANGE SELECTOR
 */

function createRangeSelectorHTML() {

    return `

        <div class="history-range">

            <span>
                RANGE
            </span>


            <button
                type="button"
                class="history-range-btn ${
                    historyRange === 7
                        ? "active"
                        : ""
                }"
                data-history-range="7"
                aria-pressed="${historyRange === 7}"
            >
                7D
            </button>


            <button
                type="button"
                class="history-range-btn ${
                    historyRange === 30
                        ? "active"
                        : ""
                }"
                data-history-range="30"
                aria-pressed="${historyRange === 30}"
            >
                30D
            </button>


            <button
                type="button"
                class="history-range-btn ${
                    historyRange === 90
                        ? "active"
                        : ""
                }"
                data-history-range="90"
                aria-pressed="${historyRange === 90}"
            >
                90D
            </button>

        </div>

    `;
}


/*
 * CHART POINTS
 */

function createChartPoints(
    records,
    field,
    width,
    height,
    padding
) {

    if (
        records.length === 0
    ) {

        return [];

    }


    const values =
        records.map(
            function (record) {

                return Number(
                    record[field]
                ) || 0;

            }
        );


    const max =
        Math.max(
            ...values,
            1
        );


    const min =
        Math.min(
            ...values,
            0
        );


    const range =
        max - min || 1;


    return records.map(
        function (record, index) {

            const x =
                records.length === 1
                    ? width / 2
                    : padding +
                      (
                        index /
                        (records.length - 1)
                      ) *
                      (
                        width -
                        padding * 2
                      );


            const y =
                height -
                padding -
                (
                    (
                        Number(
                            record[field]
                        ) - min
                    ) /
                    range
                ) *
                (
                    height -
                    padding * 2
                );


            return {

                x: x,
                y: y,
                value:
                    Number(
                        record[field]
                    ) || 0,
                date:
                    record.date

            };

        }
    );
}


/*
 * SVG LINE CHART
 */

function createLineChartHTML(
    title,
    field,
    unit,
    records
) {

    const width = 760;
    const height = 240;
    const padding = 30;


    const points =
        createChartPoints(
            records,
            field,
            width,
            height,
            padding
        );


    if (
        points.length === 0
    ) {

        return `
            <section class="progress-chart">

                <div class="progress-chart-header">
                    <strong>${title}</strong>
                </div>

                <div class="progress-chart-empty">
                    No data yet.
                </div>

            </section>
        `;

    }


    const polyline =
        points
            .map(
                function (point) {

                    return `${point.x},${point.y}`;

                }
            )
            .join(" ");


    const first =
        points[0];


    const last =
        points[
            points.length - 1
        ];


    const latest =
        last.value;


    return `

        <section class="progress-chart">

            <div class="progress-chart-header">

                <div>

                    <strong>
                        ${title}
                    </strong>

                    <small>
                        ${formatHistoryNumber(
                            latest
                        )} ${unit}
                    </small>

                </div>

            </div>


            <div class="progress-chart-wrap">

                <svg
                    class="progress-chart-svg"
                    viewBox="0 0 ${width} ${height}"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="${title} trend. Latest value: ${formatHistoryNumber(latest)} ${unit}."
                >

                    <line
                        x1="${padding}"
                        y1="${padding}"
                        x2="${width - padding}"
                        y2="${padding}"
                        class="chart-grid"
                    />

                    <line
                        x1="${padding}"
                        y1="${height / 2}"
                        x2="${width - padding}"
                        y2="${height / 2}"
                        class="chart-grid"
                    />

                    <line
                        x1="${padding}"
                        y1="${height - padding}"
                        x2="${width - padding}"
                        y2="${height - padding}"
                        class="chart-grid"
                    />


                    <polyline
                        points="${polyline}"
                        class="chart-line"
                        fill="none"
                    />


                    ${
                        points
                            .map(
                                function (point) {

                                    return `
                                        <circle
                                            cx="${point.x}"
                                            cy="${point.y}"
                                            r="3"
                                            class="chart-point"
                                        >
                                            <title>
                                                ${formatChartDate(
                                                    point.date
                                                )}
                                                :
                                                ${formatHistoryNumber(
                                                    point.value
                                                )}
                                                ${unit}
                                            </title>
                                        </circle>
                                    `;

                                }
                            )
                            .join("")
                    }

                </svg>

            </div>


            <div class="progress-chart-labels">

                <span>
                    ${formatChartDate(
                        first.date
                    )}
                </span>

                <span>
                    ${formatChartDate(
                        last.date
                    )}
                </span>

            </div>

        </section>

    `;
}


/*
 * CREATE CHARTS
 */

function createProgressChartsHTML() {

    const records =
        getProgressRecordsForDays(
            historyRange
        );


    return `

        <section class="progress-charts">

            <div class="history-section-title">

                <span>
                    TRENDS
                </span>

                <small>
                    ${historyRange} days
                </small>

            </div>


            <div class="progress-chart-grid">

                ${createLineChartHTML(
                    "Weight",
                    "weight",
                    "kg",
                    records.filter(
                        function (record) {

                            return (
                                record.weight !== null
                            );

                        }
                    )
                )}


                ${createLineChartHTML(
                    "Calories",
                    "calories",
                    "kcal",
                    records
                )}


                ${createLineChartHTML(
                    "Protein",
                    "protein",
                    "g",
                    records
                )}


                ${createLineChartHTML(
                    "Steps",
                    "steps",
                    "steps",
                    records
                )}

            </div>

        </section>

    `;
}


/*
 * CREATE RECORD CARD
 */

function createHistoryRecordHTML(
    record
) {

    return `

        <article class="history-record">

            <div class="history-record-header">

                <div>

                    <span class="history-record-date">
                        ${formatHistoryDate(
                            record.date
                        )}
                    </span>

                </div>


                ${
                    record.weight !== null
                        ? `
                            <span class="history-weight">
                                ${formatHistoryDecimal(
                                    record.weight
                                )}
                                kg
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="history-stats">

                <div class="history-stat">

                    <span>
                        Calories
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.calories
                        )}
                        <small>kcal</small>
                    </strong>

                </div>

                <div class="history-stat">

                    <span>Water</span>

                    <strong>
                        ${formatHistoryDecimal(record.water)}
                        <small>L</small>
                    </strong>

                </div>


                <div class="history-stat">

                    <span>
                        Protein
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.protein
                        )}
                        <small>g</small>
                    </strong>

                </div>


                <div class="history-stat">

                    <span>
                        Carbs
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.carbs
                        )}
                        <small>g</small>
                    </strong>

                </div>


                <div class="history-stat">

                    <span>
                        Fat
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.fat
                        )}
                        <small>g</small>
                    </strong>

                </div>


                <div class="history-stat">

                    <span>
                        Steps
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.steps
                        )}
                    </strong>

                </div>


                <div class="history-stat">

                    <span>
                        Workouts
                    </span>

                    <strong>
                        ${formatHistoryNumber(
                            record.completedWorkouts
                        )}
                    </strong>

                    ${(record.workouts || []).map(function (workout) {
                        const exerciseSummary = (workout.exercises || []).map(function (exercise) {
                            return escapeHTML(exercise.name) + " " + (Array.isArray(exercise.sets) ? exercise.sets.length : 0) + " sets";
                        }).join(" · ");
                        return `<small class="history-workout-detail">${escapeHTML(workout.name)}${exerciseSummary ? " — " + exerciseSummary : ""}</small>`;
                    }).join("")}

                </div>

            </div>

        </article>

    `;
}


/*
 * CREATE DAILY RECORDS
 */

function createHistoryRecordsHTML(
    records
) {

    if (
        records.length === 0
    ) {

        return `

            <div class="history-empty">

                <strong>
                    No records yet.
                </strong>

                <p>
                    Start logging nutrition,
                    steps, workouts and weight.
                </p>

            </div>

        `;

    }


    return `

        <section class="history-records">

            <div class="history-section-title">

                <span>
                    DAILY RECORDS
                </span>

                <small>
                    ${records.length}
                    ${
                        records.length === 1
                            ? "day"
                            : "days"
                    }
                </small>

            </div>


            ${records
                .map(
                    createHistoryRecordHTML
                )
                .join("")}

        </section>

    `;
}


/*
 * RANGE EVENTS
 */

function attachHistoryEvents() {

    const buttons =
        document.querySelectorAll(
            "[data-history-range]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    historyRange =
                        Number(
                            button.dataset
                                .historyRange
                        );


                    renderHistory();

                }
            );

        }
    );
}


/*
 * RENDER
 */

function renderHistory() {

    if (!historyList) {
        return;
    }


    const records =
        getProgressRecords()
            .slice()
            .reverse();

    if (records.length === 0) {
        historyList.innerHTML = `
            <div class="history-content">
                <div class="history-empty">
                    <strong>Your history will appear here</strong>
                    <p>Log food, water, steps, a weigh-in, or a completed workout to start building your progress record.</p>
                    <div class="button-row">
                        <a class="primary-btn" href="../nutrition/">Log nutrition</a>
                        <a class="secondary-btn" href="../planner/">Open planner</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }


    const visibleRecords =
        records.slice(
            0,
            historyRange
        );


    historyList.innerHTML = `

        <div class="history-content">

            ${createRangeSelectorHTML()}


            ${createHistorySummaryHTML()}


            ${createProgressChartsHTML()}


            ${createHistoryRecordsHTML(
                visibleRecords
            )}

        </div>

    `;


    attachHistoryEvents();
}


/*
 * INITIAL RENDER
 */

renderHistory();
