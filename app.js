const STORE_KEY = "repday-workout-v1";

function localDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateFromKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

const exercisesByMuscle = {
  shoulders: ["Overhead press", "Dumbbell lateral raise", "Reverse fly", "Arnold press", "Front dumbbell raise", "Cable rear delt fly", "Seated dumbbell press", "Band pull-apart"],
  chest: ["Barbell bench press", "Incline dumbbell press", "Push-up", "Dumbbell bench press", "Cable crossover", "Dumbbell fly", "Decline dumbbell press", "Machine chest press"],
  biceps: ["Dumbbell curl", "Barbell curl", "Hammer curl", "Incline dumbbell curl", "Concentration curl", "Preacher curl", "Cable hammer curl", "Spider curl"],
  forearms: ["Farmer carry", "Reverse curl", "Wrist curl", "Plate pinch", "Wrist roller", "Cable wrist curl", "Reverse wrist curl", "Finger curl"],
  core: ["Cable crunch", "Plank", "Dead bug", "Hanging leg raise", "Reverse crunch", "Ab roller", "Pallof press", "Cable wood chop"],
  quadriceps: ["Barbell squat", "Leg press", "Bulgarian split squat", "Front squat", "Goblet squat", "Leg extension", "Dumbbell lunge", "Hack squat"],
  calves: ["Standing calf raise", "Seated calf raise", "Leg press calf raise", "Donkey calf raise", "Standing dumbbell calf raise", "Seated barbell calf raise", "Smith machine calf raise", "Single-leg seated calf raise"],
  traps: ["Dumbbell shrug", "Barbell shrug", "Face pull", "Cable shrug", "Behind-the-back Smith shrug", "Machine shrug", "Cable upright row", "Scapular pull-up"],
  triceps: ["Cable pushdown", "Overhead triceps extension", "Close-grip press", "Bench dip", "EZ-bar skull crusher", "Rope pushdown", "One-arm dumbbell extension", "Lying cable triceps extension"],
  lats: ["Lat pulldown", "Seated cable row", "One-arm dumbbell row", "Pull-up", "Chin-up", "Close-grip lat pulldown", "Straight-arm pulldown", "One-arm lat pulldown"],
  "lower-back": ["Back extension", "Bird dog", "Good morning", "Barbell deadlift", "Rack pull", "Superman", "Reverse hyperextension", "Seated good morning"],
  glutes: ["Hip thrust", "Glute bridge", "Cable kickback", "Single-leg glute bridge", "Cable pull-through", "Glute kickback", "Banded hip extension", "Step-up with knee raise"],
  hamstrings: ["Romanian deadlift", "Seated leg curl", "Lying leg curl", "Standing leg curl", "Exercise ball leg curl", "Glute-ham raise", "Stiff-leg dumbbell deadlift", "Single-leg kettlebell deadlift"]
};

const timedExercises = new Set(["Plank", "Farmer carry", "Plate pinch", "Pallof press", "Superman"]);
const repsOnlyExercises = new Set([
  "Push-up", "Pull-up", "Chin-up", "Scapular pull-up", "Bench dip", "Band pull-apart",
  "Dead bug", "Bird dog", "Hanging leg raise", "Reverse crunch", "Ab roller", "Back extension",
  "Single-leg glute bridge", "Glute kickback", "Banded hip extension", "Step-up with knee raise",
  "Exercise ball leg curl", "Glute-ham raise", "Wide-grip push-ups", "Push-ups", "Raised-leg push-ups",
  "Punches", "Turning kicks", "High knees", "Sit-ups", "Leg raises", "Sitting twists"
]);

// Exercise lists only: completed sets are always entered by the user.
const workoutPresets = {
  shoulders: ["Overhead press", "Dumbbell lateral raise", "Reverse fly"],
  chest: ["Barbell bench press", "Incline dumbbell press", "Push-up"],
  biceps: ["Dumbbell curl", "Hammer curl"],
  forearms: ["Reverse curl", "Wrist curl"],
  core: ["Cable crunch", "Dead bug"],
  quadriceps: ["Barbell squat", "Leg press", "Bulgarian split squat"],
  calves: ["Standing calf raise", "Seated calf raise"],
  traps: ["Dumbbell shrug", "Face pull"],
  triceps: ["Cable pushdown", "Overhead triceps extension", "Close-grip press"],
  lats: ["Lat pulldown", "Seated cable row", "One-arm dumbbell row"],
  "lower-back": ["Back extension", "Bird dog"],
  glutes: ["Hip thrust", "Glute bridge", "Cable kickback"],
  hamstrings: ["Romanian deadlift", "Seated leg curl", "Lying leg curl"]
};

const superSaiyanExercises = [
  ["Wide-grip push-ups", 4, "Chest"],
  ["Push-ups", 6, "Chest"],
  ["Raised-leg push-ups", 4, "Chest"],
  ["Punches", 60, "Shoulders"],
  ["Turning kicks", 40, "Quadriceps"],
  ["High knees", 30, "Quadriceps"],
  ["Sit-ups", 10, "Core"],
  ["Leg raises", 10, "Core"],
  ["Sitting twists", 10, "Core"]
];

const muscleLabels = {
  shoulders: "Shoulders", chest: "Chest", biceps: "Biceps", forearms: "Forearms",
  core: "Core", quadriceps: "Quadriceps", calves: "Calves", traps: "Traps",
  triceps: "Triceps", lats: "Lats", "lower-back": "Lower back",
  glutes: "Glutes", hamstrings: "Hamstrings"
};

const musclesByView = {
  front: ["shoulders", "chest", "biceps", "forearms", "core", "quadriceps", "calves"],
  back: ["shoulders", "traps", "triceps", "lats", "lower-back", "glutes", "hamstrings", "calves"]
};

const REST_OPTIONS = [0, 30, 60, 90, 120, 180];
const WEEKDAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];

function emptyState() {
  return {
    appView: "build",
    bodyView: "front",
    muscle: "chest",
    exercise: "",
    weightUnit: "lb",
    weeklyGoal: 3,
    specialRounds: 3,
    restSeconds: 90,
    restEndsAt: null,
    restTotal: 0,
    workoutDate: localDateKey(new Date()),
    selectedDay: localDateKey(new Date()),
    calendarMonth: localDateKey(new Date()).slice(0, 7),
    manualDays: [],
    dayNotes: {},
    weekPlan: {},
    bodyWeights: [],
    recordsExercise: "",
    session: null,
    history: [],
    savedWorkouts: []
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!saved || typeof saved !== "object") return emptyState();
    return {
      ...emptyState(),
      ...saved,
      appView: ["build", "log", "special", "history"].includes(saved.appView) ? saved.appView : "build",
      specialRounds: [3, 5, 7, 10].includes(Number(saved.specialRounds)) ? Number(saved.specialRounds) : 3,
      bodyView: saved.bodyView === "back" ? "back" : "front",
      restSeconds: REST_OPTIONS.includes(Number(saved.restSeconds)) ? Number(saved.restSeconds) : 90,
      restEndsAt: Number.isFinite(Number(saved.restEndsAt)) && Number(saved.restEndsAt) > Date.now() ? Number(saved.restEndsAt) : null,
      restTotal: Number.isFinite(Number(saved.restTotal)) && Number(saved.restTotal) > 0 ? Number(saved.restTotal) : 0,
      weightUnit: saved.weightUnit === "kg" ? "kg" : "lb",
      weeklyGoal: Number.isInteger(Number(saved.weeklyGoal)) && Number(saved.weeklyGoal) >= 1 && Number(saved.weeklyGoal) <= 7 ? Number(saved.weeklyGoal) : 3,
      workoutDate: isDateKey(saved.workoutDate) ? saved.workoutDate : localDateKey(new Date()),
      selectedDay: isDateKey(saved.selectedDay) ? saved.selectedDay : localDateKey(new Date()),
      calendarMonth: /^\d{4}-\d{2}$/.test(saved.calendarMonth) && isDateKey(saved.calendarMonth + "-01") ? saved.calendarMonth : localDateKey(new Date()).slice(0, 7),
      manualDays: Array.isArray(saved.manualDays) ? [...new Set(saved.manualDays.filter(isDateKey))] : [],
      dayNotes: saved.dayNotes && typeof saved.dayNotes === "object" && !Array.isArray(saved.dayNotes) ? saved.dayNotes : {},
      weekPlan: saved.weekPlan && typeof saved.weekPlan === "object" && !Array.isArray(saved.weekPlan)
        ? Object.fromEntries(Object.entries(saved.weekPlan).filter(([day, id]) => WEEKDAYS.some(([key]) => key === day) && typeof id === "string"))
        : {},
      bodyWeights: Array.isArray(saved.bodyWeights)
        ? saved.bodyWeights.filter((entry) => entry && isDateKey(entry.day) && Number.isFinite(Number(entry.weight)) && Number(entry.weight) > 0 && ["lb", "kg"].includes(entry.unit))
          .map((entry) => ({ day: entry.day, weight: Number(entry.weight), unit: entry.unit }))
        : [],
      recordsExercise: typeof saved.recordsExercise === "string" ? saved.recordsExercise : "",
      session: saved.session && Array.isArray(saved.session.exercises) ? {
        ...saved.session,
        exercises: saved.session.exercises.map((item) => {
          if (timedExercises.has(item.exercise)) {
            const { pendingWeight, pendingReps, ...rest } = item;
            return rest;
          }
          if (repsOnlyExercises.has(item.exercise)) {
            const { pendingWeight, ...rest } = item;
            return rest;
          }
          return item;
        })
      } : null,
      history: Array.isArray(saved.history) ? saved.history : [],
      savedWorkouts: Array.isArray(saved.savedWorkouts)
        ? saved.savedWorkouts.filter((workout) => workout && typeof workout.name === "string" && Array.isArray(workout.exercises))
          .map((workout) => (typeof workout.id === "string" && workout.id ? workout : { ...workout, id: makeId() }))
        : []
    };
  } catch {
    return emptyState();
  }
}

const state = loadState();
const map = document.getElementById("body-map");
const muscleChoices = document.getElementById("muscle-choices");
const exerciseTitle = document.getElementById("exercise-title");
const exerciseCount = document.getElementById("exercise-count");
const exerciseList = document.getElementById("exercise-list");
const draftList = document.getElementById("draft-list");
const draftCount = document.getElementById("draft-count");
const draftEmpty = document.getElementById("draft-empty");
const navCount = document.getElementById("nav-log-count");
const logSession = document.getElementById("log-session");
const finishButton = document.getElementById("finish-workout");
const unitSelect = document.getElementById("weight-unit");
const workoutDateInput = document.getElementById("workout-date");
const historyList = document.getElementById("history-list");
const toast = document.getElementById("app-toast");
let toastTimer;

