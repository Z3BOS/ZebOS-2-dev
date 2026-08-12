// programs/regedit.js - ZebOS 2 Registry Editor
// Not on the desktop or Start Menu by design (real Windows doesn't ship a
// shortcut for regedit either) — reachable only via Run "regedit". Every key
// shown here is a genuine live OS setting; editing a value calls back into
// os.js's setRegistryValue(), which applies it to the running desktop and
// persists it, exactly like the Personalize applet does.
import { getIcon } from '../icons.js';
import { BaseApp } from '../UIKit/framework/index.js';

const HIVES = [
    {
        id: 'HKEY_CURRENT_USER',
        keys: [
            {
                id: 'hkcu-desktop',
                path: 'Control Panel\\Desktop',
                values: [
                    { name: 'Background',       field: 'desktopBackground', type: 'color' },
                    { name: 'Pattern',          field: 'desktopPattern',    type: 'string', hint: 'Valid values: solid, gradient, grid, diamonds, dots' },
                    { name: 'ColorScheme',      field: 'desktopScheme',     type: 'string', hint: 'Valid values: standard, high-contrast, rose, emerald, midnight' },
                    { name: 'IconSortBy',       field: 'desktopSortBy',     type: 'string', hint: 'Valid values: name, type' },
                    { name: 'AutoArrangeIcons', field: 'autoArrange',       type: 'dword' },
                    { name: 'RoundedCorners',   field: 'roundedCorners',    type: 'dword' },
                ],
            },
            {
                id: 'hkcu-sound',
                path: 'Control Panel\\Sound',
                values: [
                    { name: 'SoundScheme', field: 'soundScheme', type: 'string', hint: 'Valid values: classic, muted' },
                ],
            },
            {
                id: 'hkcu-taskbar',
                path: 'Control Panel\\Taskbar',
                values: [
                    { name: 'AutoHide', field: 'taskbarAutoHide', type: 'dword' },
                ],
            },
            {
                id: 'hkcu-identity',
                path: 'Identity',
                values: [
                    { name: 'Username',              field: 'savedUsername',     type: 'string' },
                    { name: 'HasLoggedInBefore',      field: 'hasLoggedInBefore', type: 'dword' },
                    { name: 'AlwaysShowSetupWizard',  field: 'alwaysShowSetup',   type: 'dword' },
                ],
            },
        ],
    },
    {
        id: 'HKEY_LOCAL_MACHINE',
        keys: [
            {
                id: 'hklm-zebos',
                path: 'SYSTEM\\CurrentControlSet\\ZebOS',
                values: [
                    { name: 'Version',           field: 'version',           type: 'string', readonly: true },
                    { name: 'Codename',          field: 'codename',          type: 'string', readonly: true },
                    { name: 'BuildHash',         field: 'buildHash',         type: 'string', readonly: true },
                    { name: 'SkipBootAnimation', field: 'skipBootAnimation', type: 'dword' },
                    { name: 'AutoDevMode',       field: 'autoDevMode',       type: 'dword' },
                    { name: 'DisableKernelLogs', field: 'disableKernelLogs', type: 'dword' },
                ],
            },
            {
                id: 'hklm-hardware',
                path: 'HARDWARE\\DESCRIPTION\\System',
                values: [
                    { name: 'CurrentUser',   field: 'currentUser', type: 'string', readonly: true },
                    { name: 'UptimeSeconds', field: 'uptime',      type: 'dword',  readonly: true },
                ],
            },
        ],
    },
];

export class RegistryEditorApp extends BaseApp {
    constructor(onCloseRequest, api) {
        super(onCloseRequest);
        this.api = api; // { getSnapshot(), setValue(field, value) }
        this.container = null;
        this.snapshot = api.getSnapshot();
        this.expandedHives = new Set(['HKEY_CURRENT_USER']);
        this.selectedKeyId = 'hkcu-desktop';
        this.selectedValueName = null;
    }

    mount() {
        this.container = this.body;
        this.container.style.height = '100%';
        this.renderUI();
    }

    _findKey(keyId) {
        for (const hive of HIVES) {
            const key = hive.keys.find(k => k.id === keyId);
            if (key) return { hive, key };
        }
        return null;
    }

    _fullPath(hive, key) {
        return `My Computer\\${hive.id}\\${key.path}`;
    }

    _sunken() { return 'border:2px solid #808080;border-right-color:#ffffff;border-bottom-color:#ffffff;'; }
    _raised() { return 'border:2px solid #ffffff;border-right-color:#808080;border-bottom-color:#808080;'; }

