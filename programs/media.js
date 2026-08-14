// programs/media.js - ZebOS 2 Retro Media Player Application
import { getIcon } from '../icons.js';
import { BaseApp } from '../UIKit/framework/index.js';
import { Telemetry } from '../telemetry/index.js';

export class MediaPlayer extends BaseApp {
    constructor(onCloseRequest, loadFromVFS) {
        super(onCloseRequest);
        this.loadFromVFS = loadFromVFS;

        this.bodyElement = null;
        this.mediaEl = null;
        this.playBtn = null;
        this.seekBar = null;
        this.timeEl = null;
        this.titleEl = null;

        this.isPlaying = false;
        this.boundKeyDown = (e) => this.handleKeyDown(e);
        this.boundTimeUpdate = () => this.updateProgress();
    }

    mount() {
        Telemetry.mark('media-mount-start');
        this.bodyElement = this.body;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#1c1c1c; color:#ffffff; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none;">
                
                <!-- Title Header Bar -->
                <div style="background:#2a2a2a; padding:6px 10px; font-size:12px; font-weight:bold; border-bottom:2px solid #000000; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <span class="media-track-title" style="color:#00e5ff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:260px;">ZebOS Media Player — Ready</span>
                    <button class="media-open-btn" style="padding:2px 6px; font-size:11px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; color:#000000;">
                        Open...
                    </button>
                </div>

                <!-- Media Viewport Screen -->
                <div style="flex-grow:1; background:#000000; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <video class="media-video-element" style="width:100%; height:100%; max-height:100%; object-fit:contain; background:#000000;"></video>
                    <div class="media-audio-visualizer" style="display:none; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
                        <div style="font-size:48px;">${getIcon('media')}</div>
                        <div style="font-size:13px; color:#55ff55; font-family:monospace;">AUDIO PLAYBACK ACTIVE</div>
                    </div>
                </div>

                <!-- Media Controls Bar -->
                <div style="background:#c0c0c0; color:#000000; padding:6px 10px; border-top:2px solid #ffffff; display:flex; flex-direction:column; gap:6px; flex-shrink:0;">
                    
                    <!-- Seek Slider -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="range" class="media-seek-bar" value="0" min="0" max="100" style="flex-grow:1; height:6px; accent-color:#000080; cursor:pointer;">
                        <span class="media-time-text" style="font-family:monospace; font-size:11px; font-weight:bold; width:80px; text-align:right;">00:00 / 00:00</span>
                    </div>

                    <!-- Buttons: Play, Pause, Stop, Volume Slider -->
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <div style="display:flex; gap:4px;">
                            <button class="media-ctrl-btn btn-play" style="width:28px; height:24px; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center;">${getIcon('play')}</button>
                            <button class="media-ctrl-btn btn-pause" style="width:28px; height:24px; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center;">${getIcon('pause')}</button>
                            <button class="media-ctrl-btn btn-stop" style="width:28px; height:24px; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center;">${getIcon('stop')}</button>
                        </div>

                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="width:16px; height:16px;">${getIcon('volume')}</span>
                            <input type="range" class="media-volume-bar" value="80" min="0" max="100" style="width:70px; height:4px; accent-color:#000080; cursor:pointer;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.mediaEl = this.bodyElement.querySelector('.media-video-element');
        this.titleEl = this.bodyElement.querySelector('.media-track-title');
        this.seekBar = this.bodyElement.querySelector('.media-seek-bar');
        this.timeEl = this.bodyElement.querySelector('.media-time-text');

        const btnPlay = this.bodyElement.querySelector('.btn-play');
        const btnPause = this.bodyElement.querySelector('.btn-pause');
        const btnStop = this.bodyElement.querySelector('.btn-stop');
        const btnOpen = this.bodyElement.querySelector('.media-open-btn');
        const volumeBar = this.bodyElement.querySelector('.media-volume-bar');

        btnPlay.addEventListener('click', () => this.play());
        btnPause.addEventListener('click', () => this.pause());
        btnStop.addEventListener('click', () => this.stop());

        volumeBar.addEventListener('input', (e) => {
            if (this.mediaEl) this.mediaEl.volume = e.target.value / 100;
        });

        this.seekBar.addEventListener('input', (e) => {
            if (this.mediaEl && this.mediaEl.duration) {
                this.mediaEl.currentTime = (e.target.value / 100) * this.mediaEl.duration;
            }
        });

        btnOpen.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*,audio/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    this.loadSource(url, file.name);
                }
            };
            input.click();
        });

        this.listen(this.mediaEl, 'timeupdate', this.boundTimeUpdate);
        this.mediaEl.addEventListener('ended', () => this.stop());
        this.listen(window, 'keydown', this.boundKeyDown);

        // Load default video preset sample
        this.loadSource('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'BigBuckBunny.mp4 (Sample Video)');
        Telemetry.measure('media-mount', 'media-mount-start');
    }

    loadSource(src, title) {
        if (!this.mediaEl) return;
        Telemetry.mark('media-load-start');
        this.mediaEl.src = src;
        this.titleEl.textContent = title;
        this.isPlaying = false;
        this.mediaEl.addEventListener('loadeddata', () => {
            Telemetry.measure('media-load', 'media-load-start');
        }, { once: true });
        this.mediaEl.load();
    }

    play() {
        if (!this.mediaEl || !this.mediaEl.src) return;
        this.mediaEl.play().then(() => {
            this.isPlaying = true;
        }).catch(err => console.log('Playback error:', err));
    }

    pause() {
        if (!this.mediaEl) return;
        this.mediaEl.pause();
        this.isPlaying = false;
    }

    stop() {
        if (!this.mediaEl) return;
        this.mediaEl.pause();
        this.mediaEl.currentTime = 0;
        this.isPlaying = false;
        this.updateProgress();
    }

    updateProgress() {
        if (!this.mediaEl || !this.seekBar || !this.timeEl) return;
        const cur = this.mediaEl.currentTime || 0;
        const dur = this.mediaEl.duration || 0;
        
        if (dur > 0) {
            this.seekBar.value = (cur / dur) * 100;
        } else {
            this.seekBar.value = 0;
        }

        const formatTime = (sec) => {
            const m = Math.floor(sec / 60).toString().padStart(2, '0');
            const s = Math.floor(sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        this.timeEl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    onCleanup() {
        if (this.mediaEl) {
            this.mediaEl.pause();
        }
    }
}