const illustratedGuides = {
  "Bird dog": {
    image: "/assets/exercise-guides/bird-dog.svg",
    steps: ["Start on hands and knees.", "Reach one arm forward and the opposite leg back, then return and switch sides."]
  },
  "Punches": {
    image: "/assets/exercise-guides/punches.svg",
    steps: ["Keep your hands near your face.", "Extend one arm, turn through your hips, then return the hand before alternating."],
    source: "https://darebee.com/exercises/punches-exercise.html"
  },
  "High knees": {
    image: "/assets/exercise-guides/high-knees.svg",
    steps: ["Stand tall with your arms ready to move.", "Drive one knee up, lower it, then alternate knees."]
  },
  "Turning kicks": {
    image: "/assets/exercise-guides/turning-kicks.svg",
    steps: ["Keep your hands up and turn your supporting foot.", "Lift your knee and extend the kicking leg across, then return to your stance."],
    source: "https://darebee.com/workouts/super-saiyan-workout.html"
  }
};

function guideButton(name) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "guide-trigger";
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/></svg><span class="guide-label">Guide</span>';
  button.title = "See movement";
  button.setAttribute("aria-label", "See how to do " + name);
  button.addEventListener("click", () => openExerciseGuide(name));
  return button;
}

function openExerciseGuide(name) {
  const dialog = document.getElementById("exercise-guide");
  const content = document.getElementById("guide-content");
  const photoGuide = exerciseGuides[name];
  const illustrated = illustratedGuides[name];
  document.getElementById("guide-title").textContent = name;
  content.replaceChildren();

  if (photoGuide) {
    const poses = document.createElement("div");
    poses.className = "guide-poses";
    photoGuide.images.forEach((src, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = src;
      image.alt = name + " movement position " + (index + 1);
      image.loading = "eager";
      const caption = document.createElement("figcaption");
      caption.textContent = "POSITION " + (index + 1);
      figure.append(image, caption);
      poses.append(figure);
    });
    content.append(poses);
    const example = document.createElement("p");
    example.className = "guide-example";
    example.textContent = "Photo example: " + photoGuide.source;
    content.append(example);
    appendGuideSteps(content, photoGuide.steps);
    appendGuideCredit(content, "Photos and instructions: Free Exercise DB (public domain)", "https://github.com/yuhonas/free-exercise-db");
  } else if (illustrated) {
    const image = document.createElement("img");
    image.src = illustrated.image;
    image.alt = "Two poses showing how to do " + name;
    image.className = "guide-illustration";
    content.append(image);
    appendGuideSteps(content, illustrated.steps);
    if (illustrated.source) appendGuideCredit(content, "See source demonstration", illustrated.source);
  } else {
    const note = document.createElement("p");
    note.textContent = "A movement guide is not available for this exercise yet.";
    content.append(note);
  }
  dialog.showModal();
}

function appendGuideSteps(parent, steps) {
  const heading = document.createElement("h3");
  heading.textContent = "How to move";
  const list = document.createElement("ol");
  list.className = "guide-steps";
  steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    list.append(item);
  });
  parent.append(heading, list);
}

function appendGuideCredit(parent, label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "guide-credit";
  link.textContent = label + " ↗";
  parent.append(link);
}

function renderSpecialGuideButtons() {
  document.querySelectorAll(".special-exercises > li").forEach((item, index) => {
    const description = document.createElement("span");
    while (item.firstChild) description.append(item.firstChild);
    item.append(description, guideButton(superSaiyanExercises[index][0]));
  });
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
}

function saveState() {
  const status = document.getElementById("topbar-status");
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    status.innerHTML = '<span class="live-dot"></span> SAVED ON THIS DEVICE';
    status.classList.remove("storage-warning");
    return true;
  } catch {
    status.textContent = "SAVE UNAVAILABLE";
    status.classList.add("storage-warning");
    return false;
  }
}

function showToast(message, action) {
  toast.replaceChildren(document.createTextNode(message));
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-action";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      toast.hidden = true;
      action.run();
    });
    toast.append(button);
  }
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, action ? 6000 : 3200);
}

