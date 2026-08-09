// programs/personalize.js - ZebOS 2 Alpha Display Properties Applet v2.5.0
// All settings actually apply to the live OS. No browser page reloads.

export class PersonalizeApp {
    constructor(onCloseRequest, onApplyCallback, currentBg, currentPattern, currentScheme, currentRoundedCorners) {
        this.onCloseRequest = onCloseRequest;
        this.onApplyCallback = onApplyCallback; // fn(settings) where settings = { color, pattern, scheme, fontSize, roundedCorners }

        // Load initial state from what's currently applied
        this.initialState = {
            color: currentBg || '#008080',
            pattern: currentPattern || 'solid',
            scheme: currentScheme || 'standard',
            fontSize: document.documentElement.style.getPropertyValue('--os-font-size') || '12',
            roundedCorners: currentRoundedCorners || false,
        };

        // Working state (changes before Apply)
        this.workingState = { ...this.initialState };

        this.activeTab = 'background';
        this.isDirty = false;
        this.container = null;

        this.colorPresets = [
            { name: "Classic Teal",    hex: "#008080" },
            { name: "ZebOS Blue",      hex: "#000080" },
            { name: "Slate Gray",      hex: "#1f2937" },
            { name: "Emerald Green",   hex: "#064e3b" },
            { name: "Cyber Purple",    hex: "#2d1b4e" },
            { name: "Matrix Black",    hex: "#111111" },
        ];

        this.schemes = {
            'standard':      { name: 'ZebOS Classic (Gray)',    titlebar: '#000080', titlebarbg: '#c0c0c0', wbg: '#c0c0c0' },
            'high-contrast': { name: 'High Contrast Dark',      titlebar: '#ffffff', titlebarbg: '#000000', wbg: '#1a1a1a' },
            'rose':          { name: 'Rose Retro',              titlebar: '#ffffff', titlebarbg: '#8b1a4a', wbg: '#c0c0c0' },
            'emerald':       { name: 'Emerald Desktop',         titlebar: '#ffffff', titlebarbg: '#064e3b', wbg: '#c0c0c0' },
            'midnight':      { name: 'Midnight Blue',           titlebar: '#ffffff', titlebarbg: '#1a237e', wbg: '#c0c0c0' },
        };
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = '100%';
        this.render();
    }

    // -----------------------------------------------------------------------
    // FULL RENDER — only called on tab switch or initial open
    // -----------------------------------------------------------------------
    render() {
        if (!this.container) return;
        const ws = this.workingState;

        this.container.innerHTML = `
<div id="p-root" style="display:flex;flex-direction:column;height:100%;background:#c0c0c0;font-family:Arial,Helvetica,sans-serif;font-size:11px;padding:6px;box-sizing:border-box;user-select:none;overflow:hidden;">

  <!-- Tab strip -->
  <div style="display:flex;border-bottom:2px solid #ffffff;gap:2px;flex-shrink:0;padding-left:4px;">
    ${['background','appearance','settings'].map(tab => `
      <button class="p-tab-btn" data-tab="${tab}" style="
        padding:4px 12px;background:#c0c0c0;
        border:2px solid #ffffff;
        border-right-color:${this.activeTab===tab?'#000000':'#808080'};
        border-bottom:none;
        font-weight:${this.activeTab===tab?'bold':'normal'};
        cursor:pointer;margin-bottom:-2px;
        z-index:${this.activeTab===tab?'2':'1'};outline:none;
        font-family:Arial,sans-serif;font-size:11px;">
        ${tab.charAt(0).toUpperCase()+tab.slice(1)}
      </button>`).join('')}
  </div>

  <!-- Main content box -->
  <div style="flex-grow:1;background:#c0c0c0;border:2px solid #ffffff;border-right-color:#808080;border-bottom-color:#808080;padding:10px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;overflow-y:auto;">

    ${this.renderPreview()}
    ${this.renderTabContent()}

  </div>

  <!-- Button bar -->
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;flex-shrink:0;">
    <button id="p-btn-ok"     style="padding:4px 18px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;cursor:pointer;font-weight:bold;font-size:11px;outline:none;">OK</button>
    <button id="p-btn-cancel" style="padding:4px 14px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;cursor:pointer;font-size:11px;outline:none;">Cancel</button>
    <button id="p-btn-apply" ${!ws._dirty?'disabled':''} style="
      padding:4px 14px;background:#c0c0c0;
      border:2px solid #fff;
      border-right-color:${this.isDirty?'#000':'#808080'};
      border-bottom-color:${this.isDirty?'#000':'#808080'};
      color:${this.isDirty?'#000':'#808080'};
      cursor:${this.isDirty?'pointer':'default'};
      font-size:11px;outline:none;
      text-shadow:${this.isDirty?'none':'1px 1px 0 #fff'};">Apply</button>
  </div>
</div>`;

        this.refreshApplyState();
        this.bindEvents();
    }

