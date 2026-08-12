# UIKit app framework

Optional, but every app in `programs/` is now built on it. `os.js`
still only ever calls `open(bodyElement)` and `cleanup()` on an app
instance — `BaseApp` implements both of those for you and hands you
`mount()` instead, so you never have to write the boilerplate that
used to be copy-pasted into every single app file:

- **Global listener leaks.** Any app that did
  `window.addEventListener(...)` in `open()` had to remember to remove
  it in `cleanup()`, by hand, or it leaked after the window closed —
  two real instances of exactly this (`explorer.js`, `paint.js`) were
  found and fixed while migrating every app onto `this.listen()`.
- **Delegated-click boilerplate.** Most apps hand-rolled
  `e.target.closest('[data-action="..."]')` inside a single big
  `handleClick()`, and had to re-wire it after every re-render.
- **Hand-typed widget markup.** Buttons, list rows, checkboxes, and
  radios all have a fixed correct shape (see the class cheat sheet in
  `../README.md`) that's easy to get slightly wrong by hand — a wrong
  class name silently drops the retro styling instead of erroring.

Nothing stops a new app from skipping it and writing `open()` /
`cleanup()` directly — see `UIKit/examples/hello-app.js` for what that
looks like — `BaseApp` is sugar over the same contract, not a
requirement enforced anywhere.

## `base-app.js` — `BaseApp`

```js
import { BaseApp } from '../framework/index.js';

export class YourApp extends BaseApp {
    mount() {                          // instead of open()
        this.render(`<button data-action="go">Go</button>`);
        this.on('click', '[data-action="go"]', () => { /* ... */ });
    }
}
```

| Method | Replaces |
|---|---|
| `mount()` | the body of `open(bodyElement)` — `this.body` is already set when it's called |
| `this.render(html)` | `bodyElement.innerHTML = html` |
| `this.on(type, selector, handler)` | `e.target.closest(selector)` checks inside a manual click handler — survives re-renders, since it's delegated on `this.body`, not bound to elements that `render()` just threw away |
| `this.listen(target, type, handler)` | `target.addEventListener(...)` on `window`/`document` — tracked automatically and removed for you in `cleanup()` |
| `this.interval(fn, ms)` / `this.timeout(fn, ms)` | `setInterval`/`setTimeout` — same return value (a real timer id, safe to `clearInterval`/`clearTimeout` yourself early, e.g. to restart a game loop), but also auto-cleared in `cleanup()` so a forgotten poll or game tick can't keep running after the window closes |
| `this.close()` | calling `this.onCloseRequest()` |
| `onCleanup()` (optional override) | custom teardown beyond removing `listen()`ed listeners — `cleanup()` calls it for you if defined |

`open()` and `cleanup()` are still exactly what `os.js` calls — you
just don't write them yourself. If you override either one anyway,
call `super.open(bodyElement)` / `super.cleanup()` first or the
delegation and listener tracking won't be wired up.

## `ui.js` — widget markup

Small string-builders for the shared UIKit classes, so you don't
hand-type them:

```js
import { toolbarButton, listRow, checkboxRow, radioRow, separator, escapeHtml } from '../framework/index.js';

toolbarButton({ label: 'Save', action: 'save' });
listRow({ label: 'file.txt', selected: true });
checkboxRow({ label: 'Enable thing', checked: true });
radioRow({ name: 'mode', label: 'Standard', checked: true });
```

Every helper escapes `label` through `escapeHtml()` — also exported on
its own, use it any time you interpolate user- or file-supplied text
(filenames, saved content, etc.) into a template string yourself.
These return plain HTML strings for template-literal interpolation,
not DOM nodes or a component tree — there's no virtual DOM here,
consistent with how every other app in this codebase renders.

## What this framework deliberately doesn't do

No routing, no state management, no reactivity/re-render-on-change,
no virtual DOM. Every app still owns its own `render()` calls and
decides when to make them, exactly like `calc.js` does today. Adding
any of that would make simple apps *harder* to write, not easier —
if your app grows complex enough to want it, that's a decision to make
in the app, not something to inherit for free.
