// Task List app for ZebOS 2. A simple to-do list that persists in localStorage.
// This is mainly a test app for UIKit 1.0
import { BaseApp, toolbarButton, escapeHtml } from '../UIKit/framework/index.js';

const STORAGE_KEY = 'ZEBOS_V2_TASKLIST';

export class TaskListApp extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);
        this.tasks = this._loadTasks();
        this.nextId = this.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;

        this.on('click', '[data-action="add"]', () => this.addTask());
        this.on('change', '[data-action="toggle"]', (el) => this.toggleTask(Number(el.dataset.id)));
        this.on('click', '[data-action="delete"]', (el) => this.deleteTask(Number(el.dataset.id)));
        this.on('click', '[data-action="clear-completed"]', () => this.clearCompleted());
    }

    mount() {
        this.render(`
            <style>
                .tasklist-shell { display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:8px; gap:8px; font-family:Arial, sans-serif; font-size:12px; }
                .tasklist-toolbar { display:flex; gap:6px; flex-shrink:0; }
                .tasklist-input {
                    flex-grow:1; box-sizing:border-box; padding:4px 6px; font-size:12px;
                    border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;
                    background:#ffffff; outline:none; font-family:inherit;
                }
                .tasklist-rows {
                    flex-grow:1; overflow-y:auto; background:#ffffff;
                    border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;
                }
                .tasklist-empty { padding:12px; color:#808080; text-align:center; }
                .tasklist-row { justify-content:space-between; }
                .tasklist-row-done .tasklist-label { text-decoration:line-through; color:#808080; }
                .tasklist-label { flex-grow:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .tasklist-del {
                    background:none; border:none; cursor:pointer; font-weight:bold;
                    color:#808080; padding:0 4px; font-size:13px; line-height:1;
                }
                .tasklist-del:hover { color:#c62828; }
                .tasklist-footer { display:flex; justify-content:space-between; align-items:center; flex-shrink:0; color:#555555; font-size:11px; }
            </style>
            <div class="tasklist-shell">
                <div class="tasklist-toolbar">
                    <input type="text" class="tasklist-input" id="tasklist-input" placeholder="What needs doing?" autocomplete="off" spellcheck="false" maxlength="200">
                    ${toolbarButton({ label: 'Add', action: 'add' })}
                </div>
                <div class="tasklist-rows" id="tasklist-rows"></div>
                <div class="tasklist-footer">
                    <span id="tasklist-count"></span>
                    ${toolbarButton({ label: 'Clear Completed', action: 'clear-completed' })}
                </div>
            </div>
        `);

        this.inputEl = this.body.querySelector('#tasklist-input');
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.inputEl.focus();

        this.renderRows();
    }

    addTask() {
        const text = this.inputEl.value.trim();
        if (!text) return;
        this.tasks.push({ id: this.nextId++, text, done: false });
        this.inputEl.value = '';
        this.inputEl.focus();
        this.saveAndRender();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) task.done = !task.done;
        this.saveAndRender();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveAndRender();
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.done);
        this.saveAndRender();
    }

    saveAndRender() {
        this._saveTasks();
        this.renderRows();
    }

    renderRows() {
        const rowsEl = this.body.querySelector('#tasklist-rows');
        const countEl = this.body.querySelector('#tasklist-count');

        if (this.tasks.length === 0) {
            rowsEl.innerHTML = `<div class="tasklist-empty">No tasks yet — add one above.</div>`;
        } else {
            rowsEl.innerHTML = this.tasks.map(task => `
                <div class="app-list-row tasklist-row ${task.done ? 'tasklist-row-done' : ''}">
                    <input type="checkbox" data-action="toggle" data-id="${task.id}" ${task.done ? 'checked' : ''}>
                    <span class="tasklist-label">${escapeHtml(task.text)}</span>
                    <button class="tasklist-del" data-action="delete" data-id="${task.id}" title="Delete task">&times;</button>
                </div>
            `).join('');
        }

        const remaining = this.tasks.filter(t => !t.done).length;
        countEl.textContent = this.tasks.length === 0
            ? ''
            : `${remaining} of ${this.tasks.length} task${this.tasks.length === 1 ? '' : 's'} left`;
    }

    _loadTasks() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    _saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
        } catch (e) {
            // storage unavailable/full — task list just won't persist this session
        }
    }
}