    // -----------------------------------------------------------------------
    // PREVIEW PANEL — CRT Monitor for bg/settings, Window Preview for appearance
    // -----------------------------------------------------------------------
    renderPreview() {
        if (this.activeTab === 'appearance') {
            const scheme = this.schemes[this.workingState.scheme] || this.schemes['standard'];
            return `
            <div id="p-preview-box" style="width:100%;height:130px;background:${this.workingState.color};border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;box-sizing:border-box;position:relative;overflow:hidden;flex-shrink:0;">
              <!-- Inactive window -->
              <div style="position:absolute;top:8px;left:10px;width:200px;height:80px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:2px 2px 6px rgba(0,0,0,.5);">
                <div id="p-scheme-inactive-bar" style="background:#808080;height:13px;color:#c0c0c0;font-size:8px;padding:1px 4px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;">
                  <span>Inactive Window</span><span>×</span>
                </div>
                <div style="padding:4px;font-size:8px;color:#000;">Normal text area</div>
              </div>
              <!-- Active window -->
              <div style="position:absolute;top:26px;left:32px;width:220px;height:88px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:3px 3px 8px rgba(0,0,0,.6);">
                <div id="p-scheme-active-bar" style="background:${scheme.titlebarbg};height:14px;color:${scheme.titlebar};font-size:8px;padding:1px 4px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;">
                  <span>Active Window</span><span>×</span>
                </div>
                <div style="padding:5px;font-size:8px;background:#c0c0c0;height:calc(100% - 14px);box-sizing:border-box;">
                  <div style="background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:3px;height:40px;box-sizing:border-box;font-size:7px;">Window Text</div>
                </div>
              </div>
              <!-- Message box -->
              <div style="position:absolute;top:50px;left:108px;width:140px;height:56px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:4px 4px 10px rgba(0,0,0,.7);z-index:5;">
                <div style="background:${scheme.titlebarbg};height:12px;color:${scheme.titlebar};font-size:7px;padding:1px 4px;font-weight:bold;">Message Box</div>
                <div style="padding:3px 5px;font-size:8px;color:#000;display:flex;flex-direction:column;align-items:center;gap:3px;">
                  <div>Message Text</div>
                  <div style="padding:1px 8px;background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;font-size:7px;font-weight:bold;">OK</div>
                </div>
              </div>
            </div>`;
        }

        // CRT Monitor Preview (background + settings tabs)
        return this.buildCrtHtml(this.workingState.color, this.workingState.pattern);
    }

