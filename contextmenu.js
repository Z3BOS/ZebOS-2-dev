// Centralized Dynamic Context Menu System Engine (ZebOS 2)
import { getIcon } from './icons.js';

let activeContextMenu = null;
let activeSubmenu = null;

export function initContextMenuSystem(callbacks = {}) {
    document.addEventListener('contextmenu', (e) => {
        const items = getContextMenuForElement(e.target, callbacks);
        if (items && items.length > 0) {
            e.preventDefault();
            renderContextMenu(e.clientX, e.clientY, items);
        } else {
            closeContextMenu();
            const isTextField = e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable;
            if (!isTextField) {
                e.preventDefault();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (activeContextMenu && !activeContextMenu.contains(e.target) && (!activeSubmenu || !activeSubmenu.contains(e.target))) {
            closeContextMenu();
        }
    });
}

export function closeContextMenu() {
    closeSubmenu();
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

function closeSubmenu() {
    if (activeSubmenu) {
        activeSubmenu.remove();
        activeSubmenu = null;
    }
}

function getContextMenuForElement(target, callbacks) {
    // 1. Taskbar Tab
    const taskbarTab = target.closest('.taskbar-tab');
    if (taskbarTab) {
        const uniqueId = taskbarTab.id.replace('tab-', '');
        return [
            { label: 'Restore', icon: 'winMax', action: () => callbacks.onRestoreWindow?.(uniqueId) },
            { label: 'Minimize', icon: 'winMin', action: () => callbacks.onMinimizeWindow?.(uniqueId) },
            { label: 'Maximize', icon: 'winMax', action: () => callbacks.onMaximizeWindow?.(uniqueId) },
            { type: 'separator' },
            { label: 'Close', icon: 'winClose', bold: true, action: () => callbacks.onCloseWindow?.(uniqueId) }
        ];
    }

    // 2. Explorer File/Folder Item
    const explorerItem = target.closest('.explorer-item, .explorer-table-row');
    if (explorerItem) {
        const itemName = explorerItem.dataset.itemName;
        const itemType = explorerItem.dataset.itemType;
        const deleteLabel = itemType === 'dir' ? 'Delete Folder' : (itemName.endsWith('.zdl') ? 'Delete Library' : 'Delete File');
        return [
            { label: 'Open', icon: itemType === 'dir' ? 'folder' : 'file', bold: true, action: () => callbacks.onOpenExplorerItem?.(itemName, itemType) },
            { type: 'separator' },
            { label: 'Cut', icon: 'file', action: () => callbacks.onCopyCutFile?.(itemName, 'cut') },
            { label: 'Copy', icon: 'file', action: () => callbacks.onCopyCutFile?.(itemName, 'copy') },
            { label: deleteLabel, icon: 'winClose', action: () => callbacks.onDeleteFile?.(itemName) },
            { label: 'Rename', icon: 'editor', action: () => callbacks.onRenameFile?.(itemName) },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showItemPropertiesDialog(itemName, itemType, callbacks) }
        ];
    }

    // 2.5 Explorer Workspace / Empty Space
    const explorerBg = target.closest('#body-explorer-root, .explorer-grid, .explorer-table, [id^="body-explorer"]');
    if (explorerBg && !target.closest('.explorer-item, .explorer-table-row')) {
        return [
            { 
                label: 'View', icon: 'explorer', hasSubmenu: true,
                submenu: [
                    { label: 'Large Icons', icon: 'explorer', action: () => callbacks.onChangeExplorerView?.('large') },
                    { label: 'Small Icons', icon: 'file', action: () => callbacks.onChangeExplorerView?.('small') },
                    { label: 'List', icon: 'editor', action: () => callbacks.onChangeExplorerView?.('list') },
                    { label: 'Details', icon: 'settings', action: () => callbacks.onChangeExplorerView?.('details') }
                ]
            },
            { label: 'Refresh', icon: 'startLogo', action: () => callbacks.onRefreshExplorer?.() },
            { type: 'separator' },
            { 
                label: 'New', icon: 'newFolder', hasSubmenu: true,
                submenu: [
                    { label: 'Folder', icon: 'folder', action: () => callbacks.onCreateNewFolder?.() },
                    { label: 'Text Document', icon: 'editor', action: () => callbacks.onCreateNewFile?.('Text Document', 'txt') },
                    { label: 'Bitmap Image', icon: 'paint', action: () => callbacks.onCreateNewFile?.('Bitmap Image', 'png') }
                ]
            },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showExplorerVolumePropertiesDialog(callbacks) }
        ];
    }

    // 3. Window Titlebar / Frame Header
    const windowHeader = target.closest('.window-header');
    if (windowHeader) {
        const frame = windowHeader.closest('.window-frame');
        const uniqueId = frame ? frame.id.replace('win-', '') : '';
        const titleEl = windowHeader.querySelector('.window-title');
        const titleText = titleEl ? titleEl.textContent.trim() : 'Window';
        return [
            { label: 'Restore', icon: 'winMax', action: () => callbacks.onRestoreWindow?.(uniqueId) },
            { label: 'Minimize', icon: 'winMin', action: () => callbacks.onMinimizeWindow?.(uniqueId) },
            { label: 'Maximize', icon: 'winMax', action: () => callbacks.onMaximizeWindow?.(uniqueId) },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showWindowPropertiesDialog(frame, titleText) },
            { type: 'separator' },
            { label: 'Close', icon: 'winClose', bold: true, action: () => callbacks.onCloseWindow?.(uniqueId) }
        ];
    }

    // 4. Desktop Shortcut / Icon
    const shortcutIcon = target.closest('.desktop-icon');
    if (shortcutIcon) {
        const appId = shortcutIcon.dataset.appId || shortcutIcon.id;
        const vfsName = shortcutIcon.dataset.vfsName;
        const itemType = shortcutIcon.dataset.itemType;
        const label = shortcutIcon.querySelector('.desktop-icon-label')?.textContent.trim() || appId;

        let deleteLabel = 'Delete Shortcut';
        if (vfsName || shortcutIcon.dataset.isCustomVfs === 'true') {
            deleteLabel = itemType === 'dir' ? 'Delete Folder' : (label.endsWith('.zdl') ? 'Delete Library' : 'Delete File');
        }

        return [
            { label: 'Open', icon: 'startLogo', bold: true, action: () => callbacks.onOpenApp?.(appId) },
            { type: 'separator' },
            { label: deleteLabel, icon: 'winClose', action: () => callbacks.onDeleteAppShortcut?.(shortcutIcon) },
            { label: 'Rename', icon: 'editor', action: () => callbacks.onRenameAppShortcut?.(shortcutIcon) },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showShortcutPropertiesDialog(label, appId) }
        ];
    }

    // 5. System Taskbar Strip
    const taskbar = target.closest('#system-taskbar');
    if (taskbar) {
        return [
            { label: 'Cascade Windows', icon: 'winMax', action: () => callbacks.onCascadeWindows?.() },
            { label: 'Show Desktop', icon: 'explorer', action: () => callbacks.onShowDesktop?.() },
            { type: 'separator' },
            { label: 'Taskbar Properties', icon: 'settings', action: () => showTaskbarPropertiesDialog(callbacks) }
        ];
    }

    // 6. Application Window Body / Container
    const windowFrame = target.closest('.window-frame, .window-body');
    if (windowFrame) {
        return null;
    }

    // 7. Default Desktop Background Canvas
    const desktopArea = target.closest('#desktop, #desktop-icons-zone, #desktop-build-tag, body');
    if (desktopArea) {
        return [
            { 
                label: 'View', icon: 'explorer', hasSubmenu: true,
                submenu: [
                    { label: 'Large Icons', icon: 'explorer', isCheckable: true, checked: callbacks.getCurrentViewMode?.() === 'large', action: () => callbacks.onChangeDesktopView?.('large') },
                    { label: 'Small Icons', icon: 'file', isCheckable: true, checked: callbacks.getCurrentViewMode?.() === 'small', action: () => callbacks.onChangeDesktopView?.('small') },
                    { label: 'Auto Arrange', icon: 'settings', isCheckable: true, checked: callbacks.getAutoArrange?.(), action: () => callbacks.onArrangeIcons?.('auto') }
                ]
            },
            { 
                label: 'Arrange Icons', icon: 'file', hasSubmenu: true,
                submenu: [
                    { label: 'By Name', icon: 'editor', isCheckable: true, checked: callbacks.getSortBy?.() === 'name', action: () => callbacks.onArrangeIcons?.('name') },
                    { label: 'By Type', icon: 'folder', isCheckable: true, checked: callbacks.getSortBy?.() === 'type', action: () => callbacks.onArrangeIcons?.('type') },
                    { label: 'By Size', icon: 'calc', isCheckable: true, checked: callbacks.getSortBy?.() === 'size', action: () => callbacks.onArrangeIcons?.('size') }
                ]
            },
            { label: 'Refresh', icon: 'startLogo', action: () => callbacks.onRefreshDesktop?.() },
            { type: 'separator' },
            { 
                label: 'New', icon: 'newFolder', hasSubmenu: true,
                submenu: [
                    { label: 'Folder', icon: 'folder', action: () => callbacks.onCreateNewFolder?.() },
                    { label: 'Text Document', icon: 'editor', action: () => callbacks.onCreateNewFile?.('Text Document', 'txt') },
                    { label: 'Bitmap Image', icon: 'paint', action: () => callbacks.onCreateNewFile?.('Bitmap Image', 'png') },
                    { label: 'Shortcut', icon: 'startLogo', action: () => callbacks.onCreateNewShortcut?.() }
                ]
            },
            { type: 'separator' },
            { label: 'Personalize', icon: 'personalize', action: () => callbacks.onOpenPersonalize?.() },
            { label: 'Properties', icon: 'settings', action: () => showDesktopPropertiesDialog(callbacks) }
        ];
    }

    return null;
}