function confirmAction(title, message, okLabel) {
  const dialog = document.getElementById("confirm-dialog");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-ok").textContent = okLabel;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}

function cloneSession(session) {
  return JSON.parse(JSON.stringify(session));
}

function countSets(session) {
  return session.exercises.reduce((sum, item) => sum + item.sets.length, 0);
}

function plural(count, word) {
  return count + " " + word + (count === 1 ? "" : "s");
}

async function discardWorkout() {
  if (!state.session) return;
  const sets = countSets(state.session);
  const ok = await confirmAction(
    "Discard today's workout?",
    plural(state.session.exercises.length, "exercise") + (sets ? " and " + plural(sets, "logged set") : "") + " will be removed. You can undo right after.",
    "Discard"
  );
  if (!ok) return;
  const removed = cloneSession(state.session);
  state.session = null;
  state.restEndsAt = null;
  saveState();
  renderApp();
  showToast("Workout discarded.", {
    label: "Undo",
    run: () => {
      state.session = removed;
      saveState();
      renderApp();
    }
  });
}

async function deleteHistoryWorkout(session) {
  const ok = await confirmAction(
    "Delete this workout?",
    "It will be removed from History and your progress. You can undo right after.",
    "Delete"
  );
  if (!ok) return;
  const index = state.history.indexOf(session);
  if (index === -1) return;
  state.history.splice(index, 1);
  saveState();
  renderApp();
  showToast("Workout deleted.", {
    label: "Undo",
    run: () => {
      state.history.splice(Math.min(index, state.history.length), 0, session);
      saveState();
      renderApp();
    }
  });
}

function templateFrom(session, name) {
  return {
    id: makeId(),
    name,
    createdAt: new Date().toISOString(),
    exercises: session.exercises.map((item) => {
      const entry = { exercise: item.exercise, muscle: item.muscle };
      if (item.targetReps) {
        entry.targetReps = item.targetReps;
        entry.targetSets = item.targetSets;
      }
      return entry;
    })
  };
}

function workoutLabel(session) {
  const muscles = [...new Set(session.exercises.map((item) => item.muscle))];
  return muscles.length <= 2 ? muscles.join(" & ") : "Full body";
}

function shortDate(iso) {
  return formatDate(iso, { month: "short", day: "numeric" });
}

function openSaveDialog() {
  if (!state.session || !state.session.exercises.length) return;
  const sets = countSets(state.session);
  const clear = document.getElementById("save-clear");
  document.getElementById("save-name").value = workoutLabel(state.session) + " · " + shortDate(new Date().toISOString());
  clear.checked = sets === 0;
  document.getElementById("save-clear-hint").textContent = sets
    ? "You've logged " + plural(sets, "set") + " today. Clearing removes them; finish the workout instead to keep them in History."
    : "Only the exercise list is saved, not weights or reps.";
  document.getElementById("save-dialog").showModal();
  document.getElementById("save-name").select();
}

function saveForLater(event) {
  event.preventDefault();
  const name = document.getElementById("save-name").value.trim();
  if (!name || !state.session) return;
  state.savedWorkouts.unshift(templateFrom(state.session, name));
  const clear = document.getElementById("save-clear").checked;
  if (clear) {
    state.session = null;
    state.restEndsAt = null;
    state.appView = "build";
  }
  saveState();
  document.getElementById("save-dialog").close();
  renderApp();
  if (clear) window.scrollTo({ top: 0, behavior: "instant" });
  showToast("Saved “" + name + "”" + (clear ? " and cleared today's log." : "."));
}

function startSavedWorkout(saved) {
  if (!state.session) {
    state.session = { id: makeId(), startedAt: new Date().toISOString(), workoutDate: state.workoutDate, weightUnit: state.weightUnit, exercises: [] };
  }
  let added = 0;
  saved.exercises.forEach((entry) => {
    if (state.session.exercises.some((item) => item.exercise === entry.exercise)) return;
    state.session.exercises.push({ ...entry, id: makeId(), sets: [] });
    added += 1;
  });
  state.appView = "log";
  saveState();
  renderApp();
  window.scrollTo({ top: 0, behavior: "instant" });
  showToast(added ? saved.name + " loaded · " + plural(added, "exercise") + "." : "Those exercises are already in today's workout.");
}

async function deleteSavedWorkout(saved) {
  const ok = await confirmAction("Delete “" + saved.name + "”?", "This removes the saved workout. Your History is not affected.", "Delete");
  if (!ok) return;
  const index = state.savedWorkouts.indexOf(saved);
  if (index === -1) return;
  state.savedWorkouts.splice(index, 1);
  saveState();
  renderHome();
  showToast("Saved workout deleted.", {
    label: "Undo",
    run: () => {
      state.savedWorkouts.splice(Math.min(index, state.savedWorkouts.length), 0, saved);
      saveState();
      renderHome();
    }
  });
}

function saveHistoryAsTemplate(session) {
  const name = workoutLabel(session) + " · " + shortDate(dateFromKey(workoutDay(session)).toISOString());
  state.savedWorkouts.unshift(templateFrom(session, name));
  saveState();
  renderHome();
  showToast("Saved “" + name + "” to your workouts.");
}

const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const plusIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const trashIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

// ---------- Last time, next target and personal records ----------
// Ideas from open-source trackers (MyFit, wger, Flexify, openGym), written fresh:
// show what you did last time, suggest a next step with the reason, flag records.
const LB_PER_KG = 2.20462;
const WEIGHT_STEP = { lb: 5, kg: 2.5 };

function setKind(set, exercise) {
  if (Number.isInteger(set.durationSeconds) && set.durationSeconds > 0) return "time";
  if (set.mode === "reps" || !(Number(set.weight) > 0)) return "reps";
  return "weight";
}

function estimatedOneRepMax(weight, reps) {
  return weight * (1 + reps / 30);
}

// One number per set that goes up when you got better at it.
function setScore(set, exercise) {
  const kind = setKind(set, exercise);
  if (kind === "time") return set.durationSeconds;
  if (kind === "reps") return Number(set.reps) || 0;
  return estimatedOneRepMax(Number(set.weight), Number(set.reps) || 0);
}

// Finished workouts that include this exercise, oldest first.
function exerciseSessions(name) {
  const rows = [];
  state.history.forEach((session) => {
    if (!Array.isArray(session.exercises)) return;
    const day = workoutDay(session);
    session.exercises.forEach((item) => {
      if (item.exercise !== name || !Array.isArray(item.sets) || item.sets.length === 0) return;
      rows.push({ day, completedAt: session.completedAt || "", sets: item.sets });
    });
  });
  rows.sort((a, b) => (a.day === b.day ? String(a.completedAt).localeCompare(String(b.completedAt)) : a.day.localeCompare(b.day)));
  return rows;
}

function isPersonalRecord(exercise, set, earlierSets) {
  const kind = setKind(set, exercise);
  const score = setScore(set, exercise);
  if (!(score > 0)) return false;
  let seen = false;
  let best = 0;
  const consider = (other) => {
    if (setKind(other, exercise) !== kind) return;
    if (kind === "weight" && other.unit !== set.unit) return;
    seen = true;
    best = Math.max(best, setScore(other, exercise));
  };
  exerciseSessions(exercise).forEach((entry) => entry.sets.forEach(consider));
  if (!seen) return false; // the first time you do a lift there is nothing to beat yet
  earlierSets.forEach(consider);
  return score > best + 0.01;
}

function cleanNumber(value) {
  return Number(Number(value).toFixed(2));
}

// "135 lb × 8, 8, 6 reps · 145 lb × 5 reps"
function summariseSets(sets, exercise) {
  const groups = [];
  sets.forEach((set) => {
    const kind = setKind(set, exercise);
    const key = kind === "weight" ? set.weight + " " + set.unit : kind;
    const value = kind === "time" ? formatDuration(set.durationSeconds) : String(set.reps);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.values.push(value);
    else groups.push({ key, kind, values: [value] });
  });
  return groups.map((group) => {
    if (group.kind === "weight") return group.key + " × " + group.values.join(", ") + " reps";
    if (group.kind === "reps") return group.values.join(", ") + " reps";
    return group.values.join(", ");
  }).join(" · ");
}

// What you did last time, and a suggested step with the reason behind it.
// Rule of thumb for weighted lifts: work up through 8–12 reps, then add weight.
function nextTarget(exercise, unit) {
  const sessions = exerciseSessions(exercise);
  if (sessions.length === 0) return null;
  const last = sessions[sessions.length - 1];
  const kind = setKind(last.sets[last.sets.length - 1], exercise);
  const sets = last.sets.filter((set) => setKind(set, exercise) === kind && (kind !== "weight" || set.unit === unit));
  const info = { last, kind, prefill: null, suggestion: null };
  if (sets.length === 0) return info;

  if (kind === "weight") {
    const top = Math.max(...sets.map((set) => Number(set.weight)));
    const reps = sets.filter((set) => Number(set.weight) === top).map((set) => Number(set.reps));
    const minReps = Math.min(...reps);
    info.prefill = { weight: String(top), reps: String(reps[0]) };
    if (minReps >= 12) {
      const weight = cleanNumber(top + WEIGHT_STEP[unit]);
      info.suggestion = { weight: String(weight), reps: 8, text: weight + " " + unit + " × 8+ reps",
        why: "Every set at " + top + " " + unit + " reached " + minReps + "+ reps last time, so it's time to go up." };
    } else if (minReps >= 8) {
      info.suggestion = { weight: String(top), reps: minReps + 1, text: top + " " + unit + " × " + (minReps + 1) + "+ reps",
        why: "You did " + reps.join(", ") + " reps at " + top + " " + unit + ". Add a rep before adding weight." };
    } else {
      info.suggestion = { weight: String(top), reps: 8, text: top + " " + unit + " × 8+ reps",
        why: "Build up to 8 reps at " + top + " " + unit + " before going heavier." };
    }
  } else if (kind === "reps") {
    const best = Math.max(...sets.map((set) => Number(set.reps)));
    info.prefill = { weight: null, reps: String(sets[sets.length - 1].reps) };
    info.suggestion = { weight: null, reps: best + 1, text: (best + 1) + "+ reps in a set", why: "Your best set last time was " + best + " reps." };
  } else {
    const best = Math.max(...sets.map((set) => set.durationSeconds));
    info.suggestion = { weight: null, reps: null, text: "hold " + formatDuration(best + 5), why: "Your longest hold last time was " + formatDuration(best) + ". Add 5 seconds." };
  }
  return info;
}

function prBadge() {
  const badge = document.createElement("em");
  badge.className = "pr-badge";
  badge.textContent = "PR";
  badge.title = "Personal record";
  return badge;
}

function renderLastTime(card, item, info) {
  if (!info) return;
  const box = document.createElement("div");
  box.className = "last-time";
  const head = document.createElement("span");
  head.className = "last-time-head";
  head.textContent = "LAST TIME · " + formatDate(dateFromKey(info.last.day).toISOString(), { weekday: "short", month: "short", day: "numeric" });
  const summary = document.createElement("p");
  summary.className = "last-time-sets";
  summary.textContent = summariseSets(info.last.sets, item.exercise);
  box.append(head, summary);
  if (info.suggestion && item.sets.length === 0) {
    const row = document.createElement("div");
    row.className = "next-target";
    const text = document.createElement("span");
    const label = document.createElement("small");
    label.textContent = "TRY";
    const value = document.createElement("strong");
    value.textContent = info.suggestion.text;
    text.append(label, value);
    row.append(text);
    if (info.suggestion.weight !== null || info.suggestion.reps !== null) {
      const use = document.createElement("button");
      use.type = "button";
      use.className = "ghost-button small";
      use.textContent = "Use";
      use.setAttribute("aria-label", "Use suggested target for " + item.exercise + ": " + info.suggestion.text);
      use.addEventListener("click", () => {
        const active = state.session && state.session.exercises.find((entry) => entry.id === item.id);
        if (!active) return;
        if (info.suggestion.weight !== null) active.pendingWeight = info.suggestion.weight;
        if (info.suggestion.reps !== null) active.pendingReps = String(info.suggestion.reps);
        saveState();
        renderLog();
      });
      row.append(use);
    }
    const why = document.createElement("small");
    why.className = "next-target-why";
    why.textContent = info.suggestion.why;
    box.append(row, why);
  }
  card.append(box);
}

// ---------- Exercise progress: records and charts ----------
function exerciseRecord(name) {
  const sessions = exerciseSessions(name);
  if (sessions.length === 0) return null;
  const lastSet = sessions[sessions.length - 1].sets[sessions[sessions.length - 1].sets.length - 1];
  const kind = setKind(lastSet, name);
  const unit = kind === "weight" ? lastSet.unit : "";
  const points = [];
  let runningBest = 0;
  let best = null;
  sessions.forEach((entry) => {
    const usable = entry.sets.filter((set) => setKind(set, name) === kind && (kind !== "weight" || set.unit === unit));
    if (usable.length === 0) return;
    const value = Math.max(...usable.map((set) => (kind === "time" ? set.durationSeconds : kind === "reps" ? Number(set.reps) : Number(set.weight))));
    points.push({ day: entry.day, value, record: points.length > 0 && value > runningBest });
    runningBest = Math.max(runningBest, value);
    usable.forEach((set) => {
      const score = setScore(set, name);
      if (!best || score > best.score) best = { set, score, day: entry.day };
    });
  });
  return points.length ? { name, kind, unit, points, best } : null;
}

function shortDay(day) {
  return formatDate(dateFromKey(day).toISOString(), { month: "short", day: "numeric" });
}

// A small dependency-free line chart. Orange dots are new highs.
function renderLineChart(host, points, options) {
  host.replaceChildren();
  const NS = "http://www.w3.org/2000/svg";
  const W = 320, H = 156, left = 40, right = 12, top = 14, bottom = 28;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("class", "line-chart");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", options.label);
  const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  };
  const values = points.map((point) => point.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const flat = dataMin === dataMax;
  const low = flat ? dataMin - 1 : dataMin - (dataMax - dataMin) * 0.12;
  const high = flat ? dataMax + 1 : dataMax + (dataMax - dataMin) * 0.12;
  const x = (index) => (points.length === 1 ? (left + W - right) / 2 : left + (index * (W - left - right)) / (points.length - 1));
  const y = (value) => top + (1 - (value - low) / (high - low)) * (H - top - bottom);
  const guides = flat ? [dataMax] : [dataMax, dataMin];
  guides.forEach((value) => {
    svg.append(make("line", { x1: left, x2: W - right, y1: y(value), y2: y(value), class: "chart-grid" }));
    const text = make("text", { x: left - 6, y: y(value) + 3.5, class: "chart-text", "text-anchor": "end" });
    text.textContent = options.format(value);
    svg.append(text);
  });
  if (points.length > 1) {
    svg.append(make("polyline", { points: points.map((point, index) => x(index) + "," + y(point.value)).join(" "), class: "chart-line" }));
  }
  points.forEach((point, index) => {
    const dot = make("circle", { cx: x(index), cy: y(point.value), r: 4, class: "chart-dot" + (point.record ? " is-record" : "") });
    const title = document.createElementNS(NS, "title");
    title.textContent = shortDay(point.day) + " · " + options.format(point.value) + (point.record ? " · new high" : "");
    dot.append(title);
    svg.append(dot);
  });
  const first = make("text", { x: left, y: H - 8, class: "chart-text", "text-anchor": "start" });
  first.textContent = shortDay(points[0].day);
  svg.append(first);
  if (points.length > 1) {
    const lastText = make("text", { x: W - right, y: H - 8, class: "chart-text", "text-anchor": "end" });
    lastText.textContent = shortDay(points[points.length - 1].day);
    svg.append(lastText);
  }
  host.append(svg);
}

function recordText(record) {
  const set = record.best.set;
  if (record.kind === "time") return formatDuration(set.durationSeconds);
  if (record.kind === "reps") return set.reps + " reps";
  return set.weight + " " + set.unit + " × " + set.reps;
}

function renderRecords() {
  const names = [...new Set(state.history.flatMap((session) => (Array.isArray(session.exercises) ? session.exercises.filter((item) => item.sets && item.sets.length).map((item) => item.exercise) : [])))];
  const empty = document.getElementById("records-empty");
  const body = document.getElementById("records-body");
  empty.hidden = names.length > 0;
  body.hidden = names.length === 0;
  if (names.length === 0) return;
  const recent = new Map();
  state.history.forEach((session, order) => (session.exercises || []).forEach((item) => recent.set(item.exercise, workoutDay(session) + String(order).padStart(6, "0"))));
  names.sort((a, b) => String(recent.get(b)).localeCompare(String(recent.get(a))));
  if (!names.includes(state.recordsExercise)) state.recordsExercise = names[0];

  const select = document.getElementById("records-exercise");
  select.replaceChildren(...names.map((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    return option;
  }));
  select.value = state.recordsExercise;

  const record = exerciseRecord(state.recordsExercise);
  const chart = document.getElementById("records-chart");
  const stats = document.getElementById("records-stats");
  stats.replaceChildren();
  if (!record) { chart.replaceChildren(); return; }
  const unitLabel = record.kind === "weight" ? " " + record.unit : record.kind === "reps" ? " reps" : "";
  const format = record.kind === "time" ? (value) => formatDuration(value) : (value) => String(cleanNumber(value));
  const metric = record.kind === "weight" ? "Top weight per workout (" + record.unit + ")" : record.kind === "reps" ? "Best set per workout (reps)" : "Longest hold per workout";
  document.getElementById("records-metric").textContent = metric;
  renderLineChart(chart, record.points.slice(-30), { format, label: record.name + ": " + metric });

  const addStat = (label, value, detail) => {
    const box = document.createElement("div");
    box.className = "progress-stat";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    const detailEl = document.createElement("small");
    detailEl.textContent = detail;
    box.append(labelEl, valueEl, detailEl);
    stats.append(box);
  };
  addStat("BEST SET", recordText(record), shortDay(record.best.day));
  if (record.kind === "weight") {
    const oneRm = estimatedOneRepMax(Number(record.best.set.weight), Number(record.best.set.reps));
    addStat("EST. 1 REP MAX", cleanNumber(oneRm) + " " + record.unit, "Estimated from your best set");
  }
  const firstValue = record.points[0].value;
  const lastValue = record.points[record.points.length - 1].value;
  const change = cleanNumber(lastValue - firstValue);
  addStat("SINCE FIRST", record.points.length < 2 ? "—" : (change > 0 ? "+" : "") + (record.kind === "time" ? change + " sec" : change + unitLabel),
    record.points.length < 2 ? "Repeat it to see a trend" : "Latest vs first workout");
  addStat("WORKOUTS", String(record.points.length), "logged for " + record.name);

  const list = document.getElementById("records-list");
  list.replaceChildren();
  names.slice().sort((a, b) => a.localeCompare(b)).forEach((name) => {
    const rec = exerciseRecord(name);
    if (!rec) return;
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = name;
    const value = document.createElement("strong");
    value.textContent = recordText(rec);
    const when = document.createElement("small");
    when.textContent = shortDay(rec.best.day);
    row.append(label, value, when);
    list.append(row);
  });
}

// ---------- Weekly plan ----------
function todayPlanKey() {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
}

function plannedWorkout(key) {
  const id = state.weekPlan[key];
  return id ? state.savedWorkouts.find((workout) => workout.id === id) || null : null;
}

function renderPlan() {
  const list = document.getElementById("plan-list");
  list.replaceChildren();
  const hasSaved = state.savedWorkouts.length > 0;
  document.getElementById("plan-empty").hidden = hasSaved;
  list.hidden = !hasSaved;
  const todayKey = todayPlanKey();
  WEEKDAYS.forEach(([key, name]) => {
    const row = document.createElement("li");
    row.className = "plan-row" + (key === todayKey ? " is-today" : "");
    const label = document.createElement("label");
    label.setAttribute("for", "plan-" + key);
    label.textContent = name;
    if (key === todayKey) {
      const pill = document.createElement("small");
      pill.textContent = "Today";
      label.append(pill);
    }
    const select = document.createElement("select");
    select.id = "plan-" + key;
    select.className = "unit-select";
    const rest = document.createElement("option");
    rest.value = "";
    rest.textContent = "Rest / nothing planned";
    select.append(rest);
    state.savedWorkouts.forEach((workout) => {
      const option = document.createElement("option");
      option.value = workout.id;
      option.textContent = workout.name;
      select.append(option);
    });
    select.value = plannedWorkout(key) ? state.weekPlan[key] : "";
    select.addEventListener("change", () => {
      if (select.value) state.weekPlan[key] = select.value;
      else delete state.weekPlan[key];
      saveState();
      renderPlan();
    });
    row.append(label, select);
    list.append(row);
  });

  const card = document.getElementById("today-plan");
  const planned = plannedWorkout(todayKey);
  const inProgress = Boolean(state.session && state.session.exercises.length);
  card.hidden = !planned || inProgress;
  if (!card.hidden) {
    const done = workoutsForDay(localDateKey(new Date())).length > 0;
    document.getElementById("today-plan-title").textContent = planned.name;
    document.getElementById("today-plan-detail").textContent = done ? "Workout logged today — nice work." : plural(planned.exercises.length, "exercise") + " planned";
    const start = document.getElementById("today-plan-start");
    start.hidden = done;
    start.onclick = () => startSavedWorkout(planned);
  }
}

// ---------- Body weight ----------
function bodyWeightIn(entry, unit) {
  if (entry.unit === unit) return entry.weight;
  return unit === "kg" ? entry.weight / LB_PER_KG : entry.weight * LB_PER_KG;
}

function renderBodyWeight() {
  const unit = state.weightUnit;
  document.getElementById("weight-unit-label").textContent = unit;
  const entries = state.bodyWeights.slice().sort((a, b) => a.day.localeCompare(b.day));
  const empty = document.getElementById("weight-empty");
  const chart = document.getElementById("weight-chart");
  const latestEl = document.getElementById("weight-latest");
  document.getElementById("weight-remove").hidden = entries.length === 0;
  empty.hidden = entries.length > 0;
  chart.hidden = entries.length === 0;
  if (entries.length === 0) {
    latestEl.textContent = "";
    chart.replaceChildren();
    return;
  }
  const values = entries.map((entry) => bodyWeightIn(entry, unit));
  const latest = values[values.length - 1];
  let text = latest.toFixed(1) + " " + unit;
  if (values.length > 1) {
    const change = latest - values[values.length - 2];
    text += " · " + (change > 0 ? "+" : change < 0 ? "−" : "") + Math.abs(change).toFixed(1) + " vs last";
  }
  latestEl.textContent = text;
  const shown = entries.slice(-30).map((entry) => ({ day: entry.day, value: bodyWeightIn(entry, unit), record: false }));
  renderLineChart(chart, shown, { format: (value) => value.toFixed(1), label: "Body weight over time in " + unit });
}

function logBodyWeight(event) {
  event.preventDefault();
  const input = document.getElementById("weight-input");
  const error = document.getElementById("weight-error");
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0 || value > 1000) {
    error.textContent = "Enter your weight as a number, for example 175.4.";
    error.hidden = false;
    input.focus();
    return;
  }
  error.hidden = true;
  const before = state.bodyWeights.map((entry) => ({ ...entry }));
  const today = localDateKey(new Date());
  state.bodyWeights = state.bodyWeights.filter((entry) => entry.day !== today);
  state.bodyWeights.push({ day: today, weight: Number(value.toFixed(1)), unit: state.weightUnit });
  input.value = "";
  saveState();
  renderBodyWeight();
  showToast("Body weight logged.", { label: "Undo", run: () => { state.bodyWeights = before; saveState(); renderBodyWeight(); } });
}

