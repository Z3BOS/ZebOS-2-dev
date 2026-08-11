// programs/taskmgr.js - ZebOS 2 Task Manager
// Lists currently-open app windows (scraped from the DOM, since the shell keeps
// no central window registry) with an End Task action.
import { closeWindow } from '../os.js';

export class TaskManagerApp {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;
        this.bodyElement = null;
        this.selectedId = null;
        this.pollInterval = null;
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(bodyElement) {
        this.bodyElement = bodyElement;
        this.bodyElement.style.height = "100%";
        window.addEventListener('keydown', this.boundKeyDown);
        this.render();
        this.pollInterval = setInterval(() => this.render(), 1000);
    }

    scanWindows() {
        return Array.from(document.querySelectorAll('.window-frame')).map(el => {
            const iconEl = el.querySelector('.win-title-icon');
            const titleEl = el.querySelector('.window-title');
            return {
                id: el.id.slice(4),
                icon: iconEl ? iconEl.innerHTML : '',
                title: titleEl ? titleEl.textContent.trim() : '(Untitled)',
                active: el.classList.contains('active-window')
            };
        });
    }

    render() {
        if (!this.bodyElement) return;

        const rows = this.scanWindows();
        if (this.selectedId && !rows.find(r => r.id === this.selectedId)) {
            this.selectedId = null;
        }

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box;">
                <div style="padding:6px 8px; font-size:12px; font-weight:bold; color:#000080; border-bottom:1px solid #808080; flex-shrink:0;">
                    Applications
                </div>
                <div style="flex-grow:1; overflow-y:auto; background:#ffffff; margin:6px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;">
                    ${rows.length === 0
                        ? `<div style="padding:16px; text-align:center; color:#666; font-size:12px;">No applications are running.</div>`
                        : rows.map(row => `
                            <div class="app-list-row ${row.id === this.selectedId ? 'selected' : ''}" data-id="${row.id}">
                                <span class="sys-icon">${row.icon}</span>
                                <span style="flex-grow:1;">${row.title}</span>
                                <span style="font-size:10px; opacity:0.75;">${row.active ? 'Running' : 'Running (background)'}</span>
                            </div>
                        `).join('')}
                </div>
                <div style="padding:6px 8px; display:flex; justify-content:flex-end; gap:6px; flex-shrink:0;">
                    <button class="app-toolbar-btn taskmgr-end-task-btn" ${this.selectedId ? '' : 'disabled'}>End Task</button>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        this.bodyElement.querySelectorAll('.app-list-row').forEach(row => {
            row.addEventListener('click', () => {
                this.selectedId = row.dataset.id;
                this.render();
            });
            row.addEventListener('dblclick', () => {
                closeWindow(row.dataset.id);
                this.selectedId = null;
                this.render();
            });
        });

        const endBtn = this.bodyElement.querySelector('.taskmgr-end-task-btn');
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                if (!this.selectedId) return;
                closeWindow(this.selectedId);
                this.selectedId = null;
                this.render();
            });
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    cleanup() {
        clearInterval(this.pollInterval);
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}
