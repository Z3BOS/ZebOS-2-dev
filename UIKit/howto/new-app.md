# Building a new app on UIKit

ZebOS 2 has no build step. An app is a plain class with
`open()`/`cleanup()` methods, living in `programs/`, dynamically
imported by `os.js` when launched. UIKit supplies the window chrome
around it; you only render what goes inside `.window-body`.

[`UIKit/framework/`](../framework/) gives you a base class for that
plus markup helpers for UIKit's shared widgets, so you don't hand-roll
the same event-cleanup and click-delegation boilerplate every existing
app currently repeats. It's optional — the framework is just sugar
over the same `open()`/`cleanup()` contract `os.js` expects either way.

Copy [`../examples/hello-app-framework.js`](../examples/hello-app-framework.js)
as a starting point (or [`../examples/hello-app.js`](../examples/hello-app.js)
for the no-framework version) — it implements every step below in
under 40 lines. This doc explains what each step is doing and why.

## 1. Write the app module

`programs/your-app.js`:

```js
import { BaseApp, toolbarButton } from '../UIKit/framework/index.js';

export class YourApp extends BaseApp {
    mount() {
        this.render(`
            <div style="padding:10px; height:100%; box-sizing:border-box;">
                ${toolbarButton({ label: 'Do the thing', action: 'go' })}
            </div>
        `);
        this.on('click', '[data-action="go"]', () => { /* ... */ });
    }
}
```

- `mount()` is called once `this.body` (the `<div class="window-body">`
  `createWindow()` built and mounted) is ready — style your content to
  fill it (`height:100%`, `box-sizing:border-box`), don't create your
  own window frame.
- Reach for the shared classes in the [cheat sheet](../README.md#reusable-classes-cheat-sheet)
  (`.app-toolbar-btn`, `.app-list-row`, `.zeb-checkbox-label`, real
  `<input type="radio">`) — `framework/ui.js`'s `toolbarButton()`,
  `listRow()`, `checkboxRow()`, `radioRow()` build the correct markup
  for each so you don't have to type the class names by hand.
- `this.on(type, selector, handler)` delegates on `this.body`, so it
  keeps working after `this.render()` replaces the DOM underneath it.
- If you need styles UIKit doesn't cover, inject a `<style>` tag as
  part of your `render()` HTML (see `programs/calc.js`) — app-specific
  CSS stays with the app, not in UIKit.
- Skip `cleanup()` entirely unless you call `this.listen(window, ...)`
  or `this.listen(document, ...)` somewhere — `BaseApp` removes those
  automatically; only override `onCleanup()` for anything beyond that.
  See [`framework/README.md`](../framework/README.md) for the full
  method list, and `programs/calc.js` for what the equivalent looks
  like written out by hand, without the framework.

## 2. Wire it into the launcher

In `os.js`, `launchApplication(appId, ...)` is a big `switch` keyed by
the same id you'll use everywhere else (`start-link-your-app`). Add a
case next to the existing ones (e.g. by `start-link-calc` around line
1600):

```js
case 'start-link-your-app': {
    const winId = 'app-your-app';
    try {
        const module = await import(`./programs/your-app.js?v=${Date.now()}`);
        const body = createWindow("Your App", "your-app", winId);
        if (body) {
            setWindowBounds(body, 480, 360); // width, height
            const instance = new module.YourApp(() => closeWindow(winId));
            registerWindowCleanup(winId, () => instance.cleanup());
            instance.open(body);
        }
    } catch (err) {
        logKernel(`Kernel Error: Failed to mount your-app.js (${err.message})`, "ERROR");
    }
    break;
}
```

- `createWindow(title, iconName, uniqueId)` builds the `.window-frame`,
  taskbar tab, and drag/resize/min/max/close wiring, and returns the
  `.window-body` element (or `null` if a window with that `uniqueId`
  is already open — it just focuses the existing one instead).
- `iconName` is looked up via `getIcon()` in `icons.js` — see step 4.
- The dynamic `import(...)` with a cache-busting `?v=` query is the
  existing convention for every app in this codebase; follow it so
  dev-mode reloads pick up your changes.

## 3. Add a desktop icon + start menu entry

Desktop icons are generated from one array — `INITIAL_DESKTOP_SHORTCUTS`
in `os.js` (search for `DESKTOP SHORTCUT ICONS`). Add an entry:

```js
{ id: 'start-link-your-app', icon: 'your-app', label: 'Your App' },
```

Then add the matching static entry to the Start Menu list in
`index.html` (inside `#start-menu-links`), following the existing
pattern:

```html
<div class="start-menu-item" id="start-link-your-app" data-icon="your-app">
    <span class="menu-icon"></span> Your App
</div>
```

Both the desktop icon and the start menu item use the `.sys-icon`
sizing rules from UIKit automatically — you don't add any CSS here.

## 4. Add an icon glyph

Icons are code-based SVGs, not image files, defined in `icons.js`'s
`SVGS` map and served through `getIcon(name)`. Add a `your-app` key
next to the others:

```js
'your-app': `
    <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="1.5" fill="#c0c0c0" stroke="#444" stroke-width="1.5"/>
    </svg>
`,
```

Always include `class="sys-icon"` and `viewBox="0 0 24 24"` — every
context selector in `UIKit/chrome/desktop.css` that resizes icons
(`.desktop-icon .sys-icon`, `.taskbar-tab .sys-icon`, `.window-title
.sys-icon`, ...) targets that class, so a new icon slots into every
context (desktop, start menu, taskbar tab, window titlebar) without
any extra CSS. See [icons.md](icons.md) for the full list of contexts
and icon-drawing conventions.

## 5. Try it

Open `index.html`, click your desktop icon or Start Menu entry, and
confirm: the window opens centered with the taskbar tab active, drag
the titlebar, minimize/maximize/close all work (all free, from
`createWindow()`), and your content fills the body correctly at a
couple of different window sizes (the body has
`container-type: inline-size`, so anything sized in `cqw`/`em` will
respond to resizing).

## See also

- [../framework/README.md](../framework/README.md) — the full
  `BaseApp` method list and `ui.js` widget helpers.
- [theming.md](theming.md) — how the `--os-titlebar-*` color scheme
  and rounded-corners toggle work, if your app needs to respect them.
- [dialogs.md](dialogs.md) — popping a modal prompt/confirm instead of
  a full window.
- [icons.md](icons.md) — the `.sys-icon` sizing system in full.
- [context-menus.md](context-menus.md) — how right-click menus are
  built, if your app needs one.
