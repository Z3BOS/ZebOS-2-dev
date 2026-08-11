import { getIcon } from '../icons.js';
import { playSystemSound, showOsConfirm } from '../os.js';

export class ActivityCenterApp {
    constructor(onClose) {
        this.onClose = onClose;
        this.root = null;
        this.clockTimer = null;
        this.boundHandlers = [];
        this.selectedProgram = null;

        this.programs = [
            {
                id: 'start-link-activitycenter',
                icon: 'activitycenter',
                label: 'Activity Center',
                desc: 'System activity & launcher dashboard',
                execPath: 'Z:\\ZebApps\\Activity Center\\activitycenter.exe',
                category: 'System Utility',
                version: '2.6.0 Beta',
                size: '185 KB',
                ram: '1.4 MB',
                status: 'Running'
            },
            {
                id: 'start-link-files',
                icon: 'explorer',
                label: 'Zeb Explorer',
                desc: 'Browse virtual file system folders & drives',
                execPath: 'Z:\\ZebApps\\Zeb Explorer\\explorer.exe',
                category: 'File Management',
                version: '2.6.0 Beta',
                size: '410 KB',
                ram: '2.2 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-text-editor',
                icon: 'editor',
                label: 'Text Editor',
                desc: 'Edit text, ZDL scripts, & configuration files',
                execPath: 'Z:\\ZebApps\\Text Editor\\editor.exe',
                category: 'Productivity',
                version: '2.5.8',
                size: '142 KB',
                ram: '0.9 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-prompt',
                icon: 'terminal',
                label: 'Zeb Terminal',
                desc: 'Command prompt interface for system tasks',
                execPath: 'Z:\\ZebApps\\Terminal\\cmd.exe',
                category: 'Developer Tools',
                version: '2.6.0 Beta',
                size: '220 KB',
                ram: '1.1 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-paint',
                icon: 'paint',
                label: 'Paint Studio',
                desc: 'Raster graphics editor & drawing suite',
                execPath: 'Z:\\ZebApps\\Paint Studio\\paint.exe',
                category: 'Graphics & Design',
                version: '2.4.1',
                size: '512 KB',
                ram: '3.5 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-calc',
                icon: 'calc',
                label: 'Calculator',
                desc: 'Perform standard & scientific calculations',
                execPath: 'Z:\\ZebApps\\Calculator\\calc.exe',
                category: 'Utilities',
                version: '2.0.0',
                size: '96 KB',
                ram: '0.5 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-taskmgr',
                icon: 'taskmgr',
                label: 'Task Manager',
                desc: 'Monitor processes, CPU, & system resources',
                execPath: 'Z:\\ZebApps\\Task Manager\\taskmgr.exe',
                category: 'System Diagnostics',
                version: '2.6.0 Beta',
                size: '340 KB',
                ram: '1.6 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-media',
                icon: 'media',
                label: 'Media Player',
                desc: 'Play audio waveforms & retro media streams',
                execPath: 'Z:\\ZebApps\\Media Player\\player.exe',
                category: 'Multimedia',
                version: '2.3.0',
                size: '620 KB',
                ram: '4.1 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-solitaire',
                icon: 'solitaire',
                label: 'Klondike Solitaire',
                desc: 'Classic card solitaire engine',
                execPath: 'Z:\\ZebApps\\Solitaire\\solitaire.exe',
                category: 'Entertainment',
                version: '1.9.0',
                size: '280 KB',
                ram: '1.7 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-chess',
                icon: 'chess',
                label: 'Chess Engine',
                desc: 'Strategic chess engine vs computer or local P2P',
                execPath: 'Z:\\ZebApps\\Chess\\chess.exe',
                category: 'Entertainment',
                version: '2.1.0',
                size: '490 KB',
                ram: '2.8 MB',
                status: 'Ready'
            },
            {
                id: 'start-link-personalize',
                icon: 'personalize',
                label: 'Display Properties',
                desc: 'Customize wallpaper, schemes, & themes',
                execPath: 'Z:\\ZebApps\\System Info\\desk.cpl',
                category: 'Control Panel',
                version: '2.6.0 Beta',
                size: '150 KB',
                ram: '1.0 MB',
                status: 'Ready'
            }
        ];
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
            <div style="background:#c0c0c0; border-bottom:2px solid #808080; padding:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap; box-sizing:border-box;">
                <button class="app-toolbar-btn" id="ac-run-selected" style="font-weight:bold;">${getIcon('play')} Run Selected</button>
                <button class="app-toolbar-btn" id="ac-open-props">${getIcon('settings')} Properties</button>
                <button class="app-toolbar-btn" id="ac-refresh">${getIcon('taskmgr')} Refresh</button>
                <button class="app-toolbar-btn" id="ac-close" style="margin-left:auto;">${getIcon('winClose')} Close</button>
            </div>

            <div style="display:flex; gap:6px; padding:6px; flex:1; min-height:0; box-sizing:border-box;">
                <!-- Left Program Selection Panel -->
                <div style="width:45%; min-width:230px; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; display:flex; flex-direction:column; min-height:0;">
                    <div style="background:linear-gradient(90deg, #000080 0%, #008080 100%); color:#fff; font-size:11px; font-weight:bold; padding:4px 8px; display:flex; justify-content:space-between; align-items:center;">
                        <span>System Applications</span>
                        <span style="font-weight:normal; font-size:10px; opacity:0.9;">(${this.programs.length} Registered)</span>
                    </div>
                    <div id="ac-program-list" style="padding:2px; overflow-y:auto; flex:1;"></div>
                </div>

                <!-- Right Telemetry & App Overview Panel -->
                <div style="flex:1; min-width:270px; display:flex; flex-direction:column; gap:6px; min-height:0;">
                    <!-- System Status Box -->
                    <div style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:8px;">
                        <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:4px; border-bottom:1px solid #c0c0c0; padding-bottom:2px; display:flex; justify-content:space-between; align-items:center;">
                            <span>System Diagnostics</span>
                            <span style="font-size:10px; color:#008000; font-weight:bold;">● ONLINE</span>
                        </div>
                        <div style="font-size:11px; line-height:1.5; display:grid; grid-template-columns:1fr 1fr; gap:2px 8px;">
                            <div><b>User:</b> <span id="ac-user">Guest</span></div>
                            <div><b>Date:</b> <span id="ac-date">${now.toLocaleDateString()}</span></div>
                            <div><b>Time:</b> <span id="ac-time">--:--:--</span></div>
                            <div><b>Active Window:</b> <span id="ac-active-window">None</span></div>
                        </div>
                    </div>

                    <!-- Selected Program Detail Card -->
                    <div id="ac-selected-detail-card" style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:8px; flex:1; display:flex; flex-direction:column; min-height:0;">
                        <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:6px; border-bottom:1px solid #c0c0c0; padding-bottom:2px;">
                            Application Overview
                        </div>
                        <div id="ac-detail-content" style="flex:1; overflow-y:auto; font-size:11px; line-height:1.45;">
                            <!-- Populated dynamically on selection -->
                        </div>
                    </div>

                    <!-- Quick System Actions Box -->
                    <div style="background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; padding:6px;">
                        <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:4px;">Quick Actions</div>
                        <div style="display:grid; grid-template-columns:repeat(2, minmax(110px,1fr)); gap:4px;">
                            <button class="app-toolbar-btn" id="ac-action-showdesktop">${getIcon('home')} Show Desktop</button>
                            <button class="app-toolbar-btn" id="ac-action-taskmgr">${getIcon('taskmgr')} Task Manager</button>
                            <button class="app-toolbar-btn" id="ac-action-files">${getIcon('explorer')} File Explorer</button>
                            <button class="app-toolbar-btn" id="ac-action-personalize">${getIcon('personalize')} Display Props</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

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
            row.className = 'ac-program-row';
            row.dataset.appId = p.id;
            row.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 6px;
                margin-bottom: 2px;
                border: 1px solid transparent;
                cursor: pointer;
                border-radius: 2px;
            `;

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                    <div style="width:20px; height:20px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">${getIcon(p.icon)}</div>
                    <div style="display:flex; flex-direction:column; min-width:0;">
                        <span class="ac-row-title" style="font-weight:bold; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.label}</span>
                        <span class="ac-row-desc" style="font-size:10px; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.desc}</span>
                    </div>
                </div>
                <button class="app-toolbar-btn ac-row-run-btn" data-run="${p.id}" style="padding:1px 6px; font-size:10px; flex-shrink:0; margin-left:4px;">Run</button>
            `;

            row.addEventListener('click', () => {
                this.selectProgramRow(row, p);
            });

            row.addEventListener('dblclick', () => {
                this.runApp(p.id);
            });

            const runBtn = row.querySelector(`.ac-row-run-btn`);
            if (runBtn) {
                runBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.runApp(p.id);
                });
            }

            if (index === 0) {
                this.selectProgramRow(row, p);
            }

            list.appendChild(row);
        });
    }

    selectProgramRow(rowElement, program) {
        this.root.querySelectorAll('.ac-program-row').forEach(r => {
            r.style.background = 'transparent';
            r.style.color = '#000000';
            r.style.border = '1px solid transparent';
            const desc = r.querySelector('.ac-row-desc');
            if (desc) desc.style.opacity = '0.75';
        });

        rowElement.style.background = '#000080';
        rowElement.style.color = '#ffffff';
        rowElement.style.border = '1px dotted #ffffff';
        const desc = rowElement.querySelector('.ac-row-desc');
        if (desc) desc.style.opacity = '0.9';

        this.selectedProgram = program;
        this.updateDetailCard(program);
        playSystemSound('click');
    }

    updateDetailCard(p) {
        const detailContainer = this.root.querySelector('#ac-detail-content');
        if (!detailContainer || !p) return;

        detailContainer.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; background:#f0f0f0; padding:6px; border:1px solid #d0d0d0;">
                <div style="width:32px; height:32px; flex-shrink:0;">${getIcon(p.icon)}</div>
                <div style="min-width:0;">
                    <div style="font-weight:bold; font-size:12px; color:#000080;">${p.label}</div>
                    <div style="font-size:10px; color:#555555;">${p.category}</div>
                </div>
            </div>
            
            <div style="margin-bottom:6px;"><b>Description:</b> ${p.desc}</div>
            <div style="margin-bottom:4px;"><b>Executable Path:</b> <code style="font-family:monospace; background:#e8e8e8; padding:1px 3px; border:1px solid #cccccc; font-size:10px;">${p.execPath}</code></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:8px; background:#fafafa; padding:6px; border:1px solid #e0e0e0;">
                <div><b>Version:</b> ${p.version}</div>
                <div><b>Binary Size:</b> ${p.size}</div>
                <div><b>RAM Footprint:</b> ${p.ram}</div>
                <div><b>Status:</b> <span style="color:#008000; font-weight:bold;">${p.status}</span></div>
            </div>
            
            <div style="display:flex; gap:6px; margin-top:10px;">
                <button class="app-toolbar-btn" id="ac-card-run" style="font-weight:bold; padding:3px 10px;">${getIcon('play')} Launch Program</button>
                <button class="app-toolbar-btn" id="ac-card-props" style="padding:3px 10px;">${getIcon('settings')} View Properties</button>
            </div>
        `;

        const cardRun = detailContainer.querySelector('#ac-card-run');
        if (cardRun) cardRun.addEventListener('click', () => this.runApp(p.id));

        const cardProps = detailContainer.querySelector('#ac-card-props');
        if (cardProps) cardProps.addEventListener('click', () => this.showProgramProperties(p));
    }

    showProgramProperties(program) {
        if (!program) return;
        playSystemSound('click');

        const existingModal = document.getElementById('ac-properties-modal');
        if (existingModal) existingModal.remove();

        const overlay = document.createElement('div');
        overlay.id = 'ac-properties-modal';
        overlay.className = 'os-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: transparent;
            display: flex; align-items: center; justify-content: center;
            z-index: 100010;
        `;

        overlay.innerHTML = `
            <div class="window-frame active-window" style="width:360px; height:auto; position:relative; left:auto; top:auto; transform:none; box-shadow:4px 4px 16px rgba(0,0,0,0.5);">
                <div class="window-header">
                    <div class="window-title" style="display:flex; align-items:center; gap:6px;">
                        <span style="width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center;">${getIcon(program.icon)}</span>
                        <span>${program.label} Properties</span>
                    </div>
                    <div class="window-controls">
                        <button class="win-btn" id="ac-modal-close-x">${getIcon('winClose')}</button>
                    </div>
                </div>

                <div class="window-body" style="padding:10px; background:#c0c0c0; display:flex; flex-direction:column; gap:8px; user-select:none;">
                    <!-- Win95 Tab Header -->
                    <div style="display:flex; align-items:flex-end; padding-left:4px; gap:2px;">
                        <div style="background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom:none; padding:3px 12px; font-weight:bold; font-size:11px; z-index:2; margin-bottom:-2px; border-top-left-radius:2px; border-top-right-radius:2px;">
                            General
                        </div>
                    </div>

                    <!-- Main Tab Content Box -->
                    <div style="background:#c0c0c0; border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:#808080; padding:10px; display:flex; flex-direction:column; gap:8px;">
                        
                        <!-- Header Icon & Name -->
                        <div style="display:flex; align-items:center; gap:12px; padding-bottom:6px; border-bottom:1px solid #808080;">
                            <div style="width:32px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">${getIcon(program.icon)}</div>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:bold; font-size:12px; color:#000080;">${program.label}</span>
                                <span style="font-size:10px; color:#555555;">${program.category}</span>
                            </div>
                        </div>

                        <!-- Grid Properties Details -->
                        <div style="font-size:11px; line-height:1.6; display:grid; grid-template-columns:105px 1fr; gap:4px 6px; align-items:center;">
                            <span style="font-weight:bold; text-align:right; color:#333333;">Type of file:</span>
                            <span>Application Executable (.exe)</span>

                            <span style="font-weight:bold; text-align:right; color:#333333;">Location:</span>
                            <code style="font-family:monospace; font-size:10px; background:#ffffff; border:1px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:1px 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${program.execPath}</code>

                            <span style="font-weight:bold; text-align:right; color:#333333;">Size on disk:</span>
                            <span>${program.size}</span>

                            <span style="font-weight:bold; text-align:right; color:#333333;">Memory footprint:</span>
                            <span>${program.ram}</span>

                            <span style="font-weight:bold; text-align:right; color:#333333;">Kernel Version:</span>
                            <span>${program.version}</span>

                            <span style="font-weight:bold; text-align:right; color:#333333;">Execution Status:</span>
                            <span style="color:#008000; font-weight:bold;">${program.status}</span>
                        </div>

                        <hr style="border:none; border-top:1px solid #808080; border-bottom:1px solid #ffffff; margin:2px 0;">

                        <!-- Attributes -->
                        <div style="display:flex; align-items:center; gap:10px; font-size:11px;">
                            <span style="font-weight:bold; width:105px; text-align:right; color:#333333;">Attributes:</span>
                            <label style="display:inline-flex; align-items:center; gap:4px; cursor:default;">
                                <input type="checkbox" checked disabled style="margin:0;"> Read-only
                            </label>
                            <label style="display:inline-flex; align-items:center; gap:4px; cursor:default;">
                                <input type="checkbox" checked disabled style="margin:0;"> System Binary
                            </label>
                        </div>
                    </div>

                    <!-- Footer Action Buttons -->
                    <div style="display:flex; justify-content:flex-end; gap:6px; padding-top:2px;">
                        <button id="ac-modal-ok" class="app-toolbar-btn" style="padding:3px 22px; font-weight:bold;">OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#ac-modal-close-x').addEventListener('click', close);
        overlay.querySelector('#ac-modal-ok').addEventListener('click', close);
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
            if (!this.selectedProgram) return;
            this.runApp(this.selectedProgram.id);
        });

        // Properties button now opens Properties modal for the selected program!
        on('#ac-open-props', 'click', () => {
            if (this.selectedProgram) {
                this.showProgramProperties(this.selectedProgram);
            }
        });

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