// UIKit/examples/hello-app-framework.js
//
// The exact same app as hello-app.js, rebuilt on UIKit/framework/ to
// show what it saves you: no manual event-listener wiring, no
// e.target.closest() boilerplate, and the widget markup comes from
// framework/ui.js instead of hand-typed HTML strings.
//
// Not wired into the desktop — copy it into programs/ and follow
// UIKit/howto/new-app.md steps 2-4 to make it launchable.

import { BaseApp, toolbarButton, listRow, checkboxRow, radioRow } from '../framework/index.js';

export class HelloApp extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);
        this.count = 0;

        // Delegated handlers survive re-renders, no re-querying elements
        // after every render() call, unlike the manual version.
        this.on('click', '[data-action="increment"]', () => {
            this.count++;
            this.updateCount();
        });
    }

    mount() {
        this.render(`
            <div style="display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:10px; gap:10px; font-family:Arial, sans-serif; font-size:12px;">

                <div>
                    ${toolbarButton({ label: 'Click me', action: 'increment' })}
                    <span style="margin-left:8px;">Clicked <b class="hello-count">0</b> times</span>
                </div>

                <div style="background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff;">
                    ${listRow({ label: 'Row one', selected: true })}
                    ${listRow({ label: 'Row two' })}
                </div>

                ${checkboxRow({ label: 'A setting' })}
                ${radioRow({ name: 'hello-choice', label: 'Choice A', checked: true })}
                ${radioRow({ name: 'hello-choice', label: 'Choice B' })}
            </div>
        `);
    }

    updateCount() {
        this.body.querySelector('.hello-count').textContent = this.count;
    }

    // No cleanup() override needed — this app only uses delegated
    // listeners (via this.on(), scoped to the window body) and never
    // calls this.listen() for a window/document-level one. BaseApp's
    // own cleanup() still runs to tear down internal wiring.
}
