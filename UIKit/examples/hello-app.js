// UIKit/examples/hello-app.js
//
// A minimal ZebOS 2 app, built by hand (no framework) entirely out of
// UIKit's shared classes. This is the same shape every existing app
// in programs/ (see programs/calc.js) already uses: a class with
// open(bodyElement) and, if you register any window/document-level
// listeners, cleanup(). It's not wired into the desktop, copy it into
// programs/ and follow UIKit/howto/new-app.md steps 2-4 to make it
// launchable.
//
// See hello-app-framework.js for the same app built on
// UIKit/framework/ instead. Less boilerplate, same result basically.

export class HelloApp {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest; // call this if your app can close itself
        this.count = 0;
    }

    open(bodyElement) {
        this.bodyElement = bodyElement;
        this.render();

        // bodyElement itself is already removed from the DOM by os.js
        // when the window closes, so listeners added *on it* don't need
        // manual cleanup. Only listeners on window/document do — see
        // cleanup() below.
        this.clickHandler = (e) => this.handleClick(e);
        this.bodyElement.addEventListener('click', this.clickHandler);
    }

    handleClick(e) {
        if (e.target.closest('[data-action="increment"]')) {
            this.count++;
            this.updateCount();
        }
    }

    render() {
        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:10px; gap:10px; font-family:Arial, sans-serif; font-size:12px;">

                <!-- .app-toolbar-btn: shared UIKit button chrome, no custom CSS needed -->
                <div>
                    <button class="app-toolbar-btn" data-action="increment">Click me</button>
                    <span style="margin-left:8px;">Clicked <b class="hello-count">0</b> times</span>
                </div>

                <!-- .app-list-row: shared UIKit selectable-list chrome -->
                <div style="background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff;">
                    <div class="app-list-row selected">Row one</div>
                    <div class="app-list-row">Row two</div>
                </div>

                <!-- .zeb-checkbox-label + input[type=radio]: styled by UIKit automatically -->
                <label class="zeb-checkbox-label"><input type="checkbox"> A setting</label>
                <label><input type="radio" name="hello-choice" checked> Choice A</label>
                <label><input type="radio" name="hello-choice"> Choice B</label>
            </div>
        `;
    }

    updateCount() {
        const el = this.bodyElement.querySelector('.hello-count');
        if (el) el.textContent = this.count;
    }

    cleanup() {
        // This is a little fucked, but the point is: if you add any window/document-level listeners, remove them here. Anything added to bodyElement itself is already removed by os.js when the window closes.
    }
}
