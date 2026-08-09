// programs/personalize.js - ZebOS 2 Authentic Windows 95 Display Properties Applet Engine
import { getIcon } from '../icons.js';

export class PersonalizeApp {
    constructor(onCloseRequest, onApplyCallback, currentBg = '#008080') {
        this.onCloseRequest = onCloseRequest;
        this.onApplyCallback = onApplyCallback;

        this.initialColor = currentBg || '#008080';
        this.selectedColor = this.initialColor;
        this.selectedPattern = 'solid';
        this.selectedScheme = 'standard';
        this.selectedResolution = '1024x768';
        this.colorDepth = '32bit';
        this.activeTab = 'background'; // 'background', 'appearance', 'settings'
        
        this.isDirty = false;
        this.container = null;

        this.colorPresets = [
            { name: "Classic Teal", hex: "#008080" },
            { name: "Windows Blue", hex: "#000080" },
            { name: "Slate Gray", hex: "#1f2937" },
            { name: "Emerald Green", hex: "#064e3b" },
            { name: "Cyber Purple", hex: "#2d1b4e" },
            { name: "Matrix Black", hex: "#000000" }
        ];
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = "100%";
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, Helvetica, sans-serif; font-size:11px; padding:6px; box-sizing:border-box; user-select:none; overflow:hidden;">
                
                <!-- Authentic Windows 95 Tab Bar -->
                <div style="display:flex; border-bottom:2px solid #ffffff; gap:2px; flex-shrink:0; padding-left:4px;">
                    <button class="p-tab-btn ${this.activeTab === 'background' ? 'active-tab-btn' : ''}" data-tab="background" style="padding:4px 12px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:${this.activeTab === 'background' ? '#000000' : '#808080'}; border-bottom:none; font-weight:${this.activeTab === 'background' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'background' ? '2' : '1'}; outline:none;">Background</button>
                    <button class="p-tab-btn ${this.activeTab === 'appearance' ? 'active-tab-btn' : ''}" data-tab="appearance" style="padding:4px 12px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:${this.activeTab === 'appearance' ? '#000000' : '#808080'}; border-bottom:none; font-weight:${this.activeTab === 'appearance' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'appearance' ? '2' : '1'}; outline:none;">Appearance</button>
                    <button class="p-tab-btn ${this.activeTab === 'settings' ? 'active-tab-btn' : ''}" data-tab="settings" style="padding:4px 12px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:${this.activeTab === 'settings' ? '#000000' : '#808080'}; border-bottom:none; font-weight:${this.activeTab === 'settings' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'settings' ? '2' : '1'}; outline:none;">Settings</button>
                </div>

                <!-- Main Dialog 3D Inset Panel Box -->
                <div style="flex-grow:1; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:10px; display:flex; flex-direction:column; gap:10px; box-sizing:border-box; overflow-y:auto;">
                    
                    ${this.renderTopPreview()}

                    ${this.renderTabContent()}
                </div>

                <!-- Windows 95 Buttons: OK | Cancel | Apply -->
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; flex-shrink:0;">
                    <button id="p-btn-ok" style="padding:4px 18px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold; font-size:11px; outline:none;">OK</button>
                    <button id="p-btn-cancel" style="padding:4px 14px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-size:11px; outline:none;">Cancel</button>
                    <button id="p-btn-apply" ${this.isDirty ? '' : 'disabled'} style="padding:4px 14px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:${this.isDirty ? '#000000' : '#808080'}; border-bottom-color:${this.isDirty ? '#000000' : '#808080'}; color:${this.isDirty ? '#000000' : '#808080'}; cursor:${this.isDirty ? 'pointer' : 'default'}; font-size:11px; outline:none; text-shadow:${this.isDirty ? 'none' : '1px 1px 0px #ffffff'};">Apply</button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderTopPreview() {
        if (this.activeTab === 'appearance') {
            // Windows 95 Appearance Scheme Live Window Preview Box (Screenshot 4)
            return `
                <div style="width:100%; height:140px; background:${this.selectedColor}; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; box-sizing:border-box; position:relative; overflow:hidden; margin-bottom:4px; flex-shrink:0;">
                    
                    <!-- Inactive Window Frame -->
                    <div style="position:absolute; top:8px; left:12px; width:220px; height:90px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; box-shadow:2px 2px 6px rgba(0,0,0,0.5);">
                        <div style="background:#808080; height:14px; color:#c0c0c0; font-size:9px; padding:1px 4px; font-weight:bold; display:flex; align-items:center; justify-content:space-between;">
                            <span>Inactive Window</span>
                            <span style="font-size:8px;">×</span>
                        </div>
                        <div style="padding:4px; font-size:9px; color:#000;">Normal text area</div>
                    </div>

                    <!-- Active Window Frame -->
                    <div style="position:absolute; top:28px; left:36px; width:240px; height:96px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; box-shadow:3px 3px 8px rgba(0,0,0,0.6);">
                        <div style="background:#000080; height:15px; color:#ffffff; font-size:9px; padding:1px 4px; font-weight:bold; display:flex; align-items:center; justify-content:space-between;">
                            <span>Active Window</span>
                            <span style="font-size:8px;">×</span>
                        </div>
                        <div style="padding:6px; font-size:9px; color:#000; background:#c0c0c0;">
                            <div style="background:#ffffff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:4px; height:45px; box-sizing:border-box; font-size:9px;">
                                Window Text Content Area
                            </div>
                        </div>
                    </div>

                    <!-- Floating Message Box -->
                    <div style="position:absolute; top:55px; left:120px; width:150px; height:60px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; box-shadow:4px 4px 10px rgba(0,0,0,0.7); z-index:5;">
                        <div style="background:#000080; height:13px; color:#ffffff; font-size:8px; padding:1px 4px; font-weight:bold;">Message Box</div>
                        <div style="padding:4px 6px; font-size:8.5px; color:#000; display:flex; flex-direction:column; align-items:center; gap:4px;">
                            <div>Message Text</div>
                            <div style="padding:1px 10px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; font-size:8px; font-weight:bold; cursor:pointer;">OK</div>
                        </div>
                    </div>

                </div>
            `;
        }

        // Standard Background / Settings Tab Retro CRT Monitor Live Preview Box (Screenshot 2 & 3)
        return `
            <div style="display:flex; flex-direction:column; align-items:center; flex-shrink:0; margin-bottom:4px;">
                <!-- CRT Chassis Outer Frame -->
                <div style="width:230px; height:140px; background:#d4d0c8; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; border-radius:10px; padding:8px 8px 12px 8px; box-shadow:inset -1px -1px 0px #444444, inset 1px 1px 0px #ffffff; display:flex; flex-direction:column; align-items:center; position:relative; box-sizing:border-box;">
                    
                    <!-- Inner Screen Bezel -->
                    <div style="width:100%; height:108px; background:#222222; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; border-radius:3px; padding:2px; box-sizing:border-box; position:relative;">
                        
                        <!-- CRT Screen Viewport (Live Wallpaper Color & Windows Preview) -->
                        <div id="crt-screen-viewport" style="width:100%; height:100%; background:${this.selectedColor}; position:relative; overflow:hidden; transition:background 0.15s ease-in-out;">
                            
                            <!-- Mini Desktop Icons (Left Column) -->
                            <div style="position:absolute; top:4px; left:4px; display:flex; flex-direction:column; gap:4px;">
                                <div style="width:8px; height:8px; background:#ffca28; border:1px solid #000;"></div>
                                <div style="width:8px; height:8px; background:#ffffff; border:1px solid #000;"></div>
                            </div>

                            <!-- Mini Floating Windows 95 Window Frame (Center) -->
                            <div style="position:absolute; top:12px; left:30px; width:125px; height:70px; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000; border-bottom-color:#000; box-shadow:2px 2px 6px rgba(0,0,0,0.5);">
                                <div style="background:#000080; height:12px; color:#ffffff; font-size:8px; padding:1px 4px; font-weight:bold; display:flex; align-items:center; justify-content:space-between;">
                                    <span>ZebOS 2</span>
                                    <span style="font-size:7px;">×</span>
                                </div>
                                <div style="padding:4px; font-size:7.5px; color:#000000; background:#c0c0c0; height:calc(100% - 12px); box-sizing:border-box;">
                                    <div style="background:#ffffff; border:1px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:3px; height:36px; box-sizing:border-box; font-size:7px; color:#333;">
                                        Live Desktop Display Preview
                                    </div>
                                </div>
                            </div>

                            <!-- Mini Taskbar (Bottom) -->
                            <div style="position:absolute; bottom:0; left:0; width:100%; height:11px; background:#c0c0c0; border-top:1px solid #ffffff; display:flex; align-items:center; padding:0 2px;">
                                <div style="width:24px; height:7px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; font-size:5.5px; font-weight:bold; line-height:7px; text-align:center; color:#000;">Start</div>
                            </div>

                        </div>
                    </div>

                    <!-- Power Button & LED -->
                    <div style="position:absolute; bottom:3px; right:14px; display:flex; align-items:center; gap:4px;">
                        <div style="width:5px; height:5px; border-radius:50%; background:#00ff00; box-shadow:0 0 4px #00ff00;"></div>
                        <div style="width:10px; height:4px; background:#808080; border:1px solid #444;"></div>
                    </div>
                </div>

                <!-- Monitor Stand Base -->
                <div style="width:68px; height:10px; background:#b0b0b0; border:2px solid #808080; border-top:none; border-radius:0 0 4px 4px; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
            </div>
        `;
    }

    renderTabContent() {
        if (this.activeTab === 'background') {
            return `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <!-- Color Palette Presets Group Box (Gray background, NO pure white) -->
                    <fieldset style="border:2px solid #ffffff; border-left-color:#808080; border-top-color:#808080; padding:8px 10px; margin:0; background:#c0c0c0; box-sizing:border-box;">
                        <legend style="color:#000080; font-weight:bold; padding:0 4px;">Wallpaper Presets</legend>
                        <div style="display:flex; flex-direction:column; gap:5px; margin-top:2px;">
                            ${this.colorPresets.map(preset => `
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:11px; color:#000;">
                                    <input type="radio" name="bg-color" value="${preset.hex}" ${this.selectedColor.toLowerCase() === preset.hex.toLowerCase() ? 'checked' : ''} style="margin:0; cursor:pointer;">
                                    <span style="width:14px; height:14px; background:${preset.hex}; border:1px solid #000; display:inline-block; flex-shrink:0;"></span>
                                    <span>${preset.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </fieldset>

                    <!-- Custom Color Selector Group Box (Gray background, NO pure white) -->
                    <fieldset style="border:2px solid #ffffff; border-left-color:#808080; border-top-color:#808080; padding:8px 10px; margin:0; background:#c0c0c0; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
                        <legend style="color:#000080; font-weight:bold; padding:0 4px;">Custom Color Palette</legend>
                        <div>
                            <div style="font-size:11px; color:#000; margin-bottom:6px;">Custom hex color:</div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <input type="color" id="p-custom-color" value="${this.selectedColor}" style="width:40px; height:24px; cursor:pointer; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; background:#fff; padding:0; outline:none;">
                                <input type="text" id="p-custom-hex-text" value="${this.selectedColor}" spellcheck="false" style="width:75px; padding:3px 5px; font-size:11px; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; background:#fff; outline:none; font-family:Arial, sans-serif;">
                            </div>
                        </div>

                        <div style="margin-top:10px;">
                            <div style="font-weight:bold; color:#000080; font-size:11px; margin-bottom:4px;">Display Pattern</div>
                            <select id="p-pattern-select" style="width:100%; padding:3px 4px; font-size:11px; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; outline:none; font-family:Arial, sans-serif;">
                                <option value="solid" ${this.selectedPattern === 'solid' ? 'selected' : ''}>Solid Color</option>
                                <option value="gradient" ${this.selectedPattern === 'gradient' ? 'selected' : ''}>Blue Gradient</option>
                                <option value="grid" ${this.selectedPattern === 'grid' ? 'selected' : ''}>DOS Grid Pattern</option>
                            </select>
                        </div>
                    </fieldset>
                </div>
            `;
        }

        if (this.activeTab === 'appearance') {
            return `
                <fieldset style="border:2px solid #ffffff; border-left-color:#808080; border-top-color:#808080; padding:10px; margin:0; background:#c0c0c0; box-sizing:border-box;">
                    <legend style="color:#000080; font-weight:bold; padding:0 4px;">Window Scheme Options</legend>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px;">
                        <div>
                            <div style="font-size:11px; margin-bottom:4px; font-weight:bold; color:#000;">Color Scheme:</div>
                            <select id="p-scheme-select" style="width:100%; padding:3px 5px; font-size:11px; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; outline:none; font-family:Arial, sans-serif;">
                                <option value="standard" ${this.selectedScheme === 'standard' ? 'selected' : ''}>Windows Standard (Classic Gray)</option>
                                <option value="high-contrast" ${this.selectedScheme === 'high-contrast' ? 'selected' : ''}>High Contrast Dark</option>
                                <option value="rose" ${this.selectedScheme === 'rose' ? 'selected' : ''}>Rose Retro 95</option>
                                <option value="emerald" ${this.selectedScheme === 'emerald' ? 'selected' : ''}>Emerald Desktop</option>
                            </select>
                        </div>
                        <div>
                            <div style="font-size:11px; margin-bottom:4px; font-weight:bold; color:#000;">Font Size:</div>
                            <select style="width:100%; padding:3px 5px; font-size:11px; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; outline:none; font-family:Arial, sans-serif;">
                                <option selected>Normal (9 pt)</option>
                                <option>Large (12 pt)</option>
                            </select>
                        </div>
                    </div>
                </fieldset>
            `;
        }

        // Settings Tab
        return `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <fieldset style="border:2px solid #ffffff; border-left-color:#808080; border-top-color:#808080; padding:8px 10px; margin:0; background:#c0c0c0; box-sizing:border-box;">
                    <legend style="color:#000080; font-weight:bold; padding:0 4px;">Color Palette</legend>
                    <select id="p-color-depth" style="width:100%; padding:3px 5px; font-size:11px; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; outline:none; margin-top:4px; font-family:Arial, sans-serif;">
                        <option value="16">16 Color</option>
                        <option value="256">256 Color</option>
                        <option value="16bit">High Color (16 bit)</option>
                        <option value="32bit" selected>True Color (32 bit)</option>
                    </select>
                </fieldset>
                
                <fieldset style="border:2px solid #ffffff; border-left-color:#808080; border-top-color:#808080; padding:8px 10px; margin:0; background:#c0c0c0; box-sizing:border-box;">
                    <legend style="color:#000080; font-weight:bold; padding:0 4px;">Desktop Area</legend>
                    <div style="font-size:11px; color:#000; margin-bottom:6px; margin-top:4px;">Screen Resolution: <strong id="p-res-label">1024 by 768</strong> pixels</div>
                    <input type="range" id="p-res-slider" min="1" max="4" value="3" style="width:100%; cursor:pointer;">
                </fieldset>
            </div>
        `;
    }

    bindEvents() {
        // Tab switching
        this.container.querySelectorAll('.p-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
            });
        });

        // Background color radio options
        this.container.querySelectorAll('input[name="bg-color"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.selectedColor = radio.value;
                const hexText = this.container.querySelector('#p-custom-hex-text');
                const customInput = this.container.querySelector('#p-custom-color');
                if (hexText) hexText.value = radio.value;
                if (customInput) customInput.value = radio.value;

                this.updateCrtPreview();
                this.markDirty();
            });
        });

        // Custom color input & text input
        const customColorInput = this.container.querySelector('#p-custom-color');
        const customHexText = this.container.querySelector('#p-custom-hex-text');

        if (customColorInput) {
            customColorInput.addEventListener('input', () => {
                this.selectedColor = customColorInput.value;
                if (customHexText) customHexText.value = customColorInput.value;
                this.updateCrtPreview();
                this.markDirty();
            });
        }
        if (customHexText) {
            customHexText.addEventListener('input', () => {
                const val = customHexText.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    this.selectedColor = val;
                    if (customColorInput) customColorInput.value = val;
                    this.updateCrtPreview();
                    this.markDirty();
                }
            });
        }

        // Pattern dropdown
        const patternSelect = this.container.querySelector('#p-pattern-select');
        if (patternSelect) {
            patternSelect.addEventListener('change', () => {
                this.selectedPattern = patternSelect.value;
                this.updateCrtPreview();
                this.markDirty();
            });
        }

        // Scheme select
        const schemeSelect = this.container.querySelector('#p-scheme-select');
        if (schemeSelect) {
            schemeSelect.addEventListener('change', () => {
                this.selectedScheme = schemeSelect.value;
                this.markDirty();
            });
        }

        // Resolution Slider
        const resSlider = this.container.querySelector('#p-res-slider');
        const resLabel = this.container.querySelector('#p-res-label');
        if (resSlider) {
            const resolutions = ['640 by 480', '800 by 600', '1024 by 768', '1920 by 1080'];
            resSlider.addEventListener('input', () => {
                const idx = parseInt(resSlider.value) - 1;
                if (resLabel) resLabel.textContent = resolutions[idx] || '1024 by 768';
                this.markDirty();
            });
        }

        // Buttons: Apply | OK | Cancel
        const applyBtn = this.container.querySelector('#p-btn-apply');
        const okBtn = this.container.querySelector('#p-btn-ok');
        const cancelBtn = this.container.querySelector('#p-btn-cancel');

        const doApply = () => {
            if (!this.isDirty) return;
            if (this.onApplyCallback) {
                this.onApplyCallback(this.selectedColor, this.selectedPattern);
            }
            this.markClean();
        };

        if (applyBtn) {
            applyBtn.addEventListener('click', doApply);
            if (this.isDirty) {
                applyBtn.disabled = false;
                applyBtn.style.opacity = '1';
                applyBtn.style.cursor = 'pointer';
                applyBtn.style.color = '#000000';
                applyBtn.style.borderColor = '#ffffff';
                applyBtn.style.borderRightColor = '#000000';
                applyBtn.style.borderBottomColor = '#000000';
                applyBtn.style.textShadow = 'none';
            }
        }

        if (okBtn) {
            okBtn.addEventListener('click', () => {
                if (this.isDirty && this.onApplyCallback) {
                    this.onApplyCallback(this.selectedColor, this.selectedPattern);
                }
                this.onCloseRequest();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.isDirty && this.onApplyCallback) {
                    // Revert desktop background back to initial color on cancel
                    this.onApplyCallback(this.initialColor, 'solid');
                }
                this.onCloseRequest();
            });
        }
    }

    markDirty() {
        this.isDirty = true;
        const applyBtn = this.container.querySelector('#p-btn-apply');
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.style.opacity = '1';
            applyBtn.style.cursor = 'pointer';
            applyBtn.style.color = '#000000';
            applyBtn.style.borderColor = '#ffffff';
            applyBtn.style.borderRightColor = '#000000';
            applyBtn.style.borderBottomColor = '#000000';
            applyBtn.style.textShadow = 'none';
        }
    }

    markClean() {
        this.isDirty = false;
        const applyBtn = this.container.querySelector('#p-btn-apply');
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.style.opacity = '0.65';
            applyBtn.style.cursor = 'default';
            applyBtn.style.color = '#808080';
            applyBtn.style.borderColor = '#ffffff';
            applyBtn.style.borderRightColor = '#808080';
            applyBtn.style.borderBottomColor = '#808080';
            applyBtn.style.textShadow = '1px 1px 0px #ffffff';
        }
    }

    updateCrtPreview() {
        const crtScreen = this.container.querySelector('#crt-screen-viewport');
        if (crtScreen) {
            crtScreen.style.background = this.selectedColor;
        }
    }
}
