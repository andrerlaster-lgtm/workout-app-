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

function emptyState() {
  return {
    appView: "build",
    bodyView: "front",
    muscle: "chest",
    exercise: "",
    weightUnit: "lb",
    weeklyGoal: 3,
    specialRounds: 3,
    workoutDate: localDateKey(new Date()),
    selectedDay: localDateKey(new Date()),
    calendarMonth: localDateKey(new Date()).slice(0, 7),
    manualDays: [],
    dayNotes: {},
    session: null,
    history: []
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
      weightUnit: saved.weightUnit === "kg" ? "kg" : "lb",
      weeklyGoal: Number.isInteger(Number(saved.weeklyGoal)) && Number(saved.weeklyGoal) >= 1 && Number(saved.weeklyGoal) <= 7 ? Number(saved.weeklyGoal) : 3,
      workoutDate: isDateKey(saved.workoutDate) ? saved.workoutDate : localDateKey(new Date()),
      selectedDay: isDateKey(saved.selectedDay) ? saved.selectedDay : localDateKey(new Date()),
      calendarMonth: /^\d{4}-\d{2}$/.test(saved.calendarMonth) && isDateKey(saved.calendarMonth + "-01") ? saved.calendarMonth : localDateKey(new Date()).slice(0, 7),
      manualDays: Array.isArray(saved.manualDays) ? [...new Set(saved.manualDays.filter(isDateKey))] : [],
      dayNotes: saved.dayNotes && typeof saved.dayNotes === "object" && !Array.isArray(saved.dayNotes) ? saved.dayNotes : {},
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
      history: Array.isArray(saved.history) ? saved.history : []
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
const addExerciseButton = document.getElementById("add-exercise");
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
  button.textContent = "See movement";
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

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
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
  saveState();
}

function renderNav() {
  const exerciseCount = state.session ? state.session.exercises.length : 0;
  navCount.textContent = String(exerciseCount);
  navCount.hidden = exerciseCount === 0;
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

  muscleChoices.replaceChildren();
  musclesByView[state.bodyView].forEach((muscle) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "muscle-chip" + (muscle === state.muscle ? " is-selected" : "");
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
    const chosen = name === state.exercise;
    button.type = "button";
    button.className = "exercise-option" + (chosen ? " is-selected" : "");
    button.setAttribute("aria-pressed", String(chosen));
    button.innerHTML = '<span class="exercise-number">' + String(index + 1).padStart(2, "0") +
      '</span><span class="exercise-name"></span><span class="exercise-type">Exercise</span><span class="exercise-check" aria-hidden="true">✓</span>';
    button.querySelector(".exercise-name").textContent = name;
    button.querySelector(".exercise-type").textContent = timedExercises.has(name) ? "Timed" : repsOnlyExercises.has(name) ? "Reps" : "Exercise";
    button.addEventListener("click", () => {
      state.exercise = name;
      renderExercises();
    });
    row.append(button, guideButton(name));
    exerciseList.append(row);
  });

  addExerciseButton.disabled = !state.exercise;
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
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Remove " + item.exercise + " from workout");
      remove.addEventListener("click", () => removeExercise(item.id));
      row.append(remove);
    }
    draftList.append(row);
  });

  renderNav();
}

function addExercise() {
  if (!state.exercise) return;
  if (!state.session) {
    state.session = {
      id: makeId(),
      startedAt: new Date().toISOString(),
      workoutDate: state.workoutDate,
      weightUnit: state.weightUnit,
      exercises: []
    };
  }
  const exists = state.session.exercises.some((item) =>
    item.exercise === state.exercise && item.muscle === muscleLabels[state.muscle]
  );
  if (!exists) {
    state.session.exercises.push({
      id: makeId(),
      muscle: muscleLabels[state.muscle],
      exercise: state.exercise,
      sets: []
    });
    showToast(state.exercise + " added to your workout.");
  } else {
    showToast("That exercise is already in your workout.");
  }
  state.exercise = "";
  saveState();
  renderExercises();
  renderDraft();
}

function removeExercise(id) {
  if (!state.session) return;
  state.session.exercises = state.session.exercises.filter((item) => item.id !== id);
  if (state.session.exercises.length === 0) state.session = null;
  saveState();
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
  const hint = document.getElementById("finish-hint");
  hint.textContent = hasPending
    ? "Save or clear the unfinished set before finishing."
    : hasSets ? "Your logged sets will be saved to workout history."
    : "Log at least one set to finish.";
}

