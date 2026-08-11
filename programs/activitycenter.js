import { getIcon, playSystemSound, showOsConfirm } from '../os.js';

export class ActivityCenterApp {
    constructor(onClose) {
        this.onClose = onClose;
        this.root = null;
        this.clockTimer = null;
        this.boundHandlers = [];
        this.selectedAction = null;
    }

    open(container) {
        this.root = container;
        this.root.style.background = '#c0c0c0';
        this.root.style.display = 'flex';
        this.root.style.flexDirection = 'column';
        this.root.style.height = '100%';
        this.root.style.fontFamily = 'Arial, sans-serif';
        this.root.style.userSelect = 'none';

        const now = new Date();

        this.root.innerHTML = `
            <div style="background:#c0c0c0; border-bottom:2px solid #808080; padding:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                <button class="app-toolbar-btn" id="ac-run-selected">${getIcon('play')} Run Selected</button>
                <button class="app-toolbar-btn" id="ac-open-props">${getIcon('settings')} Properties</button>
                <button class="app-toolbar-btn" id="ac-refresh">${getIcon('taskmgr')} Refresh</button>
                <button class="app-toolbar-btn" id="ac-close">${getIcon('winClose')} Close</button>
            </div>

            <div style="display:flex; gap:6px; padding:6px; flex:1; min-height:0;">
                <div style="width:44%; min-width:220px; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; display:flex; flex-direction:column; min-height:0;">
                    <div style="background:#000080; color:#fff; font-size:12px; font-weight:bold; padding:4px 6px;">
                        Important Programs
                    </div>
                    <div id="ac-program-list" style="padding:4px; overflow:auto; flex:1;"></div>
                </div>

                <div style="flex:1; min-width:260px; display:flex; flex-direction:column; gap:6px; min-height:0;">
                    <div style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:8px;">
                        <div style="font-size:12px; font-weight:bold; margin-bottom:6px;">System Status</div>
                        <div style="font-size:12px; line-height:1.5;">
                            <div><b>User:</b> <span id="ac-user">Guest</span></div>
                            <div><b>Date:</b> <span id="ac-date">${now.toLocaleDateString()}</span></div>
                            <div><b>Time:</b> <span id="ac-time">--:--:--</span></div>
                            <div><b>Active Window:</b> <span id="ac-active-window">None</span></div>
                        </div>
                    </div>

                    <div style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:8px; flex:1; min-height:120px;">
                        <div style="font-size:12px; font-weight:bold; margin-bottom:6px;">Quick Actions</div>
                        <div style="display:grid; grid-template-columns:repeat(2,minmax(120px,1fr)); gap:6px;">
                            <button class="app-toolbar-btn" id="ac-action-showdesktop">${getIcon('home')} Show Desktop</button>
                            <button class="app-toolbar-btn" id="ac-action-taskmgr">${getIcon('taskmgr')} Task Manager</button>
                            <button class="app-toolbar-btn" id="ac-action-files">${getIcon('explorer')} File Explorer</button>
                            <button class="app-toolbar-btn" id="ac-action-personalize">${getIcon('personalize')} Display Props</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.programs = [
            { id: 'start-link-files',        icon: 'explorer',    label: 'Zeb Explorer',     desc: 'Browse files and folders' },
            { id: 'start-link-text-editor',  icon: 'editor',      label: 'Text Editor',      desc: 'Edit text documents' },
            { id: 'start-link-prompt',       icon: 'terminal',    label: 'Zeb Terminal',     desc: 'Command interface' },
            { id: 'start-link-paint',        icon: 'paint',       label: 'Paint Studio',     desc: 'Create and edit images' },
            { id: 'start-link-calc',         icon: 'calc',        label: 'Calculator',       desc: 'Perform calculations' },
            { id: 'start-link-taskmgr',      icon: 'taskmgr',     label: 'Task Manager',     desc: 'View running tasks' },
            { id: 'start-link-media',        icon: 'media',       label: 'Media Player',     desc: 'Play media files' },
            { id: 'start-link-personalize',  icon: 'personalize', label: 'Display Properties', desc: 'Theme and desktop settings' }
        ];

        this.renderProgramList();
        this.bindEvents();
        this.startClock();
        this.refreshStatus();
    }

    renderProgramList() {
        const list = this.root.querySelector('#ac-program-list');
        if (!list) return;

        list.innerHTML = '';
        this.programs.forEach((p, index) => {
            const row = document.createElement('div');
            row.className = 'app-list-row';
            row.dataset.appId = p.id;
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                    ${getIcon(p.icon)}
                    <div style="display:flex; flex-direction:column; min-width:0;">
                        <span style="font-weight:bold; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.label}</span>
                        <span style="font-size:11px; opacity:.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.desc}</span>
                    </div>
                </div>
                <button class="app-toolbar-btn" data-run="${p.id}" style="padding:2px 8px; font-size:11px;">Run</button>
            `;

            row.addEventListener('click', () => {
                this.selectProgramRow(row);
                this.selectedAction = p.id;
            });

            row.addEventListener('dblclick', () => {
                this.runApp(p.id);
            });

            const runBtn = row.querySelector(`button[data-run="${p.id}"]`);
            if (runBtn) {
                runBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.runApp(p.id);
                });
            }

            if (index === 0) {
                this.selectProgramRow(row);
                this.selectedAction = p.id;
            }

            list.appendChild(row);
        });
    }

    selectProgramRow(target) {
        this.root.querySelectorAll('.app-list-row').forEach(r => r.classList.remove('selected'));
        target.classList.add('selected');
        playSystemSound('click');
    }

    runApp(appId) {
        playSystemSound('open');
        const openEvent = new CustomEvent('zebos:launch-app', { detail: { appId } });
        window.dispatchEvent(openEvent);
    }

    bindEvents() {
        const on = (selector, type, fn) => {
            const el = this.root.querySelector(selector);
            if (!el) return;
            el.addEventListener(type, fn);
            this.boundHandlers.push({ el, type, fn });
        };

        on('#ac-run-selected', 'click', () => {
            if (!this.selectedAction) return;
            this.runApp(this.selectedAction);
        });

        on('#ac-open-props', 'click', () => this.runApp('start-link-personalize'));
        on('#ac-refresh', 'click', () => {
            playSystemSound('click');
            this.refreshStatus();
            this.renderProgramList();
        });

        on('#ac-close', 'click', () => this.onClose && this.onClose());

        on('#ac-action-taskmgr', 'click', () => this.runApp('start-link-taskmgr'));
        on('#ac-action-files', 'click', () => this.runApp('start-link-files'));
        on('#ac-action-personalize', 'click', () => this.runApp('start-link-personalize'));

        on('#ac-action-showdesktop', 'click', () => {
            showOsConfirm(
                'Show Desktop',
                'Minimize all open windows and show desktop?',
                false,
                () => {
                    document.querySelectorAll('.window-frame').forEach(win => {
                        if (!win.id.includes('app-activitycenter') && !win.id.includes('activitycenter')) {
                            win.classList.add('hidden-view');
                        }
                    });
                }
            );
        });

        const launchProxy = (e) => {
            const appId = e?.detail?.appId;
            if (!appId) return;
            if (typeof window.launchApplicationFromActivityCenter === 'function') {
                window.launchApplicationFromActivityCenter(appId);
            }
        };
        window.addEventListener('zebos:launch-app', launchProxy);
        this.boundHandlers.push({ el: window, type: 'zebos:launch-app', fn: launchProxy });
    }

    refreshStatus() {
        const userEl = this.root.querySelector('#ac-user');
        const activeEl = this.root.querySelector('#ac-active-window');
        if (userEl && window.zebosState?.currentUser) {
            userEl.textContent = window.zebosState.currentUser;
        }
        if (activeEl) {
            const activeWin = document.querySelector('.window-frame.active-window .window-title');
            activeEl.textContent = activeWin ? activeWin.textContent.trim() : 'None';
        }
    }

    startClock() {
        const timeEl = this.root.querySelector('#ac-time');
        if (!timeEl) return;

        const tick = () => {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString();
        };
        tick();
        this.clockTimer = setInterval(tick, 1000);
    }

    cleanup() {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
            this.clockTimer = null;
        }
        this.boundHandlers.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
        this.boundHandlers = [];
        this.root = null;
    }
}