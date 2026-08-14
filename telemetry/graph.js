// telemetry/graph.js
// Canvas sparkline renderer for the Live tab's FPS/memory graphs. Same
// dark-panel-with-glow look as Task Manager's Performance tab
// (programs/taskmgr.js drawGraph), generalized to take an arbitrary max
// instead of a hardcoded 0-100%.
export function drawSparkline(canvas, data, { max, historyLen, colorLine, colorFill, labelFormatter }) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#040d1a';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    const gridRows = 4;
    for (let i = 0; i <= gridRows; i++) {
        const y = Math.floor((cssH / gridRows) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
    }
    const gridCols = 8;
    for (let j = 0; j <= gridCols; j++) {
        const x = Math.floor((cssW / gridCols) * j) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
        ctx.stroke();
    }

    const fmt = labelFormatter || (v => String(Math.round(v)));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(fmt(max), cssW - 6, 12);
    ctx.fillText(fmt(max * 0.5), cssW - 6, Math.floor(cssH * 0.5) + 4);

    if (!data.length) return;
    const stepX = cssW / (historyLen - 1);
    const points = data.map((v, i) => {
        const x = cssW - (data.length - 1 - i) * stepX;
        const y = cssH - (Math.min(max, Math.max(0, v)) / max) * cssH;
        return [x, y];
    });

    const grad = ctx.createLinearGradient(0, 0, 0, cssH);
    grad.addColorStop(0, colorFill);
    grad.addColorStop(1, 'rgba(4, 13, 26, 0.05)');

    ctx.beginPath();
    ctx.moveTo(points[0][0], cssH);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(points[points.length - 1][0], cssH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.strokeStyle = colorLine;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colorLine;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
}