function renderContextMenu(x, y, items, parentRow = null) {
    const isSub = !!parentRow;
    if (isSub) {
        closeSubmenu();
    } else {
        closeContextMenu();
    }

    const menu = document.createElement('div');
    menu.className = 'retro-context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        background-color: #c0c0c0;
        border: 2px solid #ffffff;
        border-right-color: #000000;
        border-bottom-color: #000000;
        box-shadow: 2px 2px 8px rgba(0,0,0,0.4);
        padding: 2px;
        z-index: ${isSub ? 100000 : 99999};
        min-width: 155px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        user-select: none;
    `;

    let activeHoverRow = null;

    items.forEach(item => {
        if (item.type === 'separator') {
            const sep = document.createElement('div');
            sep.style.cssText = `
                height: 1px;
                border-top: 1px solid #808080;
                border-bottom: 1px solid #ffffff;
                margin: 3px 1px;
            `;
            menu.appendChild(sep);
            return;
        }

        const row = document.createElement('div');
        row.className = 'context-menu-item';
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px 4px 6px;
            cursor: pointer;
            color: #000000;
            ${item.bold ? 'font-weight: bold;' : ''}
        `;

        const iconSvg = item.icon ? `<span style="width:16px; height:16px; display:inline-flex; align-items:center; margin-right:8px;">${getIcon(item.icon)}</span>` : '<span style="width:16px; margin-right:8px;"></span>';
        const hasSub = item.hasSubmenu || (item.submenu && item.submenu.length > 0);
        const checkPrefix = item.checked ? '<span style="font-weight:bold; width:12px; margin-right:4px; text-align:center;">✓</span>' : (item.isCheckable ? '<span style="width:12px; margin-right:4px; display:inline-block;"></span>' : '');

        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${checkPrefix}
                ${iconSvg}
                <span>${item.label}</span>
            </div>
            ${hasSub ? '<span style="font-size:10px; margin-left:12px;">▶</span>' : ''}
        `;

        row.addEventListener('mouseenter', () => {
            if (activeHoverRow && activeHoverRow !== row && !activeHoverRow.contains(row)) {
                activeHoverRow.style.backgroundColor = 'transparent';
                activeHoverRow.style.color = '#000000';
            }
            row.style.backgroundColor = '#000080';
            row.style.color = '#ffffff';
            activeHoverRow = row;

            if (hasSub) {
                const rect = row.getBoundingClientRect();
                renderContextMenu(rect.right - 2, rect.top, item.submenu, row);
            } else if (!isSub) {
                closeSubmenu();
            }
        });

        row.addEventListener('mouseleave', (e) => {
            if (!hasSub) {
                row.style.backgroundColor = 'transparent';
                row.style.color = '#000000';
            }
        });

        row.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hasSub) {
                const rect = row.getBoundingClientRect();
                renderContextMenu(rect.right - 2, rect.top, item.submenu, row);
                return;
            }
            closeContextMenu();
            if (item.action) item.action();
        });

        menu.appendChild(row);
    });

    document.body.appendChild(menu);
    if (isSub) {
        activeSubmenu = menu;
    } else {
        activeContextMenu = menu;
    }

    // Screen bounds adjustment
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        if (isSub && parentRow) {
            const parentRect = parentRow.getBoundingClientRect();
            menu.style.left = `${parentRect.left - rect.width + 2}px`;
        } else {
            menu.style.left = `${window.innerWidth - rect.width - 4}px`;
        }
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 4}px`;
    }
}

