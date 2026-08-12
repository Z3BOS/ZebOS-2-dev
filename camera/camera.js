// Fully featured, retro-authentic Camera App for ZebOS 2
import { getIcon } from '../icons.js';
import { BaseApp, w95Dropdown, bindW95Dropdown } from '../UIKit/framework/index.js';
import { isSupported, listCameras, requestCamera, stopCamera, describeStream, describeError } from './devices.js';
import { captureFrame, canvasToBlob, downloadBlob } from './capture.js';
import { saveFileToVfsPath, playSystemSound } from '../os.js';

export class CameraApp extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);

        this.videoEl = null;
        this.canvasEl = null;
        this.deviceContainer = null;
        this.filterContainer = null;
        this.timerContainer = null;
        this.statusEl = null;
        this.hudEl = null;
        this.countdownOverlay = null;
        this.flashOverlay = null;
        this.gridOverlay = null;
        this.galleryContainer = null;

        this.stream = null;
        this.currentDeviceId = null;
        this.camerasList = [];

        this.activeFilter = 'none';
        this.activeFilterLabel = 'Normal';
        this.timerSeconds = 0;
        this.showGrid = false;
        this.isCountingDown = false;

        this.gallery = []; // Stores { id, dataUrl, blob, timestamp, filterLabel }

        this.boundDeviceChange = () => this.refreshDeviceList();
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    mount() {
        this.body.style.height = "100%";

        const deviceDropHtml = w95Dropdown({
            id: 'cam-device-drop',
            options: [{ value: '', label: 'Detecting cameras...' }],
            value: '',
            width: '160px'
        });

        const filterDropHtml = w95Dropdown({
            id: 'cam-filter-drop',
            options: [
                { value: 'none', label: 'Normal' },
                { value: 'grayscale(100%)', label: 'B&W Mono' },
                { value: 'sepia(100%)', label: 'Sepia Vintage' },
                { value: 'invert(100%)', label: 'Inverted' },
                { value: 'contrast(160%) hue-rotate(180deg)', label: 'Vaporwave' },
                { value: 'contrast(200%) brightness(120%)', label: 'High Contrast' },
                { value: 'hue-rotate(90deg)', label: 'Cyberpunk' }
            ],
            value: 'none',
            width: '120px'
        });

        const timerDropHtml = w95Dropdown({
            id: 'cam-timer-drop',
            options: [
                { value: '0', label: 'No Timer' },
                { value: '3', label: '3s Timer' },
                { value: '5', label: '5s Timer' },
                { value: '10', label: '10s Timer' }
            ],
            value: '0',
            width: '100px'
        });

        this.render(`
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; color:#000000; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none; padding:4px; gap:4px;">

                <!-- Header Control Toolbar -->
                <div style="background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:4px 8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:6px; font-weight:bold; font-size:12px; color:#000080;">
                        <span style="width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center;">${getIcon('camera')}</span>
                        <span>ZebOS Camera</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <div id="cam-device-drop-wrap">${deviceDropHtml}</div>
                        <div id="cam-filter-drop-wrap">${filterDropHtml}</div>
                        <div id="cam-timer-drop-wrap">${timerDropHtml}</div>
                        <button class="app-toolbar-btn cam-grid-btn" title="Toggle 3x3 Framing Grid">
                            ${getIcon('grid')} Grid: OFF
                        </button>
                    </div>
                </div>

                <!-- Live Viewport Container -->
                <div style="flex-grow:1; background:#000000; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                    
                    <!-- Video Feed -->
                    <video class="cam-video" autoplay playsinline muted style="width:100%; height:100%; object-fit:contain; background:#000000; transition:filter 0.2s ease;"></video>
                    <canvas class="cam-canvas" style="display:none;"></canvas>

                    <!-- HUD Status Badge -->
                    <div class="cam-hud" style="position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.65); color:#ffffff; font-family:monospace; font-size:10px; padding:3px 8px; border:1px solid #444444; border-radius:2px; display:flex; align-items:center; gap:6px; pointer-events:none; z-index:5;">
                        <span style="width:6px; height:6px; background:#00ff00; border-radius:50%; display:inline-block; box-shadow:0 0 4px #00ff00;"></span>
                        <span class="cam-hud-text">Initializing Feed...</span>
                    </div>

                    <!-- 3x3 Framing Grid Overlay -->
                    <div class="cam-grid-overlay" style="display:none; position:absolute; inset:0; pointer-events:none; border:1px solid rgba(255,255,255,0.15); z-index:4;">
                        <div style="position:absolute; top:33.33%; left:0; right:0; height:1px; background:rgba(255,255,255,0.3); border-top:1px dashed rgba(0,0,0,0.5);"></div>
                        <div style="position:absolute; top:66.66%; left:0; right:0; height:1px; background:rgba(255,255,255,0.3); border-top:1px dashed rgba(0,0,0,0.5);"></div>
                        <div style="position:absolute; left:33.33%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.3); border-left:1px dashed rgba(0,0,0,0.5);"></div>
                        <div style="position:absolute; left:66.66%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.3); border-left:1px dashed rgba(0,0,0,0.5);"></div>
                    </div>

                    <!-- Countdown Overlay -->
                    <div class="cam-countdown-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.4); z-index:10; align-items:center; justify-content:center; color:#ffff00; font-family:'Courier New', monospace; font-size:72px; font-weight:bold; text-shadow:3px 3px 6px #000000;">
                        3
                    </div>

                    <!-- Flash Animation Overlay -->
                    <div class="cam-flash-overlay" style="position:absolute; inset:0; background:#ffffff; opacity:0; pointer-events:none; z-index:12; transition:opacity 0.15s ease-out;"></div>
                </div>

                <!-- Bottom Status & Actions Bar -->
                <div style="background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:6px 8px; display:flex; flex-direction:column; gap:6px; flex-shrink:0;">
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div class="cam-status" style="font-family:monospace; font-size:11px; color:#000080; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Ready</div>
                        <div class="cam-gallery-count" style="font-size:10px; font-weight:bold; color:#555555; white-space:nowrap;">Photos (0)</div>
                    </div>

                    <div style="display:flex; gap:6px;">
                        <button class="cam-capture-btn app-toolbar-btn" style="flex-grow:1; padding:5px; justify-content:center; font-size:12px;">
                            ${getIcon('picture')} Take Photo
                        </button>
                        <button class="cam-save-btn app-toolbar-btn" style="flex-grow:1; padding:5px; justify-content:center; font-size:12px;" disabled>
                            ${getIcon('save')} Save Last Photo
                        </button>
                    </div>
                </div>

                <!-- Gallery Thumbnails Strip -->
                <div class="cam-gallery-strip" style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; height:68px; padding:4px; display:flex; gap:6px; overflow-x:auto; flex-shrink:0; box-sizing:border-box;">
                    <div class="cam-gallery-empty" style="width:100%; display:flex; align-items:center; justify-content:center; color:#808080; font-size:11px;">No photos captured yet</div>
                </div>
            </div>
        `);

        this.videoEl = this.body.querySelector('.cam-video');
        this.canvasEl = this.body.querySelector('.cam-canvas');
        this.deviceContainer = this.body.querySelector('#cam-device-drop-wrap');
        this.filterContainer = this.body.querySelector('#cam-filter-drop-wrap');
        this.timerContainer = this.body.querySelector('#cam-timer-drop-wrap');
        this.statusEl = this.body.querySelector('.cam-status');
        this.hudEl = this.body.querySelector('.cam-hud-text');
        this.countdownOverlay = this.body.querySelector('.cam-countdown-overlay');
        this.flashOverlay = this.body.querySelector('.cam-flash-overlay');
        this.gridOverlay = this.body.querySelector('.cam-grid-overlay');
        this.galleryContainer = this.body.querySelector('.cam-gallery-strip');

        // Bind dropdowns
        bindW95Dropdown(this.filterContainer, '#cam-filter-drop', (val, label) => {
            this.activeFilter = val;
            this.activeFilterLabel = label;
            if (this.videoEl) this.videoEl.style.filter = val;
            this.updateHud();
        });

        bindW95Dropdown(this.timerContainer, '#cam-timer-drop', (val) => {
            this.timerSeconds = parseInt(val, 10) || 0;
        });

        // Grid toggle button
        const gridBtn = this.body.querySelector('.cam-grid-btn');
        gridBtn.addEventListener('click', () => {
            this.showGrid = !this.showGrid;
            this.gridOverlay.style.display = this.showGrid ? 'block' : 'none';
            gridBtn.innerHTML = `${getIcon('grid')} Grid: ${this.showGrid ? 'ON' : 'OFF'}`;
            if (this.showGrid) gridBtn.style.borderStyle = 'inset';
            else gridBtn.style.borderStyle = 'outset';
        });

        // Action buttons
        this.body.querySelector('.cam-capture-btn').addEventListener('click', () => this.handleCaptureTrigger());
        this.body.querySelector('.cam-save-btn').addEventListener('click', () => this.saveLastPhoto());

        this.listen(window, 'keydown', this.boundKeyDown);

        if (!isSupported()) {
            this.setStatus("Camera API not supported in this browser.", true);
            this.deviceContainer.innerHTML = w95Dropdown({
                id: 'cam-device-drop',
                options: [{ value: '', label: 'Unsupported' }],
                value: '',
                width: '160px',
                disabled: true
            });
            return;
        }

        this.listen(navigator.mediaDevices, 'devicechange', this.boundDeviceChange);
        this.initCamera();
    }

    async initCamera() {
        this.setStatus("Requesting camera access...");
        try {
            const stream = await requestCamera();
            this.attachStream(stream);
        } catch (err) {
            this.setStatus(describeError(err), true);
        }
        await this.refreshDeviceList();
    }

    async refreshDeviceList() {
        if (!this.deviceContainer) return;
        try {
            const cams = await listCameras();
            this.camerasList = cams;
            const options = cams.length
                ? cams.map((d, i) => ({ value: d.deviceId, label: d.label || `Camera ${i + 1}` }))
                : [{ value: '', label: 'No cameras detected' }];

            const selectedValue = (this.currentDeviceId && cams.some(d => d.deviceId === this.currentDeviceId))
                ? this.currentDeviceId
                : (cams[0]?.deviceId || '');

            this.deviceContainer.innerHTML = w95Dropdown({
                id: 'cam-device-drop',
                options: options,
                value: selectedValue,
                width: '160px',
                disabled: cams.length === 0
            });

            bindW95Dropdown(this.deviceContainer, '#cam-device-drop', (deviceId) => {
                if (deviceId && deviceId !== this.currentDeviceId) {
                    this.startStream(deviceId);
                }
            });

            if (!cams.length && !this.stream) {
                this.setStatus("No camera detected on this device.", true);
            }
        } catch (err) {
            this.setStatus(`Device enumeration failed: ${err.message}`, true);
        }
    }

    async startStream(deviceId) {
        this.stopStream();
        this.setStatus("Switching camera feed...");
        try {
            const stream = await requestCamera(deviceId || null);
            this.attachStream(stream);
        } catch (err) {
            this.setStatus(describeError(err), true);
        }
        await this.refreshDeviceList();
    }

    attachStream(stream) {
        this.stream = stream;
        this.videoEl.srcObject = stream;
        this.videoEl.style.filter = this.activeFilter;

        const info = describeStream(stream);
        this.currentDeviceId = info?.deviceId || null;
        this.updateHud(info);
        this.setStatus(`Camera connected: ${info?.label || 'Active Device'}`);
    }

    updateHud(info = null) {
        if (!this.hudEl) return;
        const currentInfo = info || describeStream(this.stream);
        const resText = currentInfo?.width ? `${currentInfo.width}x${currentInfo.height}` : 'Live Feed';
        this.hudEl.textContent = `${resText} | Filter: ${this.activeFilterLabel}`;
    }

    setStatus(text, isError = false) {
        if (!this.statusEl) return;
        this.statusEl.textContent = text;
        this.statusEl.style.color = isError ? "#c62828" : "#000080";
    }

    handleCaptureTrigger() {
        if (this.isCountingDown) return;

        if (this.timerSeconds > 0) {
            this.runCountdown(this.timerSeconds);
        } else {
            this.executeCapture();
        }
    }

    runCountdown(count) {
        this.isCountingDown = true;
        this.countdownOverlay.style.display = 'flex';
        this.countdownOverlay.textContent = count;
        playSystemSound('click');

        let current = count;
        const timer = setInterval(() => {
            current--;
            if (current > 0) {
                this.countdownOverlay.textContent = current;
                playSystemSound('click');
            } else {
                clearInterval(timer);
                this.countdownOverlay.style.display = 'none';
                this.isCountingDown = false;
                this.executeCapture();
            }
        }, 1000);
    }

    async executeCapture() {
        // Trigger Flash Animation
        this.flashOverlay.style.opacity = '1';
        setTimeout(() => { this.flashOverlay.style.opacity = '0'; }, 150);
        playSystemSound('click');

        const dataUrl = captureFrame(this.videoEl, this.canvasEl, this.activeFilter);
        if (!dataUrl) {
            this.setStatus("No active camera feed to capture.", true);
            return;
        }

        const blob = await canvasToBlob(this.canvasEl);
        const item = {
            id: `photo_${Date.now()}`,
            dataUrl: dataUrl,
            blob: blob,
            timestamp: new Date().toLocaleTimeString(),
            filterLabel: this.activeFilterLabel
        };

        this.gallery.unshift(item);
        this.renderGallery();

        // Enable Save button
        const saveBtn = this.body.querySelector('.cam-save-btn');
        if (saveBtn) saveBtn.removeAttribute('disabled');

        this.setStatus(`Photo captured (${item.timestamp}) with ${this.activeFilterLabel} filter!`);
    }

    renderGallery() {
        if (!this.galleryContainer) return;

        const countEl = this.body.querySelector('.cam-gallery-count');
        if (countEl) countEl.textContent = `Photos (${this.gallery.length})`;

        if (this.gallery.length === 0) {
            this.galleryContainer.innerHTML = `<div class="cam-gallery-empty" style="width:100%; display:flex; align-items:center; justify-content:center; color:#808080; font-size:11px;">No photos captured yet</div>`;
            return;
        }

        this.galleryContainer.innerHTML = this.gallery.map((photo, idx) => `
            <div class="cam-thumb-card" data-id="${photo.id}" style="width:72px; height:54px; flex-shrink:0; position:relative; cursor:pointer; border:2px solid ${idx === 0 ? '#000080' : '#808080'}; box-shadow:1px 1px 3px rgba(0,0,0,0.3); background:#000;">
                <img src="${photo.dataUrl}" alt="Photo ${idx + 1}" style="width:100%; height:100%; object-fit:cover;">
                <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); color:#ffffff; font-size:8px; font-family:monospace; padding:1px 2px; text-align:center;">
                    ${photo.timestamp}
                </div>
            </div>
        `).join('');

        this.galleryContainer.querySelectorAll('.cam-thumb-card').forEach(card => {
            card.addEventListener('click', () => {
                const photoId = card.dataset.id;
                const item = this.gallery.find(p => p.id === photoId);
                if (item) this.openPhotoModal(item);
            });
        });
    }

    openPhotoModal(photo) {
        const overlay = document.createElement('div');
        overlay.className = 'os-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: transparent; display: flex; align-items: center; justify-content: center;
            z-index: 100015;
        `;

        overlay.innerHTML = `
            <div class="window-frame active-window" style="width:440px; height:auto; position:relative; left:auto; top:auto; box-shadow:4px 4px 16px rgba(0,0,0,0.6);">
                <div class="window-header">
                    <div class="window-title" style="display:flex; align-items:center; gap:6px;">
                        <span style="width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center;">${getIcon('picture')}</span>
                        <span>Photo Preview - ${photo.timestamp}</span>
                    </div>
                    <div class="window-controls">
                        <button class="win-btn" id="modal-close">${getIcon('winClose')}</button>
                    </div>
                </div>

                <div class="window-body" style="padding:10px; background:#c0c0c0; display:flex; flex-direction:column; gap:8px;">
                    <div style="background:#000000; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:2px; display:flex; align-items:center; justify-content:center; max-height:280px; overflow:hidden;">
                        <img src="${photo.dataUrl}" style="max-width:100%; max-height:270px; object-fit:contain;">
                    </div>

                    <div style="font-size:11px; display:flex; justify-content:space-between; color:#444444;">
                        <span>Filter: <b>${photo.filterLabel}</b></span>
                        <span>Captured: <b>${photo.timestamp}</b></span>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
                        <button id="modal-vfs-save" class="app-toolbar-btn">${getIcon('save')} Save to VFS</button>
                        <button id="modal-download" class="app-toolbar-btn">${getIcon('save')} Download</button>
                        <button id="modal-delete" class="app-toolbar-btn" style="color:#c62828;">${getIcon('delete')} Delete</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#modal-close').addEventListener('click', close);

        overlay.querySelector('#modal-vfs-save').addEventListener('click', () => {
            const filename = `photo_${Date.now()}.png`;
            try {
                saveFileToVfsPath("Users/Guest/Pictures", filename, photo.dataUrl);
                this.setStatus(`Saved photo to Pictures/${filename} in ZebOS VFS!`);
                playSystemSound('open');
            } catch (err) {
                this.setStatus(`VFS save failed: ${err.message}`, true);
            }
            close();
        });

        overlay.querySelector('#modal-download').addEventListener('click', () => {
            downloadBlob(photo.blob, `zebos-photo-${Date.now()}.png`);
            close();
        });

        overlay.querySelector('#modal-delete').addEventListener('click', () => {
            this.gallery = this.gallery.filter(p => p.id !== photo.id);
            this.renderGallery();
            close();
        });
    }

    saveLastPhoto() {
        if (this.gallery.length === 0) return;
        const lastPhoto = this.gallery[0];
        const filename = `photo_${Date.now()}.png`;
        try {
            saveFileToVfsPath("Users/Guest/Pictures", filename, lastPhoto.dataUrl);
            this.setStatus(`Saved last photo to Pictures/${filename} in ZebOS VFS!`);
            playSystemSound('open');
        } catch (err) {
            downloadBlob(lastPhoto.blob, filename);
        }
    }

    stopStream() {
        stopCamera(this.stream);
        this.stream = null;
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.handleCaptureTrigger();
        }
    }

    onCleanup() {
        this.stopStream();
    }
}
