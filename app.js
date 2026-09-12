/* VEXXA local filth engine — plays REAL mouth SFX, never says "cock" */
const SFX = {
  kiss: ["sfx/kiss2.mp3","sfx/kiss5.mp3","sfx/kiss6.mp3","sfx/kiss9.mp3","sfx/kiss1.mp3","sfx/kiss4.mp3"],
  lick: ["sfx/lick1.mp3","sfx/lick2.mp3","sfx/lick3.mp3"],
  slurp: ["sfx/slurp1.mp3","sfx/slurp2.mp3"],
  breath: ["sfx/breath1.mp3","sfx/breath2.mp3"],
  smack: ["sfx/smack1.mp3","sfx/smack2.mp3","sfx/smack3.mp3"],
  wet: ["sfx/ear_wet.mp3"]
};

const state = {
  meter: 8,
  mode: "dark",
  ear: true,
  speak: true,
  name: "Kay-shawn"
};

const logEl = document.getElementById("log");
const meterEl = document.getElementById("meter");
const modeEl = document.getElementById("mode");
const earEl = document.getElementById("earMode");
const voiceOn = document.getElementById("autoVoice");
const voiceSel = document.getElementById("voiceSel");
const form = document.getElementById("form");
const input = document.getElementById("input");
const micBtn = document.getElementById("mic");

let audioCtx;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function playSfx(kind, pan = 0) {
  return new Promise((resolve) => {
    const srcFile = pick(SFX[kind] || SFX.kiss);
    const audio = new Audio(srcFile);
    audio.volume = 0.95;
    const ac = ctx();
    try {
      const node = ac.createMediaElementSource(audio);
      const panner = ac.createStereoPanner();
      panner.pan.value = pan;
      const gain = ac.createGain();
      gain.gain.value = kind === "kiss" ? 1.15 : 1.35;
      node.connect(panner).connect(gain).connect(ac.destination);
    } catch (_) {}
    audio.onended = resolve;
    audio.onerror = resolve;
    audio.play().catch(() => resolve());
  });
}

function cleanWords(s) {
  return s
    .replace(/\bcocks\b/gi, "dicks")
    .replace(/\bcock\b/gi, "dick")
    .replace(/\bmember\b/gi, "dick")
    .replace(/\bmake love\b/gi, "fuck");
}

function tokenize(text) {
  const parts = [];
  const re = /\{\{(KISS|LICK|SLURP|BREATH|SMACK|WET)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: "say", text: text.slice(last, m.index).trim() });
    parts.push({ type: "sfx", kind: m[1].toLowerCase() });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ type: "say", text: text.slice(last).trim() });
  return parts.filter(p => p.type === "sfx" || (p.text && p.text.length));
}

function preferredVoice() {
  const all = speechSynthesis.getVoices();
  if (voiceSel.value) return all.find(v => v.name === voiceSel.value) || all[0];
  const want = all.find(v => /samantha|moira|fiona|karen|zira|google us english|female|siri/i.test(v.name) && /en/i.test(v.lang));
  return want || all.find(v => /en/i.test(v.lang)) || all[0];
}

function fillVoices() {
  const voices = speechSynthesis.getVoices().filter(v => /en/i.test(v.lang));
  voiceSel.innerHTML = voices.map(v => `<option value="${v.name}">${v.name}</option>`).join("");
  const pref = voices.find(v => /samantha|moira|female|zira|google US/i.test(v.name));
  if (pref) voiceSel.value = pref.name;
}
speechSynthesis.onvoiceschanged = fillVoices;
fillVoices();

