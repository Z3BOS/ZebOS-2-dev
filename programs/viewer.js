// programs/viewer.js - ZebOS Zeb Viewer (Image Viewer Application)
import { getIcon } from '../icons.js';
import { showOsConfirm, showSaveFileDialog, saveFileToVfsPath } from '../os.js';

export class ZebViewerApp {
    constructor(imageName = "image.png", imageDataUrl = null, onCloseRequest = () => {}, getVfsNode = null) {
        this.imageName = imageName;
        this.imageDataUrl = imageDataUrl;
        this.onCloseRequest = onCloseRequest;
        this.getVfsNode = getVfsNode;

        this.bodyElement = null;
        this.viewportEl = null;
        this.canvas = null;
        this.ctx = null;
        this.statusDimensionsEl = null;
        this.statusZoomEl = null;

        this.zoomLevel = 1.0;
        this.rotation = 0; // 0, 90, 180, 270
        this.flipH = false;
        this.flipV = false;

        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.img = new Image();
        this.imgLoaded = false;

        this.keyHandler = (e) => this.handleKeyDown(e);
        this.resizeHandler = () => this.handleResize();
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.render();
        this.initCanvas();
        this.loadImage();

        window.addEventListener('keydown', this.keyHandler);
        window.addEventListener('resize', this.resizeHandler);
    }