// ==========================================================================
// SHARED DIALOG HELPERS
// ==========================================================================

const W95_DIALOG_BASE = `
    position: fixed !important;
    background-color: #c0c0c0;
    border: 2px solid #ffffff;
    border-right-color: #000000;
    border-bottom-color: #000000;
    box-shadow: 4px 4px 16px rgba(0,0,0,0.5);
    z-index: 100001;
    font-family: Arial, sans-serif;
    font-size: 12px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

function makeDialog(widthPx, heightPx) {
    const d = document.createElement('div');
    d.className = 'os-prompt-modal active-window';
    const left = Math.floor((window.innerWidth  - widthPx)  / 2);
    const top  = Math.floor((window.innerHeight - heightPx) / 2);
    d.style.cssText = `${W95_DIALOG_BASE}
        left: ${left}px !important;
        top:  ${top}px  !important;
        width:  ${widthPx}px !important;
        min-height: ${heightPx}px !important;`;
    return d;
}

function dialogHeader(title, closeId = 'prop-close') {
    return `
    <div class="window-header">
        <div class="window-title">${title}</div>
        <div class="window-controls">
            <button class="win-btn" id="${closeId}">${getIcon('winClose')}</button>
        </div>
    </div>`;
}

function w95Btn(label, id = '', extra = '') {
    return `<button id="${id}" style="
        padding:4px 18px;background:#c0c0c0;
        border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;
        cursor:pointer;font-size:12px;font-family:Arial,sans-serif;${extra}">${label}</button>`;
}