function removeLatestBodyWeight() {
  if (state.bodyWeights.length === 0) return;
  const before = state.bodyWeights.map((entry) => ({ ...entry }));
  const sorted = state.bodyWeights.slice().sort((a, b) => a.day.localeCompare(b.day));
  const latest = sorted[sorted.length - 1];
  state.bodyWeights = state.bodyWeights.filter((entry) => entry !== state.bodyWeights.find((candidate) => candidate.day === latest.day));
  saveState();
  renderBodyWeight();
  showToast("Latest weight removed.", { label: "Undo", run: () => { state.bodyWeights = before; saveState(); renderBodyWeight(); } });
}

function renderHome() {
  document.getElementById("home-date").textContent = formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("home-saved").textContent = String(state.savedWorkouts.length);

  const resume = document.getElementById("resume-card");
  const session = state.session;
  resume.hidden = !session || session.exercises.length === 0;
  if (!resume.hidden) {
    const sets = countSets(session);
    const muscles = [...new Set(session.exercises.map((item) => item.muscle))];
    document.getElementById("resume-title").textContent = muscles.length <= 3 ? muscles.join(" · ") : muscles.slice(0, 3).join(" · ") + " +" + (muscles.length - 3);
    document.getElementById("resume-detail").textContent = plural(session.exercises.length, "exercise") + " · " + plural(sets, "set") + " logged";
  }

  const list = document.getElementById("saved-list");
  list.replaceChildren();
  document.getElementById("saved-empty").hidden = state.savedWorkouts.length > 0;
  state.savedWorkouts.forEach((saved) => {
    const item = document.createElement("li");
    item.className = "saved-item";
    const start = document.createElement("button");
    start.type = "button";
    start.className = "saved-start";
    const title = document.createElement("strong");
    title.textContent = saved.name;
    const detail = document.createElement("span");
    const muscles = [...new Set(saved.exercises.map((entry) => entry.muscle))];
    detail.textContent = plural(saved.exercises.length, "exercise") + " · " + muscles.slice(0, 3).join(", ") + (muscles.length > 3 ? "…" : "");
    const go = document.createElement("span");
    go.className = "saved-go";
    go.setAttribute("aria-hidden", "true");
    go.textContent = "Start →";
    start.append(title, detail, go);
    start.setAttribute("aria-label", "Start " + saved.name + ", " + detail.textContent);
    start.addEventListener("click", () => startSavedWorkout(saved));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-button danger";
    remove.setAttribute("aria-label", "Delete saved workout " + saved.name);
    remove.innerHTML = trashIcon;
    remove.addEventListener("click", () => deleteSavedWorkout(saved));
    item.append(start, remove);
    list.append(item);
  });
  renderPlan();
  renderBodyWeight();
}

