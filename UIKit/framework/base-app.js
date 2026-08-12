// Optional base class for ZebOS 2 apps. It handles the boilerplate every
// hand-written app.js repeats: delegated event binding and safe cleanup
// of window/document-level listeners. Fully compatible with the plain
// open()/cleanup() contract os.js expects; extend it or ignore it.

export class BaseApp {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;
        this.body = null;
        this._delegates = [];
        this._globalListeners = [];
        this._timers = [];
        this._dispatch = this._dispatch.bind(this);
    }

    // Called by os.js with the <div class="window-body"> createWindow() built.
    // Don't override this — override mount() instead.
    open(bodyElement) {
        this.body = bodyElement;
        ['click', 'input', 'change'].forEach(type => this.body.addEventListener(type, this._dispatch));
        this.mount();
    }

    // Override: render your initial UI into this.body (usually via this.render(html)).
    mount() {}

    // Replace this.body's contents.
    render(html) {
        this.body.innerHTML = html;
    }

    // Delegated event binding, scoped to this.body — replaces the
    // e.target.closest('[data-action]') boilerplate every app used to
    // hand-roll. Survives re-renders since it's bound to the container,
    // not the individual elements.
    //   this.on('click', '[data-action="save"]', (el, e) => { ... });
    on(type, selector, handler) {
        this._delegates.push({ type, selector, handler });
    }

    _dispatch(e) {
        for (const { type, selector, handler } of this._delegates) {
            if (type !== e.type) continue;
            const el = e.target.closest(selector);
            if (el && this.body.contains(el)) handler(el, e);
        }
    }

    // Track a window/document-level listener so cleanup() removes it
    // automatically. Use this instead of window.addEventListener
    // directly, a listener added straight on window/document outlives
    // the window unless something removes it, which is the #1 leak in
    // hand-written apps.
    //   this.listen(window, 'keydown', (e) => { ... });
    listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        this._globalListeners.push({ target, type, handler, options });
    }

    // Tracked setInterval/setTimeout — same return value as the native
    // call (a real timer id, safe to clearInterval/clearTimeout yourself
    // early), but also auto-cleared in cleanup() so a forgotten game
    // loop or polling timer can't keep running after the window closes.
    //   this.timerId = this.interval(() => this.tick(), 200);
    interval(fn, ms) {
        const id = setInterval(fn, ms);
        this._timers.push({ kind: 'interval', id });
        return id;
    }

    timeout(fn, ms) {
        const id = setTimeout(fn, ms);
        this._timers.push({ kind: 'timeout', id });
        return id;
    }

    // Ask the shell to close this app's window (same as clicking the X).
    close() {
        this.onCloseRequest?.();
    }

    // Called by os.js right before the window is removed. Override
    // onCleanup() instead if you need custom teardown, this base
    // implementation still needs to run to unregister listen()ed
    // listeners and interval()/timeout()ed timers.
    cleanup() {
        for (const { target, type, handler, options } of this._globalListeners) {
            target.removeEventListener(type, handler, options);
        }
        this._globalListeners = [];
        for (const { kind, id } of this._timers) {
            (kind === 'interval' ? clearInterval : clearTimeout)(id);
        }
        this._timers = [];
        this.onCleanup?.();
    }
}
