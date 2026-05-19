type SoundName = 'click' | 'success' | 'fail' | 'bell' | 'chalk' | 'alert' | 'ambient' | 'coin' | 'levelup' | 'dream';

class SoundManager {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private enabled = true;
  private volume = 0.3;

  init() {
    try {
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.ctx.destination);
    } catch {
      this.enabled = false;
    }
  }

  private ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  play(name: SoundName) {
    if (!this.enabled || !this.ctx || !this.gainNode) return;
    this.ensureContext();

    switch (name) {
      case 'click': return this.playTone(800, 0.06, 'square', 0.2);
      case 'success': return this.playTone(523, 0.08, 'sine', 0.3).then(() => this.playTone(659, 0.08, 'sine', 0.3)).then(() => this.playTone(784, 0.12, 'sine', 0.3));
      case 'fail': return this.playTone(200, 0.12, 'sawtooth', 0.3).then(() => this.playTone(150, 0.18, 'sawtooth', 0.3));
      case 'bell': return this.playTone(660, 0.8, 'sine', 0.25, true);
      case 'chalk': return this.playNoise(0.15, 0.15);
      case 'alert': return this.playTone(440, 0.08, 'square', 0.3, false, true);
      case 'coin': return this.playTone(988, 0.05, 'sine', 0.2).then(() => this.playTone(1319, 0.1, 'sine', 0.2));
      case 'levelup': return this.playTone(523, 0.1, 'sine', 0.25).then(() => this.playTone(659, 0.1, 'sine', 0.25)).then(() => this.playTone(784, 0.1, 'sine', 0.25)).then(() => this.playTone(1047, 0.3, 'sine', 0.3));
      case 'dream': return this.playTone(400, 0.3, 'sine', 0.15, true).then(() => this.playTone(500, 0.3, 'sine', 0.15, true)).then(() => this.playTone(600, 0.3, 'sine', 0.15, true));
    }
  }

  private async playTone(freq: number, duration: number, type: OscillatorType, vol: number, slide = false, fast = false) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration + (slide ? 0.1 : 0));
    if (slide) {
      osc.frequency.linearRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);
    }
    if (fast) {
      for (let i = 0; i < 4; i++) {
        g.gain.setValueAtTime(vol, this.ctx.currentTime + i * 0.02);
        g.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.02 + 0.01);
      }
    }
    osc.connect(g);
    g.connect(this.gainNode);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration + (slide ? 0.1 : 0));
    return new Promise((r) => setTimeout(r, (duration + 0.1) * 1000));
  }

  private async playNoise(duration: number, vol: number) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    source.connect(g);
    g.connect(this.gainNode);
    source.start();
  }

  startAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    this.ensureContext();
    // 低频嗡嗡声模拟教室环境
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 60;
    this.ambientOsc.connect(this.ambientGain);
    this.ambientOsc.start();
    this.ambientGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = 0;
    }
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.gainNode) this.gainNode.gain.value = v;
  }
}

export const soundManager = new SoundManager();
