# Theming

ZebOS 2 has one small, real theming system: window titlebar color and
whether window corners are rounded. Both are driven from the
Personalize app and applied live via `applyOsSettings()` in `os.js`
(search for `Apply all OS appearance settings to live DOM`).

## Titlebar color scheme

`UIKit/base.css` declares the custom properties every window header
reads:

```css
:root {
    --os-titlebar-bg: #000080;
    --os-titlebar-fg: #ffffff;
    --os-font-size: 12px;
    --os-border-radius: 0px;
}
```

`chrome/windows.css` consumes them on the active window's header:

```css
.active-window .window-header,
.os-prompt-modal .window-header,
.window-frame.active-window .window-header {
    background: var(--os-titlebar-bg, linear-gradient(90deg, #000080 0%, #1084d0 100%)) !important;
    color: var(--os-titlebar-fg, #ffffff) !important;
}
```

`os.js` swaps the two properties at runtime with
`document.documentElement.style.setProperty(...)`, driven by a fixed
palette of named schemes:

```js
const schemes = {
    'standard':      { '--os-titlebar-bg': '#000080', '--os-titlebar-fg': '#ffffff' },
    'high-contrast': { '--os-titlebar-bg': '#000000', '--os-titlebar-fg': '#ffffff' },
    'rose':          { '--os-titlebar-bg': '#8b1a4a', '--os-titlebar-fg': '#ffffff' },
    'emerald':       { '--os-titlebar-bg': '#064e3b', '--os-titlebar-fg': '#ffffff' },
    'midnight':      { '--os-titlebar-bg': '#1a237e', '--os-titlebar-fg': '#ffffff' },
};
```

To add a new scheme, add an entry to that object in `os.js` and wire
it into the Personalize app's color picker (`programs/personalize.js`)
— there's no UIKit-side change needed, the CSS already reads whatever
the two custom properties are set to.

`--os-font-size` and `--os-border-radius` are declared but not
currently read anywhere in the CSS — they're reserved for future use,
not live knobs yet.

## Rounded corners

A single class on `<body>` flips every window/menu corner from square
to rounded. `applyOsSettings()` toggles it:

```js
if (settings.roundedCorners) {
    document.body.classList.add('rounded-corners');
} else {
    document.body.classList.remove('rounded-corners');
}
```

`base.css` defines what it affects:

```css
body.rounded-corners .window-frame { border-radius: 6px !important; overflow: hidden; }
body.rounded-corners .window-header { border-radius: 4px 4px 0 0 !important; }
body.rounded-corners #start-menu { border-radius: 6px 6px 0 0 !important; }
body.rounded-corners .retro-context-menu { border-radius: 4px !important; }
```

If you add a new top-level popup/menu element to UIKit, add a
`body.rounded-corners .your-thing { border-radius: ...; }` rule next
to these so it stays consistent when the setting is on.

## Desktop background

Not a CSS variable — `applyOsSettings()` sets `background-color` and
`background-image` directly on `#desktop-canvas` from the user's
chosen color/pattern. This is app-level state, not part of UIKit; see
`applyOsSettings()` in `os.js` if you need to touch it.

## What's *not* themeable

Everything else — the `#c0c0c0` gray chrome, the black/white 3D
bevels, `#008080` teal accents — is hardcoded across UIKit's CSS
files. That's intentional: the whole aesthetic is "Windows 95", and
letting more of it vary would mean auditing every file for hardcoded
colors. If you want to theme something beyond titlebar
color/roundedness, treat it as a deliberate expansion of this system
(new custom property in `base.css`, consumed in the relevant file,
set from `applyOsSettings()`), not a one-off override in your app.
