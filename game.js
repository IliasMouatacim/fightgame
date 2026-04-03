/* Clashline Arena - 1v1 fighting prototype */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const hudTip = document.getElementById("hudTip");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 120;
const GAMEPAD_DEADZONE = 0.35;

const input = new Set();
const keysPressedThisFrame = new Set();
const gamepadStates = new Map();

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function isHeld(control) {
  return asArray(control).some((code) => input.has(code));
}

function wasPressed(control) {
  return asArray(control).some((code) => keysPressedThisFrame.has(code));
}

function setVirtualInput(code, pressed) {
  const wasPressed = gamepadStates.get(code) || false;
  if (pressed) {
    input.add(code);
    if (!wasPressed) {
      keysPressedThisFrame.add(code);
      unlockAudio();
    }
  } else {
    input.delete(code);
  }
  gamepadStates.set(code, pressed);
}

function isButtonPressed(button) {
  return Boolean(button && button.pressed);
}

function getAxisValue(pad, index) {
  return pad && pad.axes && typeof pad.axes[index] === "number" ? pad.axes[index] : 0;
}

function syncGamepadInput() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];

  for (let slot = 0; slot < 2; slot += 1) {
    const pad = pads[slot];
    const prefix = `Pad${slot}`;

    const axisX = getAxisValue(pad, 0);
    const axisY = getAxisValue(pad, 1);

    const left = Boolean(pad) && (isButtonPressed(pad.buttons[14]) || axisX < -GAMEPAD_DEADZONE);
    const right = Boolean(pad) && (isButtonPressed(pad.buttons[15]) || axisX > GAMEPAD_DEADZONE);
    const up = Boolean(pad) && (isButtonPressed(pad.buttons[12]) || axisY < -GAMEPAD_DEADZONE);
    const down = Boolean(pad) && (isButtonPressed(pad.buttons[13]) || axisY > GAMEPAD_DEADZONE);

    const confirm = Boolean(pad) && (isButtonPressed(pad.buttons[0]) || isButtonPressed(pad.buttons[9]));
    const back = Boolean(pad) && isButtonPressed(pad.buttons[1]);
    const light = Boolean(pad) && isButtonPressed(pad.buttons[2]);
    const heavy = Boolean(pad) && isButtonPressed(pad.buttons[3]);
    const special = Boolean(pad) && isButtonPressed(pad.buttons[5]);
    const block = Boolean(pad) && isButtonPressed(pad.buttons[1]);

    setVirtualInput(`${prefix}Left`, left);
    setVirtualInput(`${prefix}Right`, right);
    setVirtualInput(`${prefix}Up`, up || confirm);
    setVirtualInput(`${prefix}Down`, down);
    setVirtualInput(`${prefix}Confirm`, confirm);
    setVirtualInput(`${prefix}Back`, back);
    setVirtualInput(`${prefix}Jump`, confirm);
    setVirtualInput(`${prefix}Block`, block);
    setVirtualInput(`${prefix}Light`, light);
    setVirtualInput(`${prefix}Heavy`, heavy);
    setVirtualInput(`${prefix}Special`, special);
    setVirtualInput(`${prefix}MenuUp`, up);
    setVirtualInput(`${prefix}MenuDown`, down);
  }
}

const fightersData = [
  {
    id: "hoodie-ace",
    name: "Hoodie Ace",
    primary: "#d5975f",
    secondary: "#6a3d1f",
    speed: 1.08,
    power: 1.02,
    defense: 0.98,
    gravity: 0.92,
    jumpVelocity: 18.5,
    dashSpeed: 8.5,
    spritePath: "assets/fighter1.png",
  },
  {
    id: "cloud-bloom",
    name: "Cloud Bloom",
    primary: "#f6d2b0",
    secondary: "#7a4e39",
    speed: 1.0,
    power: 1.0,
    defense: 1.02,
    gravity: 0.85,
    jumpVelocity: 17.5,
    dashSpeed: 7.5,
    spritePath: "assets/fighter2.png",
  },
  {
    id: "neon-striker",
    name: "Neon Striker",
    primary: "#ff007f",
    secondary: "#4d0026",
    speed: 1.35,
    power: 0.85,
    defense: 0.85,
    gravity: 0.75,
    jumpVelocity: 19.5,
    dashSpeed: 11,
    spritePath: null,
  },
  {
    id: "titan-rock",
    name: "Titan Rock",
    primary: "#5c5c5c",
    secondary: "#262626",
    speed: 0.75,
    power: 1.35,
    defense: 1.35,
    gravity: 1.15,
    jumpVelocity: 16.0,
    dashSpeed: 5.5,
    spritePath: null,
  },
  {
    id: "shadow-ninja",
    name: "Shadow Ninja",
    primary: "#141414",
    secondary: "#4a00e0",
    speed: 1.25,
    power: 0.95,
    defense: 0.9,
    gravity: 0.95,
    jumpVelocity: 21.0,
    dashSpeed: 10,
    spritePath: null,
  },
];

const spriteCache = new Map();

function getSprite(path) {
  if (!path) return null;
  if (spriteCache.has(path)) return spriteCache.get(path);

  const img = new Image();
  img.src = path;
  const record = { img, loaded: false };
  img.onload = () => {
    record.loaded = true;
  };
  spriteCache.set(path, record);
  return record;
}

const stages = [
  {
    id: "foundry",
    name: "Iron Foundry",
    skyTop: "#291610",
    skyBottom: "#6a2c1f",
    fog: "rgba(255, 154, 94, 0.14)",
    floorA: "#4f2a1e",
    floorB: "#281411",
    moonColor: "#ff4d4d",
    moonSize: 90,
    moonOffsetX: -150,
    moonOffsetY: 0,
    mountainColor: "#3d1c16",
  },
  {
    id: "oasis",
    name: "Shard Oasis",
    skyTop: "#10212c",
    skyBottom: "#1c5d68",
    fog: "rgba(107, 253, 235, 0.11)",
    floorA: "#1a413f",
    floorB: "#0d2325",
    moonColor: "#e6ffff",
    moonSize: 120,
    moonOffsetX: 200,
    moonOffsetY: -40,
    mountainColor: "#0f2e30",
  },
  {
    id: "sunset-yards",
    name: "Sunset Yards",
    skyTop: "#38211f",
    skyBottom: "#8f5a4a",
    fog: "rgba(255, 216, 168, 0.11)",
    floorA: "#654436",
    floorB: "#322018",
    moonColor: "#ffb366",
    moonSize: 75,
    moonOffsetX: 0,
    moonOffsetY: 50,
    mountainColor: "#4f2a20",
  },
];

