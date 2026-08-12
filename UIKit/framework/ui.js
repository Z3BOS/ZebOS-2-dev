// Tiny HTML-string builders for UIKit's shared widgets. Not a template
// engine, each one just returns a string to interpolate into your
// app's template literal, matching the classes documented in
// UIKit/README.md's cheat sheet. Using these instead of hand-writing
// the markup keeps you from drifting off the shared classes by typo.

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// <button class="app-toolbar-btn">
export function toolbarButton({ label, action = '', icon = '', disabled = false, cls = '' }) {
    return `<button class="app-toolbar-btn ${cls}" ${action ? `data-action="${escapeHtml(action)}"` : ''} ${disabled ? 'disabled' : ''}>${icon}${escapeHtml(label)}</button>`;
}

// <div class="app-list-row">
export function listRow({ label, action = '', selected = false, icon = '' }) {
    return `<div class="app-list-row ${selected ? 'selected' : ''}" ${action ? `data-action="${escapeHtml(action)}"` : ''}>${icon}${escapeHtml(label)}</div>`;
}

// <label class="zeb-checkbox-label"><input type="checkbox">
export function checkboxRow({ id = '', label, checked = false }) {
    return `<label class="zeb-checkbox-label"><input type="checkbox" ${id ? `id="${escapeHtml(id)}"` : ''} ${checked ? 'checked' : ''}> ${escapeHtml(label)}</label>`;
}

// <label><input type="radio"> — styled automatically by UIKit, no wrapper class needed
export function radioRow({ name, id = '', label, checked = false }) {
    return `<label><input type="radio" name="${escapeHtml(name)}" ${id ? `id="${escapeHtml(id)}"` : ''} ${checked ? 'checked' : ''}> ${escapeHtml(label)}</label>`;
}

// Beveled horizontal divider (the same rule used between Start Menu sections)
export function separator() {
    return `<hr class="start-menu-divider">`;
}

// <div class="w95-dropdown"> — Custom Win95 Retro Dropdown Select widget
export function w95Dropdown({ id = '', options = [], value = '', width = '100%', disabled = false }) {
    const selectedObj = options.find(o => String(o.value) === String(value)) || options[0];
    const selectedLabel = selectedObj ? selectedObj.label : '';
    const selectedVal = selectedObj ? selectedObj.value : '';

    return `
        <div class="w95-dropdown ${disabled ? 'disabled' : ''}" ${id ? `id="${escapeHtml(id)}"` : ''} data-value="${escapeHtml(selectedVal)}" style="width:${width};">
            <div class="w95-drop-display">
                <span class="w95-drop-label">${escapeHtml(selectedLabel)}</span>
                <span class="w95-drop-arrow">▼</span>
            </div>
            <div class="w95-drop-list">
                ${options.map(o => `
                    <div class="w95-drop-item ${String(o.value) === String(selectedVal) ? 'selected' : ''}" data-value="${escapeHtml(o.value)}">
                        ${escapeHtml(o.label)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function bindW95Dropdown(container, selector, onChange) {
    const dropdown = typeof selector === 'string' ? container.querySelector(selector) : selector;
    if (!dropdown) return;

    const display = dropdown.querySelector('.w95-drop-display');
    const list = dropdown.querySelector('.w95-drop-list');
    const label = dropdown.querySelector('.w95-drop-label');

    if (!display || !list) return;

    const close = () => {
        list.classList.remove('open');
        dropdown.classList.remove('open');
    };

    display.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.classList.contains('disabled')) return;
        const isOpen = list.classList.contains('open');
        document.querySelectorAll('.w95-drop-list.open').forEach(l => l.classList.remove('open'));
        document.querySelectorAll('.w95-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) {
            list.classList.add('open');
            dropdown.classList.add('open');
        }
    });

    list.querySelectorAll('.w95-drop-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const newVal = item.dataset.value;
            const newLabel = item.textContent.trim();
            dropdown.dataset.value = newVal;
            if (label) label.textContent = newLabel;
            list.querySelectorAll('.w95-drop-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            close();
            if (typeof onChange === 'function') onChange(newVal, newLabel);
        });
    });

    document.addEventListener('click', close);
}