    buildCrtHtml(color, pattern) {
        const screenBg = this.buildPatternCss(color, pattern);
        return `
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;margin-bottom:2px;">
          <!-- Monitor chassis -->
          <div style="width:230px;height:138px;background:#d4d0c8;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;border-radius:10px;padding:8px 8px 12px 8px;box-shadow:inset -1px -1px 0 #444,inset 1px 1px 0 #fff;display:flex;flex-direction:column;align-items:center;position:relative;box-sizing:border-box;">
            <!-- Screen bezel -->
            <div style="width:100%;height:106px;background:#222;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;border-radius:3px;padding:2px;box-sizing:border-box;">
              <!-- Live screen viewport -->
              <div id="crt-screen-viewport" style="width:100%;height:100%;${screenBg}position:relative;overflow:hidden;transition:all 0.15s;">
                <!-- Mini desktop icons -->
                <div style="position:absolute;top:4px;left:4px;display:flex;flex-direction:column;gap:4px;">
                  <div style="width:8px;height:8px;background:#ffca28;border:1px solid #000;"></div>
                  <div style="width:8px;height:8px;background:#fff;border:1px solid #000;"></div>
                </div>
                <!-- Mini window -->
                <div style="position:absolute;top:10px;left:26px;width:120px;height:66px;background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:2px 2px 5px rgba(0,0,0,.5);">
                  <div style="background:#000080;height:11px;color:#fff;font-size:7.5px;padding:1px 3px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;"><span>ZebOS 2</span><span>×</span></div>
                  <div style="padding:3px;font-size:7px;background:#c0c0c0;height:calc(100% - 11px);box-sizing:border-box;">
                    <div style="background:#fff;border:1px solid #808080;padding:2px;height:32px;box-sizing:border-box;font-size:6.5px;color:#333;">Live Preview</div>
                  </div>
                </div>
                <!-- Mini taskbar -->
                <div style="position:absolute;bottom:0;left:0;width:100%;height:10px;background:#c0c0c0;border-top:1px solid #fff;display:flex;align-items:center;padding:0 2px;">
                  <div style="width:22px;height:6px;background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;font-size:5px;font-weight:bold;line-height:6px;text-align:center;color:#000;">Start</div>
                </div>
              </div>
            </div>
            <!-- Power LED -->
            <div style="position:absolute;bottom:3px;right:14px;display:flex;align-items:center;gap:4px;">
              <div style="width:5px;height:5px;border-radius:50%;background:#00ff00;box-shadow:0 0 4px #0f0;"></div>
              <div style="width:10px;height:4px;background:#808080;border:1px solid #444;"></div>
            </div>
          </div>
          <!-- Stand base -->
          <div style="width:66px;height:10px;background:#b0b0b0;border:2px solid #808080;border-top:none;border-radius:0 0 4px 4px;box-shadow:0 2px 4px rgba(0,0,0,.3);"></div>
        </div>`;
    }

    buildPatternCss(color, pattern) {
        if (pattern === 'gradient') {
            return `background:linear-gradient(135deg,${color} 0%,#000080 100%);`;
        }
        if (pattern === 'grid') {
            return `background-color:${color};background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.15) 0px,rgba(0,0,0,.15) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(90deg,rgba(0,0,0,.15) 0px,rgba(0,0,0,.15) 1px,transparent 1px,transparent 12px);`;
        }
        if (pattern === 'diamonds') {
            return `background-color:${color};background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.08) 0px,rgba(255,255,255,.08) 6px,transparent 6px,transparent 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.08) 0px,rgba(255,255,255,.08) 6px,transparent 6px,transparent 12px);`;
        }
        if (pattern === 'dots') {
            return `background-color:${color};background-image:radial-gradient(rgba(255,255,255,.18) 1px,transparent 1px);background-size:10px 10px;`;
        }
        return `background:${color};`;
    }