    render() {
        if (!this.bodyElement) return;

        this.bodyElement.innerHTML = `
            <style>
                .viewer-tb-btn {
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: bold;
                    background: #c0c0c0;
                    border: 1px solid #ffffff;
                    border-right-color: #000000;
                    border-bottom-color: #000000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    user-select: none;
                    color: #000000;
                }
                .viewer-tb-btn:active {
                    border: 1px solid #000000;
                    border-right-color: #ffffff;
                    border-bottom-color: #ffffff;
                    background: #e0e0e0;
                    padding-top: 4px;
                    padding-left: 9px;
                }
                .viewer-menu-item {
                    position: relative;
                    padding: 2px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    user-select: none;
                }
                .viewer-menu-item:hover {
                    background-color: #000080;
                    color: #ffffff;
                }
                .viewer-dropdown-menu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background-color: #c0c0c0;
                    border: 2px solid #ffffff;
                    border-right-color: #000000;
                    border-bottom-color: #000000;
                    box-shadow: 2px 2px 8px rgba(0,0,0,0.4);
                    z-index: 100;
                    min-width: 140px;
                }
                .viewer-dropdown-option {
                    padding: 4px 12px;
                    font-size: 11px;
                    cursor: pointer;
                    white-space: nowrap;
                    color: #000000;
                    display: flex;
                    justify-content: space-between;
                }
                .viewer-dropdown-option:hover {
                    background-color: #000080;
                    color: #ffffff;
                }
            </style>

            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none; overflow:hidden;">
                
                <!-- 1. Menubar Strip -->
                <div style="background:#c0c0c0; border-bottom:1px solid #808080; display:flex; align-items:center; height:24px; padding:0 4px; flex-shrink:0;">
                    
                    <div class="viewer-menu-item menu-file">File
                        <div class="viewer-dropdown-menu dropdown-file">
                            <div class="viewer-dropdown-option opt-save-as"><span>Save As...</span></div>
                            <div class="viewer-dropdown-option opt-export-pc"><span>Save to PC</span></div>
                            <div style="height:1px; background:#808080; margin:2px 0;"></div>
                            <div class="viewer-dropdown-option opt-close"><span>Exit</span></div>
                        </div>
                    </div>

                    <div class="viewer-menu-item menu-view">View
                        <div class="viewer-dropdown-menu dropdown-view">
                            <div class="viewer-dropdown-option opt-zoom-in"><span>Zoom In</span><span style="opacity:0.6;">+</span></div>
                            <div class="viewer-dropdown-option opt-zoom-out"><span>Zoom Out</span><span style="opacity:0.6;">-</span></div>
                            <div class="viewer-dropdown-option opt-zoom-100"><span>100% Actual Size</span><span style="opacity:0.6;">1:1</span></div>
                            <div class="viewer-dropdown-option opt-zoom-fit"><span>Fit Window</span><span style="opacity:0.6;">Fit</span></div>
                            <div style="height:1px; background:#808080; margin:2px 0;"></div>
                            <div class="viewer-dropdown-option opt-rot-cw"><span>Rotate 90° CW</span><span style="opacity:0.6;">↻</span></div>
                            <div class="viewer-dropdown-option opt-rot-ccw"><span>Rotate 90° CCW</span><span style="opacity:0.6;">↺</span></div>
                            <div class="viewer-dropdown-option opt-flip-h"><span>Flip Horizontal</span><span style="opacity:0.6;">⇆</span></div>
                            <div class="viewer-dropdown-option opt-flip-v"><span>Flip Vertical</span><span style="opacity:0.6;">⇅</span></div>
                            <div style="height:1px; background:#808080; margin:2px 0;"></div>
                            <div class="viewer-dropdown-option opt-reset"><span>Reset View</span></div>
                        </div>
                    </div>

                    <div class="viewer-menu-item menu-tools">Tools
                        <div class="viewer-dropdown-menu dropdown-tools">
                            <div class="viewer-dropdown-option opt-edit-paint"><span>Edit in Paint Studio</span></div>
                        </div>
                    </div>

                    <div style="margin-left:auto; display:flex; align-items:center; gap:6px; font-size:11px; color:#555; padding-right:6px;">
                        <span style="font-weight:bold; color:#000080;">Zeb Viewer</span>
                        <span style="font-size:10px; background:#e0e0e0; padding:1px 4px; border:1px solid #a0a0a0;">v2.5.1</span>
                    </div>
                </div>

                <!-- 2. Retro Control Toolbar -->
                <div style="background:#c0c0c0; border-bottom:2px solid #808080; padding:3px 6px; display:flex; align-items:center; gap:4px; flex-shrink:0;">
                    <button class="viewer-tb-btn btn-zoom-in" title="Zoom In (+)">🔍+</button>
                    <button class="viewer-tb-btn btn-zoom-out" title="Zoom Out (-)">🔍-</button>
                    <button class="viewer-tb-btn btn-zoom-100" title="100% Size">1:1</button>
                    <button class="viewer-tb-btn btn-zoom-fit" title="Fit to Window">📐 Fit</button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <button class="viewer-tb-btn btn-rot-ccw" title="Rotate Left 90°">↺</button>
                    <button class="viewer-tb-btn btn-rot-cw" title="Rotate Right 90°">↻</button>
                    <button class="viewer-tb-btn btn-flip-h" title="Flip Horizontal">⇆</button>
                    <button class="viewer-tb-btn btn-flip-v" title="Flip Vertical">⇅</button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <button class="viewer-tb-btn btn-reset" title="Reset View">Reset</button>
                </div>

                <!-- 3. Main Viewport Container with Canvas -->
                <div class="viewer-viewport" style="flex-grow:1; background:#808080; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; position:relative; overflow:hidden; cursor:grab;">
                    <canvas class="viewer-canvas" style="display:block; width:100%; height:100%;"></canvas>
                </div>

                <!-- 4. Bottom Status Bar Strip -->
                <div style="background:#c0c0c0; border-top:1px solid #ffffff; padding:2px 8px; font-size:11px; color:#222; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <div class="viewer-status-name" style="font-weight:bold; color:#000080; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">${this.imageName}</div>
                    <div class="viewer-status-dims" style="font-family:monospace; color:#444;">-- × -- px</div>
                    <div class="viewer-status-zoom" style="font-weight:bold; color:#000080;">100% | 0°</div>
                </div>
            </div>
        `;

        this.viewportEl = this.bodyElement.querySelector('.viewer-viewport');
        this.statusDimensionsEl = this.bodyElement.querySelector('.viewer-status-dims');
        this.statusZoomEl = this.bodyElement.querySelector('.viewer-status-zoom');

        this.setupMenuHandlers();
        this.setupToolbarHandlers();
        this.setupViewportPanAndZoom();
    }

    initCanvas() {
        this.canvas = this.bodyElement.querySelector('.viewer-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.handleResize();
    }

    handleResize() {
        if (!this.viewportEl || !this.canvas) return;
        const rect = this.viewportEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.draw();
        }
    }

