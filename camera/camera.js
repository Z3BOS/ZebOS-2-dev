// This is the UI shell for the camera app
// Real device detection/stream handling lives in devices.js; frame capture
// and file saving live in capture.js — this file just wires them to the DOM.
import { getIcon } from '../icons.js';
import { BaseApp } from '../UIKit/framework/index.js';
import { isSupported, listCameras, requestCamera, stopCamera, describeStream, describeError } from './devices.js';
import { captureFrame, canvasToBlob, downloadBlob } from './capture.js';

export class CameraApp extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);

        this.videoEl = null;
        this.canvasEl = null;
        this.deviceSelect = null;
        this.statusEl = null;
        this.thumbEl = null;

        this.stream = null;
        this.currentDeviceId = null;
        this.lastCaptureBlob = null;

        this.boundDeviceChange = () => this.refreshDeviceList();
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    mount() {
        this.body.style.height = "100%";

        this.render(`
            <div style="display:flex; flex-direction:column; height:100%; background:#1c1c1c; color:#ffffff; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none;">

                <!-- Title / device selector bar -->
                <div style="background:#2a2a2a; padding:6px 10px; font-size:12px; font-weight:bold; border-bottom:2px solid #000000; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; gap:8px;">
                    <span style="color:#00e5ff; white-space:nowrap;">ZebOS Camera</span>
                    <select class="cam-device-select" style="flex-grow:1; max-width:240px; font-size:11px; padding:2px; background:#ffffff; color:#000000;">
                        <option value="">Detecting cameras...</option>
                    </select>
                </div>

                <!-- Live viewport -->
                <div style="flex-grow:1; background:#000000; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    <video class="cam-video" autoplay playsinline muted style="width:100%; height:100%; object-fit:contain; background:#000000;"></video>
                    <canvas class="cam-canvas" style="display:none;"></canvas>
                    <img class="cam-thumb" alt="Last capture" style="display:none; position:absolute; bottom:8px; right:8px; width:96px; height:72px; object-fit:cover; border:2px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.6);">
                </div>

                <!-- Controls -->
                <div style="background:#c0c0c0; color:#000000; padding:6px 10px; border-top:2px solid #ffffff; display:flex; flex-direction:column; gap:6px; flex-shrink:0;">
                    <div class="cam-status" style="font-family:monospace; font-size:11px; color:#ffcc55; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Initializing camera...</div>
                    <div style="display:flex; gap:6px;">
                        <button class="cam-capture-btn" style="flex-grow:1; padding:4px; font-size:11px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">${getIcon('picture')} Capture</button>
                        <button class="cam-save-btn" style="flex-grow:1; padding:4px; font-size:11px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">${getIcon('save')} Save Photo</button>
                    </div>
                </div>
            </div>
        `);

        this.videoEl = this.body.querySelector('.cam-video');
        this.canvasEl = this.body.querySelector('.cam-canvas');
        this.deviceSelect = this.body.querySelector('.cam-device-select');
        this.statusEl = this.body.querySelector('.cam-status');
        this.thumbEl = this.body.querySelector('.cam-thumb');

        this.body.querySelector('.cam-capture-btn').addEventListener('click', () => this.capture());
        this.body.querySelector('.cam-save-btn').addEventListener('click', () => this.savePhoto());
        this.deviceSelect.addEventListener('change', () => this.startStream(this.deviceSelect.value));

        this.listen(window, 'keydown', this.boundKeyDown);

        if (!isSupported()) {
            this.setStatus("Camera API not supported in this browser.", true);
            this.deviceSelect.innerHTML = '<option value="">Unsupported</option>';
            this.deviceSelect.disabled = true;
            return;
        }

        // Re-scan when a camera is plugged in / unplugged while the app is open.
        this.listen(navigator.mediaDevices, 'devicechange', this.boundDeviceChange);

        this.initCamera();
    }

    async initCamera() {
        this.setStatus("Requesting camera access...");
        try {
            // Device labels stay blank until permission is granted, so open a
            // generic stream first, then enumerate to get the real device list.
            const stream = await requestCamera();
            this.attachStream(stream);
        } catch (err) {
            this.setStatus(describeError(err), true);
        }
        await this.refreshDeviceList();
    }

    async refreshDeviceList() {
        if (!this.deviceSelect) return;
        try {
            const cams = await listCameras();
            this.deviceSelect.innerHTML = cams.length
                ? cams.map((d, i) => `<option value="${d.deviceId}">${d.label || `Camera ${i + 1}`}</option>`).join('')
                : '<option value="">No cameras detected</option>';
            this.deviceSelect.disabled = cams.length === 0;

            if (this.currentDeviceId && cams.some(d => d.deviceId === this.currentDeviceId)) {
                this.deviceSelect.value = this.currentDeviceId;
            }
            if (!cams.length && !this.stream) {
                this.setStatus("No camera detected on this device.", true);
            }
        } catch (err) {
            this.setStatus(`Device enumeration failed: ${err.message}`, true);
        }
    }

    async startStream(deviceId) {
        this.stopStream();
        this.setStatus("Switching camera...");
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

        const info = describeStream(stream);
        this.currentDeviceId = info?.deviceId || null;
        this.setStatus(`Live: ${info?.label || 'Unknown camera'} — ${info?.width || '?'}x${info?.height || '?'}`);
    }

    setStatus(text, isError = false) {
        if (!this.statusEl) return;
        this.statusEl.textContent = text;
        this.statusEl.style.color = isError ? "#ff5555" : "#55ff55";
    }

    async capture() {
        const dataUrl = captureFrame(this.videoEl, this.canvasEl);
        if (!dataUrl) {
            this.setStatus("No active camera feed to capture.", true);
            return;
        }
        this.thumbEl.src = dataUrl;
        this.thumbEl.style.display = 'block';
        this.lastCaptureBlob = await canvasToBlob(this.canvasEl);
    }

    savePhoto() {
        if (!this.lastCaptureBlob) {
            this.setStatus("Capture a photo before saving.", true);
            return;
        }
        downloadBlob(this.lastCaptureBlob, `zebos-photo-${Date.now()}.png`);
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
    }

    // Releases the camera hardware — without this the light stays on and
    // the device stays locked after the window closes.
    onCleanup() {
        this.stopStream();
    }
}
