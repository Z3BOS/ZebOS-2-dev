// programs/personalize.js - ZebOS 2 Alpha Display Properties Applet v2.5.1
// All settings actually apply to the live OS. No browser page reloads.

const W95_CHECKMARK_SVG = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="display:block;margin:0;padding:0;"><path d="M1.5 4.5L3.5 6.5L7.5 1.5" stroke="#000000" stroke-width="1.8" stroke-linecap="square"/></svg>`;

export class PersonalizeApp {
    constructor(onCloseRequest, onApplyCallback, currentBg, currentPattern, currentScheme, currentSoundScheme, currentRoundedCorners) {
        this.onCloseRequest = onCloseRequest;
        this.onApplyCallback = onApplyCallback;

        this.initialState = {
            color:          currentBg            || '#008080',
            pattern:        currentPattern       || 'solid',
            scheme:         currentScheme        || 'standard',
            soundScheme:    currentSoundScheme   || 'classic',
            roundedCorners: currentRoundedCorners || false,
        };

        this.workingState    = { ...this.initialState };
        this.activeTab       = 'background';
        this.isDirty         = false;
        this.container       = null;
        this._openDropdown   = null;

        this.colorPresets = [
            { name: 'Classic Teal',   hex: '#008080' },
            { name: 'ZebOS Blue',     hex: '#000080' },
            { name: 'Slate Gray',     hex: '#1f2937' },
            { name: 'Emerald Green',  hex: '#064e3b' },
            { name: 'Cyber Purple',   hex: '#2d1b4e' },
            { name: 'Matrix Black',   hex: '#111111' },
        ];

        this.schemes = {
            'standard':      { name: 'ZebOS Classic (Gray)',  titlebarBg: '#000080', titlebarFg: '#ffffff' },
            'high-contrast': { name: 'High Contrast Dark',    titlebarBg: '#000000', titlebarFg: '#ffffff' },
            'rose':          { name: 'Rose Retro',            titlebarBg: '#8b1a4a', titlebarFg: '#ffffff' },
            'emerald':       { name: 'Emerald Desktop',       titlebarBg: '#064e3b', titlebarFg: '#ffffff' },
            'midnight':      { name: 'Midnight Blue',         titlebarBg: '#1a237e', titlebarFg: '#ffffff' },
        };

        this.soundSchemes = [
            { value: 'classic', label: 'Classic ZebOS Synthesizer' },
            { value: 'muted',   label: 'Muted (No Audio)' },
        ];
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = '100%';
        this.render();
    }

    _btnStyle(extra = '') {
        return `background:#c0c0c0;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;padding:3px 10px;cursor:pointer;font-family:Arial,sans-serif;font-size:11px;outline:none;${extra}`;
    }

    _sunkenBorder() {
        return 'border:2px solid #808080;border-right-color:#ffffff;border-bottom-color:#ffffff;';
    }

    _checkboxHtml(id, checked, label) {
        const mark = checked ? W95_CHECKMARK_SVG : '';
        return `
        <label for="${id}" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:#000;user-select:none;">
          <span id="${id}-wrap" data-checked="${checked?'1':'0'}" style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;flex-shrink:0;background:#ffffff;${this._sunkenBorder()}cursor:pointer;box-sizing:border-box;">
            ${mark}
          </span>
          <span>${label}</span>
        </label>`;
    }

    _dropdownHtml(dropId, options, selectedValue, width = '100%') {
        const sel = options.find(o => o.value === selectedValue) || options[0];
        return `
        <div class="w95-dropdown" id="${dropId}" data-value="${selectedValue}" style="position:relative;width:${width};z-index:1;">
          <div class="w95-drop-display" style="
            display:flex;align-items:center;justify-content:space-between;
            background:#c0c0c0;${this._sunkenBorder()}
            padding:2px 4px;cursor:pointer;font-size:11px;font-family:Arial,sans-serif;
            min-height:20px;box-sizing:border-box;">
            <span class="w95-drop-label" style="flex-grow:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sel ? sel.label : ''}</span>
            <span style="
              display:inline-flex;align-items:center;justify-content:center;
              width:16px;height:16px;flex-shrink:0;
              background:#c0c0c0;
              border:2px solid #ffffff;border-right-color:#000;border-bottom-color:#000;
              font-size:8px;line-height:1;">▼</span>
          </div>
          <div class="w95-drop-list" style="
            display:none;position:absolute;top:100%;left:0;width:100%;
            background:#c0c0c0;
            border:1px solid #000000;
            box-shadow:2px 2px 4px rgba(0,0,0,0.4);
            z-index:9999;max-height:140px;overflow-y:auto;box-sizing:border-box;">
            ${options.map(o => `
            <div class="w95-drop-item" data-value="${o.value}" style="
              padding:2px 6px;font-size:11px;font-family:Arial,sans-serif;cursor:pointer;
              background:${o.value === selectedValue ? '#000080' : '#c0c0c0'};
              color:${o.value === selectedValue ? '#ffffff' : '#000000'};
              white-space:nowrap;">
              ${o.label}
            </div>`).join('')}
          </div>
        </div>`;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
<div id="p-root" style="
  display:flex;flex-direction:column;height:100%;
  background:#c0c0c0;
  font-family:Arial,Helvetica,sans-serif;font-size:11px;
  padding:6px;box-sizing:border-box;user-select:none;overflow:hidden;">

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
        font-family:Arial,sans-serif;font-size:11px;">${tab.charAt(0).toUpperCase()+tab.slice(1)}</button>`).join('')}
  </div>

  <div style="flex-grow:1;background:#c0c0c0;border:2px solid #ffffff;border-right-color:#808080;border-bottom-color:#808080;padding:10px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;overflow-y:auto;">
    ${this.renderPreview()}
    ${this.renderTabContent()}
  </div>

  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;flex-shrink:0;">
    <button id="p-btn-ok"     style="${this._btnStyle('font-weight:bold;')}">OK</button>
    <button id="p-btn-cancel" style="${this._btnStyle()}">Cancel</button>
    <button id="p-btn-apply"  disabled style="${this._btnStyle('color:#808080;border-right-color:#808080;border-bottom-color:#808080;cursor:default;text-shadow:1px 1px 0 #fff;')}">Apply</button>
  </div>
</div>`;

        this.refreshApplyState();
        this.bindEvents();
    }

    renderPreview() {
        if (this.activeTab === 'appearance') {
            return this._appearancePreviewHtml();
        }
        return this._crtMonitorHtml();
    }

    _appearancePreviewHtml() {
        const scheme = this.schemes[this.workingState.scheme] || this.schemes['standard'];
        const bg    = scheme.titlebarBg;
        const fg    = scheme.titlebarFg;
        return `
        <div id="p-appearance-preview" style="
          width:100%;height:130px;
          background:${this.workingState.color};
          border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;
          box-sizing:border-box;position:relative;overflow:hidden;flex-shrink:0;">
          <div style="position:absolute;top:8px;left:10px;width:200px;height:80px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:2px 2px 6px rgba(0,0,0,.5);">
            <div style="background:#808080;height:13px;color:#c0c0c0;font-size:8px;padding:1px 4px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;"><span>Inactive Window</span><span>×</span></div>
            <div style="padding:4px;font-size:8px;color:#000;">Norm</div>
          </div>
          <div style="position:absolute;top:24px;left:28px;width:230px;height:90px;background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:3px 3px 8px rgba(0,0,0,.6);">
            <div id="p-scheme-active-bar" style="background:${bg};height:14px;color:${fg};font-size:8px;padding:1px 4px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;"><span>Active Window</span><span>×</span></div>
            <div style="padding:5px;font-size:8px;background:#c0c0c0;height:calc(100% - 14px);box-sizing:border-box;display:flex;gap:6px;">
              <div style="background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:3px;flex:1;font-size:7px;">Window Text</div>
              <div style="background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;padding:2px 4px;font-size:7px;display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:${bg};color:${fg};padding:1px 4px;font-size:6px;font-weight:bold;width:100%;box-sizing:border-box;">Message Box</div>
                <div style="font-size:7px;">Message Text</div>
                <div style="background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;padding:0 6px;font-size:7px;font-weight:bold;">OK</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    _crtMonitorHtml() {
        const color   = this.workingState.color   || '#008080';
        const pattern = this.workingState.pattern || 'solid';
        const bgStyle = this._buildPatternStyle(color, pattern);

        return `
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;margin-bottom:2px;">
          <div style="width:228px;height:138px;background:#d4d0c8;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;border-radius:10px;padding:8px 8px 14px 8px;box-shadow:inset -1px -1px 0 #444,inset 1px 1px 0 #fff;display:flex;flex-direction:column;align-items:center;position:relative;box-sizing:border-box;">
            <div style="width:100%;height:104px;background:#222;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;border-radius:3px;box-sizing:border-box;overflow:hidden;position:relative;">
              <div id="crt-screen-viewport" style="width:100%;height:100px;position:relative;overflow:hidden;box-sizing:border-box;${bgStyle}">
                <div style="position:absolute;top:4px;left:4px;display:flex;flex-direction:column;gap:4px;z-index:1;">
                  <div style="width:7px;height:7px;background:#ffca28;border:1px solid #000;"></div>
                  <div style="width:7px;height:7px;background:#fff;border:1px solid #000;"></div>
                </div>
                <div style="position:absolute;top:10px;left:22px;width:118px;height:64px;background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;box-shadow:2px 2px 5px rgba(0,0,0,.5);z-index:1;">
                  <div style="background:#000080;height:11px;color:#fff;font-size:7px;padding:1px 3px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;"><span>ZebOS 2</span><span>×</span></div>
                  <div style="padding:3px;font-size:6.5px;background:#c0c0c0;height:calc(100% - 11px);box-sizing:border-box;">
                    <div style="background:#fff;border:1px solid #808080;padding:2px;height:30px;box-sizing:border-box;font-size:6px;color:#333;">Live Preview</div>
                  </div>
                </div>
                <div style="position:absolute;bottom:0;left:0;width:100%;height:10px;background:#c0c0c0;border-top:1px solid #fff;display:flex;align-items:center;padding:0 2px;z-index:1;">
                  <div style="width:20px;height:6px;background:#c0c0c0;border:1px solid #fff;border-right-color:#000;border-bottom-color:#000;font-size:5px;font-weight:bold;line-height:6px;text-align:center;color:#000;">Start</div>
                </div>
              </div>
            </div>
            <div style="position:absolute;bottom:3px;right:14px;display:flex;align-items:center;gap:4px;">
              <div style="width:5px;height:5px;border-radius:50%;background:#00ff00;box-shadow:0 0 4px #0f0;"></div>
              <div style="width:10px;height:4px;background:#808080;border:1px solid #444;"></div>
            </div>
          </div>
          <div style="width:64px;height:10px;background:#b0b0b0;border:2px solid #808080;border-top:none;border-radius:0 0 4px 4px;"></div>
        </div>`;
    }

    _buildPatternStyle(color, pattern) {
        if (pattern === 'gradient') {
            return `background:linear-gradient(135deg,${color} 0%,#000080 100%);`;
        }
        if (pattern === 'grid') {
            return `background-color:${color};background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0,rgba(0,0,0,.18) 1px,transparent 1px,transparent 14px),repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0,rgba(0,0,0,.18) 1px,transparent 1px,transparent 14px);`;
        }
        if (pattern === 'diamonds') {
            return `background-color:${color};background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 5px,transparent 5px,transparent 10px),repeating-linear-gradient(-45deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 5px,transparent 5px,transparent 10px);`;
        }
        if (pattern === 'dots') {
            return `background-color:${color};background-image:radial-gradient(rgba(255,255,255,.2) 1px,transparent 1px);background-size:10px 10px;`;
        }
        return `background-color:${color};`;
    }

    renderTabContent() {
        const ws = this.workingState;

        if (this.activeTab === 'background') {
            return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Wallpaper Presets</legend>
                <div style="display:flex;flex-direction:column;gap:5px;margin-top:2px;">
                  ${this.colorPresets.map(p => `
                  <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:11px;color:#000;user-select:none;">
                    ${this._radio('bg-color', p.hex, ws.color.toLowerCase() === p.hex.toLowerCase())}
                    <span style="width:13px;height:13px;background:${p.hex};border:1px solid #000;display:inline-block;flex-shrink:0;"></span>
                    <span>${p.name}</span>
                  </label>`).join('')}
                </div>
              </fieldset>

              <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Custom Color</legend>
                <div>
                  <div style="font-size:11px;color:#000;margin-bottom:5px;">Hex color:</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <input type="color" id="p-custom-color" value="${ws.color}" style="width:36px;height:22px;cursor:pointer;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:0;outline:none;background:#c0c0c0;">
                    <input type="text" id="p-custom-hex-text" value="${ws.color}" maxlength="7" spellcheck="false" style="width:68px;padding:2px 4px;font-size:11px;${this._sunkenBorder()}background:#fff;outline:none;font-family:monospace;">
                  </div>
                </div>
                <div>
                  <div style="font-weight:bold;color:#000080;font-size:11px;margin-bottom:4px;">Display Pattern</div>
                  ${this._dropdownHtml('p-pattern-drop', [
                    { value: 'solid',    label: 'Solid Color' },
                    { value: 'gradient', label: 'Gradient (Teal→Blue)' },
                    { value: 'grid',     label: 'DOS Grid Pattern' },
                    { value: 'diamonds', label: 'Diamond Pattern' },
                    { value: 'dots',     label: 'Dot Matrix' },
                  ], ws.pattern)}
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
                  <div style="font-size:11px;font-weight:bold;color:#000;margin-bottom:4px;">Color Scheme:</div>
                  ${this._dropdownHtml('p-scheme-drop',
                    Object.entries(this.schemes).map(([k,v]) => ({ value: k, label: v.name })),
                    ws.scheme)}
                </div>
                <div>
                  <div style="font-size:11px;font-weight:bold;color:#000;margin-bottom:4px;">Sound Effects:</div>
                  ${this._dropdownHtml('p-sound-drop', this.soundSchemes, ws.soundScheme)}
                </div>
              </div>
            </fieldset>`;
        }

        return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
            <legend style="color:#000080;font-weight:bold;padding:0 4px;">Visual Style</legend>
            <div style="margin-top:6px;display:flex;flex-direction:column;gap:8px;">
              ${this._checkboxHtml('p-rounded-corners', ws.roundedCorners, 'Rounded Window Corners')}
              <div style="font-size:10px;color:#555;padding-left:21px;">Applies a subtle border-radius to all<br>windows and menus.</div>
            </div>
          </fieldset>
          <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 10px;margin:0;background:#c0c0c0;box-sizing:border-box;">
            <legend style="color:#000080;font-weight:bold;padding:0 4px;">Display Info</legend>
            <div style="font-size:11px;color:#000;margin-top:6px;display:flex;flex-direction:column;gap:4px;">
              <div>Resolution: <strong>${window.innerWidth} × ${window.innerHeight}</strong></div>
              <div>Color Depth: <strong>True Color (32 bit)</strong></div>
              <div>Refresh: <strong>60 Hz</strong></div>
            </div>
          </fieldset>
        </div>`;
    }

    _radio(name, value, checked) {
        return `<input type="radio" name="${name}" value="${value}" ${checked?'checked':''} style="
          appearance:none;-webkit-appearance:none;
          width:13px;height:13px;flex-shrink:0;
          background:#fff;
          border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;
          border-radius:50%;cursor:pointer;position:relative;margin:0;
          display:inline-flex;align-items:center;justify-content:center;">`;
    }

    bindEvents() {
        this.container.querySelectorAll('.p-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
            });
        });

        this.container.querySelectorAll('input[name="bg-color"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.workingState.color = radio.value;
                this._syncColorInputs(radio.value);
                this.updateCrtPreview();
                this.markDirty();
            });
        });

        const colorPicker = this.container.querySelector('#p-custom-color');
        const hexText     = this.container.querySelector('#p-custom-hex-text');

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

        this._bindDropdown('p-pattern-drop', val => {
            this.workingState.pattern = val;
            this.updateCrtPreview();
            this.markDirty();
        });

        this._bindDropdown('p-scheme-drop', val => {
            this.workingState.scheme = val;
            this.updateAppearancePreview();
            this.markDirty();
        });

        this._bindDropdown('p-sound-drop', val => {
            this.workingState.soundScheme = val;
            this.markDirty();
        });

        const chkWrap = this.container.querySelector('#p-rounded-corners-wrap');
        if (chkWrap) {
            chkWrap.addEventListener('click', () => {
                const cur = chkWrap.dataset.checked === '1';
                const next = !cur;
                chkWrap.dataset.checked = next ? '1' : '0';
                chkWrap.innerHTML = next ? W95_CHECKMARK_SVG : '';
                this.workingState.roundedCorners = next;
                this.markDirty();
            });
        }

        const applyBtn  = this.container.querySelector('#p-btn-apply');
        const okBtn     = this.container.querySelector('#p-btn-ok');
        const cancelBtn = this.container.querySelector('#p-btn-cancel');

        if (applyBtn)  applyBtn.addEventListener('click',  () => this.doApply());
        if (okBtn)     okBtn.addEventListener('click',     () => { this.doApply(); this.onCloseRequest(); });
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            if (this.isDirty && this.onApplyCallback) {
                this.onApplyCallback({ ...this.initialState });
            }
            this.onCloseRequest();
        });

        document.addEventListener('mousedown', this._outsideClickHandler = (e) => {
            if (!e.target.closest('.w95-dropdown')) {
                this._closeAllDropdowns();
            }
        });
    }

    _bindDropdown(dropId, onChange) {
        const wrap = this.container.querySelector(`#${dropId}`);
        if (!wrap) return;

        const display = wrap.querySelector('.w95-drop-display');
        const list    = wrap.querySelector('.w95-drop-list');
        const label   = wrap.querySelector('.w95-drop-label');

        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = list.style.display !== 'none';
            this._closeAllDropdowns();
            if (!isOpen) {
                wrap.style.zIndex = '99999';
                if (wrap.parentElement && wrap.parentElement !== this.container) {
                    wrap.parentElement.style.position = 'relative';
                    wrap.parentElement.style.zIndex = '99998';
                }
                const fs = wrap.closest('fieldset');
                if (fs) {
                    fs.style.position = 'relative';
                    fs.style.zIndex = '99997';
                }
                list.style.display = 'block';
                this._openDropdown = wrap;
            }
        });

        list.querySelectorAll('.w95-drop-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                list.querySelectorAll('.w95-drop-item').forEach(i => {
                    i.style.background = '#c0c0c0';
                    i.style.color      = '#000000';
                });
                item.style.background = '#000080';
                item.style.color      = '#ffffff';
            });
            item.addEventListener('mouseleave', () => {
                const selVal = wrap.dataset.value;
                if (item.dataset.value === selVal) {
                    item.style.background = '#000080';
                    item.style.color      = '#ffffff';
                } else {
                    item.style.background = '#c0c0c0';
                    item.style.color      = '#000000';
                }
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.dataset.value;
                wrap.dataset.value = val;
                label.textContent  = item.textContent.trim();
                list.querySelectorAll('.w95-drop-item').forEach(i => {
                    i.style.background = i.dataset.value === val ? '#000080' : '#c0c0c0';
                    i.style.color      = i.dataset.value === val ? '#ffffff'  : '#000000';
                });
                this._closeAllDropdowns();
                onChange(val);
            });
        });
    }

    _closeAllDropdowns() {
        this.container.querySelectorAll('.w95-dropdown').forEach(w => {
            w.style.zIndex = '1';
            if (w.parentElement && w.parentElement !== this.container) {
                w.parentElement.style.zIndex = '';
            }
            const fs = w.closest('fieldset');
            if (fs) fs.style.zIndex = '';
            const l = w.querySelector('.w95-drop-list');
            if (l) l.style.display = 'none';
        });
        this._openDropdown = null;
    }

    updateCrtPreview() {
        const vp = this.container.querySelector('#crt-screen-viewport');
        if (!vp) return;

        const color   = this.workingState.color   || '#008080';
        const pattern = this.workingState.pattern || 'solid';

        if (pattern === 'solid') {
            vp.style.background      = color;
            vp.style.backgroundImage = 'none';
            vp.style.backgroundSize  = '';
        } else if (pattern === 'gradient') {
            vp.style.backgroundImage = `linear-gradient(135deg,${color} 0%,#000080 100%)`;
            vp.style.backgroundColor = color;
            vp.style.backgroundSize  = '';
        } else if (pattern === 'grid') {
            vp.style.backgroundColor = color;
            vp.style.backgroundImage = `repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0,rgba(0,0,0,.18) 1px,transparent 1px,transparent 14px),repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0,rgba(0,0,0,.18) 1px,transparent 1px,transparent 14px)`;
            vp.style.backgroundSize  = '';
        } else if (pattern === 'diamonds') {
            vp.style.backgroundColor = color;
            vp.style.backgroundImage = `repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 5px,transparent 5px,transparent 10px),repeating-linear-gradient(-45deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 5px,transparent 5px,transparent 10px)`;
            vp.style.backgroundSize  = '';
        } else if (pattern === 'dots') {
            vp.style.backgroundColor = color;
            vp.style.backgroundImage = `radial-gradient(rgba(255,255,255,.2) 1px,transparent 1px)`;
            vp.style.backgroundSize  = '10px 10px';
        }
    }

    updateAppearancePreview() {
        const scheme = this.schemes[this.workingState.scheme] || this.schemes['standard'];
        const activeBar = this.container.querySelector('#p-scheme-active-bar');
        if (activeBar) {
            activeBar.style.background = scheme.titlebarBg;
            activeBar.style.color      = scheme.titlebarFg;
        }
        this.container.querySelectorAll('.p-scheme-msg-bar').forEach(el => {
            el.style.background = scheme.titlebarBg;
            el.style.color      = scheme.titlebarFg;
        });
        const preview = this.container.querySelector('#p-appearance-preview');
        if (preview) preview.style.background = this.workingState.color;
    }

    _syncColorInputs(hex) {
        const cp = this.container.querySelector('#p-custom-color');
        const ht = this.container.querySelector('#p-custom-hex-text');
        if (cp) cp.value = hex;
        if (ht) ht.value = hex;
    }

    doApply() {
        if (!this.isDirty) return;
        if (this.onApplyCallback) {
            this.onApplyCallback({ ...this.workingState });
        }
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
        const btn = this.container && this.container.querySelector('#p-btn-apply');
        if (!btn) return;
        if (this.isDirty) {
            btn.disabled = false;
            btn.style.color             = '#000000';
            btn.style.borderRightColor  = '#000000';
            btn.style.borderBottomColor = '#000000';
            btn.style.cursor            = 'pointer';
            btn.style.textShadow        = 'none';
        } else {
            btn.disabled = true;
            btn.style.color             = '#808080';
            btn.style.borderRightColor  = '#808080';
            btn.style.borderBottomColor = '#808080';
            btn.style.cursor            = 'default';
            btn.style.textShadow        = '1px 1px 0 #ffffff';
        }
    }

    cleanup() {
        if (this._outsideClickHandler) {
            document.removeEventListener('mousedown', this._outsideClickHandler);
        }
    }
}
