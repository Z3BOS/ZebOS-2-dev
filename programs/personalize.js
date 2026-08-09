// programs/personalize.js - ZebOS 2 Display Properties & Personalization Control Panel
import { getIcon } from '../icons.js';

export class PersonalizeApp {
    constructor(onCloseRequest, onApplyCallback, currentBg = '#008080') {
        this.onCloseRequest = onCloseRequest;
        this.onApplyCallback = onApplyCallback;

        this.selectedColor = currentBg || '#008080';
        this.selectedPattern = 'solid';
        this.activeTab = 'background'; // 'background', 'screensaver', 'appearance', 'settings'
        this.container = null;

        this.colorPresets = [
            { name: "Classic Teal", hex: "#008080" },
            { name: "Windows Blue", hex: "#000080" },
            { name: "Slate Gray", hex: "#1f2937" },
            { name: "Emerald Green", hex: "#064e3b" },
            { name: "Cyber Purple", hex: "#2d1b4e" },
            { name: "Matrix Black", hex: "#000000" }
        ];

        this.colorPalette = "32bit";
        this.resolution = "1024x768";
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = "100%";
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, Helvetica, sans-serif; font-size:12px; padding:8px; box-sizing:border-box; user-select:none; overflow:hidden;">
                
                <!-- Windows 95 Tab Bar -->
                <div style="display:flex; border-bottom:2px solid #ffffff; gap:2px; flex-shrink:0;">
                    <button class="p-tab-btn ${this.activeTab === 'background' ? 'active-tab-btn' : ''}" data-tab="background" style="padding:4px 10px; background:#c0c0c0; border:2px solid #ffffff; border-bottom:none; font-weight:${this.activeTab === 'background' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'background' ? '2' : '1'};">Background</button>
                    <button class="p-tab-btn ${this.activeTab === 'appearance' ? 'active-tab-btn' : ''}" data-tab="appearance" style="padding:4px 10px; background:#c0c0c0; border:2px solid #ffffff; border-bottom:none; font-weight:${this.activeTab === 'appearance' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'appearance' ? '2' : '1'};">Appearance</button>
                    <button class="p-tab-btn ${this.activeTab === 'settings' ? 'active-tab-btn' : ''}" data-tab="settings" style="padding:4px 10px; background:#c0c0c0; border:2px solid #ffffff; border-bottom:none; font-weight:${this.activeTab === 'settings' ? 'bold' : 'normal'}; cursor:pointer; margin-bottom:-2px; z-index:${this.activeTab === 'settings' ? '2' : '1'};">Settings</button>
                </div>

                <!-- Main Dialog Inner Panel Box -->
                <div style="flex-grow:1; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:12px; display:flex; flex-direction:column; gap:12px; overflow-y:auto;">
                    
                    <!-- Retro CRT Monitor Live Screen Preview Section -->
                    <div style="display:flex; justify-content:center; align-items:center; flex-shrink:0; padding:4px;">
                        <div style="position:relative; width:180px; height:140px; background:#e0e0e0; border:3px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; border-radius:6px; box-shadow:inset 1px 1px 4px rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; padding:8px 8px 14px 8px;">
                            
                            <!-- CRT Glass Bezel -->
                            <div id="crt-preview-screen" style="width:100%; height:100px; background:${this.selectedColor}; border:2px solid #444444; border-radius:3px; position:relative; overflow:hidden; transition:background 0.2s ease;">
                                <!-- Mini Desktop Icons & Window Mockup -->
                                <div style="position:absolute; top:6px; left:6px; width:10px; height:10px; background:#ffca28; border:1px solid #000;"></div>
                                <div style="position:absolute; top:20px; left:6px; width:10px; height:10px; background:#ffffff; border:1px solid #000;"></div>
                                <div style="position:absolute; top:12px; left:30px; width:80px; height:50px; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000; border-bottom-color:#000; box-shadow:1px 1px 4px rgba(0,0,0,0.6);">
                                    <div style="background:#000080; height:10px; color:#fff; font-size:7px; padding:1px 3px; font-weight:bold;">ZebOS 2</div>
                                    <div style="padding:4px; font-size:6px; color:#000;">Personalize Preview</div>
                                </div>
                            </div>

                            <!-- CRT Monitor Base Stand -->
                            <div style="width:40px; height:8px; background:#a0a0a0; border:1px solid #444444; margin-top:4px;"></div>
                        </div>
                    </div>

                    ${this.renderTabContent()}
                </div>

                <!-- Bottom Button Strip: OK | Cancel | Apply -->
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px; flex-shrink:0;">
                    <button id="p-btn-ok" style="padding:4px 18px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold;">OK</button>
                    <button id="p-btn-cancel" style="padding:4px 14px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Cancel</button>
                    <button id="p-btn-apply" style="padding:4px 14px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Apply</button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderTabContent() {
        if (this.activeTab === 'background') {
            return `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <!-- Color Palette Presets -->
                    <div style="border:1px solid #808080; padding:8px; background:#f5f5f5;">
                        <div style="font-weight:bold; color:#000080; margin-bottom:6px;">Desktop Color Presets</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${this.colorPresets.map(preset => `
                                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:11px;">
                                    <input type="radio" name="bg-color" value="${preset.hex}" ${this.selectedColor.toLowerCase() === preset.hex.toLowerCase() ? 'checked' : ''}>
                                    <span style="width:14px; height:14px; background:${preset.hex}; border:1px solid #000; display:inline-block;"></span>
                                    <span>${preset.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Custom Color Selector -->
                    <div style="border:1px solid #808080; padding:8px; background:#f5f5f5; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="font-weight:bold; color:#000080; margin-bottom:6px;">Custom Color Palette</div>
                            <div style="font-size:11px; color:#555; margin-bottom:8px;">Select custom hex wallpaper color:</div>
                            <input type="color" id="p-custom-color" value="${this.selectedColor}" style="width:100%; height:32px; cursor:pointer; border:1px solid #808080;">
                        </div>

                        <div style="margin-top:8px;">
                            <div style="font-weight:bold; color:#000080; font-size:11px; margin-bottom:4px;">Pattern Style</div>
                            <select id="p-pattern-select" style="width:100%; padding:3px; font-size:11px;">
                                <option value="solid" ${this.selectedPattern === 'solid' ? 'selected' : ''}>Solid Color</option>
                                <option value="gradient" ${this.selectedPattern === 'gradient' ? 'selected' : ''}>Blue Gradient</option>
                                <option value="grid" ${this.selectedPattern === 'grid' ? 'selected' : ''}>DOS Grid Pattern</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }

        if (this.activeTab === 'appearance') {
            return `
                <div style="border:1px solid #808080; padding:10px; background:#f5f5f5; display:flex; flex-direction:column; gap:10px;">
                    <div style="font-weight:bold; color:#000080;">Window Scheme Options</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div>
                            <div style="font-size:11px; margin-bottom:4px;">Color Scheme:</div>
                            <select style="width:100%; padding:4px; font-size:11px;">
                                <option selected>Windows Standard (Classic Gray)</option>
                                <option>High Contrast Dark</option>
                                <option>Rose Retro 95</option>
                                <option>Emerald Desktop</option>
                            </select>
                        </div>
                        <div>
                            <div style="font-size:11px; margin-bottom:4px;">Font Size:</div>
                            <select style="width:100%; padding:4px; font-size:11px;">
                                <option selected>Normal (9 pt)</option>
                                <option>Large (12 pt)</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }

        // Settings Tab
        return `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div style="border:1px solid #808080; padding:8px; background:#f5f5f5;">
                    <div style="font-weight:bold; color:#000080; margin-bottom:6px;">Color Palette</div>
                    <select id="p-color-depth" style="width:100%; padding:4px; font-size:11px;">
                        <option value="16">16 Color</option>
                        <option value="256">256 Color</option>
                        <option value="16bit">High Color (16 bit)</option>
                        <option value="32bit" selected>True Color (32 bit)</option>
                    </select>
                </div>
                <div style="border:1px solid #808080; padding:8px; background:#f5f5f5;">
                    <div style="font-weight:bold; color:#000080; margin-bottom:6px;">Desktop Area</div>
                    <div style="font-size:11px; color:#333; margin-bottom:6px;">Screen Resolution: 1024 by 768 pixels</div>
                    <input type="range" min="1" max="4" value="3" style="width:100%;">
                </div>
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
                this.updateCrtPreview();
            });
        });

        // Custom color input
        const customColorInput = this.container.querySelector('#p-custom-color');
        if (customColorInput) {
            customColorInput.addEventListener('input', () => {
                this.selectedColor = customColorInput.value;
                this.updateCrtPreview();
            });
        }

        // Pattern dropdown
        const patternSelect = this.container.querySelector('#p-pattern-select');
        if (patternSelect) {
            patternSelect.addEventListener('change', () => {
                this.selectedPattern = patternSelect.value;
                this.updateCrtPreview();
            });
        }

        // Buttons
        const applyBtn = this.container.querySelector('#p-btn-apply');
        const okBtn = this.container.querySelector('#p-btn-ok');
        const cancelBtn = this.container.querySelector('#p-btn-cancel');

        const doApply = () => {
            if (this.onApplyCallback) {
                this.onApplyCallback(this.selectedColor, this.selectedPattern);
            }
        };

        if (applyBtn) applyBtn.addEventListener('click', doApply);
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                doApply();
                this.onCloseRequest();
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.onCloseRequest());
        }
    }

    updateCrtPreview() {
        const crt = this.container.querySelector('#crt-preview-screen');
        if (crt) {
            crt.style.background = this.selectedColor;
        }
    }
}