    _formatData(valueDef) {
        const raw = this.snapshot[valueDef.field];
        if (valueDef.type === 'dword') {
            const n = raw ? 1 : 0;
            return `0x${String(n).padStart(8, '0')} (${n})`;
        }
        return raw === null || raw === undefined || raw === '' ? '(value not set)' : String(raw);
    }

    _typeLabel(type) {
        return type === 'dword' ? 'REG_DWORD' : 'REG_SZ';
    }

    renderUI() {
        if (!this.container) return;
        const found = this._findKey(this.selectedKeyId) || this._findKey('hkcu-desktop');
        const { hive, key } = found;

        this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#c0c0c0;font-family:Arial,Helvetica,sans-serif;font-size:11px;box-sizing:border-box;user-select:none;">
            <div style="flex-grow:1;display:flex;min-height:0;">
                <div style="width:220px;flex-shrink:0;background:#ffffff;${this._sunken()}margin:6px 0 6px 6px;overflow-y:auto;box-sizing:border-box;">
                    ${this.renderTree()}
                </div>
                <div style="flex-grow:1;display:flex;flex-direction:column;min-width:0;margin:6px 6px 6px 6px;background:#ffffff;${this._sunken()}box-sizing:border-box;">
                    <table style="width:100%;border-collapse:collapse;font-size:11px;">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:4px 8px;font-weight:bold;border-bottom:1px solid #808080;background:#c0c0c0;">Name</th>
                                <th style="text-align:left;padding:4px 8px;font-weight:bold;border-bottom:1px solid #808080;background:#c0c0c0;width:90px;">Type</th>
                                <th style="text-align:left;padding:4px 8px;font-weight:bold;border-bottom:1px solid #808080;background:#c0c0c0;">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${key.values.map(v => this.renderValueRow(v)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style="flex-shrink:0;padding:4px 10px;font-size:11px;border-top:2px solid #808080;background:#c0c0c0;">
                ${this._esc(this._fullPath(hive, key))}
            </div>
        </div>`;

        this.bindEvents();
    }

    renderTree() {
        const rootRow = `
            <div style="display:flex;align-items:center;gap:4px;padding:3px 4px;">
                <span style="width:14px;flex-shrink:0;"></span>
                <span style="width:16px;height:16px;display:inline-flex;align-items:center;flex-shrink:0;">${getIcon('computer')}</span>
                <span>My Computer</span>
            </div>`;

        const hiveRows = HIVES.map(hive => {
            const expanded = this.expandedHives.has(hive.id);
            const arrow = expanded ? '▼' : '▶';
            const hiveRow = `
                <div class="reg-hive-row" data-hive="${hive.id}" style="display:flex;align-items:center;gap:4px;padding:3px 4px;padding-left:20px;cursor:pointer;">
                    <span style="width:14px;flex-shrink:0;font-size:9px;text-align:center;color:#444;">${arrow}</span>
                    <span style="width:16px;height:16px;display:inline-flex;align-items:center;flex-shrink:0;">${getIcon('drive')}</span>
                    <span>${hive.id}</span>
                </div>`;
            const keyRows = expanded ? hive.keys.map(key => {
                const selected = key.id === this.selectedKeyId;
                return `
                <div class="reg-key-row" data-key="${key.id}" style="display:flex;align-items:center;gap:4px;padding:3px 4px;padding-left:40px;cursor:pointer;
                    background:${selected ? '#000080' : 'transparent'};color:${selected ? '#ffffff' : '#000000'};">
                    <span style="width:16px;height:16px;display:inline-flex;align-items:center;flex-shrink:0;">${getIcon('folder')}</span>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${this._esc(key.path)}">${this._esc(key.path.split('\\').pop())}</span>
                </div>`;
            }).join('') : '';
            return hiveRow + keyRows;
        }).join('');

        return rootRow + hiveRows;
    }

    renderValueRow(valueDef) {
        const selected = valueDef.name === this.selectedValueName;
        return `
        <tr class="reg-value-row" data-value="${this._esc(valueDef.name)}" style="cursor:pointer;${selected ? 'background:#000080;color:#ffffff;' : ''}">
            <td style="padding:3px 8px;white-space:nowrap;">${this._esc(valueDef.name)}${valueDef.readonly ? ' <span style="opacity:.6;">(read-only)</span>' : ''}</td>
            <td style="padding:3px 8px;color:${selected ? '#dddddd' : '#666666'};white-space:nowrap;">${this._typeLabel(valueDef.type)}</td>
            <td style="padding:3px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc(this._formatData(valueDef))}</td>
        </tr>`;
    }

    _esc(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    bindEvents() {
        this.container.querySelectorAll('.reg-hive-row').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.hive;
                if (this.expandedHives.has(id)) this.expandedHives.delete(id);
                else this.expandedHives.add(id);
                this.renderUI();
            });
        });

        this.container.querySelectorAll('.reg-key-row').forEach(row => {
            row.addEventListener('click', () => {
                this.selectedKeyId = row.dataset.key;
                this.selectedValueName = null;
                this.renderUI();
            });
        });

        this.container.querySelectorAll('.reg-value-row').forEach(row => {
            row.addEventListener('click', () => {
                this.selectedValueName = row.dataset.value;
                this.renderUI();
            });
            row.addEventListener('dblclick', () => {
                const { key } = this._findKey(this.selectedKeyId);
                const valueDef = key.values.find(v => v.name === row.dataset.value);
                if (valueDef) this._openEditModal(valueDef);
            });
        });
    }

    _openEditModal(valueDef) {
        if (valueDef.readonly) {
            this._openMessageModal('Registry Editor',
                `Cannot edit ${valueDef.name}: Error writing the value's new contents.`, true);
            return;
        }
        if (valueDef.type === 'dword') this._openDwordModal(valueDef);
        else this._openStringModal(valueDef);
    }

    _modalShell(title, bodyHtml) {
        const overlay = document.createElement('div');
        overlay.className = 'os-modal-overlay';
        overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:transparent;display:flex;align-items:center;justify-content:center;z-index:100005;`;

        const dialog = document.createElement('div');
        dialog.className = 'os-prompt-modal active-window';
        dialog.style.cssText = `position:relative !important;left:auto !important;top:auto !important;width:360px !important;height:auto !important;background-color:#c0c0c0;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;box-shadow:4px 4px 18px rgba(0,0,0,0.6);font-family:Arial,sans-serif;box-sizing:border-box;`;

        dialog.innerHTML = `
            <div class="window-header">
                <div class="window-title">${this._esc(title)}</div>
                <div class="window-controls">
                    <button class="win-btn" id="reg-modal-close">${getIcon('winClose')}</button>
                </div>
            </div>
            <div style="padding:14px;font-size:11px;">${bodyHtml}</div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        const cleanup = () => overlay.remove();
        dialog.querySelector('#reg-modal-close').addEventListener('click', cleanup);
        return { overlay, dialog, cleanup };
    }

    _openMessageModal(title, message, isWarning) {
        const icon = isWarning
            ? `<div style="width:30px;height:30px;flex-shrink:0;color:#ffffff;display:flex;align-items:center;justify-content:center;background:#d32f2f;border:2px solid #800000;border-radius:50%;font-weight:bold;font-size:18px;">!</div>`
            : `<div style="width:30px;height:30px;flex-shrink:0;color:#ffffff;display:flex;align-items:center;justify-content:center;background:#000080;border:2px solid #000040;border-radius:50%;font-weight:bold;font-style:italic;font-family:serif;">i</div>`;
        const { cleanup, dialog } = this._modalShell(title, `
            <div style="display:flex;gap:10px;align-items:flex-start;">
                ${icon}
                <div style="line-height:1.4;">${this._esc(message)}</div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px;">
                <button id="reg-modal-ok" style="${this._btnStyle('font-weight:bold;min-width:70px;')}">OK</button>
            </div>
        `);
        dialog.querySelector('#reg-modal-ok').addEventListener('click', cleanup);
    }

    _btnStyle(extra = '') {
        return `background:#c0c0c0;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;padding:3px 10px;cursor:pointer;font-family:Arial,sans-serif;font-size:11px;outline:none;${extra}`;
    }

    _openStringModal(valueDef) {
        const currentVal = this.snapshot[valueDef.field] == null ? '' : String(this.snapshot[valueDef.field]);
        const isColor = valueDef.type === 'color';

        const { cleanup, dialog } = this._modalShell('Edit String', `
            <div style="margin-bottom:8px;">Value name:</div>
            <input type="text" value="${this._esc(valueDef.name)}" disabled style="width:100%;box-sizing:border-box;padding:3px 5px;background:#dddddd;color:#555;${this._sunken()}outline:none;margin-bottom:10px;">
            <div style="margin-bottom:8px;">Value data:</div>
            <div style="display:flex;gap:6px;align-items:center;">
                <input type="text" id="reg-str-input" value="${this._esc(currentVal)}" spellcheck="false" autocomplete="off"
                    style="flex-grow:1;box-sizing:border-box;padding:3px 5px;background:#ffffff;${this._sunken()}outline:none;">
                ${isColor ? `<input type="color" id="reg-color-input" value="${/^#[0-9a-fA-F]{6}$/.test(currentVal) ? currentVal : '#008080'}" style="width:32px;height:24px;cursor:pointer;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;padding:0;outline:none;">` : ''}
            </div>
            ${valueDef.hint ? `<div style="margin-top:6px;font-size:10px;color:#555;">${this._esc(valueDef.hint)}</div>` : ''}
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
                <button id="reg-modal-ok" style="${this._btnStyle('font-weight:bold;min-width:70px;')}">OK</button>
                <button id="reg-modal-cancel" style="${this._btnStyle('min-width:70px;')}">Cancel</button>
            </div>
        `);

        const strInput = dialog.querySelector('#reg-str-input');
        const colorInput = dialog.querySelector('#reg-color-input');
        if (colorInput) {
            colorInput.addEventListener('input', () => { strInput.value = colorInput.value; });
        }
        strInput.addEventListener('input', () => {
            if (colorInput && /^#[0-9a-fA-F]{6}$/.test(strInput.value.trim())) colorInput.value = strInput.value.trim();
        });
        setTimeout(() => { strInput.focus(); strInput.select(); }, 30);

        const commit = () => {
            const val = strInput.value;
            cleanup();
            this.api.setValue(valueDef.field, val);
            this.snapshot = this.api.getSnapshot();
            this.renderUI();
        };

        dialog.querySelector('#reg-modal-ok').addEventListener('click', commit);
        dialog.querySelector('#reg-modal-cancel').addEventListener('click', cleanup);
        strInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cleanup();
        });
    }