    loadImage() {
        if (this.imageDataUrl) {
            this.img.src = this.imageDataUrl;
        } else {
            // Placeholder checkered canvas if no image provided
            this.imgLoaded = false;
            this.drawPlaceholder();
            return;
        }

        this.img.onload = () => {
            this.imgLoaded = true;
            if (this.statusDimensionsEl) {
                this.statusDimensionsEl.textContent = `${this.img.width} × ${this.img.height} px`;
            }
            this.fitToWindow();
        };

        this.img.onerror = () => {
            this.imgLoaded = false;
            this.drawPlaceholder("Failed to load image file");
        };
    }

    drawPlaceholder(msg = "No Image Loaded") {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.fillStyle = '#606060';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '13px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(msg, w / 2, h / 2);
    }

    fitToWindow() {
        if (!this.imgLoaded || !this.canvas) return;
        const vw = this.canvas.width - 40;
        const vh = this.canvas.height - 40;

        const isRotated90 = (this.rotation % 180 !== 0);
        const imgW = isRotated90 ? this.img.height : this.img.width;
        const imgH = isRotated90 ? this.img.width : this.img.height;

        const scaleW = vw / imgW;
        const scaleH = vh / imgH;
        let scale = Math.min(scaleW, scaleH);

        if (scale > 1) scale = 1; // Don't over-expand smaller images
        this.zoomLevel = Math.max(0.1, scale);
        this.panX = 0;
        this.panY = 0;
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Draw viewport background with alpha checkerboard
        this.ctx.fillStyle = '#707070';
        this.ctx.fillRect(0, 0, w, h);

        const checkSize = 16;
        for (let y = 0; y < h; y += checkSize) {
            for (let x = 0; x < w; x += checkSize) {
                if ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0) {
                    this.ctx.fillStyle = '#888888';
                    this.ctx.fillRect(x, y, checkSize, checkSize);
                }
            }
        }

        if (!this.imgLoaded) return;

        // 2. Transform and draw image centered with zoom & pan
        this.ctx.save();
        this.ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
        this.ctx.rotate((this.rotation * Math.PI) / 180);
        this.ctx.scale(this.zoomLevel * (this.flipH ? -1 : 1), this.zoomLevel * (this.flipV ? -1 : 1));
        
        this.ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        this.ctx.restore();

