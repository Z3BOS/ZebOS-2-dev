
// A mark just remembers "when", the performance.now() timestamp at the
// moment it was set, keyed by name. measures.js reads marks back out to
// compute durations between them.
import { createBus } from './store.js';

const marks = new Map(); // name -> { t: performance.now(), at: Date.now() }
export const marksBus = createBus();

export function mark(name) {
    const entry = { t: performance.now(), at: Date.now() };
    marks.set(name, entry);
    marksBus.notify();
    return entry.t;
}

// Internal accessor used by measures.js. Returns the raw performance.now()
// value, or undefined if the mark was never set.
export function getMark(name) {
    const entry = marks.get(name);
    return entry ? entry.t : undefined;
}

export function getMarks() {
    return Array.from(marks.entries()).map(([name, entry]) => ({ name, t: entry.t, at: entry.at }));
}

export function clearMarks() {
    marks.clear();
    marksBus.notify();
}