    _openDwordModal(valueDef) {
        const currentBool = !!this.snapshot[valueDef.field];

        const { cleanup, dialog } = this._modalShell('Edit DWORD Value (32-bit)', `
            <div style="margin-bottom:8px;">Value name:</div>
            <input type="text" value="${this._esc(valueDef.name)}" disabled style="width:100%;box-sizing:border-box;padding:3px 5px;background:#dddddd;color:#555;${this._sunken()}outline:none;margin-bottom:10px;">
            <div style="margin-bottom:8px;">Value data:</div>
            <input type="text" id="reg-dword-input" value="${currentBool ? '1' : '0'}" spellcheck="false" autocomplete="off" maxlength="8"
                style="width:120px;box-sizing:border-box;padding:3px 5px;background:#ffffff;${this._sunken()}outline:none;font-family:monospace;">
            <div style="margin-top:10px;">
                <div style="font-weight:bold;margin-bottom:4px;">Base</div>
                <label style="margin-right:14px;cursor:pointer;"><input type="radio" name="reg-dword-base" value="hex" checked> Hexadecimal</label>
                <label style="cursor:pointer;"><input type="radio" name="reg-dword-base" value="dec"> Decimal</label>
            </div>
            <div style="margin-top:8px;font-size:10px;color:#555;">Nonzero enables this setting; 0 disables it.</div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
                <button id="reg-modal-ok" style="${this._btnStyle('font-weight:bold;min-width:70px;')}">OK</button>
                <button id="reg-modal-cancel" style="${this._btnStyle('min-width:70px;')}">Cancel</button>
            </div>
        `);

        const input = dialog.querySelector('#reg-dword-input');
        const radios = dialog.querySelectorAll('input[name="reg-dword-base"]');
        input.value = currentBool ? '00000001' : '00000000';

        const parseCurrent = (base) => {
            const n = parseInt(input.value, base === 'hex' ? 16 : 10);
            return Number.isFinite(n) ? n : 0;
        };

        let activeBase = 'hex';
        radios.forEach(r => r.addEventListener('change', () => {
            const n = parseCurrent(activeBase);
            activeBase = r.value;
            input.value = activeBase === 'hex' ? n.toString(16).padStart(8, '0') : String(n);
        }));

        setTimeout(() => { input.focus(); input.select(); }, 30);

        const commit = () => {
            const n = parseCurrent(activeBase);
            cleanup();
            this.api.setValue(valueDef.field, n !== 0);
            this.snapshot = this.api.getSnapshot();
            this.renderUI();
        };

        dialog.querySelector('#reg-modal-ok').addEventListener('click', commit);
        dialog.querySelector('#reg-modal-cancel').addEventListener('click', cleanup);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cleanup();
        });
    }
}
