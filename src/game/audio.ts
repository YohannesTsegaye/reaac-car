// Procedural Web Audio API sound synthesizer
// Zero external mp3/wav files required

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine sound state
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Nitro sound state
  private nitroNoise: AudioBufferSourceNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;
  private isNitroRunning: boolean = false;

  constructor() {
    // Initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startEngine() {
    if (!this.ctx || this.isEngineRunning || this.isMuted) return;
    this.resume();

    try {
      const now = this.ctx.currentTime;
      // Dual oscillator for rich rumbling engine harmonic
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, now);

      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, now);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, now);
      this.engineFilter.Q.setValueAtTime(3, now);

      this.engineGain.gain.setValueAtTime(0.01, now);
      this.engineGain.gain.linearRampToValueAtTime(0.18, now + 0.2);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      if (this.masterGain) {
        this.engineGain.connect(this.masterGain);
      }

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.isEngineRunning = true;
    } catch {
      // ignore
    }
  }

  public updateEnginePitch(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;
    try {
      const now = this.ctx.currentTime;
      // Pitch goes up with speed (45Hz idle -> up to 260Hz max speed)
      const baseFreq = 50 + speedRatio * 170 + (isBoosting ? 60 : 0);
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);

      const filterFreq = 350 + speedRatio * 1200 + (isBoosting ? 500 : 0);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    } catch {
      // ignore
    }
  }

  public stopEngine() {
    if (!this.ctx || !this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineGain) {
        this.engineGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      }
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch {}
        this.isEngineRunning = false;
      }, 160);
    } catch {
      this.isEngineRunning = false;
    }
  }

  public setNitroActive(active: boolean) {
    if (!this.ctx || this.isMuted) return;
    if (active && !this.isNitroRunning) {
      this.startNitroSound();
    } else if (!active && this.isNitroRunning) {
      this.stopNitroSound();
    }
  }

  private startNitroSound() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.nitroNoise = this.ctx.createBufferSource();
      this.nitroNoise.buffer = buffer;
      this.nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = 'bandpass';
      this.nitroFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.nitroFilter.Q.setValueAtTime(4, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.nitroGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.1);

      this.nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      if (this.masterGain) {
        this.nitroGain.connect(this.masterGain);
      }

      this.nitroNoise.start();
      this.isNitroRunning = true;
    } catch {}
  }

  private stopNitroSound() {
    if (!this.ctx || !this.isNitroRunning) return;
    try {
      const now = this.ctx.currentTime;
      if (this.nitroGain) {
        this.nitroGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      }
      setTimeout(() => {
        try {
          this.nitroNoise?.stop();
          this.nitroNoise?.disconnect();
          this.nitroFilter?.disconnect();
          this.nitroGain?.disconnect();
        } catch {}
        this.isNitroRunning = false;
      }, 120);
    } catch {
      this.isNitroRunning = false;
    }
  }

  public playNearMiss(comboMultiplier: number = 1) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      // High rewarding resonant chime with rising tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 520 + Math.min(comboMultiplier, 10) * 60;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.36);

      // Add a whoosh sweep
      const whooshOsc = this.ctx.createOscillator();
      const whooshGain = this.ctx.createGain();
      whooshOsc.type = 'triangle';
      whooshOsc.frequency.setValueAtTime(220, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
      whooshGain.gain.setValueAtTime(0.2, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whooshOsc.connect(whooshGain);
      if (this.masterGain) whooshGain.connect(this.masterGain);
      whooshOsc.start(now);
      whooshOsc.stop(now + 0.21);
    } catch {}
  }

  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      // 1. Sub heavy impact boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(oscGain);
      if (this.masterGain) oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.5);

      // 2. White noise metal crunch
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.linearRampToValueAtTime(200, now + 0.6);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      noise.connect(filter);
      filter.connect(noiseGain);
      if (this.masterGain) noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.7);
    } catch {}
  }

  public playHorn() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      // Dual frequency car/truck blare
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(310, now);
      osc2.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {}
  }

  public playPickup() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.2, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.16);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