const state = {
  scene: "title",
  mode: "versus",
  p1Choice: 0,
  p2Choice: 1,
  stageChoice: 0,
  winnerText: "",
  timer: 99,
  roundTime: 99,
  roundWins: [0, 0],
  particles: [],
  cameraShake: 0,
  comboTextTimer: 0,
  comboTexts: ["", ""],
  musicMuted: true,
  pickups: [],
  pickupSpawnTimer: 360,
  arcadeStage: 1,
  arcadeTotalStages: 3,
  arcadeScore: 0,
};

const audioState = {
  ctx: null,
  master: null,
  musicBus: null,
  sfxBus: null,
  musicStep: 0,
  musicNext: 0,
};

function ensureAudio() {
  if (audioState.ctx) return audioState.ctx;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  const musicBus = ctx.createGain();
  const sfxBus = ctx.createGain();

  musicBus.gain.value = 0.4;
  sfxBus.gain.value = 0.9;
  master.gain.value = state.musicMuted ? 0 : 0.85;

  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(ctx.destination);

  audioState.ctx = ctx;
  audioState.master = master;
  audioState.musicBus = musicBus;
  audioState.sfxBus = sfxBus;
  audioState.musicNext = ctx.currentTime;
  return ctx;
}

function unlockAudio() {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

function setMuted(muted) {
  state.musicMuted = muted;
  const ctx = ensureAudio();
  if (!ctx || !audioState.master) return;
  const now = ctx.currentTime;
  audioState.master.gain.cancelScheduledValues(now);
  audioState.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, now + 0.06);
}

function emitTone({ freq, when = 0, duration = 0.12, type = "square", gain = 0.1, target = "sfx", slideTo = null }) {
  const ctx = ensureAudio();
  if (!ctx || !freq) return;

  const at = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const bus = target === "music" ? audioState.musicBus : audioState.sfxBus;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(35, slideTo), at + duration);
  }

  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(amp);
  amp.connect(bus);

  osc.start(at);
  osc.stop(at + duration + 0.02);
}

function emitNoise({ when = 0, duration = 0.08, gain = 0.04, target = "sfx" }) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const at = ctx.currentTime + when;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }

  const src = ctx.createBufferSource();
  const hp = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  const bus = target === "music" ? audioState.musicBus : audioState.sfxBus;

  hp.type = "highpass";
  hp.frequency.value = 1200;

  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  src.buffer = buffer;
  src.connect(hp);
  hp.connect(amp);
  amp.connect(bus);

  src.start(at);
  src.stop(at + duration + 0.02);
}

function playSfx(eventName) {
  if (state.musicMuted) return;
  unlockAudio();

  if (eventName === "ui-nav") {
    emitTone({ freq: 440, duration: 0.05, type: "triangle", gain: 0.035 });
    return;
  }

  if (eventName === "ui-confirm") {
    emitTone({ freq: 420, duration: 0.06, type: "triangle", gain: 0.045 });
    emitTone({ freq: 620, when: 0.05, duration: 0.08, type: "triangle", gain: 0.05 });
    return;
  }

  if (eventName === "ui-back") {
    emitTone({ freq: 500, duration: 0.05, type: "triangle", gain: 0.04, slideTo: 260 });
    return;
  }

  if (eventName === "light") {
    emitTone({ freq: 310, duration: 0.06, type: "square", gain: 0.05, slideTo: 230 });
    return;
  }

  if (eventName === "heavy") {
    emitTone({ freq: 210, duration: 0.11, type: "square", gain: 0.07, slideTo: 110 });
    emitNoise({ duration: 0.06, gain: 0.03 });
    return;
  }

  if (eventName === "special") {
    emitTone({ freq: 440, duration: 0.08, type: "sawtooth", gain: 0.06 });
    emitTone({ freq: 660, when: 0.05, duration: 0.12, type: "sawtooth", gain: 0.07, slideTo: 980 });
    return;
  }

  if (eventName === "hit") {
    emitTone({ freq: 190, duration: 0.07, type: "square", gain: 0.05, slideTo: 120 });
    emitNoise({ duration: 0.05, gain: 0.022 });
    return;
  }

  if (eventName === "block") {
    emitTone({ freq: 840, duration: 0.05, type: "triangle", gain: 0.035, slideTo: 560 });
    return;
  }

  if (eventName === "ko") {
    emitTone({ freq: 165, duration: 0.14, type: "square", gain: 0.08, slideTo: 80 });
    emitNoise({ when: 0.02, duration: 0.1, gain: 0.03 });
    return;
  }

  if (eventName === "timeout") {
    emitTone({ freq: 520, duration: 0.09, type: "triangle", gain: 0.05, slideTo: 380 });
    emitTone({ freq: 430, when: 0.11, duration: 0.09, type: "triangle", gain: 0.05, slideTo: 300 });
    return;
  }

  if (eventName === "pickup-meter") {
    emitTone({ freq: 540, duration: 0.06, type: "triangle", gain: 0.04 });
    emitTone({ freq: 720, when: 0.05, duration: 0.08, type: "triangle", gain: 0.045 });
    return;
  }

  if (eventName === "pickup-heal") {
    emitTone({ freq: 330, duration: 0.06, type: "triangle", gain: 0.04 });
    emitTone({ freq: 392, when: 0.05, duration: 0.06, type: "triangle", gain: 0.042 });
    emitTone({ freq: 494, when: 0.1, duration: 0.08, type: "triangle", gain: 0.045 });
    return;
  }

  if (eventName === "win") {
    emitTone({ freq: 262, duration: 0.1, type: "triangle", gain: 0.05 });
    emitTone({ freq: 330, when: 0.11, duration: 0.1, type: "triangle", gain: 0.052 });
    emitTone({ freq: 392, when: 0.22, duration: 0.15, type: "triangle", gain: 0.055 });
    return;
  }

  if (eventName === "lose") {
    emitTone({ freq: 392, duration: 0.1, type: "triangle", gain: 0.05, slideTo: 330 });
    emitTone({ freq: 330, when: 0.12, duration: 0.12, type: "triangle", gain: 0.05, slideTo: 220 });
  }
}

function scheduleKick(when, intensity = 1) {
  emitTone({ freq: 120, when, duration: 0.11, type: "sine", gain: 0.07 * intensity, target: "music", slideTo: 52 });
}

