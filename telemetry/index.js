// telemetry/index.js
// Public entry point for Telemetry, ZebOS's performance-testing and
// instrumentation framework. See README.md for the full picture; the
// short version:
//
//   import { Telemetry } from './telemetry/index.js';
//   Telemetry.mark('boot-start');
//   ...
//   Telemetry.measure('boot-time', 'boot-start');
//
// FPS and heap-memory samplers start automatically the first time
// anything imports this module (or any of its submodules) and run for
// the life of the OS session. The viewer (TelemetryApp) is a
// devtools-only window, reachable by typing "telemetry" into Run — no
// desktop icon or Start Menu entry, same as devtools/sysflags.js.
import { mark, getMarks, marksBus } from './marks.js';
import { measure, record, getMeasures, measuresBus } from './measures.js';
import { getFpsSamples, getMemSamples, isMemorySupported, samplesBus } from './samplers.js';
import { exportJSON, downloadExport, clearAll } from './export.js';

export const Telemetry = {
    mark,
    measure,
    record,
    getMarks,
    getMeasures,
    getFpsSamples,
    getMemSamples,
    isMemorySupported,
    exportJSON,
    downloadExport,
    clear: clearAll,
    // Fires after any mark/measure/record call, and once a second as new
    // FPS/memory samples land. Returns an unsubscribe function.
    subscribe(fn) {
        const unsubs = [marksBus.subscribe(fn), measuresBus.subscribe(fn), samplesBus.subscribe(fn)];
        return () => unsubs.forEach(u => u());
    }
};

export { TelemetryApp } from './app.js';
