/**
 * Career Compass AI - Web Audio Interactive Synthesizer Engine
 * Provides direct digital chimes and clicks for physical user feedback.
 */

let audioCtx: AudioContext | null = null;
let isMutedState = false;

// Attempt to load settings from localStorage if available
try {
  const saved = localStorage.getItem('career_compass_sound_enabled');
  if (saved !== null) {
    isMutedState = saved === 'false';
  }
} catch (e) {
  // Silent fallback
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard AudioContext initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser auto-play safeguard)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isMuted(): boolean {
  return isMutedState;
}

export function setMute(muted: boolean) {
  isMutedState = muted;
  try {
    localStorage.setItem('career_compass_sound_enabled', String(!muted));
  } catch (e) {
    // Handle sandboxed storage limitations gracefully
  }
}

/**
 * Universal synth tone generator
 */
function synthTone(
  freqs: number[],
  type: OscillatorType,
  duration: number,
  volume: number,
  slideFreqTo?: number,
  delayMsBetweenNotes = 0
) {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Safety resume
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  freqs.forEach((freq, idx) => {
    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        if (slideFreqTo) {
          osc.frequency.exponentialRampToValueAtTime(slideFreqTo, ctx.currentTime + duration);
        }

        // Beautiful smooth volume envelope
        gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (err) {
        console.warn('Audio Context tone synthesis interrupted', err);
      }
    }, idx * delayMsBetweenNotes);
  });
}

// Sparkly high-speed futuristic click
export function playClick() {
  synthTone([600], 'sine', 0.04, 0.15, 800);
}

// Gentle slide representing modern page navigation / tab switch
export function playTab() {
  synthTone([280], 'sine', 0.12, 0.12, 540);
}

// Cheerful major chord sequence for milestone achievement or quiz success
export function playSuccess() {
  // Arpeggiate sweet minor/major 7th synth tones: C5, E5, G5, C6
  synthTone([523.25, 659.25, 783.99, 1046.5], 'sine', 0.22, 0.15, undefined, 75);
}

// Welcome sweeping wash on App launching onboarding complete
export function playOnboarding() {
  synthTone([329.63, 440.00, 554.37, 659.25, 880.00], 'triangle', 0.35, 0.14, 1100, 60);
}

// Soft low warning double beep for validation errors / incorrect quiz submission
export function playWarning() {
  synthTone([220, 220], 'triangle', 0.15, 0.18, 110, 110);
}
