// telemetry/app.js
// The Telemetry viewer window: a Live tab (FPS + heap memory sparklines)
// and a Log tab (every mark/measure/record this session, newest first).
// Devtools-only — no desktop icon or Start Menu entry, reachable only by
// typing "telemetry" into Run, same as devtools/sysflags.js. UI chrome
// (tab bar, dark sparkline canvas) is deliberately borrowed from
// programs/taskmgr.js's Performance tab so it fits the rest of ZebOS's
// devtools instead of introducing a new visual language.
import { BaseApp } from '../UIKit/framework/index.js';
import { getMarks, marksBus } from './marks.js';
import { getMeasures, measuresBus } from './measures.js';
import { getFpsSamples, getMemSamples, isMemorySupported, SAMPLES_LEN, samplesBus } from './samplers.js';
import { downloadExport, clearAll } from './export.js';
import { drawSparkline } from './graph.js';

// Imports individual submodules rather than the Telemetry facade in
// index.js to avoid a circular import (index.js re-exports this class).
export class TelemetryApp extends BaseApp {
    constructor(onCloseRequest) {
        super(onCloseRequest);
        this.activeTab = 'live';
        this.liveMetric = 'fps';
        this.unsubscribes = [];
    }

    mount() {
        this.body.style.height = '100%';
        const rerender = () => this.renderUI();
        this.unsubscribes = [marksBus.subscribe(rerender), measuresBus.subscribe(rerender), samplesBus.subscribe(rerender)];
        this.renderUI();
    }

    onCleanup() {
        this.unsubscribes.forEach(u => u());
    }

    renderUI() {
        this.render(`
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box;">
                ${this.renderTabBar()}
                <div style="flex-grow:1; overflow:hidden; display:flex; flex-direction:column; min-height:0;">
                    ${this.activeTab === 'live' ? this.renderLiveTab() : this.renderLogTab()}
                </div>
            </div>
        `);
        this.bindEvents();
        if (this.activeTab === 'live') this.drawLiveGraph();
    }