function w95Field(label, value) {
    return `<div style="margin-bottom:6px;">
        <div style="font-weight:bold;margin-bottom:2px;">${label}</div>
        <input readonly value="${value}" style="
            width:100%;padding:2px 4px;
            border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;
            background:#c0c0c0;font-size:12px;font-family:Arial,sans-serif;
            box-sizing:border-box;outline:none;">
    </div>`;
}

function w95EditField(label, value, id) {
    return `<div style="margin-bottom:6px;">
        <div style="font-weight:bold;margin-bottom:2px;">${label}</div>
        <input id="${id}" value="${value}" style="
            width:100%;padding:2px 4px;
            border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;
            background:#fff;font-size:12px;font-family:Arial,sans-serif;
            box-sizing:border-box;outline:none;">
    </div>`;
}

const W95_CHECKMARK_SVG = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="display:block;margin:0;padding:0;"><path d="M1.5 4.5L3.5 6.5L7.5 1.5" stroke="#000000" stroke-width="1.8" stroke-linecap="square"/></svg>`;

function w95Checkbox(id, label, checked) {
    const mark = checked ? W95_CHECKMARK_SVG : '';
    return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;user-select:none;margin-bottom:6px;">
        <span id="${id}-wrap" data-checked="${checked?'1':'0'}" style="
            display:inline-flex;align-items:center;justify-content:center;
            width:13px;height:13px;flex-shrink:0;box-sizing:border-box;
            background:#ffffff;border:2px solid #808080;border-right-color:#ffffff;border-bottom-color:#ffffff;cursor:pointer;">
            ${mark}
        </span>
        <span>${label}</span>
    </label>`;
}

function w95Separator() {
    return `<div style="border-top:1px solid #808080;border-bottom:1px solid #fff;margin:8px 0;"></div>`;
}

