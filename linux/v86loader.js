//v86 loader 
const ALPINE_ASSET_BASE_URL = 'https://cdn.jsdelivr.net/gh/owgydz/alpine@main';

const V86_VERSION = '0.5.432';
const NPM_BASE = `https://cdn.jsdelivr.net/npm/v86@${V86_VERSION}/build`;
const BIOS_BASE = 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios';

// These are the only assets it makes sense to pre-fetch: the v86 runtime
// itself. The Alpine rootfs is deliberately NOT in this list — it's
// fetched lazily by v86's own 9p driver during boot, not upfront.
// Sizes are the real Content-Length values recorded at integration time,
// used only to drive the OOBE progress bar.
export const LINUX_EMULATION_ASSETS = [
    { key: 'libv86', label: 'v86 runtime', url: `${NPM_BASE}/libv86.mjs`, bytes: 356131 },
    { key: 'wasm', label: 'v86 CPU core (wasm)', url: `${NPM_BASE}/v86.wasm`, bytes: 2096474 },
    { key: 'seabios', label: 'BIOS', url: `${BIOS_BASE}/seabios.bin`, bytes: 131072 },
    { key: 'vgabios', label: 'VGA BIOS', url: `${BIOS_BASE}/vgabios.bin`, bytes: 36352 },
];

export const LINUX_EMULATION_TOTAL_BYTES =
    LINUX_EMULATION_ASSETS.reduce((sum, a) => sum + a.bytes, 0);

function assertConfigured() {
    if (!ALPINE_ASSET_BASE_URL) {
        throw new Error('Linux Emulation isn\'t set up yet — ALPINE_ASSET_BASE_URL is empty in linux/v86loader.js. Build the Alpine image and point that constant at it.');
    }
}

// Warms the browser HTTP cache for the v86 runtime, reporting progress as
// we go, then does a lightweight reachability check against the Alpine filesystem manifest 
export async function downloadLinuxEmulationAssets(onProgress) {
    assertConfigured();

    let loaded = 0;
    const report = () => {
        if (onProgress) onProgress({ loaded, total: LINUX_EMULATION_TOTAL_BYTES });
    };
    report();

    for (const asset of LINUX_EMULATION_ASSETS) {
        const res = await fetch(asset.url);
        if (!res.ok) throw new Error(`${asset.label} failed to download (HTTP ${res.status})`);

        const reader = res.body?.getReader();
        if (!reader) {
            await res.arrayBuffer();
            loaded += asset.bytes;
            report();
            continue;
        }

        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
            report();
        }
    }

    const manifestRes = await fetch(`${ALPINE_ASSET_BASE_URL}/alpine-fs.json`);
    if (!manifestRes.ok) {
        throw new Error(`Alpine filesystem manifest unreachable (HTTP ${manifestRes.status}) — check ALPINE_ASSET_BASE_URL.`);
    }
}

// Boots a real Alpine Linux VM into containerEl via v86's 9p filesystem passthrough
export async function bootLinuxEmulation(containerEl) {
    assertConfigured();
    const { V86 } = await import(`${NPM_BASE}/libv86.mjs`);

    return new V86({
        wasm_path: `${NPM_BASE}/v86.wasm`,
        memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: containerEl,
        bios: { url: `${BIOS_BASE}/seabios.bin` },
        vga_bios: { url: `${BIOS_BASE}/vgabios.bin` },
        filesystem: {
            baseurl: `${ALPINE_ASSET_BASE_URL}/alpine-rootfs-flat`,
            basefs: `${ALPINE_ASSET_BASE_URL}/alpine-fs.json`,
        },
        autostart: true,
        bzimage_initrd_from_filesystem: true,
        cmdline: 'rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable',
    });
}
