# Context menus

Right-click menus are centralized, not per-app. One listener in
`contextmenu.js` handles every `contextmenu` event in the document and
decides what to show based on what was clicked — there's no per-app
registration API. If your app needs a right-click menu, you extend
`contextmenu.js` itself.

## How it's wired up

`initContextMenuSystem(callbacks)` (called once, from `os.js`) adds a
single document-level `contextmenu` listener:

```js
document.addEventListener('contextmenu', (e) => {
    const items = getContextMenuForElement(e.target, callbacks);
    if (items && items.length > 0) {
        e.preventDefault();
        renderContextMenu(e.clientX, e.clientY, items);
    }
    // else: let the browser's native menu through (unless it's a text field)
});
```

`getContextMenuForElement(target, callbacks)` is a plain top-to-bottom
chain of `target.closest(selector)` checks — the first one that
matches wins:

```js
// 1. Taskbar Tab            → .taskbar-tab
// 2. Explorer File/Folder   → .explorer-item, .explorer-table-row
// 2.5 Explorer empty space  → .explorer-grid, .explorer-table, ...
// 3. Window Titlebar        → .window-header
// 4. Desktop Shortcut       → .desktop-icon
// 5. System Taskbar Strip   → #system-taskbar
// 6. Window Body/Frame      → .window-frame, .window-body
// 7. Desktop Background     → #desktop, #desktop-icons-zone, body
```

Each branch returns an **array of menu item descriptors**:

```js
return [
    { label: 'Open', icon: 'folder', bold: true, action: () => callbacks.onOpenExplorerItem?.(itemName, itemType, explorerItem) },
    { type: 'separator' },
    { label: 'Delete Folder', icon: 'winClose', action: () => callbacks.onDeleteFile?.(itemName, explorerItem) },
];
```

- `icon` is a name from `icons.js` (rendered via `getIcon()`), not a
  raw SVG string.
- `bold: true` renders the label bold (used for the default/primary
  action, e.g. "Open").
- `{ type: 'separator' }` draws a horizontal divider instead of a row.
- `action` is called on click; menus close automatically afterward.
- Actual side effects go through the `callbacks` object passed into
  `initContextMenuSystem()` — menu items call `callbacks.onX?.(...)`
  rather than reaching into app state directly, so `contextmenu.js`
  stays decoupled from any specific app.

## Adding a menu for your app

If your app's content needs its own right-click menu, add a new
branch to `getContextMenuForElement()` in `contextmenu.js`, above the
generic "Window Body/Frame" (`.window-frame, .window-body`) fallback
so it takes priority for elements inside your app:

```js
// N. Your App's Item
const yourItem = target.closest('.your-app-item');
if (yourItem) {
    return [
        { label: 'Do the thing', icon: 'calc', action: () => callbacks.onYourAppAction?.(yourItem) },
    ];
}
```

Then wire `onYourAppAction` into the `callbacks` object passed to
`initContextMenuSystem()` in `os.js`. No CSS or `UIKit/index.css`
change needed — `.retro-context-menu` and `.context-menu-item` from
`chrome/context-menu.css` already render whatever items you return.

## The CSS

`chrome/context-menu.css` styles the shell (`.retro-context-menu`) and
the hover state (`.context-menu-item:hover`); `renderContextMenu()` in
`contextmenu.js` sets everything else (position, per-row layout,
padding) inline, since a menu's position is inherently dynamic. If you
need a new *visual* variant (not just new items), that's the file to
extend — but check first whether an existing pattern already covers
it, since every menu on the desktop currently shares one look.

Submenus (`item.submenu`) and checkable items (`item.isCheckable` /
`item.checked`, rendered with a ✓ prefix) are supported by the same
descriptor format — see the existing branches in
`getContextMenuForElement()` for examples before inventing a new item
shape.
