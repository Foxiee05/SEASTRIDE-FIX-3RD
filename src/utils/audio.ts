class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // BGM Engine State
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmTimeoutId: number | null = null;
  private nextBarTime: number = 0;
  private currentBar: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmGain = this.ctx.createGain();
        // Bright, balanced BGM volume
        this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.36, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);

        // Resume listener when audio context changes state from suspended to running
        this.ctx.onstatechange = () => {
          if (this.ctx && this.ctx.state === 'running' && this.isBgmPlaying && !this.bgmTimeoutId) {
            this.nextBarTime = this.ctx.currentTime + 0.05;
            this.scheduleBgmLoop();
          }
        };
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.36, this.ctx.currentTime);
    }
    if (!this.isMuted && !this.isBgmPlaying) {
      this.startBgm();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- "THE MARINER'S JIG" - 118 BPM G MAJOR SEAMLESS LOOPING BGM ---
  public startBgm() {
    this.initCtx();
    if (this.isBgmPlaying && this.bgmTimeoutId !== null) return;

    this.isBgmPlaying = true;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.nextBarTime = this.ctx.currentTime + 0.05;
      this.currentBar = 0;
      this.scheduleBgmLoop();
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  private scheduleBgmLoop = () => {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    // 118 BPM Fast Energetic March / Jig in 4/4 Time
    const tempo = 118;
    const quarterNoteDuration = 60 / tempo; // ~0.5085s
    const eighthNoteDuration = quarterNoteDuration / 2; // ~0.2542s (8 sub-beats per 4/4 bar)
    const barDuration = quarterNoteDuration * 4; // ~2.0339s per 4/4 bar

    // Schedule audio up to 2 seconds ahead
    while (this.nextBarTime < this.ctx.currentTime + 2.0) {
      this.playMarinersJigBar(this.currentBar, this.nextBarTime, eighthNoteDuration);
      this.nextBarTime += barDuration;
      this.currentBar = (this.currentBar + 1) % 16; // 16-Bar / 32-Measure Blueprint Loop
    }

    this.bgmTimeoutId = window.setTimeout(this.scheduleBgmLoop, 250);
  };

  private playMarinersJigBar(barIndex: number, barStartTime: number, e: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Frequencies (G Major Scale Blueprint)
    // Low Bass
    const C2 = 65.41, D2 = 73.42, E2 = 82.41, Fsharp2 = 92.50, G2 = 98.00, A2 = 110.00;
    // Mid Rhythm Chords
    const C3 = 130.81, D3 = 146.83, E3 = 164.81, Fsharp3 = 185.00, G3 = 196.00, A3 = 220.00, B3 = 246.94;
    // Melody Octaves
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, Fsharp4 = 369.99, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, Fsharp5 = 739.99, G5 = 783.99, A5 = 880.00, B5 = 987.77;
    const C6 = 1046.50, D6 = 1174.66;

    // --- BLUEPRINT CHORD PROGRESSIONS ---
    // Bars 1-4: G - D/F# - Em - C
    // Bars 5-8: G - D/F# - Em - C
    // Bars 9-12 (Peak): Am - D/F# - G - C
    // Bars 13-16 (Reset): G - D/F# - Em - C (Turnaround)
    const chordMap: { root: number; triad: [number, number, number] }[] = [
      { root: G2, triad: [G3, B3, D4] },       // Bar 0 (G)
      { root: Fsharp2, triad: [Fsharp3, A3, D4] }, // Bar 1 (D/F#)
      { root: E2, triad: [E3, G3, B3] },       // Bar 2 (Em)
      { root: C2, triad: [C3, E3, G3] },       // Bar 3 (C)

      { root: G2, triad: [G3, B3, D4] },       // Bar 4 (G)
      { root: Fsharp2, triad: [Fsharp3, A3, D4] }, // Bar 5 (D/F#)
      { root: E2, triad: [E3, G3, B3] },       // Bar 6 (Em)
      { root: C2, triad: [C3, E3, G3] },       // Bar 7 (C)

      { root: A2, triad: [A3, C4, E4] },       // Bar 8 (Am)
      { root: Fsharp2, triad: [Fsharp3, A3, D4] }, // Bar 9 (D/F#)
      { root: G2, triad: [G3, B3, D4] },       // Bar 10 (G)
      { root: C2, triad: [C3, E3, G3] },       // Bar 11 (C)

      { root: G2, triad: [G3, B3, D4] },       // Bar 12 (G)
      { root: Fsharp2, triad: [Fsharp3, A3, D4] }, // Bar 13 (D/F#)
      { root: E2, triad: [E3, G3, B3] },       // Bar 14 (Em)
      { root: D2, triad: [D3, Fsharp3, C4] },  // Bar 15 (D7 turnaround resolving back to Bar 0 G)
    ];

    // --- MELODY PATTERNS (FIDDLE & ACCORDION) ---
    // Fiddle Pattern (8 eighth notes per bar)
    const fiddleMelody: (number | null)[][] = [
      // Bars 1-4: Catchy Opening Motif
      [G4, B4, D5, G5, D5, B4, G4, D4],
      [Fsharp4, A4, D5, Fsharp5, D5, A4, Fsharp4, D4],
      [E4, G4, B4, E5, B4, G4, E4, B3],
      [C4, E4, G4, C5, B4, A4, G4, Fsharp4],

      // Bars 5-8: Supporting Accordion Hook
      [D5, G5, D5, B4, G4, B4, D5, G5],
      [D5, Fsharp5, D5, A4, Fsharp4, A4, D5, Fsharp5],
      [B4, E5, B4, G4, E4, G4, B4, E5],
      [C5, B4, A4, G4, Fsharp4, E4, D4, C4],

      // Bars 9-12 (The Peak): Virtuosic Arpeggiated Solo Run
      [A4, C5, E5, A5, C6, A5, E5, C5],
      [Fsharp4, A4, D5, Fsharp5, A5, Fsharp5, D5, A4],
      [G4, B4, D5, G5, B5, G5, D5, B4],
      [C5, D5, E5, Fsharp5, G5, A5, B5, C6],

      // Bars 13-16 (The Reset/Loop Point): Descending Conclusive Run
      [B5, A5, G5, Fsharp5, E5, D5, B4, G4],
      [A5, G5, Fsharp5, E5, D5, C4, A4, Fsharp4],
      [G5, Fsharp5, E5, D5, C4, B3, A3, G3],
      [D4, Fsharp4, A4, C5, D5, Fsharp5, A5, D6], // Turnaround leading seamlessly back to G5 on Bar 0
    ];

    // Accordion Pattern (Playful Motifs & Main Hook)
    const accordionMelody: (number | null)[][] = [
      // Bars 1-4: Background counterpoints
      [null, G4, B4, D5, null, B4, D5, G5],
      [null, Fsharp4, A4, D5, null, A4, D5, Fsharp5],
      [null, E4, G4, B4, null, G4, B4, E5],
      [null, C4, E4, G4, null, E4, G4, C5],

      // Bars 5-8 (The Main Hook / Shanty Chorus):
      [G5, G5, A5, B5, B5, G5, D5, B4],
      [A5, A5, B5, C6, B5, A5, Fsharp5, D5],
      [G5, G5, A5, B5, G5, E5, B4, G4],
      [A4, C5, E5, G5, Fsharp5, E5, D5, C5],

      // Bars 9-12 (The Peak):
      [C5, E5, A5, C6, A5, E5, C5, A4],
      [D5, Fsharp5, A5, D6, A5, Fsharp5, D5, A4],
      [D5, G5, B5, D6, B5, G5, D5, B4],
      [E5, G5, C6, G5, E5, C5, G4, E4],

      // Bars 13-16 (Conclusive Reset):
      [D5, G5, B5, G5, D5, B4, G4, D4],
      [D5, Fsharp5, A5, Fsharp5, D5, A4, Fsharp4, D4],
      [B4, E5, G5, E5, B4, G4, E4, B3],
      [A4, C5, D5, Fsharp5, A5, C6, B5, A5],
    ];

    const currentChord = chordMap[barIndex];
    const fiddleNotes = fiddleMelody[barIndex];
    const accordionNotes = accordionMelody[barIndex];

    // --- 1. ACOUSTIC GUITAR (Bouncy Rasgueado Rhythm Engine) ---
    if (currentChord) {
      // Downbeat Bass Root Note
      [0, 4].forEach((subIdx) => {
        if (!this.ctx || !this.bgmGain) return;
        const bassTime = barStartTime + subIdx * e;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(subIdx === 0 ? currentChord.root : currentChord.root * 1.5, bassTime);

        bGain.gain.setValueAtTime(0.18, bassTime);
        bGain.gain.exponentialRampToValueAtTime(0.005, bassTime + e * 1.8);

        bOsc.connect(bGain);
        bGain.connect(this.bgmGain);

        bOsc.start(bassTime);
        bOsc.stop(bassTime + e * 1.8);
      });

      // Upbeat Rasgueado Strumming (Sub-beats 1, 2, 3, 5, 6, 7)
      [1, 2, 3, 5, 6, 7].forEach((subIdx) => {
        if (!this.ctx || !this.bgmGain) return;
        const strumTime = barStartTime + subIdx * e;
        const triadNote = currentChord.triad[subIdx % 3];

        const gOsc = this.ctx.createOscillator();
        const gGain = this.ctx.createGain();
        const gFilter = this.ctx.createBiquadFilter();

        gOsc.type = 'sawtooth';
        gOsc.frequency.setValueAtTime(triadNote, strumTime);

        gFilter.type = 'bandpass';
        gFilter.frequency.setValueAtTime(2200, strumTime);

        gGain.gain.setValueAtTime(0.07, strumTime);
        gGain.gain.exponentialRampToValueAtTime(0.002, strumTime + 0.12);

        gOsc.connect(gFilter);
        gFilter.connect(gGain);
        gGain.connect(this.bgmGain);

        gOsc.start(strumTime);
        gOsc.stop(strumTime + 0.12);
      });
    }

    // --- 2. FIDDLE (Virtuosic Jig & Energy Spike) ---
    fiddleNotes.forEach((freq, i) => {
      if (!freq || !this.ctx || !this.bgmGain) return;
      const noteTime = barStartTime + i * e;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      // Fiddle vibrato on held/peak notes
      if (barIndex >= 8 && barIndex <= 11) {
        osc.frequency.linearRampToValueAtTime(freq * 1.006, noteTime + e * 0.4);
        osc.frequency.linearRampToValueAtTime(freq, noteTime + e * 0.8);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(barIndex >= 8 ? 2600 : 2000, noteTime);

      // Higher volume during Peak section (Bars 9-12)
      const vol = barIndex >= 8 && barIndex <= 11 ? 0.12 : 0.09;
      gain.gain.setValueAtTime(vol, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.003, noteTime + e * 0.88);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(noteTime);
      osc.stop(noteTime + e * 0.88);
    });

    // --- 3. ACCORDION (Playful Heart & Shanty Chorus) ---
    accordionNotes.forEach((freq, i) => {
      if (!freq || !this.ctx || !this.bgmGain) return;
      const noteTime = barStartTime + i * e;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, noteTime);
      osc2.frequency.setValueAtTime(freq * 1.0035, noteTime); // Jolly accordion reed chorus

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1700, noteTime);

      // Accordion prominent during Bars 5-8 (The Hook)
      const vol = barIndex >= 4 && barIndex <= 7 ? 0.13 : 0.08;
      gain.gain.setValueAtTime(vol, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.004, noteTime + e * 0.90);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(noteTime + e * 0.90);
      osc2.stop(noteTime + e * 0.90);
    });

    // --- 4. PERCUSSION: FOOT STOMPS (Deep Stomp-STOMP on Downbeats) ---
    // Bars 1-4: Beat 0
    // Bars 5-8: Beats 0 & 4 (Beats 1 & 3 in 4/4)
    // Bars 9-12 (Peak): Beats 0, 2, 4, 6 (Every beat for aggressive drive!)
    let stompSubIndices = [0];
    if (barIndex >= 4 && barIndex <= 7) stompSubIndices = [0, 4];
    if (barIndex >= 8 && barIndex <= 11) stompSubIndices = [0, 2, 4, 6];
    if (barIndex >= 12) stompSubIndices = [0, 4];

    stompSubIndices.forEach((stompIdx) => {
      if (!this.ctx || !this.bgmGain) return;
      const stompTime = barStartTime + stompIdx * e;

      const sOsc = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(140, stompTime);
      sOsc.frequency.exponentialRampToValueAtTime(30, stompTime + 0.18);

      const stompVol = barIndex >= 8 && barIndex <= 11 ? 0.28 : 0.20;
      sGain.gain.setValueAtTime(stompVol, stompTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, stompTime + 0.18);

      sOsc.connect(sGain);
      sGain.connect(this.bgmGain);

      sOsc.start(stompTime);
      sOsc.stop(stompTime + 0.18);
    });

    // --- 5. PERCUSSION: HANDCLAPS (Upbeats & Offbeats) ---
    // Bars 5-8: Claps on sub-beats 2 & 6 (Beats 2 & 4)
    // Bars 9-12 (Peak): Claps on sub-beats 1, 3, 5, 7 for intense tavern crowd!
    let clapSubIndices: number[] = [];
    if (barIndex >= 4 && barIndex <= 7) clapSubIndices = [2, 6];
    if (barIndex >= 8 && barIndex <= 11) clapSubIndices = [1, 3, 5, 7];
    if (barIndex >= 12) clapSubIndices = [2, 6];

    clapSubIndices.forEach((clapIdx) => {
      if (!this.ctx || !this.bgmGain) return;
      const clapTime = barStartTime + clapIdx * e;

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let k = 0; k < bufferSize; k++) {
        data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (this.ctx.sampleRate * 0.01));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, clapTime);

      const cGain = this.ctx.createGain();
      cGain.gain.setValueAtTime(0.10, clapTime);
      cGain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.05);

      noise.connect(filter);
      filter.connect(cGain);
      cGain.connect(this.bgmGain);

      noise.start(clapTime);
    });

    // --- 6. WOOD PERCUSSION (Consistent Tiki-Tat-Tiki Pulse) ---
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((woodIdx) => {
      if (!this.ctx || !this.bgmGain) return;
      const wTime = barStartTime + woodIdx * e;
      const wOsc = this.ctx.createOscillator();
      const wGain = this.ctx.createGain();

      wOsc.type = 'sine';
      wOsc.frequency.setValueAtTime(woodIdx % 2 === 0 ? 1400 : 900, wTime);
      wOsc.frequency.exponentialRampToValueAtTime(600, wTime + 0.025);

      wGain.gain.setValueAtTime(woodIdx % 2 === 0 ? 0.06 : 0.04, wTime);
      wGain.gain.exponentialRampToValueAtTime(0.001, wTime + 0.025);

      wOsc.connect(wGain);
      wGain.connect(this.bgmGain);

      wOsc.start(wTime);
      wOsc.stop(wTime + 0.025);
    });

    // --- 7. TAMBOURINE & SHIP DECK PERCUSSION ACCENTS ---
    // Tambourine jingles on off-beat sub-beats (2 & 6)
    [2, 6].forEach((tamIdx) => {
      if (!this.ctx || !this.bgmGain) return;
      const tTime = barStartTime + tamIdx * e;

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let k = 0; k < bufferSize; k++) {
        data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (this.ctx.sampleRate * 0.008));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, tTime); // Bright metal jingle

      const tGain = this.ctx.createGain();
      tGain.gain.setValueAtTime(0.05, tTime);
      tGain.gain.exponentialRampToValueAtTime(0.001, tTime + 0.035);

      noise.connect(filter);
      filter.connect(tGain);
      tGain.connect(this.bgmGain);

      noise.start(tTime);
    });

    // Ship Deck Wooden Knock Accent on Bar start
    if (barIndex % 4 === 0) {
      const kTime = barStartTime;
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.type = 'triangle';
      kOsc.frequency.setValueAtTime(320, kTime);
      kOsc.frequency.exponentialRampToValueAtTime(80, kTime + 0.06);

      kGain.gain.setValueAtTime(0.12, kTime);
      kGain.gain.exponentialRampToValueAtTime(0.001, kTime + 0.06);

      kOsc.connect(kGain);
      kGain.connect(this.bgmGain);

      kOsc.start(kTime);
      kOsc.stop(kTime + 0.06);
    }
  }

  // --- STANDARD BUTTON CLICK SOUND ---
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (!this.isBgmPlaying) this.startBgm();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // --- DISTINCT CLOSE BUTTON SOUND (Wooden Latch Snap / Pitch Drop) ---
  public playClose() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (!this.isBgmPlaying) this.startBgm();

    const now = this.ctx.currentTime;

    // Pitch-drop wooden thump oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);

    // Second wooden click burst
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, now + 0.04);
    clickOsc.frequency.exponentialRampToValueAtTime(110, now + 0.14);

    clickGain.gain.setValueAtTime(0.2, now + 0.04);
    clickGain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);

    clickOsc.start(now + 0.04);
    clickOsc.stop(now + 0.14);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (!this.isBgmPlaying) this.startBgm();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.frequency.setValueAtTime(1318.51, now);
    osc2.frequency.setValueAtTime(1760.00, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  public playCannonBomb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    if (!this.isBgmPlaying) this.startBgm();

    const now = this.ctx.currentTime;
    
    // Low boom oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);

    // Noise explosion
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }

  public playUpgrade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playMonsterRoar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Deep low frequency growl + pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(120, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  public playBossHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playPrizeFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // G4, C5, E5, G5, C6, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.3, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  }
}

export const soundFx = new SoundManager();
