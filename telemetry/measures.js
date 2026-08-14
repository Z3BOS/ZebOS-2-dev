
// The event log: measure() results (a duration between two marks, or a
// mark and "now") and record() results (any one-off numeric metric a
// caller wants to log, like an item count, a custom score, whatever). Both
// land in the same capped list so the Log tab can show one timeline.
import { pushCapped, createBus } from './store.js';
import { getMark } from './marks.js';

const MAX_LOG = 500;
let measures = [];
export const measuresBus = createBus();

export function measure(name, startMark, endMark) {
    const start = getMark(startMark);
    if (start == null) {
        console.warn(`Telemetry.measure("${name}"): no mark named "${startMark}"`);
        return null;
    }
    let end;
    if (endMark) {
        end = getMark(endMark);
        if (end == null) {
            console.warn(`Telemetry.measure("${name}"): no mark named "${endMark}"`);
            return null;
        }
    } else {
        end = performance.now();
    }
    const value = end - start;
    pushCapped(measures, { kind: 'measure', name, value, t: Date.now() }, MAX_LOG);
    measuresBus.notify();
    return value;
}

export function record(name, value, meta = null) {
    pushCapped(measures, { kind: 'record', name, value, t: Date.now(), meta }, MAX_LOG);
    measuresBus.notify();
    return value;
}

export function getMeasures() {
    return measures.slice();
}

export function clearMeasures() {
    measures = [];
    measuresBus.notify();
}
