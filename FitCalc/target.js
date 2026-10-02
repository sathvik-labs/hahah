/*
 * Target engine. Pure functions + refreshTargets().
 * profile -> BMR -> TDEE -> goal adjustment -> targets (saved to fitcalc_targets)
 */
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
};

function calculateBMR(profile) {
    const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    if (profile.sex === "male") return base + 5;
    if (profile.sex === "female") return base - 161;
    return 0;
}

function calculateTDEE(bmr, activity) {
    return bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.2);
}

function calculateCalorieTarget(tdee, goal, sex) {
    const adjusted = tdee + (GOAL_ADJUSTMENT[goal] || 0);
    const floor = CALORIE_FLOOR[sex] || 1200;
    return Math.max(adjusted, floor);
}

function calculateProteinTarget(profile) {
    const perKg = { lose: 2.0, maintain: 1.6, gain: 1.8 };
    return profile.weight * (perKg[profile.goal] || 1.6);
}

function computeTargets(profile) {
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(bmr, profile.activity);
    const calories = calculateCalorieTarget(tdee, profile.goal, profile.sex);
    const protein = calculateProteinTarget(profile);
    const fat = profile.weight * 0.8;
    const carbs = Math.max((calories - protein * 4 - fat * 9) / 4, 0);
    return {
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        fiber: Math.round(calories * 14 / 1000),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee)
    };
}

function refreshTargets() {
    const p = getProfile();
    if (p.sex && p.age && p.height && p.weight && p.activity && p.goal) {
        writeJSON(TARGETS_KEY, computeTargets(p));
    }
}

if (typeof document !== "undefined") { refreshTargets(); }
if (typeof module !== "undefined") { module.exports = { computeTargets, calculateBMR, calculateTDEE, calculateCalorieTarget }; }
