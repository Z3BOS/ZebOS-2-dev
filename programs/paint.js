// programs/paint.js - ZebPaint Studio Pro
import { getIcon } from '../icons.js';
import { showOsConfirm, showSaveFileDialog, saveFileToVfsPath } from '../os.js';

export class PaintApp {
    constructor(onCloseRequest, saveToVFS) {
        this.onCloseRequest = onCloseRequest;
        this.saveToVFS = saveToVFS;

        this.bodyElement = null;
        this.mainCanvas = null;
        this.mainCtx = null;

        this.width = 640;
        this.height = 420;
        this.activeFileName = "artwork.png";

        // Multi-Layer System
        this.layers = [];
        this.activeLayerIndex = 0;
        this.layerCounter = 1;

        // Tool Settings
        this.currentTool = 'brush'; // 'brush', 'eraser', 'fill', 'line', 'rect', 'frect', 'circle', 'fcircle'
        this.currentBrushType = 'round'; // 'round', 'soft', 'airbrush', 'calligraphy', 'crayon', 'marker', 'eraser'
        this.currentColor = '#000000';
        this.currentSize = 6;
        this.currentOpacity = 100; // 1-100
        this.currentHardness = 80; // 0-100
        this.currentSmoothness = 0; // 0% default (raw mouse)

        // Drawing state
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.startX = 0;
        this.startY = 0;
        this.snapshotData = null;

        // History Undo/Redo
        this.history = [];
        this.historyIndex = -1;

        this.boundMouseDown = (e) => this.handleMouseDown(e);
        this.boundMouseMove = (e) => this.handleMouseMove(e);
        this.boundMouseUp = (e) => this.handleMouseUp(e);
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <style>
                .w95-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    height: 16px;
                    margin: 0;
                    cursor: pointer;
                    vertical-align: middle;
                }
                .w95-slider::-webkit-slider-runnable-track {
                    height: 4px;
                    background: #808080;
                    border-top: 1px solid #404040;
                    border-left: 1px solid #404040;
                    border-right: 1px solid #ffffff;
                    border-bottom: 1px solid #ffffff;
                    box-sizing: border-box;
                }
                .w95-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 10px;
                    height: 16px;
                    background: #c0c0c0;
                    border: 2px solid #ffffff;
                    border-right-color: #000000;
                    border-bottom-color: #000000;
                    margin-top: -6px;
                    box-sizing: border-box;
                }
                .w95-slider:focus {
                    outline: none;
                }
                .w95-sunken-val {
                    background: #ffffff;
                    border: 2px solid #808080;
                    border-right-color: #ffffff;
                    border-bottom-color: #ffffff;
                    padding: 1px 4px;
                    font-size: 10px;
                    font-weight: bold;
                    color: #000080;
                    min-width: 32px;
                    text-align: center;
                    display: inline-block;
                    box-sizing: border-box;
                }
                .paint-menu-drop-opt {
                    padding: 4px 14px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                }
                .paint-menu-drop-opt:hover {
                    background-color: #000080 !important;
                    color: #ffffff !important;
                }
                .paint-menu-drop-opt:hover span {
                    color: #ffffff !important;
                }
            </style>
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; box-sizing:border-box; user-select:none; font-family:Arial, sans-serif; overflow:hidden;">
                
                <!-- 1. Win95 Standard Menubar (File, Edit, Layer, Help) -->
                <div class="paint-menubar" style="display:flex; gap:2px; padding:2px 4px; background:#c0c0c0; border-bottom:1px solid #808080; font-size:12px; position:relative; z-index:500; flex-shrink:0;">
                    
                    <!-- File Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="paint-menu-btn" data-menu="file" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>F</u>ile</span>
                        <div class="paint-dropdown" id="menu-file-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 8px rgba(0,0,0,0.5); z-index:999999; min-width:180px; padding:2px 0;">
                            <div class="paint-menu-drop-opt opt-new"><span>New</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+N</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="paint-menu-drop-opt opt-save"><span>Save to ZebOS</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+S</span></div>
                            <div class="paint-menu-drop-opt opt-saveas"><span>Save As to ZebOS...</span><span style="font-size:10px; color:#666; margin-left:16px;">F3</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="paint-menu-drop-opt opt-savepc"><span>Save to PC (Export)...</span><span style="font-size:10px; opacity:0.8; margin-left:12px;">Device</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="paint-menu-drop-opt opt-exit"><span>Exit</span><span style="font-size:10px; color:#666; margin-left:16px;">Esc</span></div>
                        </div>
                    </div>

                    <!-- Edit Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="paint-menu-btn" data-menu="edit" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>E</u>dit</span>
                        <div class="paint-dropdown" id="menu-edit-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 8px rgba(0,0,0,0.5); z-index:999999; min-width:160px; padding:2px 0;">
                            <div class="paint-menu-drop-opt opt-undo"><span>Undo</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+Z</span></div>
                            <div class="paint-menu-drop-opt opt-redo"><span>Redo</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+Y</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="paint-menu-drop-opt opt-clear"><span>Clear Active Layer</span></div>
                        </div>
                    </div>

                    <!-- Layer Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="paint-menu-btn" data-menu="layer" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>L</u>ayer</span>
                        <div class="paint-dropdown" id="menu-layer-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 8px rgba(0,0,0,0.5); z-index:999999; min-width:160px; padding:2px 0;">
                            <div class="paint-menu-drop-opt opt-add-layer"><span>+ New Layer</span></div>
                            <div class="paint-menu-drop-opt opt-del-layer"><span>- Delete Active Layer</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="paint-menu-drop-opt opt-merge-layer"><span>Merge Layer Down</span></div>
                        </div>
                    </div>

                    <!-- Help Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="paint-menu-btn" data-menu="help" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>H</u>elp</span>
                        <div class="paint-dropdown" id="menu-help-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 8px rgba(0,0,0,0.5); z-index:999999; min-width:160px; padding:2px 0;">
                            <div class="paint-menu-drop-opt opt-about"><span>About ZebPaint Studio</span></div>
                        </div>
                    </div>

                    <div style="margin-left:auto; display:flex; align-items:center; gap:6px; font-size:11px; color:#555; padding-right:6px;">
                        <span style="font-weight:bold; color:#000080;">ZebPaint Studio Pro</span>
                        <span style="font-size:10px; background:#e0e0e0; padding:1px 4px; border:1px solid #a0a0a0;">v2.6</span>
                    </div>
                </div>

                <!-- 2. Retro Property Toolbar (Brush Type, Size, Smoothness, Hardness, Opacity) -->
                <div style="background:#c0c0c0; border-bottom:2px solid #808080; padding:5px 8px; display:flex; align-items:center; gap:12px; font-size:11px; flex-shrink:0; position:relative; z-index:200; overflow:visible;">
                    
                    <!-- Brush Selector Custom Win95 Dropdown -->
                    <div style="display:flex; align-items:center; gap:4px; position:relative; flex-shrink:0;">
                        <span style="font-weight:bold;">Brush:</span>
                        <div class="w95-dropdown" id="paint-brush-dropdown" data-value="round" style="position:relative; width:140px; z-index:201;">
                            <div class="w95-drop-display" style="display:flex; align-items:center; justify-content:space-between; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:2px 6px; cursor:pointer; font-size:11px; height:22px; box-sizing:border-box;">
                                <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
                                    <canvas class="brush-preview-thumb-head" width="24" height="14" style="background:#eee; border:1px solid #a0a0a0; flex-shrink:0;"></canvas>
                                    <span class="w95-drop-label" style="flex-grow:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Round Pen</span>
                                </div>
                                <span style="font-size:8px; line-height:1; flex-shrink:0; margin-left:4px;">▼</span>
                            </div>
                            <div class="w95-drop-list" style="display:none; position:absolute; top:100%; left:0; width:170px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 8px rgba(0,0,0,0.5); z-index:999999; box-sizing:border-box; margin-top:1px; padding:2px 0;">
                                ${[
                                    { value: 'round', label: 'Round Pen', desc: 'Solid continuous pen' },
                                    { value: 'soft', label: 'Soft Brush', desc: 'Feathered soft gradient' },
                                    { value: 'airbrush', label: 'Airbrush Spray', desc: 'Particle spray effect' },
                                    { value: 'calligraphy', label: 'Calligraphy', desc: 'Chisel tip 45° angle' },
                                    { value: 'crayon', label: 'Crayon / Chalk', desc: 'Textured grainy stroke' },
                                    { value: 'marker', label: 'Highlighter', desc: 'Translucent marker' },
                                    { value: 'eraser', label: 'Eraser Tool', desc: 'Erases active layer' }
                                ].map(b => `
                                    <div class="w95-drop-item" data-value="${b.value}" style="padding:4px 8px; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:8px; background:#c0c0c0; color:#000; border-bottom:1px solid #d0d0d0;">
                                        <canvas class="brush-item-thumb" data-brush="${b.value}" width="28" height="16" style="background:#ffffff; border:1px solid #808080; flex-shrink:0;"></canvas>
                                        <div style="display:flex; flex-direction:column; overflow:hidden;">
                                            <span style="font-weight:bold;">${b.label}</span>
                                            <span style="font-size:9px; opacity:0.75;">${b.desc}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Size Control Slider -->
                    <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
                        <span style="font-weight:bold;">Size:</span>
                        <input type="range" class="w95-slider" id="paint-size-range" min="1" max="50" value="6" style="width:75px;">
                        <span id="paint-size-val" class="w95-sunken-val">6px</span>
                    </div>

                    <!-- Smoothness Slider -->
                    <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;" title="Stroke smoothing">
                        <span style="font-weight:bold;">Smooth:</span>
                        <input type="range" class="w95-slider" id="paint-smooth-range" min="0" max="100" value="0" style="width:70px;">
                        <span id="paint-smooth-val" class="w95-sunken-val">0%</span>
                    </div>

                    <!-- Hardness Slider -->
                    <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;" title="Edge softness (0% = soft, 100% = sharp)">
                        <span style="font-weight:bold;">Hardness:</span>
                        <input type="range" class="w95-slider" id="paint-hard-range" min="0" max="100" value="80" style="width:70px;">
                        <span id="paint-hard-val" class="w95-sunken-val">80%</span>
                    </div>

                    <!-- Opacity Slider -->
                    <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;" title="Stroke opacity">
                        <span style="font-weight:bold;">Opacity:</span>
                        <input type="range" class="w95-slider" id="paint-opacity-range" min="1" max="100" value="100" style="width:70px;">
                        <span id="paint-opacity-val" class="w95-sunken-val">100%</span>
                    </div>
                </div>

                <!-- 3. Main Workspace: Tool Palette (Left) + Canvas Workspace (Center) + Layers Panel (Right) -->
                <div style="flex-grow:1; display:flex; overflow:hidden; position:relative; z-index:10;">
                    
                    <!-- Left Tools Bar -->
                    <div style="width:54px; background:#c0c0c0; border-right:2px solid #808080; padding:6px 4px; display:flex; flex-direction:column; gap:6px; align-items:center; flex-shrink:0;">
                        <button class="paint-tool-btn active-tool" data-tool="brush" title="Brush Tool">${getIcon('brush')}</button>
                        <button class="paint-tool-btn" data-tool="eraser" title="Eraser Tool">${getIcon('eraser')}</button>
                        <button class="paint-tool-btn" data-tool="fill" title="Paint Bucket Fill">${getIcon('fill')}</button>
                        <div style="width:100%; border-bottom:1px solid #808080; border-top:1px solid #fff; margin:2px 0;"></div>
                        <button class="paint-tool-btn" data-tool="line" title="Straight Line">${getIcon('line')}</button>
                        <button class="paint-tool-btn" data-tool="rect" title="Rectangle">${getIcon('rect')}</button>
                        <button class="paint-tool-btn" data-tool="frect" title="Filled Rectangle">${getIcon('frect')}</button>
                        <button class="paint-tool-btn" data-tool="circle" title="Ellipse">${getIcon('circle')}</button>
                        <button class="paint-tool-btn" data-tool="fcircle" title="Filled Ellipse">${getIcon('fcircle')}</button>
                    </div>

                    <!-- Center Canvas Area -->
                    <div style="flex-grow:1; background:#808080; padding:12px; display:flex; align-items:center; justify-content:center; overflow:auto; position:relative;">
                        <canvas class="paint-main-canvas" width="${this.width}" height="${this.height}" style="background:#ffffff; border:2px solid #000000; cursor:crosshair; box-shadow:4px 4px 10px rgba(0,0,0,0.5);"></canvas>
                    </div>

                    <!-- Right Layers Panel -->
                    <div style="width:180px; background:#c0c0c0; border-left:2px solid #808080; padding:8px; display:flex; flex-direction:column; gap:8px; flex-shrink:0; box-sizing:border-box;">
                        <div style="font-weight:bold; font-size:11px; color:#000080; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #808080; padding-bottom:4px;">
                            <span>Layers Stack</span>
                            <div style="display:flex; gap:3px;">
                                <button id="layer-btn-add" title="Add New Layer" style="padding:1px 6px; font-weight:bold; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">+ Layer</button>
                                <button id="layer-btn-del" title="Delete Active Layer" style="padding:1px 6px; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">- Layer</button>
                            </div>
                        </div>

                        <!-- Layers List Container -->
                        <div id="paint-layers-list" style="flex-grow:1; background:#ffffff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; overflow-y:auto; display:flex; flex-direction:column; gap:2px; padding:2px;"></div>

                        <!-- Layer Options Panel -->
                        <div style="border-top:1px solid #808080; padding-top:6px; display:flex; flex-direction:column; gap:6px; font-size:11px;">
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span>Layer Opacity:</span>
                                <span id="layer-opacity-val" class="w95-sunken-val" style="min-width:38px;">100%</span>
                            </div>
                            <input type="range" class="w95-slider" id="layer-opacity-range" min="0" max="100" value="100" style="width:100%;">
                            
                            <div style="display:flex; gap:4px; margin-top:2px;">
                                <button id="layer-btn-up" title="Move Layer Up" style="flex:1; padding:2px 0; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-size:10px; font-weight:bold;">▲ Up</button>
                                <button id="layer-btn-down" title="Move Layer Down" style="flex:1; padding:2px 0; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-size:10px; font-weight:bold;">▼ Down</button>
                                <button id="layer-btn-merge" title="Merge Down" style="flex:1; padding:2px 0; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-size:10px; font-weight:bold;">Merge</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. Bottom Color Palette & Status Bar -->
                <div style="background:#c0c0c0; border-top:2px solid #ffffff; padding:4px 10px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; min-height:40px; box-sizing:border-box;">
                    <!-- Color Swatches -->
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; font-weight:bold;">Color:</span>
                        <div style="position:relative; width:24px; height:24px; flex-shrink:0;">
                            <div class="paint-color-preview" style="width:24px;height:24px;background:#000000;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;cursor:pointer;box-sizing:border-box;" title="Click for custom color picker"></div>
                            <input type="color" class="color-picker-input" value="#000000" style="position:absolute;top:0;left:0;width:24px;height:24px;opacity:0;cursor:pointer;" title="Custom Color">
                        </div>
                        <div class="color-palette" style="display:flex; gap:3px;">
                            ${['#000000','#ffffff','#7f7f7f','#c3c3c8','#880015','#b97a57','#ed1c24','#ffaec9','#ff7f27','#ffc90e','#fff200','#efe4b0','#22b14c','#b5e61d','#00a2e8','#99d9ea','#3f48cc','#7092be','#a349a4','#c8bfe7']
                                .map(c => `<div class="color-swatch" data-color="${c}" style="width:16px;height:16px;background:${c};border:2px solid ${c==='#000000'?'#000080':'#808080'};border-right-color:${c==='#000000'?'#000080':'#fff'};border-bottom-color:${c==='#000000'?'#000080':'#fff'};cursor:pointer;box-sizing:border-box;" title="${c}"></div>`).join('')}
                        </div>
                    </div>

                    <!-- Canvas Position Info -->
                    <div style="font-size:11px; color:#333; display:flex; gap:14px;">
                        <span id="paint-cursor-pos">Pos: 0, 0px</span>
                        <span>Canvas: ${this.width} x ${this.height}px</span>
                    </div>
                </div>
            </div>
        `;

        this.mainCanvas = this.bodyElement.querySelector('.paint-main-canvas');
        this.mainCtx = this.mainCanvas.getContext('2d');

        // Create default background Layer 1
        this.addLayer("Background Layer");

        // Initialize UI controls & event listeners
        this.initMenubar();
        this.initControls();
        this.initBrushThumbnails();

        // Canvas mouse & key events
        this.mainCanvas.addEventListener('mousedown', this.boundMouseDown);
        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('mouseup', this.boundMouseUp);
        window.addEventListener('keydown', this.boundKeyDown);
    }

    initMenubar() {
        const menuBtns = this.bodyElement.querySelectorAll('.paint-menu-btn');
        const dropdowns = this.bodyElement.querySelectorAll('.paint-dropdown');

        const closeAllMenus = () => {
            dropdowns.forEach(d => d.style.display = 'none');
            menuBtns.forEach(b => { b.style.background = 'transparent'; b.style.color = '#000'; });
        };

        menuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuType = btn.dataset.menu;
                const targetDrop = this.bodyElement.querySelector(`#menu-${menuType}-drop`);
                const isOpen = targetDrop.style.display === 'block';

                closeAllMenus();

                if (!isOpen) {
                    targetDrop.style.display = 'block';
                    btn.style.background = '#000080';
                    btn.style.color = '#ffffff';
                }
            });

            btn.addEventListener('mouseenter', () => {
                const anyOpen = Array.from(dropdowns).some(d => d.style.display === 'block');
                if (anyOpen) {
                    const menuType = btn.dataset.menu;
                    const targetDrop = this.bodyElement.querySelector(`#menu-${menuType}-drop`);
                    closeAllMenus();
                    targetDrop.style.display = 'block';
                    btn.style.background = '#000080';
                    btn.style.color = '#ffffff';
                }
            });
        });

        document.addEventListener('click', () => closeAllMenus());

        // File Menu Handlers
        this.bodyElement.querySelector('.opt-new').addEventListener('click', () => {
            closeAllMenus();
            this.createNewCanvas();
        });

        this.bodyElement.querySelector('.opt-save').addEventListener('click', () => {
            closeAllMenus();
            this.openSaveAsDialog();
        });

        this.bodyElement.querySelector('.opt-saveas').addEventListener('click', () => {
            closeAllMenus();
            this.openSaveAsDialog();
        });

        this.bodyElement.querySelector('.opt-savepc').addEventListener('click', () => {
            closeAllMenus();
            this.exportToPC();
        });

        this.bodyElement.querySelector('.opt-exit').addEventListener('click', () => {
            closeAllMenus();
            this.onCloseRequest();
        });

        // Edit Menu Handlers
        this.bodyElement.querySelector('.opt-undo').addEventListener('click', () => { closeAllMenus(); this.undo(); });
        this.bodyElement.querySelector('.opt-redo').addEventListener('click', () => { closeAllMenus(); this.redo(); });
        this.bodyElement.querySelector('.opt-clear').addEventListener('click', () => { closeAllMenus(); this.clearActiveLayer(); });

        // Layer Menu Handlers
        this.bodyElement.querySelector('.opt-add-layer').addEventListener('click', () => { closeAllMenus(); this.addLayer(); });
        this.bodyElement.querySelector('.opt-del-layer').addEventListener('click', () => { closeAllMenus(); this.deleteActiveLayer(); });
        this.bodyElement.querySelector('.opt-merge-layer').addEventListener('click', () => { closeAllMenus(); this.mergeActiveLayerDown(); });

        // Help Menu Handler
        this.bodyElement.querySelector('.opt-about').addEventListener('click', () => {
            closeAllMenus();
            showOsConfirm("About ZebPaint Studio Pro", "ZebPaint Studio Pro v2.6\n\nAdvanced retro image editor with multi-layer rendering, visual brush drop-downs, Bezier curve smoothing, and dual VFS/PC export support.\n\nCreated for ZebOS 2.");
        });
    }

    openSaveAsDialog() {
        showSaveFileDialog(this.activeFileName, (filename, vfsFolder) => {
            this.activeFileName = filename;
            const dataUrl = this.mainCanvas.toDataURL("image/png");
            saveFileToVfsPath(vfsFolder, filename, dataUrl);
            const folderLabel = vfsFolder || "ZebRoot (Z:)";
            showOsConfirm("Artwork Saved to ZebOS", `'${filename}' has been saved successfully to '${folderLabel}'.`);
        });
    }

    exportToPC() {
        const dataUrl = this.mainCanvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = this.activeFileName || "artwork.png";
        a.click();
    }

    createNewCanvas() {
        showOsConfirm("New Canvas", "Create new blank canvas? All unsaved layer changes will be cleared.", false, () => {
            this.layers = [];
            this.layerCounter = 1;
            this.addLayer("Background Layer");
        });
    }

    clearActiveLayer() {
        const activeLayer = this.getActiveLayer();
        if (activeLayer) {
            activeLayer.ctx.clearRect(0, 0, this.width, this.height);
            if (this.activeLayerIndex === 0) {
                activeLayer.ctx.fillStyle = '#ffffff';
                activeLayer.ctx.fillRect(0, 0, this.width, this.height);
            }
            this.renderComposite();
            this.saveHistoryState();
        }
    }

    deleteActiveLayer() {
        if (this.layers.length <= 1) {
            showOsConfirm("Cannot Delete Layer", "At least one layer must remain in the project.");
            return;
        }
        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
        this.renderComposite();
        this.renderLayersUI();
        this.saveHistoryState();
    }

    mergeActiveLayerDown() {
        if (this.activeLayerIndex <= 0) {
            showOsConfirm("Cannot Merge Down", "There is no layer below the selected active layer.");
            return;
        }
        const upperLayer = this.layers[this.activeLayerIndex];
        const lowerLayer = this.layers[this.activeLayerIndex - 1];

        lowerLayer.ctx.save();
        lowerLayer.ctx.globalAlpha = upperLayer.opacity;
        lowerLayer.ctx.drawImage(upperLayer.canvas, 0, 0);
        lowerLayer.ctx.restore();

        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex--;
        this.renderComposite();
        this.renderLayersUI();
        this.saveHistoryState();
    }

    // Initialize Layer Stack
    addLayer(name = null) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = this.width;
        layerCanvas.height = this.height;
        const layerCtx = layerCanvas.getContext('2d');

        const layerName = name || `Layer ${this.layerCounter++}`;
        const newLayer = {
            id: 'layer_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            name: layerName,
            canvas: layerCanvas,
            ctx: layerCtx,
            visible: true,
            opacity: 1.0
        };

        // If background layer, fill with white
        if (this.layers.length === 0) {
            layerCtx.fillStyle = '#ffffff';
            layerCtx.fillRect(0, 0, this.width, this.height);
        }

        const insertIndex = this.layers.length > 0 ? this.activeLayerIndex + 1 : 0;
        this.layers.splice(insertIndex, 0, newLayer);
        this.activeLayerIndex = insertIndex;

        this.renderComposite();
        this.renderLayersUI();
        this.saveHistoryState();
    }

    getActiveLayer() {
        return this.layers[this.activeLayerIndex] || this.layers[0];
    }

    renderComposite() {
        if (!this.mainCtx) return;
        this.mainCtx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if (layer && layer.visible) {
                this.mainCtx.save();
                this.mainCtx.globalAlpha = layer.opacity;
                this.mainCtx.drawImage(layer.canvas, 0, 0);
                this.mainCtx.restore();
            }
        }
    }

    renderLayersUI() {
        const container = this.bodyElement.querySelector('#paint-layers-list');
        if (!container) return;
        container.innerHTML = "";

        // Render top layer first in UI list
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const isSelected = i === this.activeLayerIndex;

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                padding: 4px 6px; font-size: 11px; cursor: pointer;
                background: ${isSelected ? '#000080' : '#c0c0c0'};
                color: ${isSelected ? '#ffffff' : '#000000'};
                border: 1px solid #808080; box-sizing: border-box;
            `;

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
                    <span class="layer-toggle-vis" style="cursor:pointer; display:inline-flex; align-items:center; width:16px; height:16px;" title="Toggle Visibility">${layer.visible ? getIcon('layerVis') : getIcon('layerHide')}</span>
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:${isSelected ? 'bold' : 'normal'};">${layer.name}</span>
                </div>
                <span style="font-size:10px; opacity:0.8;">${Math.round(layer.opacity * 100)}%</span>
            `;

            item.querySelector('.layer-toggle-vis').addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this.renderComposite();
                this.renderLayersUI();
            });

            item.addEventListener('click', () => {
                this.activeLayerIndex = i;
                this.renderLayersUI();
                const opacityRange = this.bodyElement.querySelector('#layer-opacity-range');
                const opacityVal = this.bodyElement.querySelector('#layer-opacity-val');
                if (opacityRange) opacityRange.value = Math.round(layer.opacity * 100);
                if (opacityVal) opacityVal.textContent = `${Math.round(layer.opacity * 100)}%`;
            });

            container.appendChild(item);
        }
    }

    initControls() {
        // Tool Buttons
        const toolBtns = this.bodyElement.querySelectorAll('.paint-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active-tool'));
                btn.classList.add('active-tool');
                this.currentTool = btn.dataset.tool;
            });
        });

        // Property Sliders
        const sizeRange = this.bodyElement.querySelector('#paint-size-range');
        const sizeVal = this.bodyElement.querySelector('#paint-size-val');
        sizeRange.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value, 10);
            sizeVal.textContent = `${this.currentSize}px`;
        });

        const smoothRange = this.bodyElement.querySelector('#paint-smooth-range');
        const smoothVal = this.bodyElement.querySelector('#paint-smooth-val');
        smoothRange.addEventListener('input', (e) => {
            this.currentSmoothness = parseInt(e.target.value, 10);
            smoothVal.textContent = `${this.currentSmoothness}%`;
        });

        const hardRange = this.bodyElement.querySelector('#paint-hard-range');
        const hardVal = this.bodyElement.querySelector('#paint-hard-val');
        hardRange.addEventListener('input', (e) => {
            this.currentHardness = parseInt(e.target.value, 10);
            hardVal.textContent = `${this.currentHardness}%`;
        });

        const opacityRange = this.bodyElement.querySelector('#paint-opacity-range');
        const opacityVal = this.bodyElement.querySelector('#paint-opacity-val');
        opacityRange.addEventListener('input', (e) => {
            this.currentOpacity = parseInt(e.target.value, 10);
            opacityVal.textContent = `${this.currentOpacity}%`;
        });

        // Color Picker & Swatches
        const swatches = this.bodyElement.querySelectorAll('.color-swatch');
        const picker = this.bodyElement.querySelector('.color-picker-input');
        const preview = this.bodyElement.querySelector('.paint-color-preview');
        const syncColor = (hex) => {
            this.currentColor = hex;
            if (preview) preview.style.background = hex;
            swatches.forEach(sw => {
                const sel = sw.dataset.color === hex;
                sw.style.borderColor = sel ? '#000080' : '#808080';
                sw.style.borderRightColor = sel ? '#000080' : '#fff';
                sw.style.borderBottomColor = sel ? '#000080' : '#fff';
            });
            this.renderBrushHeadThumb();
        };
        swatches.forEach(s => {
            s.addEventListener('click', () => {
                syncColor(s.dataset.color);
                if (picker) picker.value = s.dataset.color;
            });
        });
        if (picker) picker.addEventListener('input', (e) => syncColor(e.target.value));

        // Brush Dropdown Control
        const brushWrap = this.bodyElement.querySelector('#paint-brush-dropdown');
        const brushDisp = brushWrap.querySelector('.w95-drop-display');
        const brushList = brushWrap.querySelector('.w95-drop-list');
        const brushLabel = brushWrap.querySelector('.w95-drop-label');

        brushDisp.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = brushList.style.display === 'block';
            brushList.style.display = isOpen ? 'none' : 'block';
        });

        brushList.querySelectorAll('.w95-drop-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                brushList.querySelectorAll('.w95-drop-item').forEach(i => { i.style.background='#c0c0c0'; i.style.color='#000'; });
                item.style.background = '#000080';
                item.style.color = '#ffffff';
            });
            item.addEventListener('mouseleave', () => {
                const isSelected = item.dataset.value === this.currentBrushType;
                item.style.background = isSelected ? '#000080' : '#c0c0c0';
                item.style.color = isSelected ? '#ffffff' : '#000000';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentBrushType = item.dataset.value;
                brushWrap.dataset.value = item.dataset.value;
                brushLabel.textContent = item.querySelector('span').textContent.trim();
                brushList.style.display = 'none';

                // Synchronize active tool button with selected brush type
                const toolBtns = this.bodyElement.querySelectorAll('.paint-tool-btn');
                if (item.dataset.value === 'eraser') {
                    this.currentTool = 'eraser';
                    toolBtns.forEach(b => b.classList.toggle('active-tool', b.dataset.tool === 'eraser'));
                } else {
                    this.currentTool = 'brush';
                    toolBtns.forEach(b => b.classList.toggle('active-tool', b.dataset.tool === 'brush'));
                }
                this.renderBrushHeadThumb();
            });
        });

        document.addEventListener('click', () => {
            if (brushList) brushList.style.display = 'none';
        });

        // Layer Action Buttons
        this.bodyElement.querySelector('#layer-btn-add').addEventListener('click', () => this.addLayer());
        this.bodyElement.querySelector('#layer-btn-del').addEventListener('click', () => this.deleteActiveLayer());
        this.bodyElement.querySelector('#layer-btn-up').addEventListener('click', () => {
            if (this.activeLayerIndex < this.layers.length - 1) {
                const temp = this.layers[this.activeLayerIndex];
                this.layers[this.activeLayerIndex] = this.layers[this.activeLayerIndex + 1];
                this.layers[this.activeLayerIndex + 1] = temp;
                this.activeLayerIndex++;
                this.renderComposite();
                this.renderLayersUI();
                this.saveHistoryState();
            }
        });

        this.bodyElement.querySelector('#layer-btn-down').addEventListener('click', () => {
            if (this.activeLayerIndex > 0) {
                const temp = this.layers[this.activeLayerIndex];
                this.layers[this.activeLayerIndex] = this.layers[this.activeLayerIndex - 1];
                this.layers[this.activeLayerIndex - 1] = temp;
                this.activeLayerIndex--;
                this.renderComposite();
                this.renderLayersUI();
                this.saveHistoryState();
            }
        });

        this.bodyElement.querySelector('#layer-btn-merge').addEventListener('click', () => this.mergeActiveLayerDown());

        const layerOpacityRange = this.bodyElement.querySelector('#layer-opacity-range');
        const layerOpacityVal = this.bodyElement.querySelector('#layer-opacity-val');
        layerOpacityRange.addEventListener('input', (e) => {
            const active = this.getActiveLayer();
            if (active) {
                active.opacity = parseInt(e.target.value, 10) / 100;
                layerOpacityVal.textContent = `${e.target.value}%`;
                this.renderComposite();
            }
        });
    }

    // Render Mini Thumbnails for Visual Brush Dropdown
    initBrushThumbnails() {
        const thumbs = this.bodyElement.querySelectorAll('.brush-item-thumb');
        thumbs.forEach(canv => {
            const bType = canv.dataset.brush;
            const cCtx = canv.getContext('2d');
            cCtx.fillStyle = '#ffffff';
            cCtx.fillRect(0, 0, canv.width, canv.height);
            this.renderStrokePreviewOnCanvas(cCtx, bType, canv.width, canv.height, '#000000');
        });
        this.renderBrushHeadThumb();
    }

    renderBrushHeadThumb() {
        const headCanv = this.bodyElement.querySelector('.brush-preview-thumb-head');
        if (!headCanv) return;
        const hCtx = headCanv.getContext('2d');
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(0, 0, headCanv.width, headCanv.height);
        this.renderStrokePreviewOnCanvas(hCtx, this.currentBrushType, headCanv.width, headCanv.height, this.currentColor);
    }

    renderStrokePreviewOnCanvas(ctx, bType, w, h, color) {
        ctx.save();
        const p1 = { x: 4, y: h / 2 };
        const p2 = { x: w - 4, y: h / 2 };

        if (bType === 'round') {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        } else if (bType === 'soft') {
            const transparentColor = hexToTransparentRgba(color);
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                const x = p1.x + (p2.x - p1.x) * t;
                const grad = ctx.createRadialGradient(x, p1.y, 1, x, p1.y, 4);
                grad.addColorStop(0, color);
                grad.addColorStop(1, transparentColor);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(x, p1.y, 4, 0, Math.PI * 2); ctx.fill();
            }
        } else if (bType === 'airbrush') {
            ctx.fillStyle = color;
            for (let i = 0; i < 35; i++) {
                const rx = 3 + Math.random() * (w - 6);
                const ry = (h / 2) + (Math.random() - 0.5) * 8;
                ctx.fillRect(rx, ry, 1, 1);
            }
        } else if (bType === 'calligraphy') {
            ctx.fillStyle = color;
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                const x = p1.x + (p2.x - p1.x) * t;
                ctx.fillRect(x - 2, (h/2) - 3, 3, 6);
            }
        } else if (bType === 'crayon') {
            ctx.fillStyle = color;
            for (let i = 0; i < 40; i++) {
                const rx = 3 + Math.random() * (w - 6);
                const ry = (h / 2) + (Math.random() - 0.5) * 6;
                ctx.globalAlpha = 0.5 + Math.random() * 0.5;
                ctx.fillRect(rx, ry, 1.2, 1.2);
            }
        } else if (bType === 'marker') {
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.lineCap = 'square';
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        } else if (bType === 'eraser') {
            ctx.fillStyle = '#d32f2f';
            ctx.fillRect(4, (h/2) - 3, w - 8, 6);
        }
        ctx.restore();
    }

    // Canvas Mouse Event Handlers
    getCanvasCoords(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.width / rect.width),
            y: (e.clientY - rect.top) * (this.height / rect.height)
        };
    }

    handleMouseDown(e) {
        if (e.button !== 0) return;
        
        this.isDrawing = false;
        let activeLayer = this.getActiveLayer();
        if (!activeLayer) {
            this.addLayer("Layer 1");
            activeLayer = this.getActiveLayer();
        }

        // Auto-enable visibility if drawing on a hidden layer so strokes are never lost
        if (!activeLayer.visible) {
            activeLayer.visible = true;
            this.renderComposite();
            this.renderLayersUI();
        }

        const coords = this.getCanvasCoords(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        this.startX = coords.x;
        this.startY = coords.y;
        this.isDrawing = true;

        if (this.currentTool === 'fill') {
            this.floodFill(Math.floor(coords.x), Math.floor(coords.y), this.currentColor);
            this.saveHistoryState();
            this.isDrawing = false;
            return;
        }

        // Snapshot current layer state for shape previewing
        this.snapshotImageData = activeLayer.ctx.getImageData(0, 0, this.width, this.height);

        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.drawContinuousStroke(activeLayer.ctx, coords.x, coords.y, coords.x, coords.y);
            this.renderComposite();
        }
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        const posEl = this.bodyElement?.querySelector('#paint-cursor-pos');
        if (posEl) posEl.textContent = `Pos: ${Math.round(coords.x)}, ${Math.round(coords.y)}px`;

        if (!this.isDrawing) return;
        const activeLayer = this.getActiveLayer();
        if (!activeLayer) return;

        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            if (this.currentSmoothness > 0) {
                // Stabilizer lerp factor: 0% = 1.0 (instant), 100% = 0.12 (heavy smooth lazy rope catch-up)
                const lerpFactor = 1.0 - (this.currentSmoothness / 100) * 0.88;
                const nextX = this.lastX + (coords.x - this.lastX) * lerpFactor;
                const nextY = this.lastY + (coords.y - this.lastY) * lerpFactor;
                this.drawContinuousStroke(activeLayer.ctx, this.lastX, this.lastY, nextX, nextY);
                this.lastX = nextX;
                this.lastY = nextY;
            } else {
                this.drawContinuousStroke(activeLayer.ctx, this.lastX, this.lastY, coords.x, coords.y);
                this.lastX = coords.x;
                this.lastY = coords.y;
            }
            this.renderComposite();
        } else if (['line', 'rect', 'frect', 'circle', 'fcircle'].includes(this.currentTool)) {
            // Restore snapshot for dynamic preview
            activeLayer.ctx.putImageData(this.snapshotImageData, 0, 0);
            this.drawShapePreview(activeLayer.ctx, this.startX, this.startY, coords.x, coords.y);
            this.renderComposite();
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.saveHistoryState();
    }

    // High-Density Sub-Pixel Interpolated Stroke Rendering (100% Solid & Gapless)
    drawContinuousStroke(ctx, x1, y1, x2, y2) {
        if (!ctx) return;
        const tool = (this.currentTool === 'eraser') ? 'eraser' : (this.currentBrushType || 'round');
        const size = Math.max(1, isNaN(this.currentSize) ? 6 : Number(this.currentSize));
        const opacity = Math.max(0.01, Math.min(1.0, isNaN(this.currentOpacity) ? 1.0 : (Number(this.currentOpacity) / 100)));
        const hardness = Math.max(0, Math.min(1.0, isNaN(this.currentHardness) ? 0.8 : (Number(this.currentHardness) / 100)));
        const color = this.currentColor || '#000000';

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = size * 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else if (tool === 'round') {
            ctx.globalAlpha = opacity;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else if (tool === 'marker') {
            ctx.globalAlpha = opacity * 0.4;
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
            ctx.strokeStyle = color;
            ctx.lineWidth = size * 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else {
            // For Soft Brush, Airbrush, Calligraphy, Crayon: Sub-pixel high-density interpolation
            const dist = Math.hypot(x2 - x1, y2 - y1);
            const stepSize = Math.max(0.5, size * 0.15); // Sub-pixel step for gapless stroke
            const steps = Math.max(1, Math.ceil(dist / stepSize));

            for (let i = 0; i <= steps; i++) {
                const t = steps === 0 ? 0 : i / steps;
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;

                if (tool === 'soft') {
                    ctx.globalAlpha = opacity;
                    const rad = Math.max(1, size / 2);
                    const innerRad = Math.max(0.2, rad * hardness);
                    const transparentColor = hexToTransparentRgba(color);
                    const grad = ctx.createRadialGradient(px, py, innerRad, px, py, rad);
                    grad.addColorStop(0, color);
                    grad.addColorStop(1, transparentColor);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(px, py, rad, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tool === 'airbrush') {
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = color;
                    const density = Math.round(size * 1.2);
                    for (let j = 0; j < density; j++) {
                        const angle = Math.random() * Math.PI * 2;
                        const r = Math.random() * (size / 2);
                        ctx.fillRect(px + Math.cos(angle) * r, py + Math.sin(angle) * r, 1.2, 1.2);
                    }
                } else if (tool === 'calligraphy') {
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(px - size/2, py - size/4);
                    ctx.lineTo(px + size/2, py + size/4);
                    ctx.lineTo(px + size/2 + 2, py + size/4 + 2);
                    ctx.lineTo(px - size/2 + 2, py - size/4 + 2);
                    ctx.closePath();
                    ctx.fill();
                } else if (tool === 'crayon') {
                    ctx.fillStyle = color;
                    const density = Math.round(size * 0.8);
                    for (let j = 0; j < density; j++) {
                        const rx = (Math.random() - 0.5) * size;
                        const ry = (Math.random() - 0.5) * size;
                        ctx.globalAlpha = opacity * (0.4 + Math.random() * 0.6);
                        ctx.fillRect(px + rx, py + ry, 1.5, 1.5);
                    }
                }
            }
        }

        ctx.restore();
    }

    drawShapePreview(ctx, x1, y1, x2, y2) {
        ctx.save();
        ctx.globalAlpha = this.currentOpacity / 100;
        ctx.strokeStyle = this.currentColor;
        ctx.fillStyle = this.currentColor;
        ctx.lineWidth = this.currentSize;

        if (this.currentTool === 'line') {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        } else if (this.currentTool === 'rect') {
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        } else if (this.currentTool === 'frect') {
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        } else if (this.currentTool === 'circle' || this.currentTool === 'fcircle') {
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;
            const cx = Math.min(x1, x2) + rx;
            const cy = Math.min(y1, y2) + ry;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (this.currentTool === 'fcircle') ctx.fill(); else ctx.stroke();
        }
        ctx.restore();
    }

    // Robust Breadth-First Flood Fill (Paint Bucket)
    floodFill(startX, startY, fillColorHex) {
        const activeLayer = this.getActiveLayer();
        if (!activeLayer) return;

        const w = this.width;
        const h = this.height;

        // Sample target color from composite canvas view
        const compImgData = this.mainCtx.getImageData(0, 0, w, h);
        const compData = compImgData.data;

        const startIdx = (startY * w + startX) * 4;
        const targetR = compData[startIdx];
        const targetG = compData[startIdx + 1];
        const targetB = compData[startIdx + 2];
        const targetA = compData[startIdx + 3];

        const fillRgba = hexToRgba(fillColorHex, Math.round((this.currentOpacity / 100) * 255));

        // If fill color matches target color, exit early
        if (Math.abs(targetR - fillRgba[0]) < 5 && Math.abs(targetG - fillRgba[1]) < 5 && Math.abs(targetB - fillRgba[2]) < 5 && Math.abs(targetA - fillRgba[3]) < 5) {
            return;
        }

        const layerImgData = activeLayer.ctx.getImageData(0, 0, w, h);
        const layerData = layerImgData.data;

        const visited = new Uint8Array(w * h);
        const queue = [startX, startY];

        while (queue.length > 0) {
            const y = queue.pop();
            const x = queue.pop();
            const pos = y * w + x;

            if (x < 0 || x >= w || y < 0 || y >= h || visited[pos]) continue;
            visited[pos] = 1;

            const idx = pos * 4;
            const curR = compData[idx];
            const curG = compData[idx + 1];
            const curB = compData[idx + 2];
            const curA = compData[idx + 3];

            if (Math.abs(curR - targetR) < 35 && Math.abs(curG - targetG) < 35 && Math.abs(curB - targetB) < 35 && Math.abs(curA - targetA) < 35) {
                layerData[idx] = fillRgba[0];
                layerData[idx + 1] = fillRgba[1];
                layerData[idx + 2] = fillRgba[2];
                layerData[idx + 3] = fillRgba[3];

                if (x + 1 < w) queue.push(x + 1, y);
                if (x - 1 >= 0) queue.push(x - 1, y);
                if (y + 1 < h) queue.push(x, y + 1);
                if (y - 1 >= 0) queue.push(x, y - 1);
            }
        }

        activeLayer.ctx.putImageData(layerImgData, 0, 0);
        this.renderComposite();

        function hexToRgba(hex, alpha) {
            let c = hex.replace('#', '');
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            const num = parseInt(c, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255, alpha];
        }
    }

    // Undo / Redo History Stack
    saveHistoryState() {
        const state = this.layers.map(l => ({
            name: l.name,
            visible: l.visible,
            opacity: l.opacity,
            data: l.ctx.getImageData(0, 0, this.width, this.height)
        }));

        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        if (this.history.length > 20) this.history.shift();
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.applyHistoryState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.applyHistoryState(this.history[this.historyIndex]);
        }
    }

    applyHistoryState(state) {
        if (!state) return;
        this.layers = state.map((s, idx) => {
            const canv = document.createElement('canvas');
            canv.width = this.width;
            canv.height = this.height;
            const cCtx = canv.getContext('2d');
            cCtx.putImageData(s.data, 0, 0);
            return {
                id: 'layer_hist_' + idx + '_' + Date.now(),
                name: s.name,
                canvas: canv,
                ctx: cCtx,
                visible: s.visible,
                opacity: s.opacity
            };
        });
        this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length - 1);
        this.renderComposite();
        this.renderLayersUI();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            this.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            this.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            this.openSaveAsDialog();
        } else if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            this.createNewCanvas();
        }
    }

    cleanup() {
        if (this.mainCanvas) {
            this.mainCanvas.removeEventListener('mousedown', this.boundMouseDown);
        }
        window.removeEventListener('mousemove', this.boundMouseMove);
        window.removeEventListener('mouseup', this.boundMouseUp);
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}

function hexToTransparentRgba(hex) {
    if (!hex || typeof hex !== 'string') return 'rgba(0,0,0,0)';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return 'rgba(0,0,0,0)';
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, 0)`;
}
