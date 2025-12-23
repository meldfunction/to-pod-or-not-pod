class AudioPlayer {
  constructor(element) {
    this.container = element;
    this.audioSrc = element.dataset.src;
    this.episodeId = element.dataset.episodeId;
    this.audio = new Audio(this.audioSrc);
    this.isPlaying = false;
    this.speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    this.currentSpeedIndex = 2;

    this.cacheElements();
    this.bindEvents();
    this.loadProgress();
    this.setupKeyboardShortcuts();
  }

  cacheElements() {
    this.playPauseBtn = this.container.querySelector('.play-pause');
    this.iconPlay = this.container.querySelector('.icon-play');
    this.iconPause = this.container.querySelector('.icon-pause');
    this.skipBackBtn = this.container.querySelector('.skip-back');
    this.skipForwardBtn = this.container.querySelector('.skip-forward');
    this.speedBtn = this.container.querySelector('.speed');
    this.progressBar = this.container.querySelector('.progress-bar');
    this.progressFill = this.container.querySelector('.progress-fill');
    this.progressHandle = this.container.querySelector('.progress-handle');
    this.currentTime = this.container.querySelector('.current');
    this.totalTime = this.container.querySelector('.total');
  }

  bindEvents() {
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.skipBackBtn.addEventListener('click', () => this.skipBack());
    this.skipForwardBtn.addEventListener('click', () => this.skipForward());
    this.speedBtn.addEventListener('click', () => this.cycleSpeed());

    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
    this.audio.addEventListener('ended', () => this.handleEnded());

    this.progressBar.addEventListener('click', (e) => this.handleProgressClick(e));
    this.progressBar.addEventListener('keydown', (e) => this.handleProgressKeydown(e));

    let isDragging = false;
    this.progressBar.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mousemove', (e) => {
      if (isDragging) this.handleProgressClick(e);
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    this.progressBar.addEventListener('touchstart', (e) => this.handleTouch(e));
    this.progressBar.addEventListener('touchmove', (e) => this.handleTouch(e));

    window.addEventListener('beforeunload', () => this.saveProgress());
    setInterval(() => this.saveProgress(), 10000);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.play();
    this.isPlaying = true;
    this.iconPlay.hidden = true;
    this.iconPause.hidden = false;
    this.playPauseBtn.setAttribute('aria-label', 'Pause episode');
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.iconPlay.hidden = false;
    this.iconPause.hidden = true;
    this.playPauseBtn.setAttribute('aria-label', 'Play episode');
    this.saveProgress();
  }

  seek(percentage) {
    const time = (percentage / 100) * this.audio.duration;
    if (!isNaN(time)) {
      this.audio.currentTime = time;
    }
  }

  skipForward(seconds = 15) {
    this.audio.currentTime = Math.min(this.audio.currentTime + seconds, this.audio.duration);
  }

  skipBack(seconds = 15) {
    this.audio.currentTime = Math.max(this.audio.currentTime - seconds, 0);
  }

  cycleSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speeds.length;
    this.changeSpeed(this.speeds[this.currentSpeedIndex]);
  }

  changeSpeed(speed) {
    this.audio.playbackRate = speed;
    this.speedBtn.querySelector('span').textContent = speed + 'x';
    this.speedBtn.setAttribute('aria-label', `Playback speed: ${speed}x`);
  }

  updateProgress() {
    if (!this.audio.duration) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressFill.style.width = percent + '%';
    this.progressHandle.style.left = percent + '%';
    this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    this.progressBar.setAttribute('aria-valuenow', Math.round(percent));
  }

  updateTotalTime() {
    this.totalTime.textContent = this.formatTime(this.audio.duration);
  }

  handleEnded() {
    this.pause();
    this.audio.currentTime = 0;
    this.clearProgress();
  }

  handleProgressClick(e) {
    const rect = this.progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    this.seek(percent);
  }

  handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.progressBar.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    this.seek(percent);
  }

  handleProgressKeydown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        this.skipBack(5);
        break;
      case 'ArrowRight':
        this.skipForward(5);
        break;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
  }

  saveProgress() {
    if (!this.episodeId || !this.audio.currentTime) return;
    const data = {
      time: this.audio.currentTime,
      speed: this.audio.playbackRate,
      timestamp: Date.now()
    };
    localStorage.setItem(`podcast-progress-${this.episodeId}`, JSON.stringify(data));
  }

  loadProgress() {
    if (!this.episodeId) return;
    const saved = localStorage.getItem(`podcast-progress-${this.episodeId}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.time && data.time > 0) {
        this.audio.currentTime = data.time;
      }
      if (data.speed) {
        const speedIndex = this.speeds.indexOf(data.speed);
        if (speedIndex !== -1) {
          this.currentSpeedIndex = speedIndex;
          this.changeSpeed(data.speed);
        }
      }
    } catch (e) {
      console.warn('Could not load saved progress');
    }
  }

  clearProgress() {
    if (!this.episodeId) return;
    localStorage.removeItem(`podcast-progress-${this.episodeId}`);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          if (!e.target.closest('.progress-bar')) {
            e.preventDefault();
            this.skipBack();
          }
          break;
        case 'ArrowRight':
          if (!e.target.closest('.progress-bar')) {
            e.preventDefault();
            this.skipForward();
          }
          break;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.audio-player').forEach(el => {
    new AudioPlayer(el);
  });
});
