const foodDatabase = [
    // per 100 g, approximate (USDA-style values)
    { name: "chicken breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    { name: "white rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
    { name: "brown rice", calories: 112, protein: 2.3, carbs: 24, fat: 0.8, fiber: 1.8 },
    { name: "banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
    { name: "apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
    { name: "orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
    { name: "egg", calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 },
    { name: "oats", calories: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6 },
    { name: "salmon", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
    { name: "tuna", calories: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0 },
    { name: "lean beef", calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
    { name: "tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3 },
    { name: "milk", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
    { name: "greek yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
    { name: "cottage cheese", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0 },
    { name: "cheddar cheese", calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
    { name: "lentils", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
    { name: "chickpeas", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
    { name: "potato", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8 },
    { name: "sweet potato", calories: 90, protein: 2, carbs: 21, fat: 0.2, fiber: 3.3 },
    { name: "broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
    { name: "spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    { name: "avocado", calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7 },
    { name: "almonds", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
    { name: "peanut butter", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
    { name: "olive oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
    { name: "whole wheat bread", calories: 252, protein: 12.3, carbs: 43, fat: 3.5, fiber: 6 },
    { name: "pasta", calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8 }
];



/*
 * DATE
 */

let selectedNutritionDate = new Date();
let editingFoodIndex = -1;

function getNutritionDateKey(date) { return getDateKey(date || selectedNutritionDate); }

function getNutritionTargets() { return getTargets(); }


/*
 * STORAGE
 */

function getAllNutrition() {

    try {

        return readJSON(NUTRITION_KEY, {});

    } catch (error) {

        return {};

    }
}


/*
 * EMPTY DAY
 */

function createEmptyNutritionDay() {

    return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        water: 0,
        foods: []
    };
}


/*
 * GET TODAY'S NUTRITION
 */

function getNutrition() {

    const nutrition = Object.assign(
        createEmptyNutritionDay(),
        getNutritionFor(getNutritionDateKey())
    );


    nutrition.calories =
        Number(nutrition.calories) || 0;

    nutrition.protein =
        Number(nutrition.protein) || 0;

    nutrition.carbs =
        Number(nutrition.carbs) || 0;

    nutrition.fat =
        Number(nutrition.fat) || 0;

    nutrition.fiber =
        Number(nutrition.fiber) || 0;

    nutrition.water =
        Number(nutrition.water) || 0;


    if (!Array.isArray(nutrition.foods)) {

        nutrition.foods = [];

    }


    return nutrition;
}


/*
 * SAVE NUTRITION
 */

function saveNutrition(nutrition) {
    saveNutritionFor(getNutritionDateKey(), nutrition);
}

function updateNutritionDateDisplay() {
    const label = document.getElementById("nutrition-day-label");
    const date = document.getElementById("nutrition-date");
    if (!label || !date) return;
    const today = new Date();
    const key = getNutritionDateKey(selectedNutritionDate);
    label.textContent = key === getDateKey(today) ? "Today" : selectedNutritionDate.toLocaleDateString(undefined, { weekday: "long" });
    date.textContent = selectedNutritionDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const title = document.querySelector(".section-heading h2");
    if (title) title.textContent = key === getDateKey(today) ? "Today's Totals" : "Daily Totals";
    const next = document.getElementById("nutrition-next-day");
    if (next) next.disabled = key === getDateKey(today);
}

function shiftNutritionDate(offset) {
    const today = new Date();
    const next = new Date(selectedNutritionDate);
    next.setDate(next.getDate() + offset);
    if (getDateKey(next) > getDateKey(today)) return;
    cancelFoodEdit();
    selectedNutritionDate = next;
    updateNutritionDateDisplay();
    updateNutritionDisplay();
    updateFoodList();
    updateWaterDisplay();
}

document.getElementById("nutrition-previous-day")?.addEventListener("click", function () { shiftNutritionDate(-1); });
document.getElementById("nutrition-next-day")?.addEventListener("click", function () { shiftNutritionDate(1); });


/*
 * FIND FOOD
 */

function findFood(name) {

    const searchName =
        String(name)
            .toLowerCase()
            .trim();


    if (!searchName) {

        return null;

    }


    return foodDatabase.find(
        function (food) {

            const foodName =
                String(food.name)
                    .toLowerCase();


            return (
                foodName.includes(searchName) ||
                searchName.includes(foodName)
            );

        }
    );
}


/*
 * REMAINING
 */

function getRemaining(target, current) {

    const targetValue =
        Number(target) || 0;

    const currentValue =
        Number(current) || 0;


    return Math.max(
        targetValue - currentValue,
        0
    );
}


/*
 * PROGRESS PERCENTAGE
 */

function getNutritionPercentage(
    current,
    target
) {

    const currentValue =
        Number(current) || 0;

    const targetValue =
        Number(target) || 0;


    if (targetValue <= 0) {

        return 0;

    }


    return Math.min(
        (currentValue / targetValue) * 100,
        100
    );
}


/*
 * PROGRESS BAR
 */

function updateNutritionProgressBar(
    id,
    current,
    target
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    const percentage =
        getNutritionPercentage(
            current,
            target
        );


    element.style.width =
        percentage + "%";
    const meter = element.closest('[role="progressbar"]');
    if (meter) meter.setAttribute("aria-valuenow", String(Math.round(percentage)));


    const percentageIdMap = {

        "calorie-progress":
            "total-calories-progress",

        "protein-progress":
            "total-protein-progress",

        "carbs-progress":
            "total-carbs-progress",

        "fat-progress":
            "total-fat-progress",

        "fiber-progress":
            "total-fiber-progress"

    };


    const percentageElement =
        document.getElementById(
            percentageIdMap[id]
        );


    if (percentageElement) {

        percentageElement.textContent =
            `${Math.round(percentage)}%`;

    }
}


/*
 * NUTRITION DISPLAY
 */

function updateNutritionDisplay() {

    const nutrition =
        getNutrition();

    const targets =
        getNutritionTargets();

    const targetNotice = document.getElementById("nutrition-profile-notice");
    if (targetNotice) targetNotice.hidden = Number(targets.calories) > 0;


    const values = [

        {
            total: "total-calories",
            progress: "calorie-progress",
            current: nutrition.calories,
            target: targets.calories
        },

        {
            total: "total-protein",
            progress: "protein-progress",
            current: nutrition.protein,
            target: targets.protein
        },

        {
            total: "total-carbs",
            progress: "carbs-progress",
            current: nutrition.carbs,
            target: targets.carbs
        },

        {
            total: "total-fat",
            progress: "fat-progress",
            current: nutrition.fat,
            target: targets.fat
        },

        {
            total: "total-fiber",
            progress: "fiber-progress",
            current: nutrition.fiber,
            target: targets.fiber
        }

    ];


    values.forEach(
        function (item) {

            const total =
                document.getElementById(
                    item.total
                );


            const target =
                Number(item.target) || 0;


            if (total) {

                total.textContent =
                    `${Math.round(item.current)} / ${Math.round(target)}`;

            }


            updateNutritionProgressBar(
                item.progress,
                item.current,
                target
            );

        }
    );


    updateNutritionRemaining(
        nutrition,
        targets
    );


    updateWaterDisplay(
        nutrition
    );
}


/*
 * REMAINING DISPLAY
 */

function updateNutritionRemaining(
    nutrition,
    targets
) {

    const remaining = [

        {
            id: "remaining-calories",
            value: getRemaining(
                targets.calories,
                nutrition.calories
            ),
            unit: "kcal"
        },

        {
            id: "remaining-protein",
            value: getRemaining(
                targets.protein,
                nutrition.protein
            ),
            unit: "g"
        },

        {
            id: "remaining-carbs",
            value: getRemaining(
                targets.carbs,
                nutrition.carbs
            ),
            unit: "g"
        },

        {
            id: "remaining-fat",
            value: getRemaining(
                targets.fat,
                nutrition.fat
            ),
            unit: "g"
        },

        {
            id: "remaining-fiber",
            value: getRemaining(
                targets.fiber,
                nutrition.fiber
            ),
            unit: "g"
        }

    ];


    remaining.forEach(
        function (item) {

            const element =
                document.getElementById(
                    item.id
                );


            if (element) {

                element.textContent =
                    `${Math.round(item.value)} ${item.unit}`;

            }

        }
    );
}


/*
 * FOOD LIST
 */

function updateFoodList() {

    const nutrition =
        getNutrition();


    const foodList =
        document.getElementById(
            "food-list"
        );


    if (!foodList) {

        return;

    }


    foodList.innerHTML = "";


    if (nutrition.foods.length === 0) {

        foodList.innerHTML =
            '<p class="empty-state"><strong>No food logged yet</strong><span>Add an item to see it here.</span></p>';

        return;

    }


    const orderedFoods = nutrition.foods.map(function (food, index) {
        return { food: food, index: index };
    }).sort(function (a, b) {
        const order = { Breakfast: 0, Lunch: 1, Dinner: 2, Snack: 3 };
        const mealA = a.food.meal || "Snack";
        const mealB = b.food.meal || "Snack";
        return (Object.prototype.hasOwnProperty.call(order, mealA) ? order[mealA] : 4) -
            (Object.prototype.hasOwnProperty.call(order, mealB) ? order[mealB] : 4) || a.index - b.index;
    });
    let lastMeal = "";

    orderedFoods.forEach(
        function (item) {

            const food = item.food;
            const index = item.index;
            const meal = food.meal || "Snack";
            if (meal !== lastMeal) {
                const heading = document.createElement("h3");
                heading.className = "food-meal-heading";
                heading.textContent = meal;
                foodList.appendChild(heading);
                lastMeal = meal;
            }

            const entry =
                document.createElement("div");


            entry.className =
                "nutrition-food-entry";


            entry.innerHTML = `

                <div class="nutrition-food-info">

                    <h3>
                        ${escapeHTML(food.name)}
                    </h3>

                    <p>
                        ${food.amount} g
                    </p>

                    <p>${escapeHTML(food.meal || "Snack")}</p>

                    <p>
                        ${Math.round(food.calories)} kcal ·
                        ${Math.round(food.protein)}g protein ·
                        ${Math.round(food.carbs)}g carbs ·
                        ${Math.round(food.fat)}g fat
                    </p>

                </div>

                <div class="nutrition-food-actions">
                <button
                    type="button"
                    class="secondary-btn edit-food"
                    data-index="${index}"
                >
                    Edit
                </button>
                <button
                    type="button"
                    class="primary-btn remove-food"
                    data-index="${index}"
                >
                    Remove
                </button>
                </div>

            `;


            foodList.appendChild(entry);


            const removeButton =
                entry.querySelector(
                    ".remove-food"
                );


            removeButton.addEventListener(
                "click",
                function () {

                    removeFood(index);

                }
            );

            entry.querySelector(".edit-food").addEventListener("click", function () {
                editFood(index);
            });

        }
    );
}


/*
 * REMOVE FOOD
 */

function removeFood(index) {

    const nutrition =
        getNutrition();


    const removedFood =
        nutrition.foods[index];


    if (!removedFood) {

        return;

    }

    if (editingFoodIndex === index) cancelFoodEdit();
    else if (editingFoodIndex > index) editingFoodIndex -= 1;


    nutrition.foods.splice(
        index,
        1
    );

    recalculateNutritionTotals(nutrition);


    saveNutrition(
        nutrition
    );


    updateNutritionDisplay();

    updateFoodList();

}

function editFood(index) {
    const food = getNutrition().foods[index];
    if (!food || !(Number(food.amount) > 0)) return;
    editingFoodIndex = index;
    document.getElementById("food-name").value = food.name;
    document.getElementById("food-amount").value = food.amount;
    document.getElementById("food-meal").value = food.meal || "Snack";
    const per100 = function (key) { return (Number(food[key]) || 0) * 100 / Number(food.amount); };
    window.fitcalcPendingFood = { name: food.name, calories: per100("calories"), protein: per100("protein"), carbs: per100("carbs"), fat: per100("fat"), fiber: per100("fiber"), source: food.source, barcode: food.barcode };
    const button = document.getElementById("add-food");
    if (button) button.textContent = "Save changes";
    const cancel = document.getElementById("cancel-food-edit");
    if (cancel) cancel.hidden = false;
    document.getElementById("food-name").focus();
}

function cancelFoodEdit() {
    editingFoodIndex = -1;
    window.fitcalcPendingFood = null;
    const button = document.getElementById("add-food");
    if (button) button.textContent = "Add to log";
    const cancel = document.getElementById("cancel-food-edit");
    if (cancel) cancel.hidden = true;
    const name = document.getElementById("food-name");
    const amount = document.getElementById("food-amount");
    if (name) name.value = "";
    if (amount) amount.value = "";
}

const cancelFoodEditButton = document.getElementById("cancel-food-edit");
if (cancelFoodEditButton) cancelFoodEditButton.addEventListener("click", cancelFoodEdit);

function calculateLoggedFood(foodData, amount, meal) {
    const factor = Number(amount) / 100;
    return {
        name: String(foodData.name), amount: Number(amount), meal: meal || "Snack",
        calories: (Number(foodData.calories) || 0) * factor,
        protein: (Number(foodData.protein) || 0) * factor,
        carbs: (Number(foodData.carbs) || 0) * factor,
        fat: (Number(foodData.fat) || 0) * factor,
        fiber: (Number(foodData.fiber) || 0) * factor,
        source: foodData.source || "FitCalc local list",
        barcode: foodData.barcode || ""
    };
}

function recalculateNutritionTotals(nutrition) {
    ["calories", "protein", "carbs", "fat", "fiber"].forEach(function (key) {
        nutrition[key] = (nutrition.foods || []).reduce(function (sum, food) { return sum + (Number(food[key]) || 0); }, 0);
    });
}


/*
 * ADD FOOD
 */

const addFoodButton =
    document.getElementById(
        "add-food"
    );


if (addFoodButton) {

    addFoodButton.addEventListener(
        "click",
        function () {

            const foodName =
                document.getElementById(
                    "food-name"
                ).value;


            const foodAmount =
                Number(
                    document.getElementById(
                        "food-amount"
                    ).value
                );


            if (!foodName.trim()) {

                window.fitcalcToast("Enter a food name.", "error");

                return;

            }


            if (
                !Number.isFinite(foodAmount) ||
                foodAmount <= 0
            ) {

                window.fitcalcToast("Enter an amount greater than zero.", "error");

                return;

            }


            const pending = window.fitcalcPendingFood;
            const foodData = pending && pending.name.toLowerCase() === foodName.trim().toLowerCase()
                ? pending
                : findFood(foodName);


            if (!foodData) {

                window.fitcalcToast("That food is not in the local list. Search the food database or choose a listed item.", "error");

                return;

            }


            const food = calculateLoggedFood(foodData, foodAmount, document.getElementById("food-meal").value);


            const nutrition =
                getNutrition();


            const wasEditing = editingFoodIndex >= 0;
            if (wasEditing && nutrition.foods[editingFoodIndex]) {
                nutrition.foods[editingFoodIndex] = food;
            } else {
                nutrition.foods.push(food);
            }
            recalculateNutritionTotals(nutrition);


            saveNutrition(
                nutrition
            );


            document.getElementById(
                "food-name"
            ).value = "";


            document.getElementById(
                "food-amount"
            ).value = "";

            cancelFoodEdit();


            updateNutritionDisplay();

            updateFoodList();
            window.fitcalcToast(wasEditing ? "Food entry updated." : "Food added to your log.");

        }
    );

}


/*
 * WATER
 */

function updateWaterDisplay(
    nutrition
) {

    if (!nutrition) {

        nutrition =
            getNutrition();

    }


    const water =
        Number(nutrition.water) || 0;


    const waterEl =
        document.getElementById(
            "planner-water"
        );


    if (waterEl) {

        waterEl.textContent =
            water.toFixed(2);

    }

    const waterGoal = document.getElementById("nutrition-water-goal");
    if (waterGoal) waterGoal.textContent = Number(WATER_GOAL_L).toFixed(2);

    const waterProgressEl =
        document.getElementById(
            "water-progress"
        );


    if (waterProgressEl) {

        const percentage =
            Math.min(
                (water / WATER_GOAL_L) * 100,
                100
            );


        waterProgressEl.style.width =
            percentage + "%";
        const meter = waterProgressEl.closest('[role="progressbar"]');
        if (meter) meter.setAttribute("aria-valuenow", String(Math.round(percentage)));

    }

}


/*
 * ADD WATER
 */

const addWaterButton =
    document.getElementById(
        "add-water"
    );


if (addWaterButton) {

    addWaterButton.addEventListener(
        "click",
        function () {

            const nutrition =
                getNutrition();


            nutrition.water +=
                0.25;


            saveNutrition(
                nutrition
            );


            updateWaterDisplay(
                nutrition
            );

        }
    );

}


/*
 * RESET WATER
 */

const resetWaterButton =
    document.getElementById(
        "reset-water"
    );


if (resetWaterButton) {

    resetWaterButton.addEventListener(
        "click",
        function () {

            const nutrition =
                getNutrition();


            nutrition.water = 0;


            saveNutrition(
                nutrition
            );


            updateWaterDisplay(
                nutrition
            );

        }
    );

}


/*
 * INITIALIZE
 */

updateNutritionDisplay();

updateFoodList();

updateWaterDisplay();
updateNutritionDateDisplay();
