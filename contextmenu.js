// Centralized Dynamic Context Menu System Engine (ZebOS 2)
import { getIcon } from './icons.js';

let activeContextMenu = null;
let activeSubmenu = null;

export function initContextMenuSystem(callbacks = {}) {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const items = getContextMenuForElement(e.target, callbacks);
        if (items && items.length > 0) {
            renderContextMenu(e.clientX, e.clientY, items);
        } else {
            closeContextMenu();
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
        return [
            { label: 'Open', icon: itemType === 'dir' ? 'folder' : 'file', bold: true, action: () => callbacks.onOpenExplorerItem?.(itemName, itemType) },
            { type: 'separator' },
            { label: 'Cut', icon: 'file', action: () => callbacks.onCopyCutFile?.(itemName, 'cut') },
            { label: 'Copy', icon: 'file', action: () => callbacks.onCopyCutFile?.(itemName, 'copy') },
            { label: 'Delete', icon: 'winClose', action: () => callbacks.onDeleteFile?.(itemName) },
            { label: 'Rename', icon: 'editor', action: () => callbacks.onRenameFile?.(itemName) },
            { type: 'separator' },
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
            { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog('ZebRoot (Z:)', 'System Volume (VFS)', 'Zeb Machine') }
        ];
    }

    // 3. Window Titlebar / Frame Header
    const windowHeader = target.closest('.window-header');
    if (windowHeader) {
        const frame = windowHeader.closest('.window-frame');
        const uniqueId = frame ? frame.id.replace('win-', '') : '';
        return [
            { label: 'Restore', icon: 'winMax', action: () => callbacks.onRestoreWindow?.(uniqueId) },
            { label: 'Minimize', icon: 'winMin', action: () => callbacks.onMinimizeWindow?.(uniqueId) },
            { label: 'Maximize', icon: 'winMax', action: () => callbacks.onMaximizeWindow?.(uniqueId) },
            { type: 'separator' },
            { label: 'Close', icon: 'winClose', bold: true, action: () => callbacks.onCloseWindow?.(uniqueId) }
        ];
    }

    // 4. Desktop Shortcut Icon
    const shortcutIcon = target.closest('.desktop-icon');
    if (shortcutIcon) {
        const appId = shortcutIcon.dataset.appId || shortcutIcon.id;
        return [
            { label: 'Open', icon: 'startLogo', bold: true, action: () => callbacks.onOpenApp?.(appId) },
            { type: 'separator' },
            { label: 'Delete Shortcut', icon: 'winClose', action: () => callbacks.onDeleteAppShortcut?.(shortcutIcon) },
            { label: 'Rename Shortcut', icon: 'editor', action: () => callbacks.onRenameAppShortcut?.(shortcutIcon) },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog(shortcutIcon.innerText.trim(), 'Application Shortcut', 'ZebOS 2 Desktop') }
        ];
    }

    // 5. System Taskbar Strip
    const taskbar = target.closest('#system-taskbar');
    if (taskbar) {
        return [
            { label: 'Cascade Windows', icon: 'winMax', action: () => callbacks.onCascadeWindows?.() },
            { label: 'Show Desktop', icon: 'explorer', action: () => callbacks.onShowDesktop?.() },
            { type: 'separator' },
            { label: 'Taskbar Properties', icon: 'settings', action: () => showPropertiesDialog('System Taskbar', 'System Component', 'ZebOS Taskbar Panel') }
        ];
    }

    // 6. Default Desktop Background Canvas
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
        { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog('Display Properties', 'Control Panel Applet', 'ZebOS 2 Desktop') }
    ];
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

function showPropertiesDialog(name, type, location) {
    const dialog = document.createElement('div');
    dialog.className = 'os-prompt-modal active-window';
    dialog.style.cssText = `
        position: fixed !important;
        left: calc(50vw - 160px) !important;
        top: calc(50vh - 110px) !important;
        width: 320px !important;
        height: auto !important;
        min-height: 160px !important;
        background-color: #c0c0c0;
        border: 2px solid #ffffff;
        border-right-color: #000000;
        border-bottom-color: #000000;
        box-shadow: 4px 4px 16px rgba(0,0,0,0.5);
        z-index: 100001;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    `;

    dialog.innerHTML = `
        <div class="window-header">
            <div class="window-title">${name} Properties</div>
            <div class="window-controls">
                <button class="win-btn" id="prop-close">${getIcon('winClose')}</button>
            </div>
        </div>
        <div style="padding:16px; font-size:12px; display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; gap:12px; border-bottom:1px solid #808080; padding-bottom:10px;">
                <div style="width:40px; height:40px;">${getIcon('settings')}</div>
                <div>
                    <div style="font-weight:bold; font-size:14px; color:#000080;">${name}</div>
                    <div style="color:#555;">${type}</div>
                </div>
            </div>
            <div><strong>Location:</strong> ${location}</div>
            <div><strong>System:</strong> ZebOS 2 Kernel v2.4.0 (Alpha)</div>
            <div><strong>Status:</strong> Read/Write Accessible</div>
            <button id="prop-ok" style="align-self:flex-end; padding:4px 16px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold; margin-top:8px;">OK</button>
        </div>
    `;

    document.body.appendChild(dialog);

    const closeBtn = dialog.querySelector('#prop-close');
    const okBtn = dialog.querySelector('#prop-ok');
    const cleanup = () => dialog.remove();

    closeBtn.addEventListener('click', cleanup);
    okBtn.addEventListener('click', cleanup);
}