function setAppView(view) {
  state.appView = view;
  document.getElementById("build-intro").hidden = view !== "build";
  document.getElementById("build-workspace").hidden = view !== "build";
  document.getElementById("log-view").hidden = view !== "log";
  document.getElementById("special-view").hidden = view !== "special";
  document.getElementById("history-view").hidden = view !== "history";
  document.querySelectorAll("[data-app-view]").forEach((button) => {
    const active = button.dataset.appView === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (view === "log") renderLog();
  if (view === "history") renderHistory();
  renderNav();
  window.scrollTo({ top: 0, behavior: "instant" });
  saveState();
}

function renderNav() {
  const exerciseCount = state.session ? state.session.exercises.length : 0;
  navCount.textContent = String(exerciseCount);
  navCount.hidden = exerciseCount === 0;
  const cta = document.getElementById("build-cta");
  cta.hidden = exerciseCount === 0 || state.appView !== "build";
  document.getElementById("build-cta-count").textContent = exerciseCount + (exerciseCount === 1 ? " exercise" : " exercises");
}

function renderMap() {
  document.getElementById("map-side-name").textContent = state.bodyView === "front" ? "FRONT VIEW" : "BACK VIEW";
  map.querySelectorAll(".muscle-layer").forEach((layer) => {
    layer.toggleAttribute("hidden", layer.dataset.side !== state.bodyView);
  });
  map.querySelectorAll(".muscle-zone").forEach((zone) => {
    const selected = zone.dataset.muscle === state.muscle;
    zone.classList.toggle("is-selected", selected);
    zone.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll(".view-button").forEach((button) => {
    const active = button.dataset.view === state.bodyView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const inWorkout = new Set(state.session ? state.session.exercises.map((item) => item.muscle) : []);
  map.querySelectorAll(".muscle-zone").forEach((zone) => {
    zone.classList.toggle("in-workout", inWorkout.has(muscleLabels[zone.dataset.muscle]));
  });
  const moves = (exercisesByMuscle[state.muscle] || []).length;
  document.getElementById("map-selection-name").textContent = muscleLabels[state.muscle];
  document.getElementById("map-selection-count").textContent = moves + " moves";
  document.getElementById("map-selection").setAttribute("aria-label", "Show " + moves + " " + muscleLabels[state.muscle].toLowerCase() + " exercises");

  muscleChoices.replaceChildren();
  musclesByView[state.bodyView].forEach((muscle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "muscle-chip" + (muscle === state.muscle ? " is-selected" : "") + (inWorkout.has(muscleLabels[muscle]) ? " in-workout" : "");
    button.textContent = muscleLabels[muscle];
    button.setAttribute("aria-pressed", String(muscle === state.muscle));
    button.addEventListener("click", () => selectMuscle(muscle));
    muscleChoices.append(button);
  });
}

function renderPreset() {
  const select = document.getElementById("preset-muscle");
  if (!select.options.length) {
    Object.entries(muscleLabels).forEach(([key, label]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = label + " workout";
      select.append(option);
    });
  }
  select.value = state.muscle;
  const list = document.getElementById("preset-exercises");
  list.replaceChildren();
  workoutPresets[state.muscle].forEach((name) => {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  });
  document.getElementById("load-preset").textContent = "Load " + muscleLabels[state.muscle].toLowerCase() + " workout →";
}

function loadPreset() {
  const muscle = muscleLabels[state.muscle];
  if (!state.session) {
    state.session = { id: makeId(), startedAt: new Date().toISOString(), workoutDate: state.workoutDate, weightUnit: state.weightUnit, exercises: [] };
  }
  let added = 0;
  workoutPresets[state.muscle].forEach((name) => {
    if (state.session.exercises.some((item) => item.exercise === name)) return;
    state.session.exercises.push({ id: makeId(), muscle, exercise: name, sets: [] });
    added += 1;
  });
  state.exercise = "";
  state.appView = "log";
  saveState();
  renderApp();
  document.getElementById("log-heading").focus();
  showToast(added ? muscle + " workout loaded · " + added + " exercises added." : "This workout is already loaded. Your logged sets are saved.");
}

function loadSpecialWorkout() {
  if (!state.session) {
    state.session = { id: makeId(), startedAt: new Date().toISOString(), workoutDate: state.workoutDate, weightUnit: state.weightUnit, exercises: [] };
  }
  let added = 0;
  superSaiyanExercises.forEach(([name, reps, muscle]) => {
    const existing = state.session.exercises.find((item) => item.exercise === name);
    if (existing) {
      existing.targetReps = reps;
      existing.targetSets = state.specialRounds;
      return;
    }
    state.session.exercises.push({ id: makeId(), muscle, exercise: name, sets: [], targetReps: reps, targetSets: state.specialRounds });
    added += 1;
  });
  state.appView = "log";
  saveState();
  renderApp();
  document.getElementById("log-heading").focus();
  showToast(added ? "Super Saiyan added · " + added + " exercises." : "Super Saiyan targets updated. Logged sets are saved.");
}

function renderExercises() {
  renderPreset();
  const names = exercisesByMuscle[state.muscle] || [];
  exerciseTitle.textContent = muscleLabels[state.muscle];
  exerciseCount.textContent = names.length + (names.length === 1 ? " MOVE" : " MOVES");
  exerciseList.replaceChildren();

  names.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "exercise-choice-row";
    const button = document.createElement("button");
    const chosen = sessionHasExercise(name);
    button.type = "button";
    button.className = "exercise-option" + (chosen ? " is-selected" : "");
    button.setAttribute("aria-pressed", String(chosen));
    button.innerHTML = '<span class="exercise-number">' + String(index + 1).padStart(2, "0") +
      '</span><span class="exercise-name"></span><span class="exercise-type">Exercise</span><span class="exercise-check" aria-hidden="true">' + (chosen ? checkIcon : plusIcon) + '</span>';
    button.querySelector(".exercise-name").textContent = name;
    button.querySelector(".exercise-type").textContent = timedExercises.has(name) ? "Timed" : repsOnlyExercises.has(name) ? "Reps" : "Exercise";
    button.addEventListener("click", () => toggleExercise(name));
    row.append(button, guideButton(name));
    exerciseList.append(row);
  });
}

function sessionHasExercise(name) {
  return Boolean(state.session && state.session.exercises.some((item) => item.exercise === name));
}

function setMuscle(muscle) {
  state.muscle = muscle;
  state.exercise = "";
  saveState();
  renderMap();
  renderExercises();
}

function selectMuscle(muscle) {
  setMuscle(muscle);
}

function renderDraft() {
  const exercises = state.session ? state.session.exercises : [];
  draftCount.textContent = String(exercises.length);
  draftEmpty.hidden = exercises.length > 0;
  draftList.replaceChildren();
  document.getElementById("open-log").disabled = exercises.length === 0;

  exercises.forEach((item) => {
    const row = document.createElement("li");
    row.className = "draft-item";
    const description = document.createElement("span");
    const title = document.createElement("strong");
    const detail = document.createElement("small");
    title.textContent = item.exercise;
    detail.textContent = item.muscle + (timedExercises.has(item.exercise) ? " · Timer" : repsOnlyExercises.has(item.exercise) ? " · Reps only" : "") + (item.sets.length ? " · " + item.sets.length + " sets logged" : "");
    description.append(title, detail);
    row.append(description);

    if (item.sets.length === 0) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-exercise";
      remove.innerHTML = closeIcon;
      remove.setAttribute("aria-label", "Remove " + item.exercise + " from workout");
      remove.addEventListener("click", () => removeExercise(item.id));
      row.append(remove);
    }
    draftList.append(row);
  });

  renderNav();
  renderHome();
  renderMap();
}

function toggleExercise(name) {
  const existing = state.session && state.session.exercises.find((item) => item.exercise === name);
  if (existing) {
    if (existing.sets.length) {
      showToast(name + " has logged sets, so it stays in your workout.");
      return;
    }
    removeExercise(existing.id);
    showToast(name + " removed.");
    return;
  }
  if (!state.session) {
    state.session = { id: makeId(), startedAt: new Date().toISOString(), workoutDate: state.workoutDate, weightUnit: state.weightUnit, exercises: [] };
  }
  state.session.exercises.push({ id: makeId(), muscle: muscleLabels[state.muscle], exercise: name, sets: [] });
  saveState();
  renderExercises();
  renderDraft();
  showToast(name + " added to your workout.");
}

function removeExercise(id) {
  if (!state.session) return;
  state.session.exercises = state.session.exercises.filter((item) => item.id !== id);
  if (state.session.exercises.length === 0) state.session = null;
  saveState();
  renderExercises();
  renderDraft();
}

function createField(labelText, name, type, value, step, inputMode) {
  const label = document.createElement("label");
  label.className = "set-field";
  const title = document.createElement("span");
  title.textContent = labelText;
  const input = document.createElement("input");
  input.name = name;
  input.type = type;
  input.min = type === "number" ? "0" : "";
  input.step = step;
  input.inputMode = inputMode;
  input.required = true;
  input.autocomplete = "off";
  input.value = value;
  input.className = "set-input";
  label.append(title, input);
  return { label, input };
}

function formatDuration(seconds) {
  const whole = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remaining = String(whole % 60).padStart(2, "0");
  return hours ? hours + ":" + String(minutes).padStart(2, "0") + ":" + remaining : String(minutes).padStart(2, "0") + ":" + remaining;
}

function currentDurationSeconds(item) {
  const saved = Math.max(0, Number(item.pendingSeconds) || 0);
  const started = Number(item.timerStartedAt);
  if (!Number.isFinite(started) || started <= 0) return saved;
  return saved + Math.max(0, Math.floor((Date.now() - started) / 1000));
}

function formatLoggedSet(set, exercise) {
  if (Number.isInteger(set.durationSeconds) && set.durationSeconds > 0) return formatDuration(set.durationSeconds) + " timed";
  if (set.mode === "reps" || (repsOnlyExercises.has(exercise) && Number(set.weight) === 0)) return set.reps + " reps";
  return set.weight + " " + set.unit + " × " + set.reps + " reps";
}

function updateFinishState() {
  const session = state.session;
  const hasSets = Boolean(session && session.exercises.some((item) => item.sets.length > 0));
  const hasPending = Boolean(session && session.exercises.some((item) =>
    (item.pendingWeight !== undefined && item.pendingWeight !== "") ||
    (item.pendingReps !== undefined && item.pendingReps !== "") ||
    (item.pendingSeconds !== undefined && item.pendingSeconds !== "") || item.timerStartedAt
  ));
  finishButton.disabled = !hasSets || hasPending;
  const hasExercises = Boolean(session && session.exercises.length);
  document.getElementById("discard-workout").hidden = !hasExercises;
  document.getElementById("save-for-later").hidden = !hasExercises;
  document.querySelector(".finish-row").hidden = !hasExercises;
  const hint = document.getElementById("finish-hint");
  hint.textContent = hasPending
    ? "Save or clear the unfinished set before finishing."
    : hasSets ? "Your logged sets will be saved to workout history."
    : "Log at least one set to finish.";
}

function renderRepsForm(item, card, info) {
  const form = document.createElement("form");
  form.className = "set-form reps-set-form";
  const legend = document.createElement("p");
  legend.className = "set-form-title";
  legend.textContent = "LOG SET " + String(item.sets.length + 1).padStart(2, "0");
  const lastReps = item.sets.length ? item.sets[item.sets.length - 1].reps : (info && info.prefill ? info.prefill.reps : "");
  const reps = createField("Reps in this set", "reps", "number", item.pendingReps ?? lastReps, "1", "numeric");
  reps.input.min = "1";
  reps.input.max = "999";
  if (item.targetReps && reps.input.value === "") reps.input.placeholder = String(item.targetReps);
  reps.label.classList.add("reps-only-field");
  const error = document.createElement("p");
  error.className = "field-error";
  error.setAttribute("role", "alert");
  error.hidden = true;
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "save-set-button";
  submit.textContent = "Save set";
  form.append(legend, reps.label, error, submit);
  reps.input.addEventListener("input", () => {
    item.pendingReps = reps.input.value;
    error.hidden = true;
    saveState();
    updateFinishState();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = reps.input.value.trim();
    const count = Number(value);
    if (value === "" || !Number.isInteger(count) || count < 1 || count > 999) {
      error.textContent = "Enter a whole number of reps between 1 and 999.";
      error.hidden = false;
      reps.input.focus();
      return;
    }
    const setNumber = item.sets.length + 1;
    const newSet = { mode: "reps", reps: count, loggedAt: new Date().toISOString() };
    if (isPersonalRecord(item.exercise, newSet, item.sets)) newSet.pr = true;
    item.sets.push(newSet);
    delete item.pendingReps;
    saveState();
    renderLog();
    renderDraft();
    showToast("Set " + String(setNumber).padStart(2, "0") + " saved" + (newSet.pr ? " · new personal record" : "") + ".");
    startRest();
  });
  card.append(form);
}

function renderTimedForm(item, card) {
  const form = document.createElement("form");
  form.className = "set-form timed-set-form";
  const legend = document.createElement("p");
  legend.className = "set-form-title";
  legend.textContent = "LOG TIMED SET " + String(item.sets.length + 1).padStart(2, "0");
  const display = document.createElement("div");
  display.className = "timer-display";
  display.dataset.timerId = item.id;
  display.setAttribute("role", "timer");
  display.setAttribute("aria-label", "Elapsed time");
  display.textContent = formatDuration(currentDurationSeconds(item));
  const controls = document.createElement("div");
  controls.className = "timer-controls";
  const start = document.createElement("button");
  start.type = "button";
  start.className = "timer-button timer-primary";
  const pause = document.createElement("button");
  pause.type = "button";
  pause.className = "timer-button";
  pause.textContent = "Pause";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "timer-button";
  reset.textContent = "Reset";
  controls.append(start, pause, reset);
  const duration = createField("Duration (seconds)", "duration", "number", item.pendingSeconds ?? "", "1", "numeric");
  duration.input.min = "1";
  duration.input.max = "86400";
  duration.label.classList.add("duration-field");
  const hint = document.createElement("p");
  hint.className = "timer-hint";
  hint.textContent = "Use the timer or enter the seconds yourself.";
  const error = document.createElement("p");
  error.className = "field-error";
  error.setAttribute("role", "alert");
  error.hidden = true;
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "save-set-button";
  submit.textContent = "Save timed set";
  form.append(legend, display, controls, duration.label, hint, error, submit);
  card.append(form);

  function refresh() {
    const running = Boolean(item.timerStartedAt);
    display.textContent = formatDuration(currentDurationSeconds(item));
    start.textContent = Number(item.pendingSeconds) > 0 ? "Resume timer" : "Start timer";
    start.disabled = running;
    pause.disabled = !running;
    reset.disabled = !running && !item.pendingSeconds;
    duration.input.disabled = running;
    if (running) duration.input.value = String(currentDurationSeconds(item));
  }

  start.addEventListener("click", () => {
    const value = duration.input.value.trim();
    const seconds = value === "" ? 0 : Number(value);
    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400) {
      error.textContent = "Enter a whole number of seconds up to 86400.";
      error.hidden = false;
      return;
    }
    item.pendingSeconds = seconds ? String(seconds) : "";
    item.timerStartedAt = Date.now();
    error.hidden = true;
    saveState();
    updateFinishState();
    refresh();
  });
  pause.addEventListener("click", () => {
    item.pendingSeconds = String(currentDurationSeconds(item));
    delete item.timerStartedAt;
    duration.input.value = item.pendingSeconds;
    saveState();
    updateFinishState();
    refresh();
  });
  reset.addEventListener("click", () => {
    delete item.timerStartedAt;
    delete item.pendingSeconds;
    duration.input.value = "";
    error.hidden = true;
    saveState();
    updateFinishState();
    refresh();
  });
  duration.input.addEventListener("input", () => {
    item.pendingSeconds = duration.input.value;
    display.textContent = formatDuration(Number(duration.input.value));
    error.hidden = true;
    saveState();
    updateFinishState();
    refresh();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const seconds = item.timerStartedAt ? currentDurationSeconds(item) : Number(duration.input.value);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) {
      error.textContent = "Enter a whole number of seconds between 1 and 86400.";
      error.hidden = false;
      duration.input.focus();
      return;
    }
    const setNumber = item.sets.length + 1;
    const timedSet = { durationSeconds: seconds, loggedAt: new Date().toISOString() };
    if (isPersonalRecord(item.exercise, timedSet, item.sets)) timedSet.pr = true;
    item.sets.push(timedSet);
    delete item.timerStartedAt;
    delete item.pendingSeconds;
    saveState();
    renderLog();
    renderDraft();
    showToast("Timed set " + String(setNumber).padStart(2, "0") + " saved" + (timedSet.pr ? " · new personal record" : "") + ".");
    startRest();
  });
  refresh();
}

let restAudio;

function startRest() {
  if (!state.restSeconds) return;
  state.restTotal = state.restSeconds;
  state.restEndsAt = Date.now() + state.restSeconds * 1000;
  try {
    // Created during the tap that saved the set, so the end-of-rest beep is allowed to play.
    restAudio = restAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (restAudio.state === "suspended") restAudio.resume();
  } catch {
    restAudio = null;
  }
  saveState();
  renderRest();
}

function stopRest() {
  state.restEndsAt = null;
  state.restTotal = 0;
  saveState();
  renderRest();
}

function adjustRest(seconds) {
  if (!state.restEndsAt) return;
  const remaining = Math.ceil((state.restEndsAt - Date.now()) / 1000) + seconds;
  if (remaining <= 0) {
    stopRest();
    return;
  }
  state.restEndsAt = Date.now() + remaining * 1000;
  state.restTotal = Math.max(state.restTotal, remaining);
  saveState();
  renderRest();
}

function playRestBeep() {
  if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
  if (!restAudio) return;
  try {
    [0, 0.22].forEach((offset) => {
      const tone = restAudio.createOscillator();
      const gain = restAudio.createGain();
      const start = restAudio.currentTime + offset;
      tone.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      tone.connect(gain).connect(restAudio.destination);
      tone.start(start);
      tone.stop(start + 0.2);
    });
  } catch {
    // Sound is a bonus; the toast still tells the user rest is over.
  }
}

function renderRest() {
  const bar = document.getElementById("rest-timer");
  if (!state.restEndsAt) {
    bar.hidden = true;
    return;
  }
  const remaining = Math.max(0, Math.ceil((state.restEndsAt - Date.now()) / 1000));
  if (remaining === 0) {
    stopRest();
    playRestBeep();
    showToast("Rest over — time for your next set.");
    return;
  }
  bar.hidden = false;
  document.getElementById("rest-time").textContent = formatDuration(remaining);
  const total = state.restTotal || state.restSeconds || remaining;
  document.getElementById("rest-progress-fill").style.transform = "scaleX(" + Math.min(1, remaining / total) + ")";
}

window.setInterval(renderRest, 250);

window.setInterval(() => {
  if (state.appView !== "log" || !state.session) return;
  document.querySelectorAll("[data-timer-id]").forEach((display) => {
    const item = state.session.exercises.find((exercise) => exercise.id === display.dataset.timerId);
    if (!item || !item.timerStartedAt) return;
    const seconds = currentDurationSeconds(item);
    display.textContent = formatDuration(seconds);
    const input = display.closest("form").querySelector('input[name="duration"]');
    input.value = String(seconds);
  });
}, 500);

function renderLog() {
  logSession.replaceChildren();
  const session = state.session;
  const hasWeightedSets = session && session.exercises.some((item) => item.sets.some((set) => set.weight !== undefined));
  unitSelect.value = session ? session.weightUnit : state.weightUnit;
  workoutDateInput.value = session && isDateKey(session.workoutDate) ? session.workoutDate : state.workoutDate;
  unitSelect.disabled = Boolean(hasWeightedSets);
  updateFinishState();

  if (!session || session.exercises.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-panel";
    empty.innerHTML = '<h2>No exercises yet</h2><p>Choose a muscle and add exercises in Build to start logging.</p>';
    const goBuild = document.createElement("button");
    goBuild.type = "button";
    goBuild.className = "add-button";
    goBuild.textContent = "Choose exercises";
    goBuild.addEventListener("click", () => setAppView("build"));
    empty.append(goBuild);
    logSession.append(empty);
    return;
  }

  session.exercises.forEach((item) => {
    const card = document.createElement("article");
    card.className = "log-card";
    const header = document.createElement("div");
    header.className = "log-card-heading";
    const headingGroup = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = item.exercise;
    const subtitle = document.createElement("p");
    subtitle.className = "log-muscle";
    subtitle.textContent = item.muscle;
    if (timedExercises.has(item.exercise)) subtitle.textContent += " · Timed set";
    else if (repsOnlyExercises.has(item.exercise)) subtitle.textContent += " · Reps only";
    if (item.targetReps) subtitle.textContent += " · Target " + item.targetReps + " reps × " + item.targetSets + " rounds";
    headingGroup.append(title, subtitle);
    header.append(headingGroup, guideButton(item.exercise));
    const info = nextTarget(item.exercise, session.weightUnit);

    const setHeader = document.createElement("div");
    setHeader.className = "set-list-heading";
    const setHeading = document.createElement("span");
    setHeading.textContent = "SETS COMPLETED";
    const setCount = document.createElement("span");
    setCount.className = "set-count";
    setCount.textContent = String(item.sets.length);
    setHeader.append(setHeading, setCount);
    card.append(header);
    renderLastTime(card, item, info);
    card.append(setHeader);

    if (item.sets.length === 0) {
      const empty = document.createElement("p");
      empty.className = "no-sets";
      empty.textContent = "No sets logged yet. Add your first set below.";
      card.append(empty);
    } else {
      const list = document.createElement("ol");
      list.className = "set-list";
      item.sets.forEach((set, index) => {
        const row = document.createElement("li");
        row.className = "logged-set";
        const setLabel = document.createElement("span");
        setLabel.textContent = "SET " + String(index + 1).padStart(2, "0");
        const value = document.createElement("strong");
        value.textContent = formatLoggedSet(set, item.exercise);
        if (set.pr) value.append(prBadge());
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-set";
        remove.innerHTML = closeIcon;
        remove.setAttribute("aria-label", "Remove set " + (index + 1) + " for " + item.exercise);
        remove.addEventListener("click", () => {
          if (!window.confirm("Remove this logged set?")) return;
          const activeItem = state.session && state.session.exercises.find((exercise) => exercise.id === item.id);
          if (!activeItem) return;
          activeItem.sets.splice(index, 1);
          saveState();
          renderLog();
          renderDraft();
        });
        row.append(setLabel, value, remove);
        list.append(row);
      });
      card.append(list);
    }

    if (timedExercises.has(item.exercise)) {
      renderTimedForm(item, card);
      logSession.append(card);
      return;
    }
    if (repsOnlyExercises.has(item.exercise)) {
      renderRepsForm(item, card, info);
      logSession.append(card);
      return;
    }

    const form = document.createElement("form");
    form.className = "set-form";
    const legend = document.createElement("p");
    legend.className = "set-form-title";
    legend.textContent = "LOG SET " + String(item.sets.length + 1).padStart(2, "0");
    const fields = document.createElement("div");
    fields.className = "set-fields";
    const priorWeight = item.sets.length ? item.sets[item.sets.length - 1].weight : (info && info.prefill && info.prefill.weight !== null ? info.prefill.weight : "");
    const weightValue = item.pendingWeight !== undefined ? item.pendingWeight : priorWeight;
    const priorReps = item.sets.length ? item.sets[item.sets.length - 1].reps : (info && info.prefill ? info.prefill.reps : "");
    const repsValue = item.pendingReps !== undefined ? item.pendingReps : priorReps;
    const weightField = createField("Weight (" + session.weightUnit + ")", "weight", "number", weightValue, "any", "decimal");
    const repsField = createField("Reps", "reps", "number", repsValue, "1", "numeric");
    repsField.input.min = "1";
    if (item.targetReps && repsValue === "") repsField.input.placeholder = String(item.targetReps);
    repsField.input.max = "999";
    const error = document.createElement("p");
    error.className = "field-error";
    error.setAttribute("role", "alert");
    error.hidden = true;
    fields.append(weightField.label, repsField.label);
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "save-set-button";
    submit.textContent = "Save set";
    form.append(legend, fields, error, submit);
    form.addEventListener("input", () => {
      const activeItem = state.session && state.session.exercises.find((exercise) => exercise.id === item.id);
      if (!activeItem) return;
      activeItem.pendingWeight = weightField.input.value;
      activeItem.pendingReps = repsField.input.value;
      updateFinishState();
      saveState();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const weight = weightField.input.value.trim();
      const reps = repsField.input.value.trim();
      const weightNumber = Number(weight);
      const repsNumber = Number(reps);
      if (weight === "" || !Number.isFinite(weightNumber) || weightNumber < 0) {
        error.textContent = "Enter a valid weight, including 0 for bodyweight or assisted exercises.";
        error.hidden = false;
        weightField.input.focus();
        return;
      }
      if (reps === "" || !Number.isInteger(repsNumber) || repsNumber < 1) {
        error.textContent = "Enter a whole number of reps greater than 0.";
        error.hidden = false;
        repsField.input.focus();
        return;
      }
      const activeItem = state.session.exercises.find((exercise) => exercise.id === item.id);
      const setNumber = activeItem.sets.length + 1;
      const newSet = {
        weight: String(weightNumber),
        reps: repsNumber,
        unit: state.session.weightUnit,
        loggedAt: new Date().toISOString()
      };
      if (isPersonalRecord(activeItem.exercise, newSet, activeItem.sets)) newSet.pr = true;
      activeItem.sets.push(newSet);
      delete activeItem.pendingWeight;
      delete activeItem.pendingReps;
      saveState();
      renderLog();
      renderDraft();
      showToast("Set " + String(setNumber).padStart(2, "0") + " saved" + (newSet.pr ? " · new personal record" : "") + ".");
      startRest();
    });
    card.append(form);
    logSession.append(card);
  });
}

function formatDate(iso, options) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, options || {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  }).format(date);
}