        // 3. Update status bar zoom text
        if (this.statusZoomEl) {
            const zoomPct = Math.round(this.zoomLevel * 100);
            this.statusZoomEl.textContent = `${zoomPct}% | ${this.rotation}°`;
        }
    }

    setupViewportPanAndZoom() {
        if (!this.viewportEl) return;

        // Mouse Drag Panning
        this.viewportEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.isDragging = true;
            this.dragStartX = e.clientX - this.panX;
            this.dragStartY = e.clientY - this.panY;
            this.viewportEl.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.panX = e.clientX - this.dragStartX;
            this.panY = e.clientY - this.dragStartY;
            this.draw();
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.viewportEl) this.viewportEl.style.cursor = 'grab';
            }
        });

        // Scroll Wheel Zooming
        this.viewportEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 1.15 : 0.85;
            const newZoom = Math.min(Math.max(0.05, this.zoomLevel * delta), 8.0);
            this.zoomLevel = newZoom;
            this.draw();
        }, { passive: false });
    }

    setupMenuHandlers() {
        const closeAllMenus = () => {
            this.bodyElement.querySelectorAll('.viewer-dropdown-menu').forEach(m => m.style.display = 'none');
        };

        const toggleMenu = (itemSelector, menuSelector) => {
            const item = this.bodyElement.querySelector(itemSelector);
            const menu = this.bodyElement.querySelector(menuSelector);
            if (!item || !menu) return;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = menu.style.display === 'block';
                closeAllMenus();
                if (!isOpen) menu.style.display = 'block';
            });
        };

        toggleMenu('.menu-file', '.dropdown-file');
        toggleMenu('.menu-view', '.dropdown-view');
        toggleMenu('.menu-tools', '.dropdown-tools');

        this.bodyElement.addEventListener('click', closeAllMenus);

        // Menu options
        this.bodyElement.querySelector('.opt-save-as').addEventListener('click', () => {
            closeAllMenus();
            showSaveFileDialog(this.imageName, (filename, vfsFolder) => {
                this.imageName = filename;
                saveFileToVfsPath(vfsFolder, filename, this.imageDataUrl);
                showOsConfirm("Image Saved", `'${filename}' was saved successfully.`);
            });
        });

        this.bodyElement.querySelector('.opt-export-pc').addEventListener('click', () => {
            closeAllMenus();
            if (!this.imageDataUrl) return;
            const a = document.createElement('a');
            a.href = this.imageDataUrl;
            a.download = this.imageName || "image.png";
            a.click();
        });

        this.bodyElement.querySelector('.opt-close').addEventListener('click', () => {
            closeAllMenus();
            this.onCloseRequest();
        });

        this.bodyElement.querySelector('.opt-zoom-in').addEventListener('click', () => { closeAllMenus(); this.adjustZoom(1.25); });
        this.bodyElement.querySelector('.opt-zoom-out').addEventListener('click', () => { closeAllMenus(); this.adjustZoom(0.8); });
        this.bodyElement.querySelector('.opt-zoom-100').addEventListener('click', () => { closeAllMenus(); this.zoomLevel = 1.0; this.draw(); });
        this.bodyElement.querySelector('.opt-zoom-fit').addEventListener('click', () => { closeAllMenus(); this.fitToWindow(); });
        this.bodyElement.querySelector('.opt-rot-cw').addEventListener('click', () => { closeAllMenus(); this.rotate(90); });
        this.bodyElement.querySelector('.opt-rot-ccw').addEventListener('click', () => { closeAllMenus(); this.rotate(-90); });
        this.bodyElement.querySelector('.opt-flip-h').addEventListener('click', () => { closeAllMenus(); this.flipH = !this.flipH; this.draw(); });
        this.bodyElement.querySelector('.opt-flip-v').addEventListener('click', () => { closeAllMenus(); this.flipV = !this.flipV; this.draw(); });
        this.bodyElement.querySelector('.opt-reset').addEventListener('click', () => { closeAllMenus(); this.resetView(); });
    }

    setupToolbarHandlers() {
        this.bodyElement.querySelector('.btn-zoom-in').addEventListener('click', () => this.adjustZoom(1.25));
        this.bodyElement.querySelector('.btn-zoom-out').addEventListener('click', () => this.adjustZoom(0.8));
        this.bodyElement.querySelector('.btn-zoom-100').addEventListener('click', () => { this.zoomLevel = 1.0; this.draw(); });
        this.bodyElement.querySelector('.btn-zoom-fit').addEventListener('click', () => this.fitToWindow());
        this.bodyElement.querySelector('.btn-rot-ccw').addEventListener('click', () => this.rotate(-90));
        this.bodyElement.querySelector('.btn-rot-cw').addEventListener('click', () => this.rotate(90));
        this.bodyElement.querySelector('.btn-flip-h').addEventListener('click', () => { this.flipH = !this.flipH; this.draw(); });
        this.bodyElement.querySelector('.btn-flip-v').addEventListener('click', () => { this.flipV = !this.flipV; this.draw(); });
        this.bodyElement.querySelector('.btn-reset').addEventListener('click', () => this.resetView());
    }

    adjustZoom(factor) {
        this.zoomLevel = Math.min(Math.max(0.05, this.zoomLevel * factor), 8.0);
        this.draw();
    }

    rotate(angle) {
        this.rotation = (this.rotation + angle + 360) % 360;
        this.draw();
    }

    resetView() {
        this.zoomLevel = 1.0;
        this.rotation = 0;
        this.flipH = false;
        this.flipV = false;
        this.panX = 0;
        this.panY = 0;
        this.draw();
    }

    handleKeyDown(e) {
        if (e.key === '+' || e.key === '=') this.adjustZoom(1.2);
        else if (e.key === '-') this.adjustZoom(0.8);
        else if (e.key === '0') this.resetView();
        else if (e.key === 'r' || e.key === 'R') this.rotate(90);
        else if (e.key === 'Escape') this.onCloseRequest();
    }

    cleanup() {
        window.removeEventListener('keydown', this.keyHandler);
        window.removeEventListener('resize', this.resizeHandler);
    }
}
