// System flags editor, triggered from the Run tool
// No desktop icon or Start Menu entry — reachable only via Run "sysflags".
// A friendly checkbox/dropdown front-end over the same live settings the
// Registry Editor exposes as raw HKCU/HKLM values (same getSnapshot/setValue
// api) — think msconfig next to regedit.
import { BaseApp } from '../UIKit/framework/index.js';

const W95_CHECKMARK_SVG = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="display:block;margin:0;padding:0;"><path d="M1.5 4.5L3.5 6.5L7.5 1.5" stroke="#000000" stroke-width="1.8" stroke-linecap="square"/></svg>`;

const BOOL_FLAGS = [
    { field: 'autoDevMode',       label: 'Auto-enter Dev Mode on boot' },
    { field: 'skipBootAnimation', label: 'Skip boot animation' },
    { field: 'alwaysShowSetup',   label: 'Show setup screen on boot every time' },
    { field: 'disableKernelLogs', label: 'Disable kernel logs on startup' },
    { field: 'autoArrange',       label: 'Auto-arrange desktop icons' },
    { field: 'taskbarAutoHide',   label: 'Auto-hide taskbar' },
    { field: 'roundedCorners',    label: 'Rounded window corners' },
];

const ENUM_FLAGS = [
    { field: 'desktopSortBy', label: 'Desktop sort', options: [
        { value: 'type', label: 'Type' },
        { value: 'name', label: 'Name' },
    ]},
    { field: 'soundScheme', label: 'Sound scheme', options: [
        { value: 'classic', label: 'Classic ZebOS Synthesizer' },
        { value: 'muted',   label: 'Muted (No Audio)' },
    ]},
    { field: 'desktopScheme', label: 'Color scheme', options: [
        { value: 'standard',      label: 'Standard' },
        { value: 'high-contrast', label: 'High Contrast Dark' },
        { value: 'rose',          label: 'Rose Retro' },
        { value: 'emerald',       label: 'Emerald Desktop' },
        { value: 'midnight',      label: 'Midnight Blue' },
    ]},
];

export class SystemFlagsApp extends BaseApp {
    constructor(onCloseRequest, api) {
        super(onCloseRequest);
        this.api = api; // { getSnapshot(), setValue(field, value) }
        this.container = null;
        this.snapshot = api.getSnapshot();
    }

    mount() {
        this.container = this.body;
        this.container.style.height = '100%';
        this.renderUI();
    }

    _sunken() { return 'border:2px solid #808080;border-right-color:#ffffff;border-bottom-color:#ffffff;'; }

    _checkboxHtml(field, checked, label) {
        const mark = checked ? W95_CHECKMARK_SVG : '';
        return `
        <label data-flag="${field}" class="sf-checkbox-row" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:#000;user-select:none;padding:3px 0;">
          <span class="sf-checkbox-wrap" data-checked="${checked ? '1' : '0'}" style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;flex-shrink:0;background:#ffffff;${this._sunken()}cursor:pointer;box-sizing:border-box;">
            ${mark}
          </span>
          <span>${label}</span>
        </label>`;
    }

    _selectHtml(field, options, selected) {
        return `
        <select data-flag="${field}" class="sf-select" style="padding:2px 4px;font-size:11px;font-family:Arial,sans-serif;background:#ffffff;${this._sunken()}outline:none;">
            ${options.map(o => `<option value="${o.value}" ${o.value === selected ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>`;
    }

    renderUI() {
        if (!this.container) return;
        const s = this.snapshot;

        this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#c0c0c0;font-family:Arial,Helvetica,sans-serif;font-size:11px;padding:12px;box-sizing:border-box;user-select:none;overflow-y:auto;">
            <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 12px;margin:0 0 10px 0;background:#c0c0c0;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Startup &amp; Behavior</legend>
                <div style="display:flex;flex-direction:column;">
                    ${BOOL_FLAGS.map(f => this._checkboxHtml(f.field, !!s[f.field], f.label)).join('')}
                </div>
            </fieldset>

            <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 12px;margin:0;background:#c0c0c0;box-sizing:border-box;">
                <legend style="color:#000080;font-weight:bold;padding:0 4px;">Appearance Defaults</legend>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
                    ${ENUM_FLAGS.map(f => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                        <label>${f.label}:</label>
                        ${this._selectHtml(f.field, f.options, s[f.field])}
                    </div>`).join('')}
                </div>
            </fieldset>

            <div style="flex-grow:1;"></div>
            <div style="font-size:10px;color:#555;margin-top:10px;">Changes here apply immediately and are saved automatically — the same live settings shown in Registry Editor.</div>
        </div>`;

        this.bindEvents();
    }

    bindEvents() {
        this.container.querySelectorAll('.sf-checkbox-row').forEach(row => {
            row.addEventListener('click', () => {
                const field = row.dataset.flag;
                const wrap = row.querySelector('.sf-checkbox-wrap');
                const next = wrap.dataset.checked !== '1';
                this.api.setValue(field, next);
                this.snapshot = this.api.getSnapshot();
                wrap.dataset.checked = next ? '1' : '0';
                wrap.innerHTML = next ? W95_CHECKMARK_SVG : '';
            });
        });

        this.container.querySelectorAll('.sf-select').forEach(sel => {
            sel.addEventListener('change', () => {
                this.api.setValue(sel.dataset.flag, sel.value);
                this.snapshot = this.api.getSnapshot();
            });
        });
    }
}