    // -----------------------------------------------------------------------
    // TAB CONTENT
    // -----------------------------------------------------------------------
    renderTabContent() {
        const ws = this.workingState;

        if (this.activeTab === 'background') {
            return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Wallpaper Presets</legend>
                <div style="display:flex;flex-direction:column;gap:5px;margin-top:2px;">
                  ${this.colorPresets.map(p=>`
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:#000;">
                    <input type="radio" name="bg-color" value="${p.hex}" ${ws.color.toLowerCase()===p.hex.toLowerCase()?'checked':''} style="margin:0;cursor:pointer;">
                    <span style="width:14px;height:14px;background:${p.hex};border:1px solid #000;display:inline-block;flex-shrink:0;"></span>
                    <span>${p.name}</span>
                  </label>`).join('')}
                </div>
              </fieldset>

              <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Custom Color</legend>
                <div>
                  <div style="font-size:11px;color:#000;margin-bottom:5px;">Hex color:</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <input type="color" id="p-custom-color" value="${ws.color}" style="width:38px;height:22px;cursor:pointer;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:0;outline:none;">
                    <input type="text" id="p-custom-hex-text" value="${ws.color}" maxlength="7" spellcheck="false" style="width:70px;padding:2px 4px;font-size:11px;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;background:#fff;outline:none;font-family:monospace;">
                  </div>
                </div>
                <div>
                  <div style="font-weight:bold;color:#000080;font-size:11px;margin-bottom:4px;">Display Pattern</div>
                  <select id="p-pattern-select" style="width:100%;padding:3px 4px;font-size:11px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;outline:none;font-family:Arial,sans-serif;">
                    <option value="solid"    ${ws.pattern==='solid'?'selected':''}>Solid Color</option>
                    <option value="gradient" ${ws.pattern==='gradient'?'selected':''}>Gradient (Teal→Blue)</option>
                    <option value="grid"     ${ws.pattern==='grid'?'selected':''}>DOS Grid Pattern</option>
                    <option value="diamonds" ${ws.pattern==='diamonds'?'selected':''}>Diamond Pattern</option>
                    <option value="dots"     ${ws.pattern==='dots'?'selected':''}>Dot Matrix</option>
                  </select>
                </div>
              </fieldset>
            </div>`;
        }

        if (this.activeTab === 'appearance') {
            return `
            <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
              <legend style="color:#000080;font-weight:bold;padding:0 4px;">ZebOS Scheme Options</legend>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;">
                <div>
                  <div style="font-size:11px;margin-bottom:4px;font-weight:bold;color:#000;">Color Scheme:</div>
                  <select id="p-scheme-select" style="width:100%;padding:3px 5px;font-size:11px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;outline:none;font-family:Arial,sans-serif;">
                    ${Object.entries(this.schemes).map(([k,v])=>`
                    <option value="${k}" ${ws.scheme===k?'selected':''}>${v.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <div style="font-size:11px;margin-bottom:4px;font-weight:bold;color:#000;">UI Font Size:</div>
                  <select id="p-font-size-select" style="width:100%;padding:3px 5px;font-size:11px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;outline:none;font-family:Arial,sans-serif;">
                    <option value="11" ${ws.fontSize==='11'?'selected':''}>Small (11px)</option>
                    <option value="12" ${ws.fontSize==='12'||!ws.fontSize?'selected':''}>Normal (12px)</option>
                    <option value="14" ${ws.fontSize==='14'?'selected':''}>Large (14px)</option>
                    <option value="16" ${ws.fontSize==='16'?'selected':''}>Extra Large (16px)</option>
                  </select>
                </div>
              </div>
            </fieldset>`;
        }

        // Settings tab
        return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
            <legend style="color:#000080;font-weight:bold;padding:0 4px;">Visual Style</legend>
            <div style="margin-top:4px;display:flex;flex-direction:column;gap:8px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:#000;">
                <input type="checkbox" id="p-rounded-corners" ${ws.roundedCorners?'checked':''} style="cursor:pointer;">
                <span>Rounded Window Corners</span>
              </label>
              <div style="font-size:10px;color:#555;padding-left:18px;">Applies a subtle border-radius to all windows and menus.</div>
            </div>
          </fieldset>
          <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
            <legend style="color:#000080;font-weight:bold;padding:0 4px;">Display Info</legend>
            <div style="font-size:11px;color:#000;margin-top:4px;display:flex;flex-direction:column;gap:4px;">
              <div>Resolution: <strong>${window.innerWidth} × ${window.innerHeight}</strong></div>
              <div>Color Depth: <strong>True Color (32 bit)</strong></div>
              <div>Refresh: <strong>60 Hz</strong></div>
            </div>
          </fieldset>
        </div>`;
    }

    // -----------------------------------------------------------------------
    // BIND EVENTS — no re-render, direct DOM manipulation
    // -----------------------------------------------------------------------
    bindEvents() {
        // Tab switching (this DOES re-render since HTML structure changes)
        this.container.querySelectorAll('.p-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
            });
        });

        // --- Background tab ---
        this.container.querySelectorAll('input[name="bg-color"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.workingState.color = radio.value;
                this._syncColorInputs(radio.value);
                this.updateCrtPreview();
                this.markDirty();
            });
        });

        const colorPicker = this.container.querySelector('#p-custom-color');
        const hexText = this.container.querySelector('#p-custom-hex-text');

        if (colorPicker) {
            colorPicker.addEventListener('input', () => {
                this.workingState.color = colorPicker.value;
                if (hexText) hexText.value = colorPicker.value;
                this.updateCrtPreview();
                this.markDirty();
            });
        }
        if (hexText) {
            hexText.addEventListener('input', () => {
                const val = hexText.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    this.workingState.color = val;
                    if (colorPicker) colorPicker.value = val;
                    this.updateCrtPreview();
                    this.markDirty();
                }
            });
        }

        const patternSelect = this.container.querySelector('#p-pattern-select');
        if (patternSelect) {
            patternSelect.addEventListener('change', () => {
                this.workingState.pattern = patternSelect.value;
                this.updateCrtPreview();
                this.markDirty();
            });
        }

        // --- Appearance tab ---
        const schemeSelect = this.container.querySelector('#p-scheme-select');
        if (schemeSelect) {
            schemeSelect.addEventListener('change', () => {
                this.workingState.scheme = schemeSelect.value;
                this.updateAppearancePreview();
                this.markDirty();
            });
        }

        const fontSizeSelect = this.container.querySelector('#p-font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', () => {
                this.workingState.fontSize = fontSizeSelect.value;
                this.markDirty();
            });
        }

        // --- Settings tab ---
        const roundedCornersChk = this.container.querySelector('#p-rounded-corners');
        if (roundedCornersChk) {
            roundedCornersChk.addEventListener('change', () => {
                this.workingState.roundedCorners = roundedCornersChk.checked;
                this.markDirty();
            });
        }

        // --- Buttons ---
        const applyBtn = this.container.querySelector('#p-btn-apply');
        const okBtn    = this.container.querySelector('#p-btn-ok');
        const cancelBtn= this.container.querySelector('#p-btn-cancel');

        if (applyBtn) applyBtn.addEventListener('click', () => this.doApply());
        if (okBtn)    okBtn.addEventListener('click',    () => { this.doApply(); this.onCloseRequest(); });
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            // Revert live OS to initial state
            if (this.isDirty && this.onApplyCallback) {
                this.onApplyCallback({ ...this.initialState });
            }
            this.onCloseRequest();
        });
    }

    // -----------------------------------------------------------------------
    // LIVE PREVIEW UPDATERS (no re-render — direct DOM manipulation)
    // -----------------------------------------------------------------------
    updateCrtPreview() {
        const viewport = this.container.querySelector('#crt-screen-viewport');
        if (!viewport) return;
        const css = this.buildPatternCss(this.workingState.color, this.workingState.pattern);
        // Parse css string into background/background-image/background-color properties
        viewport.removeAttribute('style');
        viewport.style.cssText = `width:100%;height:100%;position:relative;overflow:hidden;transition:all 0.15s;${css}`;
    }

    updateAppearancePreview() {
        const scheme = this.schemes[this.workingState.scheme] || this.schemes['standard'];
        const activeBar  = this.container.querySelector('#p-scheme-active-bar');
        const inactiveBar= this.container.querySelector('#p-scheme-inactive-bar');
        if (activeBar) {
            activeBar.style.background = scheme.titlebarbg;
            activeBar.style.color      = scheme.titlebar;
        }
        if (inactiveBar) {
            // Inactive bar stays gray, but update desktop preview bg
        }
        const previewBox = this.container.querySelector('#p-preview-box');
        if (previewBox) previewBox.style.background = this.workingState.color;
    }

    _syncColorInputs(hex) {
        const cp = this.container.querySelector('#p-custom-color');
        const ht = this.container.querySelector('#p-custom-hex-text');
        if (cp) cp.value = hex;
        if (ht) ht.value = hex;
    }

    // -----------------------------------------------------------------------
    // APPLY / DIRTY STATE
    // -----------------------------------------------------------------------
    doApply() {
        if (!this.isDirty) return;
        if (this.onApplyCallback) {
            this.onApplyCallback({ ...this.workingState });
        }
        // Update initial state to current
        this.initialState = { ...this.workingState };
        this.markClean();
    }

    markDirty() {
        this.isDirty = true;
        this.refreshApplyState();
    }

    markClean() {
        this.isDirty = false;
        this.refreshApplyState();
    }

    refreshApplyState() {
        const applyBtn = this.container && this.container.querySelector('#p-btn-apply');
        if (!applyBtn) return;
        if (this.isDirty) {
            applyBtn.disabled = false;
            applyBtn.style.color = '#000000';
            applyBtn.style.borderRightColor  = '#000000';
            applyBtn.style.borderBottomColor = '#000000';
            applyBtn.style.cursor = 'pointer';
            applyBtn.style.textShadow = 'none';
        } else {
            applyBtn.disabled = true;
            applyBtn.style.color = '#808080';
            applyBtn.style.borderRightColor  = '#808080';
            applyBtn.style.borderBottomColor = '#808080';
            applyBtn.style.cursor = 'default';
            applyBtn.style.textShadow = '1px 1px 0 #ffffff';
        }
    }
}
