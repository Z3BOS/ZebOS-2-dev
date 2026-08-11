// Run dialog for ZebOS
// This actually was really easy wow
import { getIcon } from '../icons.js';

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
    'run':             'start-link-run',
};

// Commands that accept a trailing argument as a target filename ("notepad readme.txt").
const FILE_ARG_COMMANDS = new Set(['start-link-text-editor']);

export class RunDialog {
    constructor(onCloseRequest, onExecute, onBrowse) {
        this.onCloseRequest = onCloseRequest;
        this.onExecute = onExecute;
        this.onBrowse = onBrowse;
        this.container = null;
        this.history = this._loadHistory();
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = '100%';
        this.render();
        const input = this.container.querySelector('#run-input');
        if (input) input.focus();
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

    render() {
        if (!this.container) return;
        this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#c0c0c0;font-family:Arial,Helvetica,sans-serif;font-size:11px;padding:14px;box-sizing:border-box;user-select:none;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:32px;height:32px;flex-shrink:0;">${getIcon('run')}</div>
                <div style="line-height:1.5;color:#000;padding-top:2px;">Type the name of a program, and ZebOS will open it for you.</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:18px;">
                <label for="run-input" style="flex-shrink:0;">Open:</label>
                <input type="text" id="run-input" list="run-history-list" autocomplete="off" spellcheck="false" value=""
                    style="flex-grow:1;padding:3px 5px;font-size:11px;border:2px solid #808080;border-right-color:#ffffff;border-bottom-color:#ffffff;background:#ffffff;outline:none;">
                <datalist id="run-history-list">
                    ${this.history.map(c => `<option value="${this._esc(c)}"></option>`).join('')}
                </datalist>
            </div>
            <div id="run-error" style="min-height:26px;margin:6px 0 0 46px;color:#800000;font-size:10px;line-height:1.3;"></div>
            <div style="flex-grow:1;"></div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button id="run-ok"     style="${this._btnStyle('font-weight:bold;min-width:70px;')}">OK</button>
                <button id="run-cancel" style="${this._btnStyle('min-width:70px;')}">Cancel</button>
                <button id="run-browse" style="${this._btnStyle('min-width:70px;')}">Browse...</button>
            </div>
        </div>`;
        this.bindEvents();
    }

    _btnStyle(extra = '') {
        return `background:#c0c0c0;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;padding:3px 10px;cursor:pointer;font-family:Arial,sans-serif;font-size:11px;outline:none;${extra}`;
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
            this.onExecute(resolved.appId, resolved.arg);
            this.onCloseRequest();
        };

        if (okBtn) okBtn.addEventListener('click', submit);
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.onCloseRequest());
        if (browseBtn) browseBtn.addEventListener('click', () => {
            if (this.onBrowse) this.onBrowse();
            this.onCloseRequest();
        });
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') this.onCloseRequest();
            });
            input.addEventListener('input', () => { errEl.textContent = ''; });
        }
    }

    cleanup() {}
}
