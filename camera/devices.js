// Real MediaDevices API wrapper for the Camera app.
// Nothing in this file is simulated: every value returned comes straight
// from navigator.mediaDevices. Kept separate from camera.js so the
// detection/stream logic can be read and changed independently of the UI.

export function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export async function listCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
}

export async function requestCamera(deviceId = null) {
    return navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
    });
}

export function stopCamera(stream) {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
}

// Pulls the live label/deviceId/resolution off the stream's actual video
// track (via getSettings()) rather than anything cached at request time.
export function describeStream(stream) {
    const track = stream?.getVideoTracks()[0];
    if (!track) return null;
    const settings = track.getSettings();
    return {
        label: track.label || 'Unknown camera',
        deviceId: settings.deviceId || null,
        width: settings.width || null,
        height: settings.height || null
    };
}

const ERROR_MESSAGES = {
    NotFoundError: "No camera detected on this device.",
    DevicesNotFoundError: "No camera detected on this device.",
    NotAllowedError: "Camera access denied. Grant permission to use this app.",
    PermissionDeniedError: "Camera access denied. Grant permission to use this app.",
    NotReadableError: "Camera is in use by another application.",
    OverconstrainedError: "Selected camera is unavailable."
};

export function describeError(err) {
    return ERROR_MESSAGES[err.name] || `Camera error: ${err.message}`;
}
