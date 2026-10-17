// A small, self-contained soundscape. Audio starts only after a player gesture.
window.expeditionAudio = (() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let master = null;
  let muted = false;
  let chordIndex = 0;

  function tone(from, to, seconds, volume, type = "sine", offset = 0) {
    if (!context || muted) return;
    const startAt = context.currentTime + offset;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), startAt + seconds);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(volume, startAt + Math.min(0.045, seconds / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + seconds);
    oscillator.connect(envelope).connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + seconds + 0.02);
  }

  function makeWind() {
    const length = Math.floor(context.sampleRate * 4);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let drift = 0;
    for (let index = 0; index < length; index += 1) {
      drift = (drift + (Math.random() * 2 - 1) * 0.045) * 0.995;
      samples[index] = drift;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const level = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 480;
    level.gain.value = 0.16;
    source.connect(filter).connect(level).connect(master);
    source.start();
  }

  function padChord() {
    if (!context || muted) return;
    const chords = [
      [146.83, 185.00, 220.00], // D major
      [196.00, 246.94, 293.66], // G major
      [123.47, 146.83, 185.00], // B minor
      [164.81, 220.00, 277.18]  // A major
    ];
    const notes = chords[chordIndex % chords.length];
    chordIndex += 1;
    const startAt = context.currentTime + 0.05;
    notes.forEach((frequency) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.linearRampToValueAtTime(0.038, startAt + 1.8);
      envelope.gain.setValueAtTime(0.038, startAt + 3.8);
      envelope.gain.linearRampToValueAtTime(0.0001, startAt + 7.8);
      oscillator.connect(envelope).connect(master);
      oscillator.start(startAt);
      oscillator.stop(startAt + 7.85);
    });
  }

  function ensureContext() {
    if (context || !AudioContextClass) return context;
    try {
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.28;
      master.connect(context.destination);
      makeWind();
      padChord();
      window.setInterval(padChord, 6500);
    } catch (error) {
      console.warn("Expedition audio is unavailable:", error);
      context = null;
      master = null;
    }
    return context;
  }

  function start() {
    if (muted) return;
    const audio = ensureContext();
    if (audio?.state === "suspended") audio.resume().catch(() => {});
  }

  function setMuted(value, activate = false) {
    muted = Boolean(value);
    if (!muted && activate) start();
    if (context && master) {
      master.gain.setTargetAtTime(muted ? 0 : 0.28, context.currentTime, 0.08);
    }
  }

  function play(effect, points = 0) {
    if (muted) return;
    start();
    if (!context) return;
    if (effect === "start") {
      tone(392, 523, 0.42, 0.1);
      tone(587, 784, 0.48, 0.08, "sine", 0.2);
    } else if (effect === "submit") {
      tone(420, 360, 0.12, 0.09, "triangle");
    } else if (effect === "correct") {
      [523, 659, 784].forEach((note, index) => tone(note, note * 1.02, 0.4, 0.12, "sine", index * 0.13));
    } else if (effect === "invalid") {
      tone(220, 165, 0.23, 0.075, "triangle");
    } else if (effect === "timeout") {
      tone(330, 196, 0.45, 0.085, "triangle");
    } else if (effect === "progress") {
      if (points <= 0) {
        tone(196, 185, 0.2, 0.05, "triangle");
      } else {
        const steps = Math.max(2, Math.ceil(points / 20));
        for (let index = 0; index < steps; index += 1) {
          const note = 392 + index * 46;
          tone(note, note * 1.05, 0.22, 0.06, "sine", index * 0.26);
        }
      }
    } else if (effect === "walk") {
      for (let index = 0; index < 6; index += 1) {
        tone(115, 75, 0.13, 0.035, "triangle", index * 0.52);
      }
    } else if (effect === "complete") {
      [392, 494, 587, 784].forEach((note, index) => tone(note, note, 0.8, 0.095, "sine", index * 0.16));
    }
  }

  return { supported: Boolean(AudioContextClass), start, setMuted, play, getState: () => context?.state || "not-started" };
})();