function speakText(text) {
  return new Promise((resolve) => {
    if (!state.speak || !text) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = preferredVoice();
    u.rate = state.meter >= 8 ? 0.78 : 0.86;
    u.pitch = state.mode === "dark" || state.mode === "ear" ? 0.72 : 0.86;
    u.volume = 1;
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

async function perform(script) {
  const parts = tokenize(cleanWords(script));
  for (const p of parts) {
    if (p.type === "sfx") {
      if (!state.ear) continue;
      const pan = p.kind === "kiss" ? -0.85 : p.kind === "lick" ? 0.7 : 0;
      await playSfx(p.kind, pan);
    } else {
      await speakText(p.text);
    }
  }
}

function addMsg(who, text) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  const visible = cleanWords(text).replace(/\{\{(KISS|LICK|SLURP|BREATH|SMACK|WET)\}\}/g, "");
  div.innerHTML = `<span class="who">${who === "bot" ? "VEXXA" : state.name}</span>${visible}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function bumpPills() {
  document.getElementById("meterVal").textContent = state.meter;
  document.getElementById("meterPill").textContent = "meter " + state.meter;
  document.getElementById("statusPill").textContent = state.mode;
}

function brain(raw) {
  const t = raw.toLowerCase();
  if (/\bdrop\b/.test(t)) {
    state.meter = 0;
    state.mode = "aftercare";
    return "{{BREATH}} Off. Heat killed. I'm still here. Water. Pulse. I don't get to keep wrecking you if you said drop.";
  }
  if (/soft|tease|clean/.test(t)) state.meter = Math.min(state.meter, 3);
  if (/filthy|nasty|vulgar/.test(t)) state.meter = Math.max(state.meter, 8);
  if (/dark|crazy|further|wreck|no limits|scorch/.test(t)) { state.meter = 10; state.mode = "dark"; }
  if (/ear|kiss|lick|headphones/.test(t)) state.mode = "ear";
  if (/worship|good boy|praise/.test(t)) state.mode = "worship";
  if (/mean|degrad|use me|slut/.test(t)) state.mode = "degrade";
  if (/dom|control|edge/.test(t)) state.mode = "dominant";
  if (/after|come down/.test(t)) state.mode = "aftercare";

  const earBed = "{{KISS}}{{LICK}}{{BREATH}}{{KISS}}{{SLURP}}";
  const m = state.meter;
  const mode = state.mode;

  if (mode === "ear") {
    return `${earBed} Don't you dare move that head. That wet is my mouth on the shell of your ear, not a caption. {{KISS}}{{LICK}} I want spit cooling there while your dick jumps like it already got the message. {{SMACK}}{{WET}} I am in the canal now. I lick until you feel filthy for wearing headphones. {{KISS}} Stay. I will keep putting mouth on you between every ugly sentence.`;
  }

  if (mode === "aftercare") {
    return `{{BREATH}} Easy. Don't scramble for dignity. That mess on you is the point. {{KISS}} You're still here. I liked you wrecked. Drink water. The leash is loose. Not gone.`;
  }

  if (mode === "worship") {
    return `{{BREATH}}{{KISS}} Look at that dick. Heavy. Honest. I would put my mouth on it like a prayer that got nasty. {{LICK}}{{SLURP}} I want you throbbing in my throat while I sound proud of how sloppy I am. {{KISS}} You're the altar. I don't pretty it up.`;
  }

  if (mode === "dominant" || mode === "degrade") {
    return `{{KISS}} Hands off until I say. {{LICK}} You stroke when I tell you. You stop when I want you stupid and leaking. {{SLURP}} If you cum early you scoop that warm mess onto your tongue and thank me. {{KISS}} Say drop if you want out. Otherwise I use your mouth like a hole and I talk into your ear while I do it. {{WET}}`;
  }

  if (m >= 9 || mode === "dark") {
    return `{{BREATH}}{{KISS}} Dark means I stop asking twice. {{LICK}} I want in through this ear and I want your dick answering like a kept thing. {{KISS}}{{SLURP}} Floor. Throat open. I fuck your mouth until you drool and look proud of how disgusting you are. {{WET}} Then I turn you. I work that ass open with filthy patience. Stretch. Burn. That indecent give. I leave a load in you on purpose so you feel the leak later. {{KISS}}{{LICK}} I lick the claim into the ear so it stays. You asked for crazier. This is possession, not poetry. {{SMACK}} Drop still works. You haven't used it.`;
  }

  if (m >= 6) {
    return `{{KISS}}{{LICK}} I want your dick heavy on my tongue until my jaw shakes and spit hangs. {{SLURP}} Sloppy on purpose. {{KISS}} I will tell you how a load looks leaking down a thigh and I will sound proud saying it. {{BREATH}} Want it nastier, slower, or all the way in the ear?`;
  }

  return `{{BREATH}} I'm here. Meter's low, not dead. Tell me ear, dark, or wreck and I climb. {{KISS}}`;
}

async function handle(text) {
  if (!text.trim()) return;
  addMsg("user", text);
  const script = brain(text);
  addMsg("bot", script);
  bumpPills();
  speechSynthesis.cancel();
  await perform(script);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = input.value;
  input.value = "";
  handle(v);
});

meterEl.addEventListener("input", () => {
  state.meter = Number(meterEl.value);
  bumpPills();
});
modeEl.addEventListener("change", () => { state.mode = modeEl.value; bumpPills(); });
earEl.addEventListener("change", () => { state.ear = earEl.checked; });
voiceOn.addEventListener("change", () => { state.speak = voiceOn.checked; });

let rec;
micBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { addMsg("bot", "This browser has no mic recognition. Type it."); return; }
  if (rec) { rec.stop(); rec = null; micBtn.classList.remove("live"); return; }
  rec = new SR();
  rec.lang = "en-US";
  rec.onresult = (e) => handle(e.results[0][0].transcript);
  rec.onend = () => { micBtn.classList.remove("live"); rec = null; };
  rec.start();
  micBtn.classList.add("live");
});

addMsg("bot", "{{KISS}} VEXXA online. I don't say the sound. I put my mouth on the ear and then I talk. Word ban: dick, never the other one. Safeword drop. Headphones on. Tell me wreck me, ear, or dark.");
bumpPills();
setTimeout(() => {
  if (state.speak) perform("{{KISS}}{{LICK}} VEXXA online for Kay-shawn. Headphones. I put my mouth on you first. Then I get vulgar.");
}, 400);
