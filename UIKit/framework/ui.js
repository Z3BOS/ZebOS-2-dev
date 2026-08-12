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
