// programs/paint.js - ZebOS 2 Pro Retro Paint Application
import { getIcon } from '../icons.js';

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
                <div style="background:#c0c0c0; border-top:2px solid #ffffff; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; height:36px; box-sizing:border-box;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; font-weight:bold;">Color:</span>
                        <div class="color-palette" style="display:flex; gap:3px;">
                            ${['#000000','#ffffff','#d32f2f','#1976d2','#388e3c','#fbc02d','#f57c00','#7b1fa2','#008080','#795548']
                                .map(c => `<div class="color-swatch ${c==='#000000'?'active-swatch':''}" data-color="${c}" style="width:16px; height:16px; background:${c}; border:1px solid #000000; cursor:pointer;"></div>`).join('')}
                        </div>
                        <input type="color" class="color-picker-input" value="#000000" style="width:22px; height:22px; border:none; padding:0; background:transparent; cursor:pointer;" title="Custom Color">
                    </div>

                    <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:bold;">
                        <span>Size:</span>
                        <select class="paint-size-select" style="font-size:11px; padding:2px; background:#ffffff; border:1px solid #808080;">
                            <option value="1">1px (Thin)</option>
                            <option value="3" selected>3px (Medium)</option>
                            <option value="6">6px (Thick)</option>
                            <option value="12">12px (Bold)</option>
                            <option value="24">24px (Huge)</option>
                        </select>
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

        // Bind color swatches
        const swatches = this.bodyElement.querySelectorAll('.color-swatch');
        const picker = this.bodyElement.querySelector('.color-picker-input');
        swatches.forEach(s => {
            s.addEventListener('click', () => {
                swatches.forEach(sw => sw.style.outline = 'none');
                s.style.outline = '2px solid #000080';
                this.currentColor = s.dataset.color;
                picker.value = this.currentColor;
            });
        });
        picker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // Size selector
        const sizeSelect = this.bodyElement.querySelector('.paint-size-select');
        sizeSelect.addEventListener('change', (e) => {
            this.currentSize = parseInt(e.target.value, 10);
        });

        // Save & Clear
        this.bodyElement.querySelector('.opt-clear').addEventListener('click', () => {
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        });

        this.bodyElement.querySelector('.opt-save').addEventListener('click', () => {
            const filename = prompt("Enter artwork name to save:", "artwork.png");
            if (!filename) return;
            const dataUrl = this.canvas.toDataURL("image/png");
            if (this.saveToVFS) {
                this.saveToVFS(filename, dataUrl);
            }
            // Also trigger download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            a.click();
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
