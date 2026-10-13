const questions = [
  { place: "Demacia", question: "Name a champion from Demacia.", instruction: "Less obvious answers earn more Resonance.", answers: [["Garen", ["garen"], "Familiar", 10], ["Lux", ["lux", "luxanna", "luxanna crownguard"], "Familiar", 10], ["Jarvan IV", ["jarvan", "jarvan iv", "jarvan 4"], "Known", 25], ["Sylas", ["sylas"], "Known", 25], ["Fiora", ["fiora", "fiora laurent"], "Uncommon", 50], ["Vayne", ["vayne", "shauna vayne"], "Uncommon", 50], ["Galio", ["galio"], "Deep Lore", 75], ["Sona", ["sona", "sona buvelle"], "Deep Lore", 75], ["Shyvana", ["shyvana"], "Deep Lore", 75], ["Quinn", ["quinn"], "Legendary", 100]] },
  { place: "Spirit Realm", question: "Name a champion from Ionia.", instruction: "Look beyond the first champions that come to mind.", answers: [["Ahri", ["ahri"], "Familiar", 10], ["Yasuo", ["yasuo"], "Familiar", 10], ["Irelia", ["irelia", "irelia lito"], "Known", 25], ["Karma", ["karma", "darma"], "Known", 25], ["Shen", ["shen"], "Uncommon", 50], ["Kennen", ["kennen"], "Uncommon", 50], ["Rakan", ["rakan"], "Deep Lore", 75], ["Xayah", ["xayah"], "Deep Lore", 75], ["Varus", ["varus"], "Legendary", 100]] },
  { place: "Noxus", question: "Name a champion from Noxus.", instruction: "The final gate rewards the deepest cut of knowledge.", answers: [["Darius", ["darius"], "Familiar", 10], ["Katarina", ["katarina", "katarina du couteau"], "Familiar", 10], ["Draven", ["draven"], "Known", 25], ["LeBlanc", ["leblanc", "le blanc"], "Known", 25], ["Riven", ["riven"], "Uncommon", 50], ["Talon", ["talon"], "Uncommon", 50], ["Cassiopeia", ["cassiopeia", "cassiopeia du couteau"], "Deep Lore", 75], ["Sion", ["sion"], "Deep Lore", 75], ["Kled", ["kled"], "Legendary", 100]] }
];
const track = document.querySelector("#question-track"), map = document.querySelector("#map-scroll"), traveler = document.querySelector("#traveler"), progressLabel = document.querySelector("#progress-label"), scoreLabel = document.querySelector("#score-label"), completion = document.querySelector("#completion"), finalScore = document.querySelector("#final-score"), restart = document.querySelector("#restart");
let current = 0, score = 0, transitioning = false;
const normalize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
function renderQuestion() {
  const item = questions[current];
  track.innerHTML = `<article class="question-card"><p class="card-kicker">${String(current + 1).padStart(2, "0")} · ${item.place}</p><h2>${item.question}</h2><p class="question-instruction">${item.instruction}</p><form class="answer-form" novalidate><label class="sr-only" for="answer">Champion name</label><input id="answer" name="answer" type="text" autocomplete="off" placeholder="Type a champion name" /><button type="submit">Chart course</button></form><p class="response" aria-live="polite"></p></article>`;
}

function updateJourney() {
  map.style.transform = `translateX(-${current * 18}%)`;
  traveler.style.left = `${8 + current * 39}%`;
  progressLabel.textContent = `Stop ${Math.min(current + 1, questions.length)} of ${questions.length}`;
  scoreLabel.textContent = `${score} Resonance`;
}

function submitAnswer(form) {
  if (transitioning) return;
  const input = form.querySelector("input");
  const response = form.parentElement.querySelector(".response");
  const submitted = normalize(input.value);
  if (!submitted) { response.textContent = "Enter a champion name first."; response.className = "response error"; return; }
  const match = questions[current].answers.find(([, aliases]) => aliases.some((alias) => normalize(alias) === submitted));
  if (!match) { response.textContent = "That answer is not in this expedition's answer bank. Try another champion."; response.className = "response error"; return; }
  transitioning = true;
  const [name, , tier, points] = match;
  score += points;
  input.disabled = true;
  form.querySelector("button").disabled = true;
  response.textContent = `${name} — ${tier}. +${points} Resonance.`;
  response.className = "response success";
  window.setTimeout(() => {
    current += 1;
    if (current < questions.length) {
      updateJourney();
      renderQuestion();
      transitioning = false;
      track.querySelector("input").focus({ preventScroll: true });
    } else {
      progressLabel.textContent = "Route complete";
      scoreLabel.textContent = `${score} Resonance`;
      completion.hidden = false;
      finalScore.textContent = `Your expedition earned ${score} Resonance.`;
      transitioning = false;
      restart.focus();
    }
  }, 900);
}
track.addEventListener("submit", (event) => { event.preventDefault(); const form = event.target.closest(".answer-form"); if (form) submitAnswer(form); });
restart.addEventListener("click", () => { current = 0; score = 0; transitioning = false; completion.hidden = true; renderQuestion(); updateJourney(); track.querySelector("input").focus({ preventScroll: true }); });
renderQuestion(); updateJourney();