function workoutDay(session) {
  if (isDateKey(session.workoutDate)) return session.workoutDate;
  const completed = new Date(session.completedAt);
  return Number.isNaN(completed.getTime()) ? "" : localDateKey(completed);
}

function workoutsForDay(day) {
  return state.history.filter((session) => workoutDay(session) === day);
}

function trainingDays() {
  const today = localDateKey(new Date());
  const days = new Set(state.manualDays.filter((day) => isDateKey(day) && day <= today));
  state.history.forEach((session) => {
    const day = workoutDay(session);
    if (isDateKey(day) && day <= today) days.add(day);
  });
  return [...days].sort();
}

function bestLiftGain() {
  const firstLifts = new Map();
  let best = null;
  state.history.forEach((session) => {
    if (!Array.isArray(session.exercises)) return;
    session.exercises.forEach((item) => {
      const sessionBest = new Map();
      (item.sets || []).forEach((set) => {
        const weight = Number(set.weight);
        if (!Number.isFinite(weight) || weight <= 0 || !["lb", "kg"].includes(set.unit)) return;
        sessionBest.set(set.unit, Math.max(sessionBest.get(set.unit) || 0, weight));
      });
      sessionBest.forEach((weight, unit) => {
        const key = item.exercise + "\u0000" + unit;
        if (!firstLifts.has(key)) {
          firstLifts.set(key, weight);
          return;
        }
        const gain = weight - firstLifts.get(key);
        if (gain > 0 && (!best || gain > best.gain)) best = { exercise: item.exercise, unit, gain };
      });
    });
  });
  return best;
}

