# Modal dialogs

Not every interaction needs a full `.window-frame` from
`createWindow()`. For a quick prompt, confirmation, or save-as box,
`os.js` already ships three ready-to-call helpers built on two UIKit
classes:

- `.os-modal-overlay` (`chrome/windows.css`) — a fixed, full-viewport,
  transparent, centering flex container. It doesn't dim the
  background; it just centers the dialog.
- `.os-prompt-modal` (styled via the same `.active-window
  .window-header` rule as a real window, in `chrome/windows.css`) — a
  non-draggable, non-resizable dialog box that reuses `.window-header`
  / `.window-title` / `.window-controls` / `.win-btn` so it looks like
  a small window.

## The three built-in helpers

All three live in `os.js` and build this same overlay + dialog pair,
then `document.body.appendChild()` it:

| Function | Use for |
|---|---|
| `showOsPrompt(title, message, defaultValue, onConfirm)` | A single text input + OK/Cancel. `onConfirm(value)` fires on OK. |
| `showOsConfirm(title, message, isWarning, onConfirm)` | Yes/No (or a single OK if `onConfirm` is omitted). `isWarning` swaps the header to red and the icon to `!`. |
| `showSaveFileDialog(defaultName, onSaveCallback)` | A "Save As" filename prompt. |

Call them directly — they don't need registering anywhere:

```js
import { showOsConfirm } from '../os.js'; // or however your module reaches os.js

showOsConfirm('Delete file?', 'This cannot be undone.', true, () => {
    // runs on "Yes"
});
```

None of the three take an app id or window id — they're one-shot,
self-closing overlays, not tracked in the taskbar like `.window-frame`
windows are.

## Building your own

If none of the three fit, copy the shape of `showOsConfirm()` in
`os.js` (search for `export function showOsConfirm`): create the
`.os-modal-overlay` div, create a `.os-prompt-modal.active-window` div
inside it with a `.window-header` / `.window-controls` /
`.win-btn#...-close` structure, append to `document.body`, and remove
both elements on close. `z-index: 100005` on the overlay is the
existing convention — high enough to sit above any `.window-frame`
(which top out in the low thousands via `topZIndex` in `os.js`).

Reach for this pattern instead of a full `createWindow()` window when
the interaction is a single question that blocks the rest of the UI
until answered — anything with ongoing state or that the user might
want to leave open in the background belongs in a real window instead.