function w95Select(id, options, selectedValue) {
    return `
    <div class="w95-dropdown" id="${id}" data-value="${selectedValue}" style="position:relative;width:100%;z-index:1;">
      <div class="w95-drop-display" style="
        display:flex;align-items:center;justify-content:space-between;
        background:#c0c0c0;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;
        padding:2px 4px;cursor:pointer;font-size:12px;font-family:Arial,sans-serif;min-height:22px;box-sizing:border-box;">
        <span class="w95-drop-label" style="flex-grow:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(options.find(o=>o.value===selectedValue)||options[0]||{}).label||''}</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;
          background:#c0c0c0;border:2px solid #fff;border-right-color:#000;border-bottom-color:#000;font-size:8px;">▼</span>
      </div>
      <div class="w95-drop-list" style="
        display:none;position:absolute;top:100%;left:0;width:100%;
        background:#c0c0c0;border:1px solid #000;box-shadow:2px 2px 4px rgba(0,0,0,0.4);
        z-index:9999;max-height:140px;overflow-y:auto;box-sizing:border-box;">
        ${options.map(o=>`
        <div class="w95-drop-item" data-value="${o.value}" style="
          padding:2px 6px;font-size:12px;font-family:Arial,sans-serif;cursor:pointer;
          background:${o.value===selectedValue?'#000080':'#c0c0c0'};
          color:${o.value===selectedValue?'#fff':'#000'};white-space:nowrap;">${o.label}</div>`).join('')}
      </div>
    </div>`;
}

function bindDropdownsInEl(el) {
    const closeAll = () => {
        el.querySelectorAll('.w95-dropdown').forEach(w => {
            w.style.zIndex = '1';
            if (w.parentElement && w.parentElement !== el) {
                w.parentElement.style.zIndex = '';
            }
            const fs = w.closest('fieldset');
            if (fs) fs.style.zIndex = '';
            const l = w.querySelector('.w95-drop-list');
            if (l) l.style.display = 'none';
        });
    };

    el.querySelectorAll('.w95-dropdown').forEach(wrap => {
        const display = wrap.querySelector('.w95-drop-display');
        const list    = wrap.querySelector('.w95-drop-list');
        const lbl     = wrap.querySelector('.w95-drop-label');
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = list.style.display !== 'none';
            closeAll();
            if (!open) {
                wrap.style.zIndex = '99999';
                if (wrap.parentElement && wrap.parentElement !== el) {
                    wrap.parentElement.style.position = 'relative';
                    wrap.parentElement.style.zIndex = '99998';
                }
                const fs = wrap.closest('fieldset');
                if (fs) {
                    fs.style.position = 'relative';
                    fs.style.zIndex = '99997';
                }
                list.style.display = 'block';
            }
        });
        list.querySelectorAll('.w95-drop-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                list.querySelectorAll('.w95-drop-item').forEach(i => { i.style.background='#c0c0c0'; i.style.color='#000'; });
                item.style.background = '#000080'; item.style.color = '#fff';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = item.dataset.value===wrap.dataset.value?'#000080':'#c0c0c0';
                item.style.color      = item.dataset.value===wrap.dataset.value?'#fff':'#000';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                wrap.dataset.value = item.dataset.value;
                lbl.textContent = item.textContent.trim();
                list.querySelectorAll('.w95-drop-item').forEach(i => { i.style.background=i.dataset.value===item.dataset.value?'#000080':'#c0c0c0'; i.style.color=i.dataset.value===item.dataset.value?'#fff':'#000'; });
                closeAll();
                wrap.dispatchEvent(new CustomEvent('w95-change', { detail: { value: item.dataset.value } }));
            });
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.w95-dropdown')) {
            closeAll();
        }
    });
}

function bindCheckboxesInEl(el) {
    el.querySelectorAll('[id$="-wrap"][data-checked]').forEach(wrap => {
        wrap.addEventListener('click', () => {
            const cur = wrap.dataset.checked === '1';
            wrap.dataset.checked = cur ? '0' : '1';
            wrap.innerHTML = cur ? '' : W95_CHECKMARK_SVG;
        });
    });
}

function mountDraggable(dialog) {
    const hdr = dialog.querySelector('.window-header');
    if (!hdr) return;
    let drag = false, ox=0, oy=0;
    hdr.style.cursor = 'move';
    hdr.addEventListener('mousedown', e => {
        if (e.target.classList.contains('win-btn')) return;
        drag = true; ox = e.clientX - dialog.offsetLeft; oy = e.clientY - dialog.offsetTop;
    });
    document.addEventListener('mousemove', e => { if (drag) { dialog.style.left=`${e.clientX-ox}px`; dialog.style.top=`${e.clientY-oy}px`; } });
    document.addEventListener('mouseup', () => { drag = false; });
}

// ==========================================================================
// 1. FILE / FOLDER PROPERTIES DIALOG
// ==========================================================================
function showItemPropertiesDialog(itemName, itemType, callbacks) {
    const isDir    = itemType === 'dir';
    const ext      = isDir ? '' : (itemName.includes('.') ? itemName.split('.').pop().toUpperCase() : 'File');
    const created  = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const iconName = isDir ? 'folder' : 'file';

    const dialog = makeDialog(340, 420);
    dialog.innerHTML = `
    ${dialogHeader(`${itemName} Properties`)}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <!-- Icon + Name header -->
      <div style="display:flex;align-items:center;gap:12px;border-bottom:1px solid #808080;border-color:##808080;padding-bottom:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;flex-shrink:0;">${getIcon(iconName)}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">${itemName}</div>
          <div style="color:#555;font-size:11px;">${isDir ? 'File Folder' : `${ext} File`}</div>
        </div>
      </div>
      <!-- Editable name -->
      ${w95EditField('File Name:', itemName, 'prop-filename')}
      ${w95Field('Type:', isDir ? 'File Folder' : `${ext} File (.${ext.toLowerCase()})`)}
      ${w95Field('Location:', `ZebRoot (Z:\\${itemName})`)}
      ${w95Field('Size:', isDir ? 'N/A' : '—')}
      ${w95Separator()}
      ${w95Field('Created:', created)}
      ${w95Field('Modified:', created)}
      ${w95Separator()}
      <!-- Attributes -->
      <div style="font-weight:bold;margin-bottom:6px;">Attributes</div>
      <div style="display:flex;gap:24px;">
        ${w95Checkbox('prop-readonly',  'Read-only', false)}
        ${w95Checkbox('prop-hidden',    'Hidden',    false)}
        ${w95Checkbox('prop-archive',   'Archive',   true)}
      </div>
      <div style="flex-grow:1;"></div>
      <!-- Buttons -->
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
        ${w95Btn('Cancel','prop-cancel')}
        ${w95Btn('Apply','prop-apply','color:#808080;border-right-color:#808080;border-bottom-color:#808080;cursor:default;text-shadow:1px 1px 0 #fff;')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);
    bindCheckboxesInEl(dialog);

    let dirty = false;
    const applyBtn = dialog.querySelector('#prop-apply');
    const nameInput = dialog.querySelector('#prop-filename');

    const setDirty = () => {
        dirty = true;
        applyBtn.style.color='#000'; applyBtn.style.borderRightColor='#000'; applyBtn.style.borderBottomColor='#000'; applyBtn.style.cursor='pointer'; applyBtn.style.textShadow='none';
    };
    nameInput.addEventListener('input', setDirty);
    dialog.querySelectorAll('[data-checked]').forEach(c => c.addEventListener('click', setDirty));

    const doApply = () => {
        if (!dirty) return;
        const newName = nameInput.value.trim();
        if (newName && newName !== itemName && callbacks.onRenameFile) {
            callbacks.onRenameFile(itemName);
        }
        dirty = false;
        applyBtn.style.color='#808080'; applyBtn.style.borderRightColor='#808080'; applyBtn.style.borderBottomColor='#808080'; applyBtn.style.cursor='default'; applyBtn.style.textShadow='1px 1px 0 #fff';
    };

    dialog.querySelector('#prop-ok').addEventListener('click', () => { doApply(); dialog.remove(); });
    dialog.querySelector('#prop-cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#prop-apply').addEventListener('click', doApply);
    dialog.querySelector('#prop-close').addEventListener('click', () => dialog.remove());
}

