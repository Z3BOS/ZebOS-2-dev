// Reinstaller, triggered from the Run tool
// Dev mode is the only accessible way to trigger a full reinstall of ZebOS from inside a running session.
// Wipes the VFS and every setting back to factory defaults, then restarts
// ZebOS (a real reload), the same way the boot-time Recovery > Reinstall
// tab does, just triggered from inside a running session.
import { showOsConfirm } from '../os.js';

export class ReinstallerApp {
    constructor(onCloseRequest, api) {
        this.onCloseRequest = onCloseRequest;
        this.api = api; // { reinstallAndRestart() }
        this.container = null;
        this.busy = false;
    }

    open(windowBodyElement) {
        this.container = windowBodyElement;
        this.container.style.height = '100%';
        this.render();
    }

    cleanup() {}

    _btnStyle(extra = '') {
        return `background:#c0c0c0;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;padding:5px 14px;cursor:pointer;font-family:Arial,sans-serif;font-size:11px;outline:none;${extra}`;
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#c0c0c0;font-family:Arial,Helvetica,sans-serif;font-size:11px;padding:16px;box-sizing:border-box;user-select:none;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:36px;height:36px;flex-shrink:0;color:#ffffff;display:flex;align-items:center;justify-content:center;background:#d32f2f;border:2px solid #800000;border-radius:50%;font-weight:bold;font-size:22px;line-height:1;">!</div>
                <div style="line-height:1.5;color:#000;">
                    <div style="font-weight:bold;margin-bottom:6px;">Reinstall ZebOS</div>
                    <div>This permanently erases every file on ZebRoot (Z:) and resets all
                    settings — background, sound, taskbar, everything — to their factory
                    defaults. This cannot be undone. Back up first from Recovery Mode if
                    you're not sure.</div>
                </div>
            </div>
            <div style="flex-grow:1;"></div>
            <div id="reinstaller-status" style="min-height:16px;margin-bottom:8px;font-weight:bold;"></div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button id="reinstaller-go" style="${this._btnStyle('font-weight:bold;color:#800000;')}" ${this.busy ? 'disabled' : ''}>Reinstall ZebOS...</button>
                <button id="reinstaller-cancel" style="${this._btnStyle()}">Close</button>
            </div>
        </div>`;
        this.bindEvents();
    }

    bindEvents() {
        const goBtn = this.container.querySelector('#reinstaller-go');
        const cancelBtn = this.container.querySelector('#reinstaller-cancel');

        if (goBtn) goBtn.addEventListener('click', () => {
            if (this.busy) return;
            showOsConfirm(
                'Reinstall ZebOS',
                'This will permanently erase all files and reset every setting, then restart ZebOS. Continue?',
                true,
                () => {
                    this.busy = true;
                    const status = this.container.querySelector('#reinstaller-status');
                    if (status) status.textContent = 'Reinstalling... ZebOS will restart in a moment.';
                    if (goBtn) goBtn.disabled = true;
                    this.api.reinstallAndRestart();
                }
            );
        });

        if (cancelBtn) cancelBtn.addEventListener('click', () => this.onCloseRequest());
    }
}