function renderRepsForm(item, card) {
  const form = document.createElement("form");
  form.className = "set-form reps-set-form";
  const legend = document.createElement("p");
  legend.className = "set-form-title";
  legend.textContent = "LOG SET " + String(item.sets.length + 1).padStart(2, "0");
  const reps = createField("Reps in this set", "reps", "number", item.pendingReps ?? "", "1", "numeric");
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
    item.sets.push({ mode: "reps", reps: count, loggedAt: new Date().toISOString() });
    delete item.pendingReps;
    saveState();
    renderLog();
    renderDraft();
    showToast("Set " + String(setNumber).padStart(2, "0") + " saved.");
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
    item.sets.push({ durationSeconds: seconds, loggedAt: new Date().toISOString() });
    delete item.timerStartedAt;
    delete item.pendingSeconds;
    saveState();
    renderLog();
    renderDraft();
    showToast("Timed set " + String(setNumber).padStart(2, "0") + " saved.");
  });
  refresh();
}

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
    empty.innerHTML = '<span class="empty-mark" aria-hidden="true">01</span><h2>No exercises yet</h2><p>Choose a muscle and add exercises in Build to start logging.</p>';
    const goBuild = document.createElement("button");
    goBuild.type = "button";
    goBuild.className = "add-button";
    goBuild.textContent = "Choose exercises";
    goBuild.addEventListener("click", () => setAppView("build"));
    empty.append(goBuild);
    logSession.append(empty);
    return;
  }

  session.exercises.forEach((item, itemIndex) => {
    const card = document.createElement("article");
    card.className = "log-card";
    const header = document.createElement("div");
    header.className = "log-card-heading";
    const headingGroup = document.createElement("div");
    const kicker = document.createElement("p");
    kicker.className = "section-kicker";
    kicker.textContent = "EXERCISE " + String(itemIndex + 1).padStart(2, "0");
    const title = document.createElement("h2");
    title.textContent = item.exercise;
    const subtitle = document.createElement("p");
    subtitle.className = "log-muscle";
    subtitle.textContent = item.muscle;
    if (timedExercises.has(item.exercise)) subtitle.textContent += " · Timed set";
    else if (repsOnlyExercises.has(item.exercise)) subtitle.textContent += " · Reps only";
    if (item.targetReps) subtitle.textContent += " · Target " + item.targetReps + " reps × " + item.targetSets + " rounds";
    headingGroup.append(kicker, title, subtitle);
    header.append(headingGroup, guideButton(item.exercise));

    const setHeader = document.createElement("div");
    setHeader.className = "set-list-heading";
    const setHeading = document.createElement("span");
    setHeading.textContent = "SETS COMPLETED";
    const setCount = document.createElement("span");
    setCount.className = "set-count";
    setCount.textContent = String(item.sets.length);
    setHeader.append(setHeading, setCount);
    card.append(header, setHeader);

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
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-set";
        remove.textContent = "×";
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
      renderRepsForm(item, card);
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
    const priorWeight = item.sets.length ? item.sets[item.sets.length - 1].weight : "";
    const weightValue = item.pendingWeight !== undefined ? item.pendingWeight : priorWeight;
    const repsValue = item.pendingReps !== undefined ? item.pendingReps : "";
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
      activeItem.sets.push({
        weight: String(weightNumber),
        reps: repsNumber,
        unit: state.session.weightUnit,
        loggedAt: new Date().toISOString()
      });
      delete activeItem.pendingWeight;
      delete activeItem.pendingReps;
      saveState();
      renderLog();
      renderDraft();
      showToast("Set " + String(setNumber).padStart(2, "0") + " saved.");
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
  document.getElementById("progress-fill").style.width = Math.min(100, ((count - previous) / (next - previous)) * 100) + "%";
  document.getElementById("progress-next").textContent = (next - count) + (next - count === 1 ? " day" : " days") + " until your " + next + "-day milestone.";

  const today = dateFromKey(localDateKey(new Date()));
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekCount = days.filter((day) => day >= localDateKey(monday)).length;
  document.getElementById("weekly-goal").value = String(state.weeklyGoal);
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
  summary.textContent = count ? count + (count === 1 ? " workout logged" : " workouts logged") : marked ? "Gym visit marked" : "No workout logged for this day";
}

function renderHistory() {
  renderProgress();
  renderCalendar();
  renderSelectedDay();
  historyList.replaceChildren();
  const selectedWorkouts = workoutsForDay(state.selectedDay);
  if (selectedWorkouts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-panel";
    empty.innerHTML = '<span class="empty-mark" aria-hidden="true">—</span><h2>No session logged for this day</h2><p>Choose a highlighted day to review a workout, or build one for this date.</p>';
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
    header.append(title, summary);
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
    exercises: state.session.exercises.map((item) => ({
      ...item,
      sets: item.sets.map((set) => ({ ...set }))
    }))
  };
  state.history.push(completed);
  state.selectedDay = completed.workoutDate;
  state.calendarMonth = completed.workoutDate.slice(0, 7);
  state.workoutDate = localDateKey(new Date());
  state.session = null;
  state.appView = "history";
  saveState();
  renderApp();
  showToast("Workout saved to history.");
}

function addSelectedExercise() {
  if (!state.exercise) return;
  if (!state.session) {
    state.session = {
      id: makeId(),
      startedAt: new Date().toISOString(),
      workoutDate: state.workoutDate,
      weightUnit: state.weightUnit,
      exercises: []
    };
  }
  const exists = state.session.exercises.some((item) =>
    item.exercise === state.exercise && item.muscle === muscleLabels[state.muscle]
  );
  if (!exists) {
    state.session.exercises.push({
      id: makeId(),
      muscle: muscleLabels[state.muscle],
      exercise: state.exercise,
      sets: []
    });
    showToast(state.exercise + " added to your workout.");
  } else {
    showToast("That exercise is already in your workout.");
  }
  state.exercise = "";
  saveState();
  renderApp();
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
addExerciseButton.addEventListener("click", addSelectedExercise);
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

unitSelect.addEventListener("change", () => {
  state.weightUnit = unitSelect.value === "kg" ? "kg" : "lb";
  if (state.session) {
    state.session.weightUnit = state.weightUnit;
  }
  saveState();
  if (state.appView === "log") renderLog();
});

document.getElementById("close-guide").addEventListener("click", () => document.getElementById("exercise-guide").close());
document.getElementById("exercise-guide").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
renderSpecialGuideButtons();
document.getElementById("special-level").value = String(state.specialRounds);
renderApp();
