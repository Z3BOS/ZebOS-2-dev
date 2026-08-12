// Frame-grab and save-to-disk helpers for the Camera app.
// Split out of camera.js so the UI shell calls captureFrame()/downloadBlob()
// instead of touching the canvas/Blob APIs directly.

export function captureFrame(videoEl, canvasEl, filterString = 'none') {
    if (!videoEl.videoWidth) return null;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    const ctx = canvasEl.getContext('2d');
    ctx.filter = filterString || 'none';
    ctx.drawImage(videoEl, 0, 0);
    return canvasEl.toDataURL('image/png');
}

export function canvasToBlob(canvasEl) {
    return new Promise(resolve => canvasEl.toBlob(resolve, 'image/png'));
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
