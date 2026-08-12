# UIKit

Structure and the class cheat sheet are below. See
[framework/](framework/) for the optional app base class that removes
most of the boilerplate below, [howto/new-app.md](howto/new-app.md)
for wiring in a new app, and [examples/](examples/) for a component
gallery and a minimal example app.

---

UIKit is the unified ZebOS UI shared by every window, menu, and
program in ZebOS. It has no build step. It's plain CSS, loaded once
by `index.html`:

```html
<link rel="stylesheet" href="UIKit/index.css">
```

`UIKit/index.css` is just an `@import` list, in the same order the
original monolithic `style.css` had its sections, so cascade order
(and therefore visual output) is unchanged from before the split:

```
UIKit/
  index.css              entry point — @imports everything below, in original cascade order
  base.css               reset, :root theme vars, rounded-corners toggle, .hidden-view

  chrome/                the persistent desktop shell
    desktop.css            desktop canvas, desktop icons, .sys-icon sizing rules
    start-menu.css         #start-menu popup
    taskbar.css            #system-taskbar, start button, tray, tray menu
    context-menu.css       .retro-context-menu (right-click menus)
    windows.css            .window-frame chrome — the shell every app opens into

  forms/                 shared widget chrome any app can reuse
    form-controls.css      Win95 radio buttons + custom scrollbar
    app-chrome.css         shared toolbar button / list-row chrome + checkbox

  screens/               full-screen states that replace the desktop
    boot-screen.css        kernel boot log + splash art
    dev-mode.css           Ctrl+Alt dev console badge/panel
    recovery.css           Recovery Mode property-sheet dialog
    loading-screen.css     XP-style loading screen

  apps/                  individual program UI
    explorer.css           Zeb Explorer file manager grid
    chess.css              Chess board + sidebar
    solitaire.css          Solitaire cards/table

  framework/              optional app base class + widget markup helpers
  howto/                 step-by-step guides
  examples/              component gallery + a minimal example app
```

Folder grouping is cosmetic — `index.css`'s `@import` order is what
actually controls the cascade, and it still matches the original
`style.css` source order regardless of which folder a file lives in.

## What actually belongs in UIKit vs. your app

**UIKit owns the shell.** It gives you `.window-frame` (the draggable,
resizable, min/max/close window), the taskbar, the start menu, and a
handful of shared retro widgets (`.app-toolbar-btn`, `.app-list-row`,
`.zeb-checkbox-label`, `input[type=radio]`).

**Your app owns everything inside `.window-body`.** Look at any file
in `programs/` (e.g. `programs/calc.js`) — apps render their own
markup into the body element `createWindow()` hands them, and ship
their own `<style>` block for anything UIKit doesn't already cover.
Reach for a UIKit class first when one exists (don't reinvent
`.app-toolbar-btn`); write scoped, app-prefixed classes for anything
UIKit doesn't have. [`framework/`](framework/) is an optional base
class + markup helpers that build on exactly this contract — it
doesn't change what belongs where, it just cuts the boilerplate.

## Reusable classes cheat sheet

| Class | File | What it's for |
|---|---|---|
| `.window-frame` / `.window-header` / `.window-body` / `.window-controls` | chrome/windows.css | The window shell. Built for you by `createWindow()` in `os.js` — you rarely write these by hand. |
| `.win-btn` | chrome/windows.css | Min/max/close window titlebar buttons. |
| `.app-toolbar-btn` | forms/app-chrome.css | Beveled Win95 toolbar button — same 3D bevel as `.win-btn` but sized for toolbars. Use for any "Save / New / Delete"-style action bar. |
| `.app-list-row` (+ `.selected`) | forms/app-chrome.css | A selectable row in a list (Task Manager process list, file lists, etc). |
| `.zeb-checkbox-label` | forms/app-chrome.css | Wrap a `<label>` around a `<input type="checkbox">` for the retro checkmark. |
| `input[type="radio"]` | forms/form-controls.css | Styled automatically — no class needed, just use a real radio input. |
| `.w95-dropdown` / `.w95-drop-display` / `.w95-drop-list` | forms/form-controls.css | Custom Win95 retro select dropdown control. Use `w95Dropdown()` and `bindW95Dropdown()` from `UIKit/framework/index.js`. |
| `.w95-input` | forms/form-controls.css | Sunken 3D Win95 text input box and textarea. |
| `.w95-tab-header` / `.w95-tab-item` / `.w95-tab-body` | forms/form-controls.css | Classic Win95 property-sheet tabbed container control. |
| `.w95-progress-track` / `.w95-progress-fill` | forms/form-controls.css | Inset Win95 blue progress bar control. |
| `.w95-drop-list` | forms/form-controls.css | Add to a scrollable list/dropdown to get the beveled Win95 scrollbar. |
| `.sys-icon` | chrome/desktop.css | Base size for the code-based SVG icon set (`icons.js`). Context selectors (`.window-title .sys-icon`, `.taskbar-tab .sys-icon`, etc.) resize it automatically depending on where it's placed — you don't need to size it yourself. |
| `.retro-context-menu` / `.context-menu-item` | chrome/context-menu.css | Right-click menus, built by `contextmenu.js`. See [howto/context-menus.md](howto/context-menus.md). |
| `.os-modal-overlay` / `.os-prompt-modal` | chrome/windows.css | Centered modal dialogs (see `showOsPrompt()` in `os.js`). See [howto/dialogs.md](howto/dialogs.md). |

Everything else (`.chess-*`, `.solitaire-*`, `.recovery-*`,
`.explorer-*`, `.zeb-loading-*`) is feature-specific — copy the
pattern, don't reuse the classes for unrelated apps.

## The retro 3D bevel, if you need your own

Almost every raised Win95 control in this codebase (buttons, panels,
inputs) uses the same border trick:

```css
border: 2px solid #ffffff;
border-right-color: #000000;
border-bottom-color: #000000;
```

...and for the pressed/sunken state, the same colors flipped, usually
paired with a 1px nudge via `padding-top`/`padding-left` so the
content visibly "moves in":

```css
border: 2px solid #000000;
border-right-color: #ffffff;
border-bottom-color: #ffffff;
```

See `UIKit/examples/component-gallery.html` for this rendered live.

## See also

- [framework/](framework/) — the optional app base class and widget
  markup helpers.
- [howto/](howto/) — step-by-step guides: building a new app, theming,
  dialogs, icons, context menus.
- [examples/](examples/) — a browsable component gallery and a
  minimal example app to copy from.