// ==========================================================================
// 2. DESKTOP PROPERTIES DIALOG
// ==========================================================================
function showDesktopPropertiesDialog(callbacks) {
    const bg = document.getElementById('desktop-canvas');
    const bgColor = bg ? (bg.style.backgroundColor || '#008080') : '#008080';
    const res = `${window.innerWidth} × ${window.innerHeight}`;

    const dialog = makeDialog(340, 340);
    dialog.innerHTML = `
    ${dialogHeader('Desktop Properties')}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #808080;">
        <div style="width:36px;height:36px;">${getIcon('personalize')}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">Desktop</div>
          <div style="color:#555;font-size:11px;">ZebOS 2 Desktop Environment</div>
        </div>
      </div>
      ${w95Field('Resolution:', res)}
      ${w95Field('Background Color:', bgColor)}
      ${w95Field('System:', 'ZebOS 2 Kernel v2.6.0 (Alpha)')}
      ${w95Separator()}
      <div style="font-size:11px;color:#444;margin-bottom:10px;">To change the wallpaper, color scheme, or display pattern, open the Personalize applet from the context menu or Start menu.</div>
      <div style="flex-grow:1;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        ${w95Btn('Personalize…','prop-personalize')}
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);

    dialog.querySelector('#prop-personalize').addEventListener('click', () => {
        dialog.remove();
        callbacks.onOpenPersonalize?.();
    });
    dialog.querySelector('#prop-ok').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#prop-close').addEventListener('click', () => dialog.remove());
}

// ==========================================================================
// 3. TASKBAR PROPERTIES DIALOG
// ==========================================================================
function showTaskbarPropertiesDialog(callbacks) {
    const tbEl = document.getElementById('system-taskbar');
    const curPos = tbEl?.dataset.position || 'bottom';
    const curSize = tbEl?.dataset.size || '40';

    const posOpts = [
        { value: 'bottom', label: 'Bottom' },
        { value: 'top',    label: 'Top' },
        { value: 'left',   label: 'Left' },
        { value: 'right',  label: 'Right' },
    ];
    const sizeOpts = [
        { value: '30', label: 'Small (30px)' },
        { value: '40', label: 'Normal (40px)' },
        { value: '52', label: 'Large (52px)' },
        { value: '64', label: 'Extra Large (64px)' },
    ];

    const dialog = makeDialog(320, 380);
    dialog.innerHTML = `
    ${dialogHeader('Taskbar Properties')}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #808080;">
        <div style="width:36px;height:36px;">${getIcon('settings')}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">System Taskbar</div>
          <div style="color:#555;font-size:11px;">ZebOS Taskbar Panel</div>
        </div>
      </div>
      <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:10px;margin-bottom:10px;background:#c0c0c0;">
        <legend style="color:#000080;font-weight:bold;padding:0 4px;">Position &amp; Size</legend>
        <div style="margin-bottom:8px;">
          <div style="font-weight:bold;margin-bottom:4px;">Taskbar Position:</div>
          ${w95Select('prop-tb-pos', posOpts, curPos)}
        </div>
        <div>
          <div style="font-weight:bold;margin-bottom:4px;">Taskbar Size:</div>
          ${w95Select('prop-tb-size', sizeOpts, curSize)}
        </div>
      </fieldset>
      <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:10px;margin-bottom:10px;background:#c0c0c0;">
        <legend style="color:#000080;font-weight:bold;padding:0 4px;">Behavior</legend>
        ${w95Checkbox('prop-tb-autohide',  'Auto-hide the taskbar', false)}
        ${w95Checkbox('prop-tb-ontop',     'Always on top',         true)}
        ${w95Checkbox('prop-tb-showtime',  'Show clock',            true)}
      </fieldset>
      <div style="flex-grow:1;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
        ${w95Btn('Cancel','prop-cancel')}
        ${w95Btn('Apply','prop-apply','color:#808080;border-right-color:#808080;border-bottom-color:#808080;cursor:default;text-shadow:1px 1px 0 #fff;')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);
    bindDropdownsInEl(dialog);
    bindCheckboxesInEl(dialog);

    let dirty = false;
    const applyBtn = dialog.querySelector('#prop-apply');
    const enableApply = () => {
        dirty = true;
        applyBtn.style.color='#000'; applyBtn.style.borderRightColor='#000'; applyBtn.style.borderBottomColor='#000'; applyBtn.style.cursor='pointer'; applyBtn.style.textShadow='none';
    };
    dialog.querySelectorAll('.w95-dropdown').forEach(d => d.addEventListener('w95-change', enableApply));
    dialog.querySelectorAll('[data-checked]').forEach(c => c.addEventListener('click', enableApply));

    const doApply = () => {
        if (!dirty) return;
        const pos  = dialog.querySelector('#prop-tb-pos').dataset.value;
        const size = dialog.querySelector('#prop-tb-size').dataset.value;
        const autoHide  = dialog.querySelector('#prop-tb-autohide-wrap').dataset.checked === '1';
        const alwaysTop = dialog.querySelector('#prop-tb-ontop-wrap').dataset.checked === '1';
        const showClock = dialog.querySelector('#prop-tb-showtime-wrap').dataset.checked === '1';
        callbacks.onApplyTaskbarProps?.({ pos, size, autoHide, alwaysTop, showClock });
        dirty = false;
        applyBtn.style.color='#808080'; applyBtn.style.borderRightColor='#808080'; applyBtn.style.borderBottomColor='#808080'; applyBtn.style.cursor='default'; applyBtn.style.textShadow='1px 1px 0 #fff';
    };

    dialog.querySelector('#prop-ok').addEventListener('click', () => { doApply(); dialog.remove(); });
    dialog.querySelector('#prop-cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#prop-apply').addEventListener('click', doApply);
    dialog.querySelector('#prop-close').addEventListener('click', () => dialog.remove());
}