function scheduleMusic() {
  if (state.musicMuted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  unlockAudio();

  if (!audioState.musicNext || audioState.musicNext < ctx.currentTime) {
    audioState.musicNext = ctx.currentTime;
  }

  const inMatch = state.scene === "match";
  const bpm = inMatch ? 124 : 92;
  const step = 60 / bpm / 2;
  const melody = inMatch
    ? [165, 0, 196, 0, 220, 0, 196, 0]
    : [196, 0, 247, 0, 220, 0, 196, 0];

  while (audioState.musicNext < ctx.currentTime + 0.16) {
    const idx = audioState.musicStep % melody.length;
    const note = melody[idx];

    if (note) {
      emitTone({
        freq: note,
        when: audioState.musicNext - ctx.currentTime,
        duration: step * 0.85,
        type: inMatch ? "sawtooth" : "triangle",
        gain: inMatch ? 0.03 : 0.022,
        target: "music",
      });
    }

    if (inMatch && idx % 2 === 0) {
      scheduleKick(audioState.musicNext - ctx.currentTime, 1);
    }

    audioState.musicStep += 1;
    audioState.musicNext += step;
  }
}

function keyDown(e) {
  unlockAudio();
  const code = e.code;
  if (!input.has(code)) {
    keysPressedThisFrame.add(code);
  }
  input.add(code);

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
    e.preventDefault();
  }
}

function keyUp(e) {
  input.delete(e.code);
}

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);
window.addEventListener("gamepadconnected", unlockAudio);

class Fighter {
  constructor(slot, data, controls) {
    this.slot = slot;
    this.data = data;
    this.controls = controls;
    this.reset();
  }

  reset() {
    this.x = this.slot === 0 ? W * 0.3 : W * 0.7;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = this.slot === 0 ? 1 : -1;

    this.width = 96;
    this.height = 164;

    this.hpMax = 1000;
    this.hp = this.hpMax;
    this.meter = 0;

    this.grounded = true;
    this.blocking = false;
    this.hitstun = 0;
    this.attackTimer = 0;
    this.attackType = null;
    this.attackDuration = 0;
    this.attackConnected = false;

    this.combo = 0;
    this.comboTimeout = 0;

    this.flashTimer = 0;
    this.isKO = false;

    this.scaleX = 1;
    this.scaleY = 1;

    this.dashTimer = 0;
    this.dashDir = 0;
    this.lastTap = { dir: 0, time: 0 };
  }

  get moveSpeed() {
    return 5.2 * this.data.speed;
  }

  get jumpPower() {
    return this.data.jumpVelocity;
  }

  controlsPressed() {
    return {
      left: isHeld(this.controls.left),
      right: isHeld(this.controls.right),
      up: isHeld(this.controls.up),
      block: isHeld(this.controls.block),
      leftPressed: wasPressed(this.controls.left),
      rightPressed: wasPressed(this.controls.right),
      light: wasPressed(this.controls.light),
      heavy: wasPressed(this.controls.heavy),
      special: wasPressed(this.controls.special),
    };
  }

  update(enemy, mode) {
    if (this.isKO) {
      this.vx *= 0.85;
      this.x += this.vx;
      return;
    }

    if (this.comboTimeout > 0) this.comboTimeout -= 1;
    if (this.comboTimeout <= 0) this.combo = 0;

    if (this.flashTimer > 0) this.flashTimer -= 1;
    if (this.hitstun > 0) this.hitstun -= 1;
    if (this.attackTimer > 0) this.attackTimer -= 1;
    if (this.attackTimer <= 0) {
      this.attackType = null;
      this.attackConnected = false;
    }
    
    if (this.dashTimer > 0) this.dashTimer -= 1;
    this.scaleX += (1 - this.scaleX) * 0.15;
    this.scaleY += (1 - this.scaleY) * 0.15;

    const c = this.slot === 1 && mode === "arcade" ? cpuBrain(this, enemy) : this.controlsPressed();

    this.facing = this.x < enemy.x ? 1 : -1;

    this.blocking = c.block && this.hitstun <= 0 && this.grounded;
    const wasGrounded = this.grounded;

    if (this.hitstun <= 0) {
      if (!c.left && !c.right) {
        this.vx *= 0.7; // friction
      }

      if (c.left) {
        if (c.leftPressed && this.lastTap.dir === -1 && performance.now() - this.lastTap.time < 300) {
          this.dashTimer = 22;
          this.dashDir = -1;
          spawnBurst(this.x, GROUND_Y - 10, "#ffffff", 4);
        } else if (c.leftPressed) {
          this.lastTap = { dir: -1, time: performance.now() };
        }
        let maxSpeed = this.dashTimer > 0 && this.dashDir === -1 ? this.data.dashSpeed : this.moveSpeed;
        this.vx -= 1.5;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
      }
      
      if (c.right) {
        if (c.rightPressed && this.lastTap.dir === 1 && performance.now() - this.lastTap.time < 300) {
          this.dashTimer = 22;
          this.dashDir = 1;
          spawnBurst(this.x, GROUND_Y - 10, "#ffffff", 4);
        } else if (c.rightPressed) {
          this.lastTap = { dir: 1, time: performance.now() };
        }
        let maxSpeed = this.dashTimer > 0 && this.dashDir === 1 ? this.data.dashSpeed : this.moveSpeed;
        this.vx += 1.5;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
      }

      if (c.up && this.grounded) {
        this.vy = -this.jumpPower;
        this.grounded = false;
        this.scaleX = 0.65;
        this.scaleY = 1.35;
      }

      if (!this.attackType) {
        if (c.light) this.startAttack("light");
        if (c.heavy) this.startAttack("heavy");
        if (c.special && this.meter >= 35) this.startAttack("special");
      }
    }

    this.vy += this.data.gravity;
    if (this.vy > 18) this.vy = 18;

    this.x += this.vx;
    this.y += this.vy;

    this.x = Math.max(45, Math.min(W - 45, this.x));

    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
      if (!wasGrounded) {
        this.scaleX = 1.4;
        this.scaleY = 0.6;
        spawnBurst(this.x, GROUND_Y, "rgba(255,255,255,0.4)", 6);
      }
    } else {
      this.grounded = false;
    }

