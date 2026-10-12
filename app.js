const answers = [
  { name: "Garen", aliases: ["garen"], tier: "Familiar", points: 10 },
  { name: "Lux", aliases: ["lux", "luxanna", "luxanna crownguard"], tier: "Familiar", points: 10 },
  { name: "Jarvan IV", aliases: ["jarvan", "jarvan iv", "jarvan 4"], tier: "Known", points: 25 },
  { name: "Fiora", aliases: ["fiora", "fiora laurent"], tier: "Known", points: 25 },
  { name: "Galio", aliases: ["galio"], tier: "Uncommon", points: 50 },
  { name: "Quinn", aliases: ["quinn"], tier: "Uncommon", points: 50 },
  { name: "Vayne", aliases: ["vayne", "shauna vayne"], tier: "Rare", points: 75 },
  { name: "Shyvana", aliases: ["shyvana"], tier: "Rare", points: 75 },
  { name: "Sona", aliases: ["sona", "sona buvelle"], tier: "Rare", points: 75 },
  { name: "Sylas", aliases: ["sylas"], tier: "Legendary", points: 100 }
];

const form = document.querySelector("#answer-form");
const input = document.querySelector("#answer");
const result = document.querySelector("#result");
const again = document.querySelector("#again");

function normalize(value) { return value.trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function showResult(message, state) { result.hidden = false; result.className = `result ${state}`; result.innerHTML = message; }

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitted = normalize(input.value);
  if (!submitted) { showResult("<strong>Enter a champion name first.</strong>", "error"); return; }
  const match = answers.find((answer) => answer.aliases.some((alias) => normalize(alias) === submitted));
  if (!match) { showResult("<strong>Not in this prototype's answer bank.</strong> Try another Demacian champion.", "error"); return; }
  showResult(`<strong>${match.name} — ${match.tier}</strong>+${match.points} Resonance`, "success");
  input.disabled = true;
  form.querySelector("button").disabled = true;
  again.hidden = false;
});

again.addEventListener("click", () => {
  form.reset(); input.disabled = false; form.querySelector("button").disabled = false;
  result.hidden = true; again.hidden = true; input.focus();
});
