// This is a small app I made in like 10 minutes that is like a Neofetch for ZebOS
// It shows some basic system info and a cute ASCII courgette

const ASCII_COURGETTE = `
       .::::.
     .::::::::.
    :::'    '::.
    ::        ::
    ::.      .::
     ':::::::::'
        '::::'
`;

export class CourgetteInfo {
    constructor(onCloseRequest, snapshot) {
        this.onCloseRequest = onCloseRequest;
        this.snapshot = snapshot;

        this.bodyElement = null;
        this.uptimeEl = null;
        this.tickInterval = null;
        this.uptimeSeconds = snapshot.uptimeSeconds;

        this.keyHandler = (e) => this.handleKeyDown(e);
    }

    formatUptime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        const stats = [
            ['OS', `ZebOS 2 (Pre-Alpha v${this.snapshot.version})`],
            ['Kernel', `Zeb Kernel v${this.snapshot.version}`], 
            ['Uptime', this.formatUptime(this.uptimeSeconds)],
            ['Resolution', `${window.innerWidth}x${window.innerHeight}`],
            ['Files', `${this.snapshot.fileCount} file(s), ${this.snapshot.dirCount} folder(s)`],
            ['Disk', `${this.formatBytes(this.snapshot.diskBytes)} (ZEBOS_V2_DISK)`], 
            ['Agent', navigator.userAgent.split(') ').pop().split(' ')[0] || navigator.userAgent]
        ];

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#0e1b0e; color:#c8f0c8; font-family:'Consolas','Courier New',monospace; box-sizing:border-box;">
                <div style="flex-grow:1; display:flex; gap:18px; padding:18px; overflow:auto; align-items:flex-start;">
                    <pre style="margin:0; color:#55dd55; font-size:0.95em; line-height:1.15; flex-shrink:0;">${ASCII_COURGETTE}</pre>
                    <div class="cg-stats" style="font-size:0.95em; line-height:1.9; white-space:nowrap;"></div>
                </div>
                <div style="background:#c0c0c0; color:#000000; padding:4px 10px; font-size:12px; font-weight:bold; border-top:2px solid #ffffff; flex-shrink:0; box-sizing:border-box; height:26px; display:flex; align-items:center;">
                    Esc: Exit
                </div>
            </div>
        `;

        const statsEl = this.bodyElement.querySelector('.cg-stats');
        this.statsEl = statsEl;
        this.stats = stats;
        this.renderStats();

        window.addEventListener('keydown', this.keyHandler);
        this.tickInterval = setInterval(() => {
            this.uptimeSeconds += 1;
            this.stats[2][1] = this.formatUptime(this.uptimeSeconds);
            this.renderStats();
        }, 1000);
    }

    renderStats() {
        this.statsEl.innerHTML = this.stats
            .map(([label, value]) => `<span style="color:#55dd55; font-weight:bold;">${label}:</span> ${value}`)
            .join('<br>');
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') { e.preventDefault(); this.onCloseRequest(); }
    }

    cleanup() {
        clearInterval(this.tickInterval);
        window.removeEventListener('keydown', this.keyHandler);
    }
}