    this.resolveAttack(enemy);
  }

  startAttack(type) {
    this.attackType = type;
    if (type === "light") this.attackTimer = 16;
    if (type === "heavy") this.attackTimer = 24;
    if (type === "special") {
      this.attackTimer = 30;
      this.meter -= 35;
    }

    this.attackDuration = this.attackTimer;

    playSfx(type);
  }

  attackBox() {
    if (!this.attackType || this.hitstun > 0) return null;

    const progress = this.attackTimer;
    let active = false;

    if (this.attackType === "light") active = progress >= 8 && progress <= 12;
    if (this.attackType === "heavy") active = progress >= 10 && progress <= 18;
    if (this.attackType === "special") active = progress >= 8 && progress <= 24;

    if (!active) return null;

    let reach = 54;
    let h = 46;
    if (this.attackType === "heavy") {
      reach = 74;
      h = 54;
    }
    if (this.attackType === "special") {
      reach = 92;
      h = 68;
    }

    return {
      x: this.x + this.facing * (this.width * 0.5 + reach * 0.5),
      y: this.y - this.height * 0.58,
      w: reach,
      h,
      damage: this.attackType === "light" ? 55 : this.attackType === "heavy" ? 95 : 132,
      chip: this.attackType === "special" ? 15 : 8,
      hitstun: this.attackType === "light" ? 12 : this.attackType === "heavy" ? 18 : 22,
      push: this.attackType === "light" ? 7 : this.attackType === "heavy" ? 12 : 14,
    };
  }

  resolveAttack(enemy) {
    const box = this.attackBox();
    if (!box || this.attackConnected) return;

    const enemyRect = {
      x: enemy.x,
      y: enemy.y - enemy.height * 0.5,
      w: enemy.width,
      h: enemy.height,
    };

    if (!overlap(box, enemyRect)) return;

    this.attackConnected = true;

    let damage = box.damage * this.data.power;
    damage /= enemy.data.defense;

    if (enemy.blocking) {
      damage = box.chip;
      enemy.hitstun = Math.max(enemy.hitstun, 6);
      spawnBurst(enemy.x, enemy.y - enemy.height * 0.6, "#8ec7df", 8);
      playSfx("block");
    } else {
      enemy.hitstun = Math.max(enemy.hitstun, box.hitstun);
      enemy.combo += 1;
      enemy.comboTimeout = 80;
      state.comboTexts[this.slot] = `${this.data.name} ${enemy.combo} HIT`;
      state.comboTextTimer = 44;
      spawnBurst(enemy.x, enemy.y - enemy.height * 0.6, "#ffd7b5", 18);
      state.cameraShake = Math.max(state.cameraShake, 6);
      playSfx("hit");
    }

    enemy.hp -= Math.max(1, damage);
    enemy.vx += this.facing * box.push;
    enemy.flashTimer = 6;

    this.meter = Math.min(100, this.meter + (enemy.blocking ? 5 : 10));

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.isKO = true;
      state.cameraShake = 15;
      playSfx("ko");
    }
  }

  draw() {
    const pulse = this.attackType ? Math.sin(performance.now() / 65) * 0.08 + 1 : 1;
    const sprite = getSprite(this.data.spritePath);
    const attackProgress = this.attackType && this.attackDuration > 0 ? 1 - this.attackTimer / this.attackDuration : 0;
    const attackIntent = this.getAttackIntent(attackProgress);

    ctx.save();
    ctx.translate(this.x, this.y);

    let walkBob = 0;
    let walkLean = 0;
    if (this.grounded && Math.abs(this.vx) > 0.5 && this.hitstun <= 0 && !this.attackType && !this.blocking && !this.dashTimer) {
      walkBob = Math.abs(Math.sin(performance.now() / 80)) * 8;
      walkLean = (this.vx * this.facing) * 0.015;
    }
    if (this.dashTimer > 0) {
      walkLean = (this.dashDir * this.facing) * 0.15;
    }
    if (this.attackType) {
      walkLean += attackIntent.bodyLean;
      ctx.translate(attackIntent.bodyShiftX, attackIntent.bodyShiftY);
    }
    ctx.translate(0, -walkBob);
    ctx.rotate(walkLean);

    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-this.width * 0.5, -this.height, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    if (this.attackType) {
      this.drawAttackAura(attackIntent);
    }

    ctx.scale(this.facing * this.scaleX, this.scaleY);

    if (sprite && sprite.loaded) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite.img,
        -this.width * 0.55 * pulse,
        -this.height,
        this.width * 1.1 * pulse,
        this.height
      );
      ctx.imageSmoothingEnabled = true;
    } else {
      const bodyTop = this.y - this.height;
      const grad = ctx.createLinearGradient(0, bodyTop, 0, this.y);
      grad.addColorStop(0, this.data.primary);
      grad.addColorStop(1, this.data.secondary);

      ctx.fillStyle = grad;
      ctx.fillRect(-this.width * 0.5 * pulse, -this.height, this.width * pulse, this.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(-this.width * 0.32, -this.height * 0.82, this.width * 0.64, this.height * 0.22);

      ctx.fillStyle = "#f6f1dc";
      ctx.fillRect(this.width * 0.07, -this.height * 0.7, 10, 10);
    }

    if (this.attackType) {
      this.drawAttackPose(attackIntent);
    }

    if (this.blocking) {
      ctx.strokeStyle = "#9cc9de";
      ctx.lineWidth = 3;
      ctx.strokeRect(-this.width * 0.58, -this.height * 0.96, this.width * 1.16, this.height * 0.96);
    }

    if (this.attackType && this.attackBox()) {
      const box = this.attackBox();
      ctx.fillStyle = this.attackType === "special" ? "rgba(239, 127, 66, 0.3)" : "rgba(255, 255, 255, 0.2)";
      const localX = (box.x - this.x) * this.facing;
      ctx.fillRect(localX - box.w * 0.5, box.y - this.y - box.h * 0.5, box.w, box.h);
    }

    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 4, 45, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  getAttackIntent(progress) {
    const clamped = Math.max(0, Math.min(1, progress));

    if (this.attackType === "light") {
      return {
        bodyLean: -0.1 + clamped * 0.18,
        bodyShiftX: 4 + clamped * 10,
        bodyShiftY: -2,
        armReach: 24 + clamped * 22,
        armRise: -22,
        slashRadius: 74 + clamped * 18,
        slashWidth: 8,
        glowColor: "rgba(255, 248, 188, 0.95)",
        glowOuter: "rgba(255, 219, 107, 0.22)",
        trailColor: "rgba(255, 246, 176, 0.85)",
        burstColor: "rgba(255, 236, 160, 0.9)",
        sparkCount: 6,
        handScale: 1,
      };
    }

    if (this.attackType === "heavy") {
      return {
        bodyLean: 0.14 + clamped * 0.12,
        bodyShiftX: 2 + clamped * 6,
        bodyShiftY: 2,
        armReach: 38 + clamped * 36,
        armRise: -12,
        slashRadius: 96 + clamped * 30,
        slashWidth: 14,
        glowColor: "rgba(255, 179, 118, 0.95)",
        glowOuter: "rgba(255, 112, 58, 0.18)",
        trailColor: "rgba(255, 180, 108, 0.78)",
        burstColor: "rgba(255, 160, 96, 0.85)",
        sparkCount: 10,
        handScale: 1.12,
      };
    }

    return {
      bodyLean: 0.02 + clamped * 0.18,
      bodyShiftX: 3 + clamped * 8,
      bodyShiftY: -2,
      armReach: 46 + clamped * 42,
      armRise: -18,
      slashRadius: 112 + clamped * 40,
      slashWidth: 18,
      glowColor: "rgba(130, 255, 248, 0.9)",
      glowOuter: "rgba(74, 215, 209, 0.18)",
      trailColor: "rgba(120, 255, 244, 0.82)",
      burstColor: "rgba(120, 255, 244, 0.85)",
      sparkCount: 12,
      handScale: 1.16,
    };
  }

  drawAttackAura(intent) {
    const swing = Math.sin(performance.now() / 45);
    const direction = this.facing;
    const armX = direction * (this.width * 0.34 + intent.armReach * 0.35);
    const armY = -this.height * 0.78 + intent.armRise + swing * 3;
    const trailAlpha = this.attackType === "light" ? 0.7 : this.attackType === "heavy" ? 0.55 : 0.62;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = intent.glowColor;
    ctx.shadowBlur = this.attackType === "light" ? 24 : 20;

    const auraGrad = ctx.createRadialGradient(0, -this.height * 0.55, 10, 0, -this.height * 0.55, intent.slashRadius);
    auraGrad.addColorStop(0, intent.glowOuter);
    auraGrad.addColorStop(0.55, intent.trailColor);
    auraGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(armX * 0.45, -this.height * 0.56, intent.slashRadius, 0, Math.PI * 2);
    ctx.fill();

    const slashStart = -0.9 + (this.attackType === "special" ? 0.25 : 0.0);
    const slashEnd = slashStart + 1.0 + this.attackTimer * 0.01;
    ctx.strokeStyle = intent.trailColor;
    ctx.lineWidth = intent.slashWidth;
    ctx.lineCap = "round";
    ctx.globalAlpha = trailAlpha;
    ctx.beginPath();
    ctx.arc(armX * 0.34, -this.height * 0.58, intent.slashRadius, slashStart, slashEnd);
    ctx.stroke();

    if (this.attackType === "light") {
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = intent.glowColor;
      ctx.beginPath();
      ctx.ellipse(armX, armY, 18, 26, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(armX - 10, armY - 8);
      ctx.lineTo(armX + 16, armY - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(armX - 4, armY + 10);
      ctx.lineTo(armX + 10, armY + 18);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = intent.burstColor;
    for (let i = 0; i < intent.sparkCount; i += 1) {
      const sparkAngle = (Math.PI * 2 * i) / intent.sparkCount + swing * 0.3;
      const sparkRadius = intent.slashRadius * (0.68 + (i % 3) * 0.06);
      const sx = Math.cos(sparkAngle) * sparkRadius;
      const sy = Math.sin(sparkAngle) * sparkRadius * 0.55;
      ctx.beginPath();
      ctx.arc(sx * 0.25, sy - this.height * 0.58, 4 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawAttackPose(intent) {
    const direction = this.facing;
    const bodyBaseY = -this.height * 0.36;
    const torsoLean = direction * (this.attackType === "light" ? 0.12 : this.attackType === "heavy" ? 0.22 : 0.18);
    const armForward = direction * intent.armReach;
    const armUp = intent.armRise;

    ctx.save();
    ctx.translate(0, bodyBaseY);
    ctx.rotate(torsoLean);

    ctx.fillStyle = intent.glowColor;
    ctx.globalAlpha = this.attackType === "light" ? 0.85 : 0.6;
    ctx.beginPath();
    ctx.ellipse(direction * 6, -18, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = intent.trailColor;
    ctx.lineCap = "round";
    ctx.lineWidth = this.attackType === "light" ? 8 : this.attackType === "heavy" ? 10 : 12;
    ctx.beginPath();
    ctx.moveTo(direction * 8, -16);
    ctx.lineTo(direction * (18 + armForward * 0.4), armUp - 32);
    ctx.stroke();

    ctx.fillStyle = this.attackType === "light" ? "rgba(255, 249, 205, 0.95)" : this.attackType === "heavy" ? "rgba(255, 209, 156, 0.95)" : "rgba(190, 255, 250, 0.95)";
    ctx.beginPath();
    ctx.arc(direction * (20 + armForward * 0.5), armUp - 30, 12 * intent.handScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

const p1Controls = {
  left: ["KeyA", "Pad0Left"],
  right: ["KeyD", "Pad0Right"],
  up: ["KeyW", "Pad0Jump"],
  block: ["KeyS", "Pad0Block"],
  light: ["KeyF", "Pad0Light"],
  heavy: ["KeyG", "Pad0Heavy"],
  special: ["KeyH", "Pad0Special"],
};

const p2Controls = {
  left: ["ArrowLeft", "Pad1Left"],
  right: ["ArrowRight", "Pad1Right"],
  up: ["ArrowUp", "Pad1Jump"],
  block: ["ArrowDown", "Pad1Block"],
  light: ["KeyJ", "Pad1Light"],
  heavy: ["KeyK", "Pad1Heavy"],
  special: ["KeyL", "Pad1Special"],
};

let p1 = new Fighter(0, fightersData[0], p1Controls);
let p2 = new Fighter(1, fightersData[1], p2Controls);

function cpuBrain(self, enemy) {
  const dist = enemy.x - self.x;
  const absDist = Math.abs(dist);
  const shouldAttack = absDist < 130;

  return {
    left: dist < -45,
    right: dist > 45,
    up: Math.random() < 0.006 && self.grounded,
    block: enemy.attackType && Math.random() < 0.25,
    light: shouldAttack && Math.random() < 0.09,
    heavy: shouldAttack && Math.random() < 0.055,
    special: shouldAttack && self.meter >= 35 && Math.random() < 0.03,
  };
}

function overlap(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h
  );
}

function resetRound() {
  p1.reset();
  p2.reset();
  state.timer = state.roundTime;
  state.comboTexts[0] = "";
  state.comboTexts[1] = "";
  state.pickups = [];
  state.pickupSpawnTimer = 240;
}

function startMatch(resetSet = true) {
  p1 = new Fighter(0, fightersData[state.p1Choice], p1Controls);
  p2 = new Fighter(1, fightersData[state.p2Choice], p2Controls);
  if (resetSet) state.roundWins = [0, 0];
  state.timer = state.roundTime;
  state.pickups = [];
  state.pickupSpawnTimer = 240;
  state.scene = "match";
}

function chooseArcadeOpponent() {
  const options = fightersData.map((_, i) => i).filter((i) => i !== state.p1Choice);
  state.p2Choice = options[Math.floor(Math.random() * options.length)];
}

function finishSet(winner, reasonText) {
  if (state.mode === "arcade") {
    if (winner === 0) {
      playSfx("win");
      state.arcadeScore += 1000 + Math.floor(p1.hp * 2);
      if (state.arcadeStage >= state.arcadeTotalStages) {
        state.winnerText = `Arcade Clear! Score: ${state.arcadeScore}`;
        state.scene = "results";
      } else {
        state.arcadeStage += 1;
        chooseArcadeOpponent();
        state.stageChoice = (state.stageChoice + 1) % stages.length;
        state.winnerText = `Stage ${state.arcadeStage - 1} clear! Press Enter for Stage ${state.arcadeStage}`;
        state.scene = "arcade-next";
      }
      return;
    }

    playSfx("lose");
    state.winnerText = `Arcade Over. ${reasonText} Score: ${state.arcadeScore}`;
    state.scene = "results";
    return;
  }

  playSfx(winner === 0 ? "win" : "lose");

  state.winnerText = reasonText;
  state.scene = "results";
}

function endRoundByKO() {
  const winner = p1.hp > p2.hp ? 0 : 1;
  if (state.mode !== "training") state.roundWins[winner] += 1;

  if (state.mode !== "training" && state.roundWins[winner] >= 2) {
    const winnerName = winner === 0 ? "Player 1" : state.mode === "arcade" ? "CPU" : "Player 2";
    finishSet(winner, `${winnerName} wins the set!`);
  } else {
    resetRound();
  }
}

function endRoundByTimeout() {
  playSfx("timeout");
  const winner = p1.hp === p2.hp ? -1 : p1.hp > p2.hp ? 0 : 1;

  if (winner >= 0 && state.mode !== "training") {
    state.roundWins[winner] += 1;
    if (state.roundWins[winner] >= 2) {
      const winnerName = winner === 0 ? "Player 1" : state.mode === "arcade" ? "CPU" : "Player 2";
      finishSet(winner, `${winnerName} wins by decision!`);
      return;
    }
  }

  resetRound();
}

function updateMatch() {
  p1.update(p2, state.mode);
  p2.update(p1, state.mode);

  updatePickups();

  if (state.comboTextTimer > 0) state.comboTextTimer -= 1;

  if (state.mode !== "training") {
    state.timer -= 1 / 60;
    if (state.timer <= 0) {
      state.timer = 0;
      endRoundByTimeout();
      return;
    }
  }

  if (p1.hp <= 0 || p2.hp <= 0) {
    endRoundByKO();
  }

  if (state.cameraShake > 0) state.cameraShake *= 0.85;
}

function updatePickups() {
  state.pickupSpawnTimer -= 1;
  if (state.pickupSpawnTimer <= 0 && state.pickups.length < 1) {
    state.pickups.push({
      x: 280 + Math.random() * (W - 560),
      y: GROUND_Y - 110,
      r: 18,
      life: 720,
      kind: Math.random() < 0.65 ? "meter" : "heal",
    });
    state.pickupSpawnTimer = 600;
  }

  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = state.pickups[i];
    pickup.life -= 1;
    if (pickup.life <= 0) {
      state.pickups.splice(i, 1);
      continue;
    }

    if (touchesFighter(pickup, p1)) {
      grantPickup(pickup, p1);
      state.pickups.splice(i, 1);
      continue;
    }

    if (touchesFighter(pickup, p2)) {
      grantPickup(pickup, p2);
      state.pickups.splice(i, 1);
    }
  }
}

function touchesFighter(pickup, fighter) {
  const fx = fighter.x;
  const fy = fighter.y - fighter.height * 0.6;
  const dx = pickup.x - fx;
  const dy = pickup.y - fy;
  return dx * dx + dy * dy <= (pickup.r + 38) * (pickup.r + 38);
}

function grantPickup(pickup, fighter) {
  if (pickup.kind === "meter") {
    fighter.meter = Math.min(100, fighter.meter + 28);
    spawnBurst(pickup.x, pickup.y, "#ffe29f", 14);
    playSfx("pickup-meter");
    return;
  }

  fighter.hp = Math.min(fighter.hpMax, fighter.hp + 80);
  spawnBurst(pickup.x, pickup.y, "#9cf0d0", 14);
  playSfx("pickup-heal");
}

function drawTexturedStage() {
  const stage = stages[state.stageChoice];

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (stage.moonColor) {
    ctx.beginPath();
    const midX = W / 2 + Math.sin(performance.now() / 5000) * 15;
    ctx.arc(midX + stage.moonOffsetX, 180 + stage.moonOffsetY, stage.moonSize, 0, Math.PI * 2);
    ctx.fillStyle = stage.moonColor;
    ctx.shadowBlur = 60;
    ctx.shadowColor = stage.moonColor;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (stage.mountainColor) {
    ctx.fillStyle = stage.mountainColor;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let i = 0; i <= W; i += 120) {
      const h = 80 + Math.sin(i * 1.3) * 45 + Math.cos(i * 0.8) * 35;
      ctx.lineTo(i, GROUND_Y - h - 10);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.fill();
  }

  ctx.fillStyle = stage.fog;
  for (let i = 0; i < 5; i += 1) {
    const y = 120 + i * 90 + Math.sin(performance.now() / 800 + i) * 12;
    ctx.fillRect(0, y, W, 42);
  }

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x < W; x += 40) {
    ctx.fillRect(x, 0, 3, H);
  }

  const floorGrad = ctx.createLinearGradient(0, GROUND_Y - 15, 0, H);
  floorGrad.addColorStop(0, stage.floorA);
  floorGrad.addColorStop(1, stage.floorB);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y - 20, W, H - GROUND_Y + 20);

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  for (let x = 0; x < W; x += 28) {
    ctx.fillRect(x, GROUND_Y - 20, 18, 120);
  }

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = GROUND_Y - 20; y < H; y += 14) {
    ctx.fillRect(0, y, W, 1);
  }
}

function drawHUD() {
  const pad = 28;
  const barW = 440;
  const barH = 24;

  drawBar(pad, 26, barW, barH, p1.hp / p1.hpMax, "#e99762", "#4a1f12", `${p1.data.name}`);
  drawBar(W - pad - barW, 26, barW, barH, p2.hp / p2.hpMax, "#57d7d0", "#14384a", `${p2.data.name}`, true);

  drawBar(pad, 60, 260, 14, p1.meter / 100, "#ffe29f", "#3d2f14", "Meter");
  drawBar(W - pad - 260, 60, 260, 14, p2.meter / 100, "#ffe29f", "#3d2f14", "Meter", true);

  ctx.fillStyle = "#f8f4e8";
  ctx.font = "bold 40px Trebuchet MS";
  const t = Math.ceil(state.timer).toString().padStart(2, "0");
  const tw = ctx.measureText(t).width;
  ctx.fillText(t, W * 0.5 - tw * 0.5, 58);

  drawRoundDots(0, 1, pad, 96);
  drawRoundDots(1, 2, W - pad - 78, 96);

  if (state.comboTextTimer > 0) {
    ctx.fillStyle = "#ffe8d0";
    ctx.font = "bold 24px Trebuchet MS";
    if (state.comboTexts[0]) ctx.fillText(state.comboTexts[0], 28, 145);
    if (state.comboTexts[1]) {
      const text = state.comboTexts[1];
      const mw = ctx.measureText(text).width;
      ctx.fillText(text, W - 28 - mw, 145);
    }
  }

  if (state.mode === "training") {
    ctx.fillStyle = "rgba(10, 10, 12, 0.72)";
    ctx.fillRect(W * 0.5 - 170, 16, 340, 28);
    ctx.fillStyle = "#f0eadb";
    ctx.font = "bold 16px Trebuchet MS";
    ctx.fillText("TRAINING MODE - press Enter to reset positions", W * 0.5 - 152, 35);
  }

  if (state.mode === "arcade") {
    ctx.fillStyle = "rgba(10, 10, 12, 0.72)";
    ctx.fillRect(W * 0.5 - 185, 16, 370, 28);
    ctx.fillStyle = "#f0eadb";
    ctx.font = "bold 16px Trebuchet MS";
    ctx.fillText(`ARCADE STAGE ${state.arcadeStage}/${state.arcadeTotalStages}  SCORE ${state.arcadeScore}`, W * 0.5 - 170, 35);
  }
}

function drawBar(x, y, w, h, ratio, colorA, colorB, label, rightAlign = false) {
  ctx.fillStyle = "rgba(10, 12, 14, 0.65)";
  ctx.fillRect(x, y, w, h);

  const fill = Math.max(0, Math.min(1, ratio)) * w;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;

  if (rightAlign) {
    ctx.fillRect(x + w - fill, y, fill, h);
  } else {
    ctx.fillRect(x, y, fill, h);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#f8f4e8";
  ctx.font = "bold 16px Trebuchet MS";
  if (rightAlign) {
    const m = ctx.measureText(label).width;
    ctx.fillText(label, x + w - m, y - 6);
  } else {
    ctx.fillText(label, x, y - 6);
  }
}

function drawRoundDots(idx, playerNum, x, y) {
  for (let i = 0; i < 2; i += 1) {
    ctx.beginPath();
    ctx.arc(x + i * 28 + 12, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < state.roundWins[idx] ? "#f5c37e" : "#523f2a";
    ctx.fill();
  }

  ctx.fillStyle = "#f0eadb";
  ctx.font = "13px Trebuchet MS";
  ctx.fillText(playerNum === 1 ? "P1" : state.mode === "arcade" ? "CPU" : "P2", x, y + 24);
}

function spawnBurst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    const life = 25 + Math.random() * 20;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: life,
      maxLife: life,
      color,
      size: 3 + Math.random() * 5,
      type: Math.random() > 0.6 ? 'spark' : 'block'
    });
  }
}

function updateAndDrawParticles() {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.life -= 1;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.vx *= 0.95;

    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    if (p.type === 'spark') {
      const length = Math.max(p.size, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 2.5);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.fillRect(-length / 2, -p.size / 2, length, p.size);
      ctx.restore();
    } else {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPickups() {
  for (let i = 0; i < state.pickups.length; i += 1) {
    const p = state.pickups[i];
    const wobble = Math.sin(performance.now() / 180 + i * 2.3) * 6;
    const color = p.kind === "meter" ? "#ffe29f" : "#9cf0d0";

    ctx.beginPath();
    ctx.arc(p.x, p.y + wobble, p.r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawMenu() {
  ctx.fillStyle = "#14161b";
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1f2a33");
  grad.addColorStop(1, "#23140f");
  ctx.fillStyle = grad;
  ctx.fillRect(20, 20, W - 40, H - 40);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 110; i += 1) {
    ctx.fillRect(20 + i * 11, 20, 1, H - 40);
  }

  ctx.fillStyle = "#ffe4c3";
  ctx.font = "bold 76px Trebuchet MS";
  const title = "CLASHLINE ARENA";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, W * 0.5 - tw * 0.5, 180);

  ctx.font = "26px Trebuchet MS";
  ctx.fillStyle = "#f3eee2";

  if (state.scene === "title") {
    drawCentered("Press Enter to start", 300);
    drawCentered("1v1 combat with arcade, versus, and training", 348, "#bfcddb");
  }

  if (state.scene === "mode") {
    drawCentered("Select Mode", 265);
    const modes = ["Versus (2P)", "Arcade (vs CPU)", "Training"];
    drawListSelector(modes, modeIndex(), 325);
  }

  if (state.scene === "char-select") {
    drawCentered("Character Select", 245);
    drawCharacterCards();
    drawCentered("P1: A/D then Enter. P2: Arrow Left/Right then Enter", 600, "#bfcddb");
  }

  if (state.scene === "stage-select") {
    drawCentered("Stage Select", 250);
    drawListSelector(stages.map((s) => s.name), state.stageChoice, 325);
  }

  if (state.scene === "results") {
    drawCentered("Match Complete", 250);
    drawCentered(state.winnerText, 320);
    drawCentered("Enter: Back to title", 390, "#bfcddb");
  }

  if (state.scene === "arcade-next") {
    drawCentered("Arcade Progress", 250);
    drawCentered(state.winnerText, 320);
    drawCentered("Enter: Continue", 390, "#bfcddb");
  }
}

function drawCentered(text, y, color = "#f3eee2") {
  ctx.fillStyle = color;
  const w = ctx.measureText(text).width;
  ctx.fillText(text, W * 0.5 - w * 0.5, y);
}

function drawListSelector(items, index, startY) {
  items.forEach((item, i) => {
    const selected = i === index;
    ctx.fillStyle = selected ? "#ffd7a8" : "#a8b8ca";
    ctx.font = selected ? "bold 34px Trebuchet MS" : "28px Trebuchet MS";
    drawCentered((selected ? "> " : "") + item, startY + i * 56);
  });
  drawCentered("Use W/S or Arrow Up/Down, Enter to confirm", startY + items.length * 68, "#bfcddb");
}

function drawCharacterCards() {
  const cardW = 320;
  const cardH = 300;
  const gap = 46;
  const total = fightersData.length * cardW + (fightersData.length - 1) * gap;
  const startX = W * 0.5 - total * 0.5;

  fightersData.forEach((f, i) => {
    const x = startX + i * (cardW + gap);
    const y = 280;

    ctx.fillStyle = "rgba(11, 16, 22, 0.8)";
    ctx.fillRect(x, y, cardW, cardH);

    const grad = ctx.createLinearGradient(x, y, x, y + cardH);
    grad.addColorStop(0, f.primary);
    grad.addColorStop(1, f.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(x + 18, y + 18, cardW - 36, 132);

    const sprite = getSprite(f.spritePath);
    if (sprite && sprite.loaded) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite.img, x + cardW * 0.5 - 58, y + 26, 116, 116);
      ctx.imageSmoothingEnabled = true;
    }

    ctx.fillStyle = "#f6efe0";
    ctx.font = "bold 22px Trebuchet MS";
    ctx.fillText(f.name, x + 18, y + 174);

    ctx.font = "17px Trebuchet MS";
    ctx.fillStyle = "#c3d0dc";
    ctx.fillText(`Speed: ${f.speed.toFixed(2)}`, x + 18, y + 212);
    ctx.fillText(`Power: ${f.power.toFixed(2)}`, x + 18, y + 236);
    ctx.fillText(`Defense: ${f.defense.toFixed(2)}`, x + 18, y + 260);

    if (i === state.p1Choice) {
      ctx.strokeStyle = "#efb278";
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 6, y - 6, cardW + 12, cardH + 12);
      ctx.font = "bold 14px Trebuchet MS";
      ctx.fillStyle = "#efb278";
      ctx.fillText("P1", x + 12, y - 12);
    }

    if (i === state.p2Choice) {
      ctx.strokeStyle = "#72dfd7";
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 12, y - 12, cardW + 24, cardH + 24);
      ctx.font = "bold 14px Trebuchet MS";
      ctx.fillStyle = "#72dfd7";
      ctx.fillText(state.mode === "arcade" ? "CPU" : "P2", x + cardW - 56, y - 12);
    }
  });
}

function modeIndex() {
  return state.mode === "versus" ? 0 : state.mode === "arcade" ? 1 : 2;
}

function setModeByIndex(i) {
  state.mode = i === 0 ? "versus" : i === 1 ? "arcade" : "training";
}

function handleSceneInput() {
  if (wasPressed("KeyM")) {
    const next = !state.musicMuted;
    setMuted(next);
    if (!next) playSfx("ui-confirm");
  }

  if (wasPressed("Escape", "Pad0Back", "Pad1Back")) {
    state.scene = "title";
    playSfx("ui-back");
  }

  if (state.scene === "title" && wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
    state.scene = "mode";
    playSfx("ui-confirm");
    return;
  }

  if (state.scene === "mode") {
    let idx = modeIndex();
    const up = wasPressed("KeyW", "ArrowUp", "Pad0MenuUp", "Pad1MenuUp");
    const down = wasPressed("KeyS", "ArrowDown", "Pad0MenuDown", "Pad1MenuDown");
    if (up) idx = (idx + 2) % 3;
    if (down) idx = (idx + 1) % 3;
    if (up || down) playSfx("ui-nav");
    setModeByIndex(idx);

    if (wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
      playSfx("ui-confirm");
      if (state.mode === "arcade") {
        state.arcadeStage = 1;
        state.arcadeScore = 0;
      }
      state.scene = "char-select";
      state.p1Choice = 0;
      state.p2Choice = 1;
    }
    return;
  }

  if (state.scene === "char-select") {
    const p1Left = wasPressed("KeyA", "Pad0Left");
    const p1Right = wasPressed("KeyD", "Pad0Right");
    if (p1Left) state.p1Choice = (state.p1Choice + fightersData.length - 1) % fightersData.length;
    if (p1Right) state.p1Choice = (state.p1Choice + 1) % fightersData.length;

    if (state.mode !== "arcade") {
      const p2Left = wasPressed("ArrowLeft", "Pad1Left");
      const p2Right = wasPressed("ArrowRight", "Pad1Right");
      if (p2Left) state.p2Choice = (state.p2Choice + fightersData.length - 1) % fightersData.length;
      if (p2Right) state.p2Choice = (state.p2Choice + 1) % fightersData.length;
      if (p2Left || p2Right) playSfx("ui-nav");
    } else {
      if (state.p2Choice === state.p1Choice) state.p2Choice = 1;
    }

    if (p1Left || p1Right) playSfx("ui-nav");

    if (wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
      state.scene = "stage-select";
      playSfx("ui-confirm");
    }
    return;
  }

  if (state.scene === "stage-select") {
    let moved = false;
    if (wasPressed("KeyW", "ArrowUp", "Pad0MenuUp", "Pad1MenuUp")) {
      state.stageChoice = (state.stageChoice + stages.length - 1) % stages.length;
      moved = true;
    }
    if (wasPressed("KeyS", "ArrowDown", "Pad0MenuDown", "Pad1MenuDown")) {
      state.stageChoice = (state.stageChoice + 1) % stages.length;
      moved = true;
    }
    if (moved) playSfx("ui-nav");
    if (wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
      playSfx("ui-confirm");
      if (state.mode === "arcade") {
        state.arcadeStage = 1;
        state.arcadeScore = 0;
        chooseArcadeOpponent();
      }
      startMatch();
    }
    return;
  }

  if (state.scene === "results" && wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
    state.scene = "title";
    playSfx("ui-confirm");
  }

  if (state.scene === "arcade-next" && wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
    playSfx("ui-confirm");
    startMatch(true);
  }

  if (state.scene === "match" && state.mode === "training" && wasPressed("Enter", "Pad0Confirm", "Pad1Confirm")) {
    playSfx("ui-confirm");
    resetRound();
  }
}

function drawMatchScene() {
  drawTexturedStage();

  const shakeX = (Math.random() - 0.5) * state.cameraShake;
  const shakeY = (Math.random() - 0.5) * state.cameraShake;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  p1.draw();
  p2.draw();
  drawPickups();

  updateAndDrawParticles();
  ctx.restore();

  drawHUD();
}

function setTipText() {
  if (state.scene === "title") hudTip.textContent = "Press Enter to start";
  else if (state.scene === "mode") hudTip.textContent = "Choose mode with W/S or Arrow Keys";
  else if (state.scene === "char-select") hudTip.textContent = "Pick fighters and press Enter";
  else if (state.scene === "stage-select") hudTip.textContent = "Choose a stage and press Enter";
  else if (state.scene === "match") hudTip.textContent = state.mode === "training" ? "Training mode active" : "Fight";
  else if (state.scene === "arcade-next") hudTip.textContent = "Arcade progression ready";
  else if (state.scene === "results") hudTip.textContent = "Press Enter to return to title";
}

function frame() {
  syncGamepadInput();
  handleSceneInput();
  scheduleMusic();

  if (state.scene === "match") {
    updateMatch();
    drawMatchScene();
  } else {
    drawMenu();
  }

  setTipText();

  keysPressedThisFrame.clear();
  requestAnimationFrame(frame);
}

frame();
