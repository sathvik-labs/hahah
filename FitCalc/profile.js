const profileForm = document.getElementById("profile-form");

function renderProfileTargets() {
    const targets = getTargets();
    const list = document.getElementById("profile-target-list");
    const empty = document.getElementById("profile-target-empty");
    if (!list || !empty) return;
    const available = Number(targets.calories) > 0;
    list.hidden = !available;
    empty.hidden = available;
    if (!available) return;
    ["calories", "protein", "carbs", "fat", "fiber"].forEach(function (key) {
        const value = document.getElementById("profile-target-" + key);
        if (value) value.textContent = Math.round(Number(targets[key]) || 0) + (key === "calories" ? " kcal" : " g");
    });
}

if (profileForm) {
    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const values = {
            age: Number(document.getElementById("profile-age").value),
            sex: document.getElementById("profile-sex").value,
            height: Number(document.getElementById("profile-height").value),
            weight: Number(document.getElementById("profile-weight").value),
            activity: document.getElementById("profile-activity").value,
            goal: document.getElementById("profile-goal").value
        };
        const status = document.getElementById("profile-status");
        if (values.age < 10 || values.age > 100 || values.height < 100 || values.height > 250 || values.weight < 30 || values.weight > 300) {
            if (status) status.textContent = "Check the values: age 10–100, height 100–250 cm, and weight 30–300 kg.";
            window.fitcalcToast("Please review the highlighted profile ranges.", "error");
            return;
        }
        updateProfile(values);
        if (typeof refreshTargets === "function") refreshTargets();
        renderProfileTargets();
        if (status) status.textContent = "Profile and estimated targets saved on this device.";
        window.fitcalcToast("Profile saved.");
    });
}

const savedProfile = getProfile();
if (profileForm && Object.keys(savedProfile).length > 0) {
    document.getElementById("profile-age").value = savedProfile.age || "";
    document.getElementById("profile-sex").value = savedProfile.sex || "";
    document.getElementById("profile-height").value = savedProfile.height || "";
    document.getElementById("profile-weight").value = savedProfile.weight || "";
    document.getElementById("profile-activity").value = savedProfile.activity || "";
    document.getElementById("profile-goal").value = savedProfile.goal || "";
}
document.addEventListener("DOMContentLoaded", renderProfileTargets);

