// Welcome to Recovery!

// A pre-desktop, full-screen maintenance console (Backup/Restore, Reinstall,
// System Flags, Shell), entered by holding Ctrl+Shift+R during boot.
// Mirrors logon/logon.js: a self-contained overlay that knows nothing about
// systemState directly — everything it needs comes through the `api` callbacks
// os.js builds for it (see buildRecoveryApi in os.js).

import { getIcon } from '../icons.js';
import { showOsConfirm } from '../os.js';

const TABS = [
    { id: 'backup', label: 'Backup & Restore' },
    { id: 'reinstall', label: 'Reinstall' },
    { id: 'flags', label: 'System Flags' },
    { id: 'shell', label: 'Shell' }
];

const SOUND_SCHEMES = [
    { value: 'classic', label: 'Classic ZebOS Synthesizer' },
    { value: 'muted', label: 'Muted (No Audio)' }
];
const DESKTOP_SCHEMES = [
    { value: 'standard', label: 'Standard' },
    { value: 'high-contrast', label: 'High Contrast Dark' },
    { value: 'rose', label: 'Rose Retro' },
    { value: 'emerald', label: 'Emerald Desktop' },
    { value: 'midnight', label: 'Midnight Blue' }
];

export function showRecoveryScreen(api) {
    const screen = document.createElement('div');
    screen.id = 'recovery-screen';
    screen.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        z-index:97000; opacity:1; transition:opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(screen);

    let activeTab = 'backup';
    let terminalInstance = null;

    function exitRecovery() {
        if (terminalInstance) { terminalInstance.cleanup(); terminalInstance = null; }
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 300);
        api.onExit();
    }

    function render() {
        if (terminalInstance) { terminalInstance.cleanup(); terminalInstance = null; }

        screen.innerHTML = `
            <div class="recovery-root">
                <div class="recovery-window">
                    <div class="recovery-titlebar">
                        <div class="recovery-title">${getIcon('settings')} ZebOS Recovery Mode</div>
                        <div class="recovery-version">Kernel v${api.getVersion()}</div>
                    </div>
                    <div class="recovery-tabs">
                        ${TABS.map(t => `<button class="recovery-tab-btn ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
                    </div>
                    <div class="recovery-content">${renderTabContent()}</div>
                    <div class="recovery-footer">
                        <button class="recovery-btn recovery-exit-btn">Continue to ZebOS &rarr;</button>
                    </div>
                </div>
            </div>
        `;

        bindEvents();
    }

    function renderTabContent() {
        if (activeTab === 'backup') return renderBackupTab();
        if (activeTab === 'reinstall') return renderReinstallTab();
        if (activeTab === 'flags') return renderFlagsTab();
        if (activeTab === 'shell') return renderShellTab();
        return '';
    }

    function renderBackupTab() {
        return `
            <div class="recovery-panel">
                <h3>Backup &amp; Restore</h3>
                <p>Download a full backup of your files and settings, or restore from a previously saved backup file.</p>
                <button class="recovery-btn" id="recovery-download-backup">Download Backup</button>
                <div class="recovery-restore-row">
                    <label for="recovery-restore-input">Restore from file:</label>
                    <input type="file" accept=".json,application/json" id="recovery-restore-input">
                </div>
                <div class="recovery-status" id="recovery-backup-status"></div>
            </div>
        `;
    }

    function renderReinstallTab() {
        return `
            <div class="recovery-panel">
                <h3>Reinstall ZebOS</h3>
                <p>This permanently erases every file and resets all settings to their factory defaults. This cannot be undone! Back up first if you're not sure.</p>
                <button class="recovery-btn recovery-danger-btn" id="recovery-reinstall-btn">Reinstall ZebOS</button>
                <div class="recovery-status" id="recovery-reinstall-status"></div>
            </div>
        `;
    }

    function renderFlagsTab() {
        const flags = api.getFlags();
        return `
            <div class="recovery-panel">
                <h3>System Flags</h3>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="autoDevMode" ${flags.autoDevMode ? 'checked' : ''}> Auto-enter Dev Mode on boot</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="skipBootAnimation" ${flags.skipBootAnimation ? 'checked' : ''}> Skip boot animation</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="alwaysShowSetup" ${flags.alwaysShowSetup ? 'checked' : ''}> Show setup screen on boot every time</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="alwaysShowOobe" ${flags.alwaysShowOobe ? 'checked' : ''}> Always show the full OOBE wizard on boot</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="disableKernelLogs" ${flags.disableKernelLogs ? 'checked' : ''}> Disable kernel logs on startup</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="autoArrange" ${flags.autoArrange ? 'checked' : ''}> Auto-arrange desktop icons</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="taskbarAutoHide" ${flags.taskbarAutoHide ? 'checked' : ''}> Auto-hide taskbar</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="roundedCorners" ${flags.roundedCorners ? 'checked' : ''}> Rounded window corners</label></div>
                <div class="recovery-flag-row"><label><input type="checkbox" data-flag="linuxEmulationEnabled" ${flags.linuxEmulationEnabled ? 'checked' : ''}> Linux Emulation (v86) enabled</label></div>
                <div class="recovery-flag-row">
                    <label>Desktop sort:
                        <select data-flag="desktopSortBy">
                            <option value="type" ${flags.desktopSortBy === 'type' ? 'selected' : ''}>Type</option>
                            <option value="name" ${flags.desktopSortBy === 'name' ? 'selected' : ''}>Name</option>
                        </select>
                    </label>
                </div>
                <div class="recovery-flag-row">
                    <label>Sound scheme:
                        <select data-flag="soundScheme">
                            ${SOUND_SCHEMES.map(s => `<option value="${s.value}" ${flags.soundScheme === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="recovery-flag-row">
                    <label>Color scheme:
                        <select data-flag="desktopScheme">
                            ${DESKTOP_SCHEMES.map(s => `<option value="${s.value}" ${flags.desktopScheme === s.value ? 'selected' : ''}>${s.label}</option>`).join('')}
                        </select>
                    </label>
                </div>
            </div>
        `;
    }

    function renderShellTab() {
        return `<div class="recovery-panel recovery-shell-panel"><div class="recovery-shell-mount"></div></div>`;
    }

    function bindEvents() {
        screen.querySelectorAll('.recovery-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
        });
        screen.querySelector('.recovery-exit-btn')?.addEventListener('click', exitRecovery);

        if (activeTab === 'backup') bindBackupTab();
        else if (activeTab === 'reinstall') bindReinstallTab();
        else if (activeTab === 'flags') bindFlagsTab();
        else if (activeTab === 'shell') bindShellTab();
    }

    function bindBackupTab() {
        const status = screen.querySelector('#recovery-backup-status');

        screen.querySelector('#recovery-download-backup')?.addEventListener('click', () => {
            const blob = new Blob([api.createBackup()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'zebos-backup.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            if (status) { status.textContent = 'Backup downloaded.'; status.className = 'recovery-status ok'; }
        });

        const fileInput = screen.querySelector('#recovery-restore-input');
        fileInput?.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const result = api.restoreBackup(String(reader.result));
                if (status) {
                    status.textContent = result.message;
                    status.className = `recovery-status ${result.ok ? 'ok' : 'error'}`;
                }
                if (result.ok && activeTab === 'flags') render();
            };
            reader.onerror = () => {
                if (status) { status.textContent = 'Could not read the selected file.'; status.className = 'recovery-status error'; }
            };
            reader.readAsText(file);
        });
    }

    function bindReinstallTab() {
        const status = screen.querySelector('#recovery-reinstall-status');
        screen.querySelector('#recovery-reinstall-btn')?.addEventListener('click', () => {
            showOsConfirm(
                'Reinstall ZebOS',
                'This will permanently erase all files and reset every setting. Continue?',
                true,
                () => {
                    api.reinstall();
                    if (status) {
                        status.textContent = 'Fresh install complete. Click "Continue to ZebOS" to boot.';
                        status.className = 'recovery-status ok';
                    }
                }
            );
        });
    }

    function bindFlagsTab() {
        screen.querySelectorAll('[data-flag]').forEach(el => {
            el.addEventListener('change', () => {
                const value = el.type === 'checkbox' ? el.checked : el.value;
                api.setFlag(el.dataset.flag, value);
            });
        });
    }

    function bindShellTab() {
        const mount = screen.querySelector('.recovery-shell-mount');
        if (!mount) return;
        (async () => {
            try {
                const module = await import('../programs/terminal.js');
                terminalInstance = new module.ZebTerminal(() => {}, api.shellApi);
                terminalInstance.open(mount);
            } catch (err) {
                mount.textContent = `Failed to load shell: ${err.message}`;
            }
        })();
    }

    render();
}
