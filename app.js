const fallbackQuestions = [
  { place: "Demacia", question: "Name a champion from Demacia.", instruction: "Less obvious answers earn more Resonance.", answers: [["Garen", ["garen"], "Familiar", 10], ["Lux", ["lux", "luxanna", "luxanna crownguard"], "Familiar", 10], ["Jarvan IV", ["jarvan", "jarvan iv", "jarvan 4"], "Known", 25], ["Sylas", ["sylas"], "Known", 25], ["Fiora", ["fiora", "fiora laurent"], "Uncommon", 50], ["Vayne", ["vayne", "shauna vayne"], "Uncommon", 50], ["Galio", ["galio"], "Deep Lore", 75], ["Sona", ["sona", "sona buvelle"], "Deep Lore", 75], ["Shyvana", ["shyvana"], "Deep Lore", 75], ["Quinn", ["quinn"], "Legendary", 100]] },
  { place: "Spirit Realm", question: "Name a champion from Ionia.", instruction: "Look beyond the first champions that come to mind.", answers: [["Ahri", ["ahri"], "Familiar", 10], ["Yasuo", ["yasuo"], "Familiar", 10], ["Irelia", ["irelia", "irelia lito"], "Known", 25], ["Karma", ["karma", "darma"], "Known", 25], ["Shen", ["shen"], "Uncommon", 50], ["Kennen", ["kennen"], "Uncommon", 50], ["Rakan", ["rakan"], "Deep Lore", 75], ["Xayah", ["xayah"], "Deep Lore", 75], ["Varus", ["varus"], "Legendary", 100]] },
  { place: "Noxus", question: "Name a champion from Noxus.", instruction: "The final gate rewards the deepest cut of knowledge.", answers: [["Darius", ["darius"], "Familiar", 10], ["Katarina", ["katarina", "katarina du couteau"], "Familiar", 10], ["Draven", ["draven"], "Known", 25], ["LeBlanc", ["leblanc", "le blanc"], "Known", 25], ["Riven", ["riven"], "Uncommon", 50], ["Talon", ["talon"], "Uncommon", 50], ["Cassiopeia", ["cassiopeia", "cassiopeia du couteau"], "Deep Lore", 75], ["Sion", ["sion"], "Deep Lore", 75], ["Kled", ["kled"], "Legendary", 100]] }
];
const $ = (selector) => document.querySelector(selector);
const game = $("#game"), scene = $("#scene"), startScreen = $("#start-screen"), playScreen = $("#play-screen"), resultScreen = $("#result-screen"), completeScreen = $("#complete-screen");
const startButton = $("#start-button"), restartButton = $("#restart-button"), answerForm = $("#answer-form"), answerInput = $("#answer-input"), submitButton = answerForm.querySelector("button");
const dataStatus = $("#data-status"), timerLabel = $("#timer-label"), timerFill = $("#timer-fill"), timerCell = $(".hud-cell--timer");
const QUESTION_SECONDS = 30;
const RESULT_MS = 2300;
const START_TRAVEL_MS = 2300;
const TRAVEL_MS = 2300;
const RESULT_FADE_MS = 650;
const QUESTION_FADE_MS = 1000;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let questions = fallbackQuestions;
let nextQuestions = fallbackQuestions;
let current = 0;
let score = 0;
let phase = "landing";
let deadline = 0;
let timerId = null;
let sequenceId = null;
let results = [];
let dailyKey = "";
let dailyLabel = "";
let runKey = "";
let runLabel = "";

function localDay() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`,
    number: Math.floor(Date.UTC(year, month, date) / 86400000),
    label: new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(now)
  };
}

function dailyBest(key) {
  try { return Number(window.localStorage.getItem(`daily-expedition-best:${key}`)) || 0; }
  catch { return 0; }
}

function saveDailyBest(key, points) {
  const best = Math.max(dailyBest(key), points);
  try { window.localStorage.setItem(`daily-expedition-best:${key}`, String(best)); }
  catch { /* The expedition still works when browser storage is unavailable. */ }
  return best;
}

function refreshDailyRoute() {
  const day = localDay();
  dailyKey = day.key;
  dailyLabel = day.label;
  // A fixed permutation keeps today's route the same after refresh or replay.
  const orders = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]];
  const order = orders[day.number % orders.length];
  nextQuestions = order.map((index) => nextQuestionsSource[index]);
  $("#daily-date").textContent = day.label.toUpperCase();
  $("#topbar-date").textContent = day.label.toUpperCase();
  const route = $("#daily-route");
  route.replaceChildren();
  nextQuestions.forEach((item, index) => {
    const stop = document.createElement("span");
    stop.textContent = `${String(index + 1).padStart(2, "0")}  ${item.place}`;
    route.append(stop);
  });
  const best = dailyBest(dailyKey);
  $("#start-footnote").textContent = best
    ? `TODAY'S BEST: ${padScore(best)} RESONANCE · TYPE A CHAMPION NAME TO EARN MORE`
    : "TYPE A CHAMPION NAME TO EARN RESONANCE";
}