// ==========================================================================
// 4. WINDOW / APP PROPERTIES DIALOG
// ==========================================================================
function showWindowPropertiesDialog(frame, titleText) {
    if (!frame) return;
    const w  = Math.round(frame.offsetWidth);
    const h  = Math.round(frame.offsetHeight);
    const l  = Math.round(frame.offsetLeft);
    const t  = Math.round(frame.offsetTop);
    const zi = frame.style.zIndex || '–';

    const dialog = makeDialog(320, 320);
    dialog.innerHTML = `
    ${dialogHeader(`${titleText} Properties`)}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #808080;">
        <div style="width:36px;height:36px;">${getIcon('settings')}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">${titleText}</div>
          <div style="color:#555;font-size:11px;">ZebOS Application Window</div>
        </div>
      </div>
      ${w95Field('Title:', titleText)}
      ${w95Field('Dimensions:', `${w} × ${h} px`)}
      ${w95Field('Position:', `X: ${l}, Y: ${t}`)}
      ${w95Field('Z-Index:', zi)}
      ${w95Field('Status:', frame.classList.contains('hidden-view') ? 'Minimized' : 'Visible')}
      ${w95Field('System:', 'ZebOS 2 Kernel v2.6.0 (Alpha)')}
      <div style="flex-grow:1;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);
    dialog.querySelector('#prop-ok').addEventListener('click',    () => dialog.remove());
    dialog.querySelector('#prop-close').addEventListener('click', () => dialog.remove());
}

// ==========================================================================
// 5. SHORTCUT PROPERTIES DIALOG
// ==========================================================================
function showShortcutPropertiesDialog(label, appId) {
    const dialog = makeDialog(320, 300);
    dialog.innerHTML = `
    ${dialogHeader(`${label} Properties`)}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #808080;">
        <div style="width:36px;height:36px;">${getIcon('startLogo')}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">${label}</div>
          <div style="color:#555;font-size:11px;">Desktop Shortcut</div>
        </div>
      </div>
      ${w95EditField('Shortcut Name:', label, 'prop-shortcut-name')}
      ${w95Field('Target ID:', appId)}
      ${w95Field('Type:', 'Application Shortcut')}
      ${w95Field('Location:', 'ZebOS 2 Desktop')}
      ${w95Field('System:', 'ZebOS 2 Kernel v2.6.0 (Alpha)')}
      <div style="flex-grow:1;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
        ${w95Btn('Cancel','prop-cancel')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);
    dialog.querySelector('#prop-ok').addEventListener('click',     () => dialog.remove());
    dialog.querySelector('#prop-cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#prop-close').addEventListener('click',  () => dialog.remove());
}

