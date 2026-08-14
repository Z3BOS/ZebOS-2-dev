
// Internal plumbing shared by marks.js, measures.js and samplers.js.
// Not part of the public API 

// Pushes onto a capped array, dropping the oldest entry once `cap` is
// exceeded, so long-running sessions don't grow these arrays forever.
export function pushCapped(arr, item, cap) {
    arr.push(item);
    if (arr.length > cap) arr.shift();
    return arr;
}

// Minimal pub/sub so the viewer can re-render whenever new data
// lands, without each module needing to know the viewer exists.
export function createBus() {
    const listeners = new Set();
    return {
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        notify() {
            listeners.forEach(fn => {
                try { fn(); } catch (_) { /* one bad listener shouldn't break the rest */ }
            });
        }
    };
}
