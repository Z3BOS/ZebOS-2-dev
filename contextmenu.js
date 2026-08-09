import { getIcon } from './icons.js';

// Centralized Dynamic Context Menu System for ZebOS 2 Pro
let activeContextMenu = null;

export function initContextMenuSystem(callbacks = {}) {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close any open menu
        closeContextMenu();

        const x = e.clientX;
        const y = e.clientY;

        const target = e.target;
        const menuConfig = buildMenuConfigForTarget(target, callbacks);

        if (menuConfig && menuConfig.length > 0) {
            renderContextMenu(x, y, menuConfig);
        }
    });

    document.addEventListener('click', (e) => {
        if (activeContextMenu && !activeContextMenu.contains(e.target)) {
            closeContextMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContextMenu();
        }
    });
}

export function closeContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

function buildMenuConfigForTarget(target, callbacks) {
    // 1. Desktop Icon / Shortcut
    const desktopIcon = target.closest('.desktop-shortcut, .desktop-icon');
    if (desktopIcon) {
        const appId = desktopIcon.dataset.appId || desktopIcon.id;
        const title = desktopIcon.querySelector('.desktop-shortcut-label, .desktop-name')?.textContent || 'Shortcut';
        return [
            { label: 'Open', icon: 'startLogo', bold: true, action: () => callbacks.onOpenApp?.(appId) },
            { type: 'separator' },
            { label: 'Create Shortcut', icon: 'file', action: () => callbacks.onNotify?.('Shortcut created.') },
            { label: 'Delete', icon: 'winClose', action: () => callbacks.onDeleteAppShortcut?.(desktopIcon) },
            { label: 'Rename', icon: 'editor', action: () => callbacks.onRenameAppShortcut?.(desktopIcon) },
            { type: 'separator' },
            { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog(title, 'Desktop Shortcut', 'System Application') }
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
            { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog(itemName, itemType === 'dir' ? 'File Folder' : 'Document File', 'Virtual Disk C:\\') }
        ];
    }

    // 3. Window Header / Frame
    const winFrame = target.closest('.window-frame');
    if (winFrame && (target.closest('.window-header') || target.closest('.window-title'))) {
        const winId = winFrame.id.replace('win-', '');
        return [
            { label: 'Restore', icon: 'winMax', action: () => callbacks.onRestoreWindow?.(winId) },
            { label: 'Move', icon: 'up', action: () => {} },
            { label: 'Size', icon: 'winMax', action: () => {} },
            { label: 'Minimize', icon: 'winMin', action: () => callbacks.onMinimizeWindow?.(winId) },
            { label: 'Maximize', icon: 'winMax', action: () => callbacks.onMaximizeWindow?.(winId) },
            { type: 'separator' },
            { label: 'Close', icon: 'winClose', bold: true, action: () => callbacks.onCloseWindow?.(winId) }
        ];
    }

    // 4. Taskbar Tab
    const taskbarTab = target.closest('.taskbar-tab');
    if (taskbarTab) {
        const tabId = taskbarTab.id.replace('tab-', '');
        return [
            { label: 'Restore', icon: 'winMax', action: () => callbacks.onRestoreWindow?.(tabId) },
            { label: 'Minimize', icon: 'winMin', action: () => callbacks.onMinimizeWindow?.(tabId) },
            { label: 'Maximize', icon: 'winMax', action: () => callbacks.onMaximizeWindow?.(tabId) },
            { type: 'separator' },
            { label: 'Close', icon: 'winClose', bold: true, action: () => callbacks.onCloseWindow?.(tabId) }
        ];
    }

    // 5. System Taskbar Background
    const taskbar = target.closest('#system-taskbar');
    if (taskbar) {
        return [
            { label: 'Cascade Windows', icon: 'explorer', action: () => callbacks.onCascadeWindows?.() },
            { label: 'Tile Windows Horizontally', icon: 'explorer', action: () => callbacks.onTileWindows?.() },
            { label: 'Show Desktop', icon: 'startLogo', action: () => callbacks.onShowDesktop?.() },
            { type: 'separator' },
            { label: 'Task Manager', icon: 'vm', action: () => callbacks.onOpenApp?.('start-link-courgette') },
            { label: 'Taskbar Properties', icon: 'settings', action: () => showPropertiesDialog('Taskbar & Start Menu', 'System Component', 'ZebOS Desktop Shell') }
        ];
    }

    // 6. Default Desktop Canvas Context Menu
    return [
        { 
            label: 'View', icon: 'explorer', hasSubmenu: true, 
            submenu: [
                { label: 'Large Icons', action: () => callbacks.onChangeDesktopView?.('large') },
                { label: 'Small Icons', action: () => callbacks.onChangeDesktopView?.('small') }
            ]
        },
        { 
            label: 'Arrange Icons', icon: 'file', hasSubmenu: true,
            submenu: [
                { label: 'By Name', action: () => callbacks.onArrangeIcons?.('name') },
                { label: 'By Type', action: () => callbacks.onArrangeIcons?.('type') }
            ]
        },
        { label: 'Refresh', icon: 'startLogo', action: () => location.reload() },
        { type: 'separator' },
        { 
            label: 'New', icon: 'newFolder', hasSubmenu: true,
            submenu: [
                { label: 'Folder', icon: 'folder', action: () => callbacks.onCreateNewFolder?.() },
                { label: 'Text Document', icon: 'editor', action: () => callbacks.onCreateNewFile?.('New Document.txt') },
                { label: 'Bitmap Image', icon: 'paint', action: () => callbacks.onCreateNewFile?.('New Image.png') }
            ]
        },
        { type: 'separator' },
        { label: 'Properties', icon: 'settings', action: () => showPropertiesDialog('Display Properties', 'Control Panel Applet', 'ZebOS 2 Pro Desktop') }
    ];
}

function renderContextMenu(x, y, items) {
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
        z-index: 99999;
        min-width: 160px;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        user-select: none;
    `;

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
        
        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${iconSvg}
                <span>${item.label}</span>
            </div>
            ${item.hasSubmenu ? '<span style="font-size:10px;">▶</span>' : ''}
        `;

        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#000080';
            row.style.color = '#ffffff';
        });

        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = 'transparent';
            row.style.color = '#000000';
        });

        row.addEventListener('click', (e) => {
            e.stopPropagation();
            closeContextMenu();
            if (item.action) item.action();
        });

        menu.appendChild(row);
    });

    document.body.appendChild(menu);
    activeContextMenu = menu;

    // Adjust positioning if menu exceeds viewport edges
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 4}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 4}px`;
    }
}

function showPropertiesDialog(name, type, location) {
    const dialog = document.createElement('div');
    dialog.className = 'window-frame active-window';
    dialog.style.cssText = `
        position: fixed;
        left: calc(50vw - 160px);
        top: calc(50vh - 120px);
        width: 320px;
        background-color: #c0c0c0;
        border: 2px solid #ffffff;
        border-right-color: #000000;
        border-bottom-color: #000000;
        box-shadow: 4px 4px 16px rgba(0,0,0,0.5);
        z-index: 99999;
        font-family: Arial, sans-serif;
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
            <div><strong>System:</strong> ZebOS 2 Pro Kernel v2.1.0</div>
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
