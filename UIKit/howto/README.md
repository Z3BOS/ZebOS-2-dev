# UIKit how-to guides

Start with [new-app.md](new-app.md) if you're building something new.
The rest are reference for specific pieces of the shell:

| Guide | Covers |
|---|---|
| [new-app.md](new-app.md) | Wiring a new `programs/*.js` app into the launcher, desktop icons, start menu, and icon set. |
| [theming.md](theming.md) | The `--os-titlebar-*` color scheme, `body.rounded-corners`, and what's (deliberately) not themeable. |
| [dialogs.md](dialogs.md) | `showOsPrompt` / `showOsConfirm` / `showSaveFileDialog`, and `.os-modal-overlay` / `.os-prompt-modal` if you need to build your own. |
| [icons.md](icons.md) | The code-based SVG icon set in `icons.js`, `.sys-icon`'s full sizing-context table, and how to draw a new icon. |
| [context-menus.md](context-menus.md) | How right-click menus are built in `contextmenu.js`, and how to add one for your app. |

See also the top-level [UIKit README](../README.md) for the file
structure and reusable-class cheat sheet, [../framework/](../framework/)
for the optional app base class + widget helpers, and
[../examples/](../examples/) for a live component gallery.
