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
const TRAVEL_MS = 1100;
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
  phase = "question";
  const item = questions[current];
  $("#question-index").textContent = `QUESTION ${String(current + 1).padStart(2, "0")}`;
  $("#question-place").textContent = item.place.toUpperCase();
  $("#question-title").textContent = item.question;
  $("#question-instruction").textContent = item.instruction;
  $("#form-message").textContent = "";
  answerInput.value = "";
  answerInput.disabled = false;
  submitButton.disabled = false;
  $("#question-card").classList.remove("is-leaving");
  scene.classList.remove("is-traveling");
  resultScreen.hidden = true;
  playScreen.hidden = false;
  updateHud();
  deadline = Date.now() + QUESTION_SECONDS * 1000;
  updateTimer();
  timerId = window.setInterval(updateTimer, 100);
  answerInput.focus({ preventScroll: true });
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
    game.style.setProperty("--scene-step", String(current + 1));
    sequenceId = window.setTimeout(() => {
      current += 1;
      if (current < questions.length) showQuestion();
      else showComplete();
    }, delay(TRAVEL_MS));
  }, delay(300));
}

function showComplete() {
  phase = "complete";
  scene.classList.remove("is-traveling");
  $("#total-score").textContent = padScore(score);
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
  questions = nextQuestions;
  current = 0;
  score = 0;
  results = [];
  phase = "starting";
  game.style.setProperty("--scene-step", "0");
  completeScreen.hidden = true;
  startScreen.classList.add("is-leaving");
  sequenceId = window.setTimeout(() => {
    startScreen.hidden = true;
    startScreen.classList.remove("is-leaving");
    showQuestion();
  }, delay(380));
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

  nextQuestions = loaded;
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

initialize();
