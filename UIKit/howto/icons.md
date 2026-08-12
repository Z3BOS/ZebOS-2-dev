# Icons

ZebOS 2 has no icon image files — every icon is a hand-written inline
SVG string, keyed by name, in `icons.js`. There's exactly one function
you call to get one:

```js
import { getIcon } from '../icons.js'; // path relative to your file

getIcon('calc')                 // '<svg class="sys-icon" ...>...</svg>'
getIcon('calc', 'my-extra-cls') // same, with an extra class appended
```

`getIcon(name)` falls back to `SVGS.file` if `name` isn't found, so a
typo'd icon name never throws — it just silently renders the generic
file icon. Worth knowing when an icon looks wrong: check the key
spelling in `icons.js` first.

## Why you never size a `.sys-icon` yourself

Every icon carries the same base rule from `chrome/desktop.css`:

```css
.sys-icon {
    width: 18px;
    height: 18px;
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
}
```

...and then a set of *context* selectors override that size depending
on where the icon lands in the DOM. This is the complete list, all in
`chrome/desktop.css` unless noted:

| Selector | Size | Context |
|---|---|---|
| `.sys-icon` | 18×18 | default/fallback |
| `.desktop-icon .sys-icon` | 38×38 | desktop shortcut icons |
| `.desktop-icon.small-view .sys-icon` | 18×18 | desktop icons in "small view" |
| `.start-menu-item .sys-icon` | 20×20 | Start Menu rows |
| `.window-title .sys-icon` | 16×16 | window titlebar |
| `.taskbar-tab .sys-icon` | 16×16 | taskbar tabs |
| `.explorer-item div > .sys-icon`, `.explorer-table-row .sys-icon`, `.exp-drive-card .sys-icon` | 100%×100% | Zeb Explorer grid/list/drive cards — sized by their own container |
| `.paint-tool-btn .sys-icon`, `.paint-btn .sys-icon` | 16×16 | Paint toolbar |
| `.app-toolbar-btn .sys-icon` | 16×16 | `forms/app-chrome.css` — shared toolbar buttons |
| `.app-list-row .sys-icon` | 16×16 | `forms/app-chrome.css` — list rows (Task Manager, etc.) |
| `.exp-icon-wrap .sys-icon` | 100%×100% | `chrome/context-menu.css` — right-click menu icons |
| `.recovery-title .sys-icon` | 16×16 | `screens/recovery.css` — Recovery Mode titlebar |

This is *why* step 4 of [new-app.md](new-app.md) tells you to always
draw new icons with `class="sys-icon"` — drop one anywhere on this
list (desktop icon, start menu row, window titlebar, taskbar tab...)
and it's already the right size, no extra CSS.

If you add a **new context** that needs its own icon size (a new
kind of list row, a new toolbar), add one more selector to this same
block in `chrome/desktop.css` rather than sizing the SVG inline —
keeping every size rule in one place is what makes an icon "just work"
everywhere.

## Drawing a new icon

Every entry in `SVGS` follows the same shape — copy the nearest
existing one and restyle it:

```js
'your-app': `
    <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="1.5" fill="#c0c0c0" stroke="#444444" stroke-width="1.5"/>
    </svg>
`,
```

Conventions to match (not enforced by CSS, just consistency with the
rest of the set):

- `viewBox="0 0 24 24"`, no explicit `width`/`height` attribute — the
  CSS context selectors control final size, the `viewBox` just defines
  the coordinate space.
- `stroke-width` in the 0.8–2 range, scaled to look right at ~18–38px
  — these render small, thin strokes disappear or alias badly.
- Stick to the existing retro palette where it fits: `#c0c0c0` /
  `#808080` chrome grays, `#000080` Windows blue, `#ffca28`/`#ffb300`
  folder yellows — pulling from colors already used elsewhere in
  `icons.js` keeps a new icon from looking out of place next to the
  others.

## Using an icon outside a `.sys-icon` context

`getIcon(name, customClass)` appends an extra class onto the same
`class="sys-icon ..."` attribute rather than replacing it — so even a
"custom" usage still gets the base 18×18 sizing plus whatever your
class overrides. `SVGS` itself is a module-private map — nothing in
the codebase imports it directly, `getIcon()` is the only way in. If
some future usage genuinely needs an icon without `.sys-icon`'s base
sizing, that's a reason to export `SVGS` too, not to reach around
`icons.js`.
