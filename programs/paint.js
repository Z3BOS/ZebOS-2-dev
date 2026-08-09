// programs/paint.js - ZebOS 2 Pro Retro Paint Application
import { getIcon } from '../icons.js';
import { showOsPrompt } from '../os.js';

export class PaintApp {
    constructor(onCloseRequest, saveToVFS) {
        this.onCloseRequest = onCloseRequest;
        this.saveToVFS = saveToVFS;

        this.bodyElement = null;
        this.canvas = null;
        this.ctx = null;

        this.currentTool = 'pencil'; // pencil, brush, eraser, line, rect, circle
        this.currentColor = '#000000';
        this.currentSize = 3;

        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.snapshotData = null;

        this.boundMouseDown = (e) => this.handleMouseDown(e);
        this.boundMouseMove = (e) => this.handleMouseMove(e);
        this.boundMouseUp = (e) => this.handleMouseUp(e);
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; box-sizing:border-box; user-select:none; font-family:Arial, sans-serif;">
                
                <!-- Menu / Header Bar -->
                <div style="background:#c0c0c0; padding:4px 8px; border-bottom:2px solid #808080; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
                    <div style="display:flex; gap:6px;">
                        <button class="paint-btn opt-save" title="Save Image to Disk">${getIcon('save')} Save</button>
                        <button class="paint-btn opt-clear" title="Clear Canvas">${getIcon('clear')} Clear</button>
                    </div>
                    <div style="font-size:12px; font-weight:bold; color:#404040;">ZebPaint Studio</div>
                </div>

                <!-- Main Workspace: Tool Palette (Left) + Canvas (Right) -->
                <div style="flex-grow:1; display:flex; overflow:hidden;">
                    
                    <!-- Left Tool Bar -->
                    <div style="width:50px; background:#c0c0c0; border-right:2px solid #808080; padding:6px; display:flex; flex-direction:column; gap:6px; align-items:center; flex-shrink:0;">
                        <button class="paint-tool-btn active-tool" data-tool="pencil" title="Pencil">${getIcon('pencil')}</button>
                        <button class="paint-tool-btn" data-tool="brush" title="Brush">${getIcon('brush')}</button>
                        <button class="paint-tool-btn" data-tool="eraser" title="Eraser">${getIcon('eraser')}</button>
                        <button class="paint-tool-btn" data-tool="line" title="Line">${getIcon('line')}</button>
                        <button class="paint-tool-btn" data-tool="rect" title="Rectangle">${getIcon('rect')}</button>
                        <button class="paint-tool-btn" data-tool="circle" title="Circle">${getIcon('circle')}</button>
                    </div>

                    <!-- Canvas Area -->
                    <div style="flex-grow:1; background:#808080; padding:8px; display:flex; align-items:center; justify-content:center; overflow:auto;">
                        <canvas class="paint-canvas" width="600" height="400" style="background:#ffffff; border:2px solid #000000; cursor:crosshair; box-shadow:3px 3px 6px rgba(0,0,0,0.4);"></canvas>
                    </div>
                </div>

                <!-- Bottom Control Strip: Color Swatches + Size Selector -->
                <div style="background:#c0c0c0; border-top:2px solid #ffffff; padding:4px 10px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; min-height:38px; box-sizing:border-box;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; font-weight:bold;">Color:</span>
                        <!-- Active color preview + native picker trigger -->
                        <div style="position:relative; width:22px; height:22px; flex-shrink:0;">
                            <div class="paint-color-preview" style="width:22px;height:22px;background:#000000;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;cursor:pointer;box-sizing:border-box;" title="Click to pick custom color"></div>
                            <input type="color" class="color-picker-input" value="#000000" style="position:absolute;top:0;left:0;width:22px;height:22px;opacity:0;cursor:pointer;" title="Custom Color">
                        </div>
                        <div class="color-palette" style="display:flex; gap:2px;">
                            ${['#000000','#ffffff','#d32f2f','#1976d2','#388e3c','#fbc02d','#f57c00','#7b1fa2','#008080','#795548','#607d8b','#e91e63']
                                .map(c => `<div class="color-swatch" data-color="${c}" style="width:14px;height:14px;background:${c};border:2px solid ${c==='#000000'?'#000080':'#808080'};border-right-color:${c==='#000000'?'#000080':'#fff'};border-bottom-color:${c==='#000000'?'#000080':'#fff'};cursor:pointer;box-sizing:border-box;" title="${c}"></div>`).join('')}
                        </div>
                    </div>

                    <!-- Size: Win95 custom dropdown -->
                    <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:bold;">
                        <span>Size:</span>
                        <div class="w95-dropdown paint-size-drop" id="paint-size-drop" data-value="3" style="position:relative;width:130px;z-index:10;">
                          <div class="w95-drop-display" style="display:flex;align-items:center;justify-content:space-between;background:#c0c0c0;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:2px 4px;cursor:pointer;font-size:11px;font-family:Arial,sans-serif;min-height:20px;box-sizing:border-box;">
                            <span class="w95-drop-label" style="flex-grow:1;">3px (Medium)</span>
                            <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;flex-shrink:0;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;font-size:7px;">▼</span>
                          </div>
                          <div class="w95-drop-list" style="display:none;position:absolute;bottom:100%;left:0;width:100%;background:#c0c0c0;border:1px solid #000;box-shadow:2px 2px 4px rgba(0,0,0,.4);z-index:9999;">
                            <div class="w95-drop-item" data-value="1"  style="padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;background:#c0c0c0;color:#000;">1px (Thin)</div>
                            <div class="w95-drop-item" data-value="3"  style="padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;background:#000080;color:#fff;">3px (Medium)</div>
                            <div class="w95-drop-item" data-value="6"  style="padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;background:#c0c0c0;color:#000;">6px (Thick)</div>
                            <div class="w95-drop-item" data-value="12" style="padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;background:#c0c0c0;color:#000;">12px (Bold)</div>
                            <div class="w95-drop-item" data-value="24" style="padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;background:#c0c0c0;color:#000;">24px (Huge)</div>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = this.bodyElement.querySelector('.paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Bind tool switches
        const toolBtns = this.bodyElement.querySelectorAll('.paint-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active-tool'));
                btn.classList.add('active-tool');
                this.currentTool = btn.dataset.tool;
            });
        });

        // Bind color swatches + preview swatch + color picker
        const swatches = this.bodyElement.querySelectorAll('.color-swatch');
        const picker   = this.bodyElement.querySelector('.color-picker-input');
        const preview  = this.bodyElement.querySelector('.paint-color-preview');
        const syncColor = (hex) => {
            this.currentColor = hex;
            if (preview) preview.style.background = hex;
            swatches.forEach(sw => {
                const sel = sw.dataset.color === hex;
                sw.style.borderColor       = sel ? '#000080' : '#808080';
                sw.style.borderRightColor  = sel ? '#000080' : '#fff';
                sw.style.borderBottomColor = sel ? '#000080' : '#fff';
            });
        };
        swatches.forEach(s => {
            s.addEventListener('click', () => {
                syncColor(s.dataset.color);
                if (picker) picker.value = s.dataset.color;
            });
        });
        if (picker) picker.addEventListener('input', (e) => syncColor(e.target.value));

        // Win95 Size dropdown
        const sizeDropWrap  = this.bodyElement.querySelector('#paint-size-drop');
        const sizeDropDisp  = sizeDropWrap.querySelector('.w95-drop-display');
        const sizeDropList  = sizeDropWrap.querySelector('.w95-drop-list');
        const sizeDropLabel = sizeDropWrap.querySelector('.w95-drop-label');
        sizeDropDisp.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = sizeDropList.style.display !== 'none';
            sizeDropList.style.display = open ? 'none' : 'block';
        });
        sizeDropList.querySelectorAll('.w95-drop-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                sizeDropList.querySelectorAll('.w95-drop-item').forEach(i => { i.style.background='#c0c0c0'; i.style.color='#000'; });
                item.style.background='#000080'; item.style.color='#fff';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = item.dataset.value===sizeDropWrap.dataset.value?'#000080':'#c0c0c0';
                item.style.color      = item.dataset.value===sizeDropWrap.dataset.value?'#fff':'#000';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                sizeDropWrap.dataset.value = item.dataset.value;
                sizeDropLabel.textContent  = item.textContent.trim();
                sizeDropList.querySelectorAll('.w95-drop-item').forEach(i => { i.style.background=i.dataset.value===item.dataset.value?'#000080':'#c0c0c0'; i.style.color=i.dataset.value===item.dataset.value?'#fff':'#000'; });
                sizeDropList.style.display = 'none';
                this.currentSize = parseInt(item.dataset.value, 10);
            });
        });
        document.addEventListener('click', () => { sizeDropList.style.display = 'none'; });

        // Save & Clear
        this.bodyElement.querySelector('.opt-clear').addEventListener('click', () => {
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        });

        this.bodyElement.querySelector('.opt-save').addEventListener('click', () => {
            showOsPrompt("Save Artwork", "Enter filename to save image:", "artwork.png", (filename) => {
                const dataUrl = this.canvas.toDataURL("image/png");
                if (this.saveToVFS) {
                    this.saveToVFS(filename, dataUrl);
                }
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = filename;
                a.click();
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('mouseup', this.boundMouseUp);
        window.addEventListener('keydown', this.boundKeyDown);
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleMouseDown(e) {
        if (e.button !== 0) return;
        this.isDrawing = true;
        const coords = this.getCanvasCoords(e);
        this.startX = coords.x;
        this.startY = coords.y;

        this.snapshotData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentTool === 'pencil' || this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(coords.x, coords.y);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#ffffff' : this.currentColor;
            this.ctx.lineWidth = this.currentTool === 'eraser' ? this.currentSize * 3 : (this.currentTool === 'brush' ? this.currentSize * 2 : this.currentSize);
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        const coords = this.getCanvasCoords(e);

        if (this.currentTool === 'pencil' || this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.ctx.lineTo(coords.x, coords.y);
            this.ctx.stroke();
        } else {
            // Restore snapshot for preview shapes
            this.ctx.putImageData(this.snapshotData, 0, 0);
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentSize;

            if (this.currentTool === 'line') {
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(coords.x, coords.y);
                this.ctx.stroke();
            } else if (this.currentTool === 'rect') {
                const w = coords.x - this.startX;
                const h = coords.y - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, w, h);
            } else if (this.currentTool === 'circle') {
                const rx = Math.abs(coords.x - this.startX) / 2;
                const ry = Math.abs(coords.y - this.startY) / 2;
                const cx = Math.min(this.startX, coords.x) + rx;
                const cy = Math.min(this.startY, coords.y) + ry;
                this.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    cleanup() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        }
        window.removeEventListener('mousemove', this.boundMouseMove);
        window.removeEventListener('mouseup', this.boundMouseUp);
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}
