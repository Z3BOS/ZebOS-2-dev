// Recorded marks, measures, FPS and memory samples can be exported to a JSON file for later analysis or sharing. 
// This module provides functions to export the current telemetry data as JSON, download it as a file, and clear all recorded data.
import { getMarks, clearMarks } from './marks.js';
import { getMeasures, clearMeasures } from './measures.js';
import { getFpsSamples, getMemSamples, clearSamples } from './samplers.js';

export function exportJSON() {
    return JSON.stringify({
        exportedAt: new Date().toISOString(),
        marks: getMarks(),
        measures: getMeasures(),
        fpsSamples: getFpsSamples(),
        memSamples: getMemSamples()
    }, null, 2);
}

export function downloadExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zebos-telemetry-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export function clearAll() {
    clearMarks();
    clearMeasures();
    clearSamples();
}