    renderTabBar() {
        const tabs = [{ id: 'live', label: 'Live' }, { id: 'log', label: 'Log' }];
        return `
            <div style="display:flex; flex-shrink:0; background:#c0c0c0; border-bottom:2px solid #808080; padding-top:6px; gap:4px; padding-left:6px; user-select:none;">
                ${tabs.map(t => {
                    const active = this.activeTab === t.id;
                    return `<button class="tlm-tab-btn" data-tab="${t.id}" style="
                        padding:5px 16px; font-size:12px; font-weight:${active ? 'bold' : 'normal'}; cursor:pointer;
                        background:${active ? '#ffffff' : '#c0c0c0'};
                        border:2px solid #ffffff; border-right-color:#808080; border-bottom-color:${active ? '#ffffff' : '#808080'};
                        margin-bottom:-2px; position:relative; z-index:${active ? '2' : '1'};
                    ">${t.label}</button>`;
                }).join('')}
            </div>
        `;
    }

    renderLiveTab() {
        const fpsSamples = getFpsSamples();
        const memSamples = getMemSamples();
        const memSupported = isMemorySupported();
        const lastFps = fpsSamples.length ? fpsSamples[fpsSamples.length - 1].fps : 0;
        const lastMem = memSamples.length ? memSamples[memSamples.length - 1] : null;

        const metrics = [
            { id: 'fps', label: 'FPS', value: `${lastFps}`, sub: 'Frames per second (requestAnimationFrame counter, sampled 1/sec)' },
            { id: 'memory', label: 'Memory', value: memSupported ? `${lastMem.usedMB.toFixed(0)} MB` : 'n/a', sub: memSupported ? `of ${lastMem.limitMB.toFixed(0)} MB heap limit (performance.memory)` : 'performance.memory not available in this browser' },
        ];
        const active = metrics.find(m => m.id === this.liveMetric) || metrics[0];

        return `
            <div style="display:flex; flex-grow:1; min-height:0; padding:8px; gap:8px; box-sizing:border-box;">
                <div style="width:140px; flex-shrink:0; background:#c0c0c0; display:flex; flex-direction:column; gap:6px;">
                    ${metrics.map(m => {
                        const isAct = m.id === this.liveMetric;
                        return `
                            <div class="tlm-live-nav-item" data-metric="${m.id}" style="padding:8px 10px; cursor:pointer; user-select:none; background:${isAct ? '#000080' : '#ffffff'}; color:${isAct ? '#ffffff' : '#000000'}; border:2px solid ${isAct ? '#000000' : '#808080'}; border-right-color:#ffffff; border-bottom-color:#ffffff;">
                                <div style="font-size:12px; font-weight:bold;">${m.label}</div>
                                <div style="font-size:16px; font-weight:900; margin-top:2px; font-family:monospace;">${m.value}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="flex-grow:1; display:flex; flex-direction:column; padding:10px; min-width:0; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;">
                    <div style="font-size:14px; font-weight:bold; color:#000080; margin-bottom:2px;">${active.label}</div>
                    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">${active.sub}</div>
                    <div style="flex-grow:1; min-height:0; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; position:relative; background:#040d1a;">
                        <canvas class="tlm-live-canvas" style="width:100%; height:100%; display:block;"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    renderLogTab() {
        const marks = getMarks().slice().reverse();
        const measures = getMeasures().slice().reverse();

        const measureRow = m => `
            <tr>
                <td style="padding:4px 8px; font-weight:500;">${this.escapeHtml(m.name)}</td>
                <td style="padding:4px 8px; color:#64748b;">${m.kind}</td>
                <td style="padding:4px 8px; text-align:right; font-family:monospace;">${m.value.toFixed(2)}${m.kind === 'measure' ? ' ms' : ''}</td>
                <td style="padding:4px 8px; text-align:right; color:#64748b;">${new Date(m.t).toLocaleTimeString()}</td>
            </tr>
        `;
        const markRow = m => `
            <tr>
                <td style="padding:4px 8px; font-weight:500;">${this.escapeHtml(m.name)}</td>
                <td style="padding:4px 8px; text-align:right; color:#64748b;">${new Date(m.at).toLocaleTimeString()}</td>
            </tr>
        `;

        return `
            <div style="flex-grow:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:10px; box-sizing:border-box;">
                <div>
                    <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:4px;">Measures &amp; Records (${measures.length})</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;">
                        <thead><tr>
                            <th style="text-align:left; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Name</th>
                            <th style="text-align:left; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Kind</th>
                            <th style="text-align:right; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Value</th>
                            <th style="text-align:right; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Recorded</th>
                        </tr></thead>
                        <tbody>
                            ${measures.length ? measures.map(measureRow).join('') : `<tr><td colspan="4" style="padding:14px; text-align:center; color:#64748b;">No measures recorded yet. Call Telemetry.measure() or Telemetry.record() from anywhere in ZebOS.</td></tr>`}
                        </tbody>
                    </table>
                </div>
                <div>
                    <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:4px;">Marks (${marks.length})</div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff;">
                        <thead><tr>
                            <th style="text-align:left; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Name</th>
                            <th style="text-align:right; padding:5px 8px; font-size:11px; border-bottom:1px solid #808080; background:#e0e0e0;">Set at</th>
                        </tr></thead>
                        <tbody>
                            ${marks.length ? marks.map(markRow).join('') : `<tr><td colspan="2" style="padding:14px; text-align:center; color:#64748b;">No marks set yet. Call Telemetry.mark() from anywhere in ZebOS.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style="flex-shrink:0; padding:6px 8px; display:flex; justify-content:flex-end; gap:6px; background:#c0c0c0; border-top:1px solid #a0a0a0;">
                <button class="app-toolbar-btn tlm-export-btn" style="padding:4px 14px;">Export JSON</button>
                <button class="app-toolbar-btn tlm-clear-btn" style="padding:4px 14px;">Clear Log</button>
            </div>
        `;
    }

    drawLiveGraph() {
        const canvas = this.body.querySelector('.tlm-live-canvas');
        if (this.liveMetric === 'fps') {
            const data = getFpsSamples().map(s => s.fps);
            drawSparkline(canvas, data, { max: 120, historyLen: SAMPLES_LEN, colorLine: '#38bdf8', colorFill: 'rgba(14, 165, 233, 0.25)', labelFormatter: v => `${Math.round(v)} fps` });
        } else {
            const memSamples = getMemSamples();
            const data = memSamples.map(s => s.usedMB);
            const max = memSamples.length ? Math.max(64, ...memSamples.map(s => s.limitMB)) : 512;
            drawSparkline(canvas, data, { max, historyLen: SAMPLES_LEN, colorLine: '#22c55e', colorFill: 'rgba(34, 197, 94, 0.25)', labelFormatter: v => `${Math.round(v)} MB` });
        }
    }

    escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    bindEvents() {
        this.body.querySelectorAll('.tlm-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => { this.activeTab = btn.dataset.tab; this.renderUI(); });
        });
        this.body.querySelectorAll('.tlm-live-nav-item').forEach(item => {
            item.addEventListener('click', () => { this.liveMetric = item.dataset.metric; this.renderUI(); });
        });
        const exportBtn = this.body.querySelector('.tlm-export-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => downloadExport());
        const clearBtn = this.body.querySelector('.tlm-clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => clearAll());
    }
}