// ==========================================================================
// 6. EXPLORER VOLUME PROPERTIES DIALOG
// ==========================================================================
function showExplorerVolumePropertiesDialog(callbacks) {
    const totalDisk  = '256 MB';
    const used       = '—';
    const dialog = makeDialog(320, 320);
    dialog.innerHTML = `
    ${dialogHeader('ZebRoot (Z:) Properties')}
    <div style="padding:14px;display:flex;flex-direction:column;flex-grow:1;">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #808080;">
        <div style="width:36px;height:36px;">${getIcon('explorer')}</div>
        <div>
          <div style="font-weight:bold;font-size:14px;color:#000080;">ZebRoot (Z:)</div>
          <div style="color:#555;font-size:11px;">Virtual File System Volume</div>
        </div>
      </div>
      ${w95Field('Volume Label:', 'ZebRoot')}
      ${w95Field('File System:', 'ZebVFS (Virtual)')}
      ${w95Field('Total Capacity:', totalDisk)}
      ${w95Field('Used:', used)}
      ${w95Field('System:', 'ZebOS 2 Kernel v2.6.0 (Alpha)')}
      ${w95Field('Status:', 'Read/Write Accessible')}
      <div style="flex-grow:1;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        ${w95Btn('OK','prop-ok','font-weight:bold;')}
      </div>
    </div>`;

    document.body.appendChild(dialog);
    mountDraggable(dialog);
    dialog.querySelector('#prop-ok').addEventListener('click',    () => dialog.remove());
    dialog.querySelector('#prop-close').addEventListener('click', () => dialog.remove());
}
