class AudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmInterval: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a single pleasant chime chord
   */
  playChime(frequency: number = 880, durationMs: number = 250, gainLevel: number = 0.3): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Audio play error (user interaction might be needed):', e);
    }
  }

  /**
   * Starts a repeating alarm chime sequence
   */
  startAlarm(volume: number = 0.5): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    const playSequence = () => {
      if (!this.isAlarmPlaying) return;
      // Gentle 3-tone arpeggio: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
      this.playChime(1046.5, 200, volume * 0.4);
      setTimeout(() => {
        if (this.isAlarmPlaying) this.playChime(1318.5, 200, volume * 0.4);
      }, 150);
      setTimeout(() => {
        if (this.isAlarmPlaying) this.playChime(1567.98, 400, volume * 0.5);
      }, 300);
    };

    playSequence();
    this.alarmInterval = setInterval(playSequence, 2000);
  }

  /**
   * Stops the repeating alarm sound
   */
  stopAlarm(): void {
    this.isAlarmPlaying = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  /**
   * Quick confirmation feedback sound
   */
  playConfirmSound(): void {
    this.playChime(880, 150, 0.2);
    setTimeout(() => {
      this.playChime(1174.66, 200, 0.25);
    }, 100);
  }
}

export const audioService = new AudioService();
