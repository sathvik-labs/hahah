const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const vm = require("vm");

const values = new Map();
const localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); }
};

// load constants + target engine in a sandbox (they are plain browser scripts)
const ctx = {
  module: { exports: {} }, console, localStorage,
  document: { getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } },
  window: { addEventListener() {} }
};
vm.createContext(ctx);
["constants.js", "store.js", "target.js", "progress.js", "nutrition.js", "workout.js", "food-api.js", "exercise-api.js", "dashboard.js", "adaptive.js"].forEach((f) =>
  vm.runInContext(fs.readFileSync(__dirname + "/../" + f, "utf8"), ctx));
const { computeTargets, calculateBMR } = ctx.module.exports;

const male = { sex: "male", age: 25, height: 180, weight: 80, activity: "moderate", goal: "maintain" };

test("Mifflin-St Jeor BMR", () => {
  assert.strictEqual(Math.round(calculateBMR(male)), 1805);
  assert.strictEqual(Math.round(calculateBMR({ ...male, sex: "female" })), 1639);
});

test("goal adjustments", () => {
  const m = computeTargets(male), l = computeTargets({ ...male, goal: "lose" }), g = computeTargets({ ...male, goal: "gain" });
  assert.strictEqual(l.calories, m.calories - 500);
  assert.strictEqual(g.calories, m.calories + 300);
});

test("calorie floor and non-negative carbs", () => {
  const small = computeTargets({ sex: "female", age: 60, height: 150, weight: 40, activity: "sedentary", goal: "lose" });
  assert.ok(small.calories >= 1200);
  assert.ok(small.carbs >= 0);
});

test("escapeHTML", () => {
  assert.strictEqual(ctx.escapeHTML("<b>&\"'"), "&lt;b&gt;&amp;&quot;&#39;");
});

test("corrupt storage falls back without throwing", () => {
  localStorage.setItem("broken", "{");
  assert.strictEqual(ctx.readJSON("broken", "safe"), "safe");
});

test("date reads do not create empty source records", () => {
  localStorage.removeItem("fitcalc_nutrition");
  const before = localStorage.getItem("fitcalc_nutrition");
  assert.strictEqual(ctx.getNutritionFor("2026-09-28").water, 0);
  assert.strictEqual(localStorage.getItem("fitcalc_nutrition"), before);
  assert.strictEqual(ctx.getProgressRecord("2026-09-28"), null);
});

test("nutrition and planner saves remain keyed by date", () => {
  ctx.saveNutritionFor("2026-09-28", { calories: 400, water: 0.5, foods: [{ name: "Oats" }] });
  ctx.savePlannerFor("2026-09-28", { steps: 6420, weight: 72.5, workouts: [], tasks: [] });
  assert.strictEqual(ctx.getNutritionFor("2026-09-28").calories, 400);
  assert.strictEqual(ctx.getNutritionFor("2026-09-29").calories, 0);
  assert.strictEqual(ctx.getPlannerFor("2026-09-28").steps, 6420);
  assert.strictEqual(ctx.getPlannerFor("2026-09-29").steps, 0);
});

test("food portions scale every nutrient and meal totals can be recomputed", () => {
  const food = ctx.calculateLoggedFood({ name: "Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }, 150, "Lunch");
  assert.strictEqual(food.calories, 195);
  assert.strictEqual(food.meal, "Lunch");
  const day = { foods: [food, ctx.calculateLoggedFood({ name: "Egg", calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 }, 50, "Breakfast")] };
  ctx.recalculateNutritionTotals(day);
  assert.strictEqual(day.calories, 266.5);
  assert.ok(Math.abs(day.protein - 10.35) < 0.001);
});

test("history captures real nutrition and completed workout performance", () => {
  const date = "2026-09-30";
  ctx.saveNutritionFor(date, { calories: 600, protein: 35, carbs: 50, fat: 20, fiber: 4, water: 1.25, foods: [{ name: "Lunch", meal: "Lunch" }] });
  ctx.savePlannerFor(date, { date, steps: 5000, weight: 73, workouts: [{ name: "Push", completed: true, exercises: [{ name: "Bench press", sets: [{ reps: 8, weight: 60 }] }] }], tasks: [{ name: "Walk", completed: true }] });
  const record = ctx.saveProgressRecord(date);
  assert.strictEqual(record.calories, 600);
  assert.strictEqual(record.water, 1.25);
  assert.strictEqual(record.workouts[0].exercises[0].sets[0].weight, 60);
  assert.strictEqual(record.completedWorkouts, 1);
  assert.strictEqual(record.tasks, 1);
});

test("workout completion requires logged actual performance", () => {
  assert.strictEqual(ctx.hasWorkoutPerformance({ exercises: [{ sets: [] }] }), false);
  assert.strictEqual(ctx.hasWorkoutPerformance({ exercises: [{ sets: [{ reps: 8, weight: 0 }] }] }), true);
  assert.strictEqual(ctx.formatWorkoutSet({ durationMinutes: 25 }), "25 min");
});

test("external food and exercise records are normalized without trusting markup", () => {
  const food = ctx.normalizeOpenFoodFactsProduct({ code: "12345678", product_name: "Example oats", nutriments: { "energy-kcal_100g": 389, proteins_100g: 16.9, carbohydrates_100g: 66, fat_100g: 6.9, fiber_100g: 10.6 } });
  assert.strictEqual(food.calories, 389);
  assert.strictEqual(ctx.normalizeOpenFoodFactsProduct({ product_name: "No values" }), null);
  const exercise = ctx.normalizeWgerExercise({ id: 5, name: "Press", category: { name: "Chest" }, muscles: [{ name: "Pectoralis" }] });
  assert.strictEqual(exercise.provider, "wger");
  assert.strictEqual(exercise.category, "Chest");
});

test("dashboard progress is finite and bounded using saved daily state", () => {
  const today = ctx.getDateKey(new Date());
  ctx.writeJSON("fitcalc_targets", { calories: 2000, protein: 100, carbs: 200, fat: 70, fiber: 25 });
  ctx.saveNutritionFor(today, { calories: 1000, protein: 50, carbs: 100, fat: 35, fiber: 12, water: 2, foods: [] });
  ctx.savePlannerFor(today, { steps: 5000, workouts: [], tasks: [] });
  const progress = ctx.getDashboardDailyProgress();
  assert.ok(Number.isFinite(progress));
  assert.ok(progress >= 0 && progress <= 100);
});

test("adaptive exercise insight detects repeated logged performance", () => {
  for (let offset = 1; offset <= 3; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = ctx.getDateKey(date);
    ctx.savePlannerFor(key, { date: key, workouts: [{ name: "Push", completed: true, exercises: [{ name: "Bench press", sets: [{ reps: 8, weight: 60 }] }] }], tasks: [] });
    ctx.saveProgressRecord(key);
  }
  assert.ok(ctx.getWorkoutProgressionInsights().some((item) => item.includes("Bench press") && item.includes("three sessions")));
});

test("history range is a calendar window rather than N saved records", () => {
  const date = new Date();
  date.setDate(date.getDate() - 12);
  const key = ctx.getDateKey(date);
  ctx.savePlannerFor(key, { date: key, steps: 8000, workouts: [], tasks: [] });
  ctx.saveProgressRecord(key);
  assert.ok(!ctx.getProgressRecordsForDays(7).some((record) => record.date === key));
});