function bestRepGain() {
  const firstReps = new Map();
  let best = null;
  state.history.forEach((session) => {
    if (!Array.isArray(session.exercises)) return;
    session.exercises.forEach((item) => {
      if (!repsOnlyExercises.has(item.exercise)) return;
      const sessionBest = (item.sets || []).reduce((highest, set) => Math.max(highest, Number(set.reps) || 0), 0);
      if (!sessionBest) return;
      if (!firstReps.has(item.exercise)) {
        firstReps.set(item.exercise, sessionBest);
        return;
      }
      const gain = sessionBest - firstReps.get(item.exercise);
      if (gain > 0 && (!best || gain > best.gain)) best = { exercise: item.exercise, gain };
    });
  });
  return best;
}

function renderProgress() {
  const days = trainingDays();
  const count = days.length;
  const tier = count >= 30 ? 3 : count >= 15 ? 2 : count >= 5 ? 1 : 0;
  const stageNames = ["Starting line", "Getting moving", "Building rhythm", "Strong routine"];
  document.body.dataset.progressTier = String(tier);
  document.getElementById("figure-stage").textContent = stageNames[tier].toUpperCase();
  document.getElementById("progress-stage").textContent = stageNames[tier];
  document.getElementById("progress-days").textContent = String(count);

  const milestones = [5, 15, 30, 50, 75, 100];
  let previous = 0;
  let next = milestones.find((milestone) => milestone > count);
  if (next === undefined) next = Math.floor(count / 25) * 25 + 25;
  for (const milestone of milestones) {
    if (milestone >= next) break;
    previous = milestone;
  }
  if (next > 100) previous = next - 25;
  const track = document.getElementById("progress-track");
  track.setAttribute("aria-valuemin", String(previous));
  track.setAttribute("aria-valuenow", String(count));
  track.setAttribute("aria-valuemax", String(next));
  document.getElementById("progress-fill").style.transform = "scaleX(" + Math.min(1, (count - previous) / (next - previous)) + ")";
  document.getElementById("progress-next").textContent = (next - count) + (next - count === 1 ? " day" : " days") + " until your " + next + "-day milestone.";

  const today = dateFromKey(localDateKey(new Date()));
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekCount = days.filter((day) => day >= localDateKey(monday)).length;
  document.getElementById("weekly-goal").value = String(state.weeklyGoal);
  document.getElementById("home-week").textContent = weekCount + "/" + state.weeklyGoal;
  document.getElementById("home-days").textContent = String(count);
  document.getElementById("progress-week").textContent = weekCount + " / " + state.weeklyGoal + " days";
  document.getElementById("progress-week-detail").textContent = weekCount >= state.weeklyGoal ? "Weekly goal reached" : "This week's training days";

  const lift = bestLiftGain();
  document.getElementById("progress-lift").textContent = lift ? "+" + Number(lift.gain.toFixed(1)) + " " + lift.unit : "—";
  document.getElementById("progress-lift-detail").textContent = lift ? lift.exercise + " · best lift vs first logged workout" : "Repeat a weighted exercise to see a gain";
  const reps = bestRepGain();
  document.getElementById("progress-reps").textContent = reps ? "+" + reps.gain + " reps" : "—";
  document.getElementById("progress-reps-detail").textContent = reps ? reps.exercise + " · best set vs first logged workout" : "Repeat a bodyweight exercise to see a gain";

  const setCounts = state.history.filter((session) => Array.isArray(session.exercises)).map((session) =>
    session.exercises.reduce((sum, item) => sum + (item.sets || []).length, 0)
  );
  const recent = setCounts.slice(-3);
  const average = recent.length ? recent.reduce((sum, value) => sum + value, 0) / recent.length : 0;
  document.getElementById("progress-sets").textContent = recent.length ? average.toFixed(1) + " sets" : "—";
  const previousSets = setCounts.slice(-6, -3);
  let setsDetail = recent.length ? "Average over your latest " + recent.length + (recent.length === 1 ? " workout" : " workouts") : "Finish a workout to see your average";
  if (previousSets.length) {
    const priorAverage = previousSets.reduce((sum, value) => sum + value, 0) / previousSets.length;
    const change = Number((average - priorAverage).toFixed(1));
    setsDetail = (change > 0 ? "+" : "") + change.toFixed(1) + " vs previous " + previousSets.length + (previousSets.length === 1 ? " workout" : " workouts");
  }
  document.getElementById("progress-sets-detail").textContent = setsDetail;
  document.getElementById("progress-message").textContent = count === 0
    ? "Log a workout or mark a gym day to begin."
    : weekCount >= state.weeklyGoal ? "Weekly goal reached. Keep building your routine at your own pace."
    : (state.weeklyGoal - weekCount) + (state.weeklyGoal - weekCount === 1 ? " training day" : " training days") + " to reach this week's goal.";
}

function renderCalendar() {
  const [year, month] = state.calendarMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1, 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  document.getElementById("calendar-month").textContent = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(first);
  const grid = document.getElementById("calendar-grid");
  grid.replaceChildren();
  for (let blank = 0; blank < first.getDay(); blank += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-spacer";
    spacer.setAttribute("aria-hidden", "true");
    grid.append(spacer);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = state.calendarMonth + "-" + String(day).padStart(2, "0");
    const hasWorkout = workoutsForDay(key).length > 0;
    const marked = state.manualDays.includes(key) || Boolean(state.dayNotes[key] && String(state.dayNotes[key]).trim());
    const selected = state.selectedDay === key;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day" + (hasWorkout ? " has-workout" : "") + (marked ? " is-marked" : "") + (selected ? " is-selected" : "") + (key === localDateKey(new Date()) ? " is-today" : "");
    button.dataset.calendarDay = key;
    button.textContent = String(day);
    button.setAttribute("aria-pressed", String(selected));
    const status = hasWorkout ? ", workout logged" : marked ? ", gym day marked" : "";
    button.setAttribute("aria-label", formatDate(dateFromKey(key).toISOString()) + status);
    button.addEventListener("click", () => {
      state.selectedDay = key;
      saveState();
      renderHistory();
      document.querySelector('[data-calendar-day="' + key + '"]').focus();
    });
    grid.append(button);
  }
}

