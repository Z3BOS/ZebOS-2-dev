// Run dialog for ZebOS
// This actually was really easy wow
import { getIcon } from '../icons.js';
import { BaseApp } from '../UIKit/framework/index.js';
import { Telemetry } from '../telemetry/index.js';

const HISTORY_KEY = 'ZEBOS_RUN_HISTORY';
const HISTORY_MAX = 10;

// Maps a typed command to the appId launchApplication() in os.js already
// understands. Lookups are case-insensitive and a trailing ".exe" is stripped.
const COMMAND_MAP = {
    'explorer':        'start-link-files',
    'files':           'start-link-files',
    'notepad':         'start-link-text-editor',
    'editor':          'start-link-text-editor',
    'write':           'start-link-text-editor',
    'cmd':             'start-link-prompt',
    'command':         'start-link-prompt',
    'terminal':        'start-link-prompt',
    'prompt':          'start-link-prompt',
    'mspaint':         'start-link-paint',
    'paint':           'start-link-paint',
    'winmine':         'start-link-mines',
    'mines':           'start-link-mines',
    'minesweeper':     'start-link-mines',
    'wmplayer':        'start-link-media',
    'media':           'start-link-media',
    'vm':              'start-link-vm',
    'zebvm':           'start-link-vm',
    'calc':            'start-link-calc',
    'calculator':      'start-link-calc',
    'snake':           'start-link-snake',
    'courgette':       'start-link-courgette',
    'winver':          'start-link-courgette',
    'about':           'start-link-courgette',
    'control':         'start-link-personalize',
    'desk.cpl':        'start-link-personalize',
    'personalize':     'start-link-personalize',
    'display':         'start-link-personalize',
    'taskmgr':         'start-link-taskmgr',
    'solitaire':       'start-link-solitaire',
    'sol':             'start-link-solitaire',
    'chess':           'start-link-chess',
    'regedit':         'start-link-regedit',
    'regedit32':       'start-link-regedit',
    'regedt32':        'start-link-regedit',
    'sysflags':        'start-link-sysflags',
    'flags':           'start-link-sysflags',
    'msconfig':        'start-link-sysflags',
    'reinstall':       'start-link-reinstall',
    'factoryreset':    'start-link-reinstall',
    'telemetry':       'start-link-telemetry',
    'perfmon':         'start-link-telemetry',
    'perf':            'start-link-telemetry',
    'activitycenter':  'start-link-activitycenter',
    'activity':        'start-link-activitycenter',
    'ac':              'start-link-activitycenter',
    'run':             'start-link-run',
};

// Commands that accept a trailing argument as a target filename ("notepad readme.txt").
const FILE_ARG_COMMANDS = new Set(['start-link-text-editor']);

export class RunDialog extends BaseApp {
    constructor(onCloseRequest, onExecute, onBrowse) {
        super(onCloseRequest);
        this.onExecute = onExecute;
        this.onBrowse = onBrowse;
        this.container = null;
        this.history = this._loadHistory();
    }

    mount() {
        Telemetry.mark('run-mount-start');
        this.container = this.body;
        this.container.style.height = '100%';
        this.renderDialog();
        const input = this.container.querySelector('#run-input');
        if (input) {
            input.focus();
            input.select();
        }
        Telemetry.measure('run-mount', 'run-mount-start');
    }

    _loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.filter(c => typeof c === 'string') : [];
        } catch (e) {
            return [];
        }
    }

    _saveHistory(command) {
        this.history = [command, ...this.history.filter(c => c !== command)].slice(0, HISTORY_MAX);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history)); } catch (e) { /* ignore */ }
    }

    // Resolves raw typed text to { appId, arg } or null when nothing matches.
    resolve(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const spaceIdx = trimmed.indexOf(' ');
        const head = (spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)).toLowerCase().replace(/\.exe$/, '');
        const arg = spaceIdx === -1 ? null : trimmed.slice(spaceIdx + 1).trim();
        const appId = COMMAND_MAP[head];
        if (!appId) return null;
        return { appId, arg: (arg && FILE_ARG_COMMANDS.has(appId)) ? arg : null };
    }

    renderDialog() {
        if (!this.container) return;
        this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:11px; padding:12px 14px; box-sizing:border-box; user-select:none;">
            <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:12px;">
                <div style="width:36px; height:36px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">${getIcon('run')}</div>
                <div style="line-height:1.4; color:#000000; font-size:11px; padding-top:2px;">
                    Type the name of a program, folder, document, or Internet resource, and ZebOS will open it for you.
                </div>
            </div>
            
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <label for="run-input" style="flex-shrink:0; font-weight:bold; width:38px; text-align:right;">Open:</label>
                <input type="text" id="run-input" list="run-history-list" autocomplete="off" spellcheck="false" value=""
                    placeholder="e.g. explorer, notepad, cmd, calc, activitycenter"
                    style="flex-grow:1; height:22px; padding:2px 6px; font-size:11px; font-family:monospace, Arial, sans-serif; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; outline:none; box-sizing:border-box;">
                <datalist id="run-history-list">
                    ${this.history.map(c => `<option value="${this._esc(c)}"></option>`).join('')}
                </datalist>
            </div>
            
            <div id="run-error" style="min-height:18px; margin-left:46px; color:#a00000; font-size:10px; font-weight:bold; line-height:1.2;"></div>
            
            <div style="flex-grow:1;"></div>
            
            <div style="display:flex; justify-content:flex-end; gap:6px; border-top:1px solid #a0a0a0; padding-top:10px; margin-top:4px;">
                <button id="run-ok"     style="${this._btnStyle('font-weight:bold; width:75px;')}">OK</button>
                <button id="run-cancel" style="${this._btnStyle('width:75px;')}">Cancel</button>
                <button id="run-browse" style="${this._btnStyle('width:75px;')}">Browse...</button>
            </div>
        </div>`;
        this.bindEvents();
    }

    _btnStyle(extra = '') {
        return `background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; padding:3px 12px; cursor:pointer; font-family:Arial, sans-serif; font-size:11px; outline:none; box-shadow: active 1px 1px 0px #000; ${extra}`;
    }

    _esc(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    bindEvents() {
        const input     = this.container.querySelector('#run-input');
        const errEl     = this.container.querySelector('#run-error');
        const okBtn     = this.container.querySelector('#run-ok');
        const cancelBtn = this.container.querySelector('#run-cancel');
        const browseBtn = this.container.querySelector('#run-browse');

        const submit = () => {
            const raw = input.value;
            const resolved = this.resolve(raw);
            if (!resolved) {
                errEl.textContent = `Cannot find '${raw.trim()}'. Make sure you typed the name correctly, and then try again.`;
                input.focus();
                input.select();
                return;
            }
            this._saveHistory(raw.trim());
            Telemetry.record('run-command', 1, { command: resolved.appId });
            this.onExecute(resolved.appId, resolved.arg);
            this.close();
        };

        if (okBtn) okBtn.addEventListener('click', submit);
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
        if (browseBtn) browseBtn.addEventListener('click', () => {
            if (this.onBrowse) this.onBrowse();
            this.close();
        });
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') this.close();
            });
            input.addEventListener('input', () => { errEl.textContent = ''; });
        }
    }
}
