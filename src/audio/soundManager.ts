/**
 * Procedural Web Audio API sound generator for the 3D Dice Game.
 * Zero external audio files, 100% deterministic, instant and lightweight.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private shakeIntervalId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Subtle UI click sound
   */
  public playClick() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /**
   * Sound of cup shaking with dice clattering inside
   */
  public startShakeSound(durationMs: number = 2500) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopShakeSound();

    const startTime = this.ctx.currentTime;
    const endTime = startTime + durationMs / 1000;

    // Pulse rattle clicks repeatedly
    const intervalMs = 65;
    const playClatterPulse = () => {
      if (!this.ctx || !this.isEnabled) return;
      const t = this.ctx.currentTime;
      if (t >= endTime) {
        this.stopShakeSound();
        return;
      }

      // High resonant clack (dice on porcelain)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Randomize pitch around 1200 - 2400 Hz
      const freq = 1200 + Math.random() * 1200;
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.035);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(3, t);

      // Randomize amplitude
      const amp = 0.08 + Math.random() * 0.12;
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);

      // Low hollow thud of cup movement
      if (Math.random() > 0.4) {
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(140 + Math.random() * 60, t);
        thudOsc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

        thudGain.gain.setValueAtTime(0.1, t);
        thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        thudOsc.connect(thudGain);
        thudGain.connect(this.ctx.destination);

        thudOsc.start(t);
        thudOsc.stop(t + 0.06);
      }
    };

    // Execute immediately and set interval
    playClatterPulse();
    this.shakeIntervalId = window.setInterval(playClatterPulse, intervalMs);

    // Auto-stop safety
    setTimeout(() => {
      this.stopShakeSound();
    }, durationMs);
  }

  public stopShakeSound() {
    if (this.shakeIntervalId !== null) {
      clearInterval(this.shakeIntervalId);
      this.shakeIntervalId = null;
    }
  }

  /**
   * Sound when shaking completes and cup is ready to be opened
   */
  public playReadyToOpen() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15); // A5

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Sound when cup is dragged across the dish/table
   */
  public playCupDrag() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(2, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Sound when cup is lifted off the plate (suction release & ceramic glide)
   */
  public playCupLift() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.35);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  /**
   * Sound when cup drops back down onto the plate
   */
  public playCupDrop() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Fanfare chime when revealing the result
   */
  public playResultFanfare(type: 'tai' | 'xiu') {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'tai') {
      // Bright high chord (Tài: higher energy)
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const noteTime = t + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.5);
      });
    } else {
      // Rich deep chord (Xỉu: grounded harmony)
      const freqs = [392.00, 493.88, 587.33]; // G4, B4, D5
      freqs.forEach((freq, idx) => {
        const noteTime = t + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.5);
      });
    }
  }

  /**
   * Sound played when the app is successfully reset to initial state
   */
  public playResetSuccess() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.1, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  /**
   * Emergency stop all ongoing loops/clatters
   */
  public stopAll() {
    this.stopShakeSound();
  }
}

export const soundManager = new SoundManager();

