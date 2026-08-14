// FPS and memory samplers
import { pushCapped, createBus } from './store.js';

export const SAMPLES_LEN = 120; // ~2 minutes of history at 1 sample/sec

let fpsSamples = [];
let memSamples = [];
export const samplesBus = createBus();

const memSupported = typeof performance !== 'undefined' && !!performance.memory;

let frameCount = 0;
let lastSampleTime = typeof performance !== 'undefined' ? performance.now() : 0;
let rafId = null;
let tickId = null;

function frame() {
    frameCount++;
    rafId = requestAnimationFrame(frame);
}

function tick() {
    const now = performance.now();
    const elapsed = now - lastSampleTime;
    const fps = elapsed > 0 ? Math.round((frameCount / elapsed) * 1000) : 0;
    frameCount = 0;
    lastSampleTime = now;
    pushCapped(fpsSamples, { t: Date.now(), fps }, SAMPLES_LEN);

    if (memSupported) {
        pushCapped(memSamples, {
            t: Date.now(),
            usedMB: performance.memory.usedJSHeapSize / 1048576,
            limitMB: performance.memory.jsHeapSizeLimit / 1048576
        }, SAMPLES_LEN);
    }
    samplesBus.notify();
}

function startSamplers() {
    if (rafId != null) return; // already running
    frameCount = 0;
    lastSampleTime = performance.now();
    rafId = requestAnimationFrame(frame);
    tickId = setInterval(tick, 1000);
}

export function isMemorySupported() { return memSupported; }
export function getFpsSamples() { return fpsSamples.slice(); }
export function getMemSamples() { return memSamples.slice(); }
export function clearSamples() { fpsSamples = []; memSamples = []; samplesBus.notify(); }

startSamplers();