function renderSelectedDay() {
  const day = state.selectedDay;
  document.getElementById("selected-day-heading").textContent = formatDate(dateFromKey(day).toISOString());
  const marked = state.manualDays.includes(day);
  const marker = document.getElementById("mark-gym-day");
  marker.textContent = marked ? "Remove gym mark" : "Mark gym day";
  marker.setAttribute("aria-pressed", String(marked));
  const note = document.getElementById("day-note");
  note.value = typeof state.dayNotes[day] === "string" ? state.dayNotes[day] : "";
  const count = workoutsForDay(day).length;
  const summary = document.getElementById("selected-day-summary");
  summary.textContent = count ? count + (count === 1 ? " workout logged" : " workouts logged") : marked ? "Gym visit marked" : "";
  summary.hidden = !summary.textContent;
}

function renderHistory() {
  renderProgress();
  renderRecords();
  renderCalendar();
  renderSelectedDay();
  historyList.replaceChildren();
  const selectedWorkouts = workoutsForDay(state.selectedDay);
  if (selectedWorkouts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-panel";
    empty.innerHTML = '<h2>No session logged for this day</h2><p>Choose a highlighted day to review a workout, or build one for this date.</p>';
    const goBuild = document.createElement("button");
    goBuild.type = "button";
    goBuild.className = "add-button";
    goBuild.textContent = "Build workout for this day";
    goBuild.addEventListener("click", () => {
      state.workoutDate = state.selectedDay;
      if (state.session) state.session.workoutDate = state.selectedDay;
      saveState();
      setAppView("build");
    });
    empty.append(goBuild);
    historyList.append(empty);
    return;
  }

  selectedWorkouts.slice().reverse().forEach((session) => {
    const article = document.createElement("article");
    article.className = "history-card";
    const header = document.createElement("div");
    header.className = "history-heading";
    const title = document.createElement("h2");
    title.textContent = formatDate(dateFromKey(workoutDay(session)).toISOString());
    const summary = document.createElement("p");
    const totalSets = session.exercises.reduce((sum, item) => sum + item.sets.length, 0);
    summary.textContent = session.exercises.length + (session.exercises.length === 1 ? " exercise" : " exercises") +
      " · " + totalSets + (totalSets === 1 ? " set" : " sets");
    const actions = document.createElement("div");
    actions.className = "history-actions";
    const reuse = document.createElement("button");
    reuse.type = "button";
    reuse.className = "ghost-button small";
    reuse.textContent = "Save as workout";
    reuse.addEventListener("click", () => saveHistoryAsTemplate(session));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-button danger";
    remove.setAttribute("aria-label", "Delete this workout from history");
    remove.innerHTML = trashIcon;
    remove.addEventListener("click", () => deleteHistoryWorkout(session));
    actions.append(reuse, remove);
    const headingText = document.createElement("div");
    headingText.append(title, summary);
    header.append(headingText, actions);
    article.append(header);

    session.exercises.forEach((item) => {
      const exercise = document.createElement("section");
      exercise.className = "history-exercise";
      const exerciseHeading = document.createElement("div");
      exerciseHeading.className = "history-exercise-heading";
      const name = document.createElement("strong");
      name.textContent = item.exercise;
      const muscle = document.createElement("span");
      muscle.textContent = item.muscle;
      exerciseHeading.append(name, muscle);
      const sets = document.createElement("ul");
      sets.className = "history-set-list";
      item.sets.forEach((set, index) => {
        const row = document.createElement("li");
        row.textContent = "Set " + (index + 1) + " · " + formatLoggedSet(set, item.exercise);
        if (set.pr) row.append(" ", prBadge());
        sets.append(row);
      });
      exercise.append(exerciseHeading, sets);
      article.append(exercise);
    });
    historyList.append(article);
  });
}

function finishWorkout() {
  if (!state.session) return;
  const totalSets = state.session.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  if (totalSets === 0) return;
  const completed = {
    ...state.session,
    completedAt: new Date().toISOString(),
    workoutDate: isDateKey(state.session.workoutDate) ? state.session.workoutDate : state.workoutDate,
    exercises: state.session.exercises.filter((item) => item.sets.length > 0).map((item) => ({
      ...item,
      sets: item.sets.map((set) => ({ ...set }))
    }))
  };
  state.history.push(completed);
  state.selectedDay = completed.workoutDate;
  state.calendarMonth = completed.workoutDate.slice(0, 7);
  state.workoutDate = localDateKey(new Date());
  state.session = null;
  state.restEndsAt = null;
  state.appView = "history";
  saveState();
  renderApp();
  showToast("Workout saved to history.");
}

function renderApp() {
  renderProgress();
  document.getElementById("build-intro").hidden = state.appView !== "build";
  document.getElementById("build-workspace").hidden = state.appView !== "build";
  document.getElementById("log-view").hidden = state.appView !== "log";
  document.getElementById("special-view").hidden = state.appView !== "special";
  document.getElementById("history-view").hidden = state.appView !== "history";
  document.querySelectorAll("[data-app-view]").forEach((button) => {
    const active = button.dataset.appView === state.appView;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  renderMap();
  renderExercises();
  renderDraft();
  unitSelect.value = state.session ? state.session.weightUnit : state.weightUnit;
  workoutDateInput.value = state.session && isDateKey(state.session.workoutDate) ? state.session.workoutDate : state.workoutDate;
  if (state.appView === "log") renderLog();
  if (state.appView === "history") renderHistory();
}

map.querySelectorAll(".muscle-zone").forEach((zone) => {
  zone.addEventListener("click", () => selectMuscle(zone.dataset.muscle));
  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectMuscle(zone.dataset.muscle);
    }
  });
});

document.querySelectorAll(".view-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.bodyView = button.dataset.view;
    if (!musclesByView[state.bodyView].includes(state.muscle)) {
      state.muscle = musclesByView[state.bodyView][0];
    }
    state.exercise = "";
    saveState();
    renderMap();
    renderExercises();
    map.classList.remove("is-flipping");
    map.getBoundingClientRect();
    map.classList.add("is-flipping");
  });
});

document.querySelectorAll("[data-app-view]").forEach((button) => {
  button.addEventListener("click", () => setAppView(button.dataset.appView));
});

document.getElementById("load-preset").addEventListener("click", loadPreset);
document.getElementById("load-special").addEventListener("click", loadSpecialWorkout);
document.getElementById("special-level").addEventListener("change", (event) => {
  state.specialRounds = Number(event.target.value);
  saveState();
});
document.getElementById("preset-muscle").addEventListener("change", (event) => {
  const muscle = event.target.value;
  if (!musclesByView[state.bodyView].includes(muscle)) {
    state.bodyView = musclesByView.front.includes(muscle) ? "front" : "back";
  }
  setMuscle(muscle);
});
document.getElementById("build-cta").addEventListener("click", () => setAppView("log"));
document.getElementById("open-log").addEventListener("click", () => setAppView("log"));
finishButton.addEventListener("click", finishWorkout);

workoutDateInput.addEventListener("change", () => {
  if (!isDateKey(workoutDateInput.value)) return;
  state.workoutDate = workoutDateInput.value;
  if (state.session) state.session.workoutDate = state.workoutDate;
  saveState();
});

function changeCalendarMonth(amount) {
  const [year, month] = state.calendarMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + amount, 1, 12);
  state.calendarMonth = localDateKey(next).slice(0, 7);
  state.selectedDay = state.calendarMonth + "-01";
  saveState();
  renderHistory();
}

document.getElementById("calendar-prev").addEventListener("click", () => changeCalendarMonth(-1));
document.getElementById("calendar-next").addEventListener("click", () => changeCalendarMonth(1));
document.getElementById("weekly-goal").addEventListener("change", (event) => {
  state.weeklyGoal = Number(event.target.value);
  saveState();
  renderProgress();
});
document.getElementById("mark-gym-day").addEventListener("click", () => {
  const day = state.selectedDay;
  state.manualDays = state.manualDays.includes(day)
    ? state.manualDays.filter((entry) => entry !== day)
    : [...state.manualDays, day];
  saveState();
  renderHistory();
});
document.getElementById("day-note").addEventListener("input", (event) => {
  const note = event.target.value;
  if (note.trim()) state.dayNotes[state.selectedDay] = note;
  else delete state.dayNotes[state.selectedDay];
  saveState();
  renderCalendar();
});

const restSelect = document.getElementById("rest-length");
restSelect.value = String(state.restSeconds);
restSelect.addEventListener("change", () => {
  state.restSeconds = REST_OPTIONS.includes(Number(restSelect.value)) ? Number(restSelect.value) : 90;
  if (!state.restSeconds) state.restEndsAt = null;
  saveState();
  renderRest();
});
document.querySelectorAll("[data-rest-adjust]").forEach((button) => {
  button.addEventListener("click", () => adjustRest(Number(button.dataset.restAdjust)));
});
document.getElementById("rest-skip").addEventListener("click", stopRest);
document.getElementById("discard-workout").addEventListener("click", discardWorkout);
document.getElementById("resume-discard").addEventListener("click", discardWorkout);
document.getElementById("resume-open").addEventListener("click", () => setAppView("log"));
document.getElementById("save-for-later").addEventListener("click", openSaveDialog);
document.getElementById("save-form").addEventListener("submit", saveForLater);
document.getElementById("save-cancel").addEventListener("click", () => document.getElementById("save-dialog").close());
document.getElementById("map-selection").addEventListener("click", () => {
  document.querySelector(".exercise-panel").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});

unitSelect.addEventListener("change", () => {
  state.weightUnit = unitSelect.value === "kg" ? "kg" : "lb";
  if (state.session) {
    state.session.weightUnit = state.weightUnit;
  }
  saveState();
  renderBodyWeight();
  if (state.appView === "log") renderLog();
});

document.getElementById("close-guide").addEventListener("click", () => document.getElementById("exercise-guide").close());
document.getElementById("exercise-guide").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.getElementById("weight-form").addEventListener("submit", logBodyWeight);
document.getElementById("weight-remove").addEventListener("click", removeLatestBodyWeight);
document.getElementById("records-exercise").addEventListener("change", (event) => {
  state.recordsExercise = event.target.value;
  saveState();
  renderRecords();
});
renderSpecialGuideButtons();
document.getElementById("special-level").value = String(state.specialRounds);
renderApp();
renderRest();
