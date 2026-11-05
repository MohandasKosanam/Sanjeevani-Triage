/**
 * Utility for local emergency siren generation and audio capture
 */

class AudioAlertManager {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private sirenInterval: any = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Starts an authentic emergency siren oscillating between 700Hz and 1100Hz.
   * Auto-stops after durationSeconds (default 10s as per specification).
   */
  public startSiren(durationSeconds = 10, onStop?: () => void): () => void {
    try {
      this.initContext();
      if (!this.audioCtx) return () => {};

      this.stopSiren(); // ensure any previous siren is closed

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.audioCtx.currentTime);

      // Volume envelope
      gain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      this.oscillator = osc;
      this.gainNode = gain;

      // Siren sweep
      let freqHigh = true;
      this.sirenInterval = setInterval(() => {
        if (!this.audioCtx || !this.oscillator) return;
        const target = freqHigh ? 1150 : 720;
        this.oscillator.frequency.exponentialRampToValueAtTime(
          target,
          this.audioCtx.currentTime + 0.35
        );
        freqHigh = !freqHigh;
      }, 400);

      // Automatic stop after duration
      const timer = setTimeout(() => {
        this.stopSiren();
        if (onStop) onStop();
      }, durationSeconds * 1000);

      return () => {
        clearTimeout(timer);
        this.stopSiren();
      };
    } catch (err) {
      console.warn('Audio siren error (possibly user interaction needed):', err);
      return () => {};
    }
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
      } catch (e) {}
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop(this.audioCtx ? this.audioCtx.currentTime + 0.06 : undefined);
        this.oscillator.disconnect();
      } catch (e) {}
      this.oscillator = null;
    }
  }

  public triggerHaptic(pattern: number[] = [100, 50, 100, 50, 200]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }
}

export const alertManager = new AudioAlertManager();