let nextQuestionsSource = fallbackQuestions;

const normalize = (value) => String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
const padScore = (value) => String(value).padStart(3, "0");
const delay = (milliseconds) => reducedMotion.matches ? 0 : milliseconds;

function clearPending() {
  window.clearInterval(timerId);
  window.clearTimeout(sequenceId);
  timerId = null;
  sequenceId = null;
}

function updateHud() {
  $("#stop-label").textContent = `${String(current + 1).padStart(2, "0")} / 03`;
  $("#score-label").textContent = padScore(score);
  document.querySelectorAll(".route-stop").forEach((stop, index) => {
    stop.classList.toggle("is-active", index === current);
    stop.classList.toggle("is-complete", index < current);
  });
}

function updateTimer() {
  if (phase !== "question") return;
  const remaining = Math.max(0, deadline - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  timerLabel.textContent = `00:${String(seconds).padStart(2, "0")}`;
  timerFill.style.width = `${remaining / (QUESTION_SECONDS * 1000) * 100}%`;
  timerCell.classList.toggle("is-urgent", seconds <= 10);
  if (remaining <= 0) submitAnswer(true);
}

function showQuestion() {
  phase = "arriving";
  const item = questions[current];
  $("#question-index").textContent = `QUESTION ${String(current + 1).padStart(2, "0")}`;
  $("#question-place").textContent = item.place.toUpperCase();
  $("#question-title").textContent = item.question;
  $("#question-instruction").textContent = item.instruction;
  $("#form-message").textContent = "";
  answerInput.value = "";
  answerInput.disabled = true;
  submitButton.disabled = true;
  $("#question-card").classList.remove("is-leaving");
  resultScreen.hidden = true;
  playScreen.hidden = false;
  updateHud();
  timerLabel.textContent = "00:30";
  timerFill.style.width = "100%";
  timerCell.classList.remove("is-urgent");
  sequenceId = window.setTimeout(() => {
    phase = "question";
    answerInput.disabled = false;
    submitButton.disabled = false;
    deadline = Date.now() + QUESTION_SECONDS * 1000;
    updateTimer();
    timerId = window.setInterval(updateTimer, 100);
    answerInput.focus({ preventScroll: true });
  }, delay(QUESTION_FADE_MS));
}

function submitAnswer(timedOut = false) {
  if (phase !== "question") return;
  if (!timedOut && Date.now() >= deadline) timedOut = true;
  const submitted = normalize(answerInput.value);
  const match = questions[current].answers.find(([, aliases]) => aliases.some((alias) => normalize(alias) === submitted));
  if (!match && !timedOut) {
    $("#form-message").textContent = submitted ? "That answer isn't in this stop's answer bank. Try another." : "Type a champion name first.";
    return;
  }

  phase = "result";
  window.clearInterval(timerId);
  timerId = null;
  answerInput.disabled = true;
  submitButton.disabled = true;
  const points = match ? Math.max(0, Number(match[3]) || 0) : 0;
  score += points;
  results.push({ place: questions[current].place, points });
  $("#result-kicker").textContent = match ? "ANSWER ACCEPTED" : "TIME IS UP";
  $("#result-points").textContent = `+${points}`;
  $("#result-description").textContent = match
    ? `${match[0]} · ${match[2]} answer. ${points} Resonance earned.`
    : submitted ? "No match before the timer ended. Keep moving!" : "No answer entered. The expedition moves on.";
  playScreen.hidden = true;
  resultScreen.hidden = false;
  resultScreen.classList.remove("is-leaving");
  sequenceId = window.setTimeout(beginTravel, delay(RESULT_MS));
}

function beginTravel() {
  resultScreen.classList.add("is-leaving");
  sequenceId = window.setTimeout(() => {
    resultScreen.hidden = true;
    resultScreen.classList.remove("is-leaving");
    phase = "travel";
    scene.classList.add("is-traveling");
    if (current === 0) scene.dataset.time = "dusk";
    if (current === 1) scene.dataset.time = "night";
    moveScene(current + 1.6);
    sequenceId = window.setTimeout(() => {
      scene.classList.remove("is-traveling");
      current += 1;
      if (current < questions.length) showQuestion();
      else showComplete();
    }, delay(TRAVEL_MS));
  }, delay(RESULT_FADE_MS));
}

function moveScene(step) {
  game.style.setProperty("--scene-step", String(step));
  game.style.setProperty("--scene-scale", String(1.22 + step * 0.07));
}

function showComplete() {
  phase = "complete";
  $("#total-score").textContent = padScore(score);
  $("#daily-best").textContent = `TODAY'S BEST · ${padScore(saveDailyBest(runKey, score))} RESONANCE`;
  $("#complete-copy").textContent = `You made it through all three stops on the ${runLabel} route.`;
  const breakdown = $("#score-breakdown");
  breakdown.replaceChildren();
  results.forEach((result, index) => {
    const row = document.createElement("div");
    row.className = "score-row";
    const label = document.createElement("span");
    label.textContent = `${String(index + 1).padStart(2, "0")} · ${result.place}`;
    const points = document.createElement("strong");
    points.textContent = `+${result.points}`;
    row.append(label, points);
    breakdown.append(row);
  });
  completeScreen.hidden = false;
  restartButton.focus({ preventScroll: true });
}

function beginGame() {
  clearPending();
  refreshDailyRoute();
  runKey = dailyKey;
  runLabel = dailyLabel;
  questions = nextQuestions;
  current = 0;
  score = 0;
  results = [];
  phase = "starting";
  const restarting = startScreen.hidden;
  if (restarting) scene.classList.add("is-resetting");
  moveScene(0);
  scene.dataset.time = "day";
  if (restarting) {
    // Return to the start of the route before animating the first step forward.
    void scene.offsetWidth;
    scene.classList.remove("is-resetting");
  }
  completeScreen.hidden = true;
  scene.classList.add("is-traveling");
  startScreen.classList.add("is-leaving");
  // Let the scenery advance while the title clears, then reveal question one.
  window.requestAnimationFrame(() => moveScene(0.6));
  sequenceId = window.setTimeout(() => {
    startScreen.hidden = true;
    startScreen.classList.remove("is-leaving");
    scene.classList.remove("is-traveling");
    showQuestion();
  }, delay(START_TRAVEL_MS));
}

startButton.addEventListener("click", beginGame);
restartButton.addEventListener("click", beginGame);
answerForm.addEventListener("submit", (event) => { event.preventDefault(); submitAnswer(false); });

function placeFromPrompt(prompt) {
  return prompt.replace(/^name a champion (?:from|associated with) /i, "").replace(/[.?!]$/, "");
}

async function loadSupabaseQuestions() {
  if (!window.leagueillionSupabase) {
    dataStatus.textContent = "LOCAL QUESTION PACK";
    return;
  }

  dataStatus.textContent = "LOADING QUESTION PACK…";
  const { data, error } = await window.leagueillionSupabase
    .from("questions")
    .select(`
      id,
      prompt,
      slug,
      sort_order,
      created_at,
      question_answers (
        canonical_answer,
        obscurity_tier,
        resonance_points,
        answer_aliases (normalized_alias)
      )
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  const loaded = (data || []).map((question) => ({
    place: placeFromPrompt(question.prompt),
    question: question.prompt.endsWith("?") ? question.prompt : `${question.prompt}.`,
    instruction: "Less obvious answers earn more Resonance.",
    answers: (question.question_answers || []).map((answer) => [
      answer.canonical_answer,
      [answer.canonical_answer, ...(answer.answer_aliases || []).map((alias) => alias.normalized_alias)],
      answer.obscurity_tier,
      answer.resonance_points
    ])
  })).filter((question) => question.answers.length > 0);

  if (loaded.length !== 3) {
    dataStatus.textContent = "LOCAL QUESTION PACK · THREE ACTIVE QUESTIONS NEEDED";
    return;
  }

  nextQuestionsSource = loaded;
  refreshDailyRoute();
  dataStatus.textContent = "QUESTION PACK READY";
}

async function initialize() {
  try {
    await loadSupabaseQuestions();
  } catch (error) {
    console.error("Supabase question load failed:", error);
    dataStatus.textContent = "LOCAL QUESTION PACK";
  }
}

refreshDailyRoute();
initialize();
