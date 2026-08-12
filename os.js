// State tracking & Persistent VFS Storage Module (ZebOS 2 v3.0.0 Core)
import { getIcon } from './icons.js';
import { initContextMenuSystem } from './contextmenu.js';

// No build pipeline generates this — it's the short commit hash as of the
// last time this file was edited, updated by hand alongside version bumps.
const BUILD_GIT_HASH = "8f31b40";

let systemState = {
    version: "3.0.0",
    currentUser: "guest",
    uptime: 0,
    activeApp: null,
    currentDirectory: "",
    desktopSortBy: "type",
    autoArrange: true,
    desktopBackground: '#008080',
    desktopPattern: 'solid',
    desktopScheme: 'standard',
    soundScheme: 'classic',
    taskbarAutoHide: false,
    roundedCorners: false,
    skipBootAnimation: false,
    autoDevMode: false,
    hasLoggedInBefore: false,
    savedUsername: null,
    savedAvatar: null,
    alwaysShowSetup: false,
    disableKernelLogs: false,
    fileSystem: {}
};

// Sound Engine (Web Audio API Synthesizer)
let audioCtx = null;
export function playSystemSound(type) {
    if (systemState.soundScheme === 'muted') return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;

        if (type === 'click') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'open') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(880, now + 0.04);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'close') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(440, now + 0.04);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'error') {
            [300, 450].forEach(freq => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            });
        }
    } catch(e) { /* ignore audio context policy restrictions */ }
}

let topZIndex = 100; // Track screen depth layers globally across desktop workspace

let devModeEnabled = false;
let devConsoleEl = null; // set once Dev Mode is entered; logKernel mirrors into it when present

// This should be a good enough logger
function logKernel(message, level = "INFO") {
    const stamp = new Date().toTimeString().split(' ')[0];
    const formatted = `[${stamp}] [${level}] ${message}`;
    if (level === "ERROR") console.error(formatted);
    else if (level === "WARN") console.warn(formatted);
    else console.log(formatted);

    if (devConsoleEl) {
        const line = document.createElement('div');
        line.textContent = formatted;
        if (level === "ERROR") line.style.color = '#ff6666';
        else if (level === "WARN") line.style.color = '#ffcc55';
        devConsoleEl.appendChild(line);
        devConsoleEl.scrollTop = devConsoleEl.scrollHeight;
    }

    return formatted;
}

// Basic dev mode. Let's expand on this later. 
function enterDevMode() {
    if (devModeEnabled) return;
    devModeEnabled = true;

    const badge = document.createElement('div');
    badge.id = 'dev-mode-badge';
    badge.textContent = 'DEV MODE';
    document.getElementById('desktop-canvas')?.appendChild(badge);

    devConsoleEl = document.createElement('div');
    devConsoleEl.id = 'dev-console';
    document.body.appendChild(devConsoleEl);

    logKernel("DEV MODE: Developer mode engaged via Ctrl+Alt.", "WARN");
}

// ==========================================================================
// PERSISTENT HARD DISK STORAGE ENGINE (LOCALSTORAGE SUBSYSTEM)
// ==========================================================================

function loadFileSystem() {
    let diskImage = null;
    let savedSettings = null;
    try {
        diskImage = localStorage.getItem('ZEBOS_V2_DISK');
        savedSettings = localStorage.getItem('ZEBOS_V2_SETTINGS');
    } catch (e) {
        logKernel("Storage System Warning: LocalStorage access restricted or unavailable.", "WARN");
    }

    if (savedSettings) {
        try {
            const s = JSON.parse(savedSettings);
            if (s.color)          systemState.desktopBackground = s.color;
            if (s.pattern)        systemState.desktopPattern    = s.pattern;
            if (s.scheme)         systemState.desktopScheme     = s.scheme;
            if (s.soundScheme)    systemState.soundScheme       = s.soundScheme;
            if (s.roundedCorners !== undefined) systemState.roundedCorners = s.roundedCorners;
            if (s.autoArrange !== undefined)     systemState.autoArrange     = s.autoArrange;
            if (s.taskbarAutoHide !== undefined) systemState.taskbarAutoHide = s.taskbarAutoHide;
            if (s.desktopSortBy)                 systemState.desktopSortBy  = s.desktopSortBy;
            if (s.skipBootAnimation !== undefined) systemState.skipBootAnimation = s.skipBootAnimation;
            if (s.autoDevMode !== undefined)       systemState.autoDevMode       = s.autoDevMode;
            if (s.hasLoggedInBefore !== undefined) systemState.hasLoggedInBefore = s.hasLoggedInBefore;
            if (s.savedUsername)                   systemState.savedUsername     = s.savedUsername;
            if (s.savedAvatar)                      systemState.savedAvatar      = s.savedAvatar;
            if (s.alwaysShowSetup !== undefined)   systemState.alwaysShowSetup   = s.alwaysShowSetup;
            if (s.disableKernelLogs !== undefined) systemState.disableKernelLogs = s.disableKernelLogs;
        } catch(e) { /* ignore */ }
    }

    if (diskImage) {
        try {
            const parsed = JSON.parse(diskImage);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                systemState.fileSystem = parsed;
                logKernel("Storage System: Restored persistent file allocations from disk image sector.");
                ensureSystemFoldersExist();
            } else {
                throw new Error("Disk sector contains non-object data structure.");
            }
        } catch (err) {
            logKernel(`Storage System Error: Hard drive image corrupted. Resetting data cells. (${err.message})`, "ERROR");
            provisionDefaultRootFS();
        }
    } else {
        provisionDefaultRootFS();
    }
    window.zebosState = systemState;
}

function ensureSystemFoldersExist() {
    if (!systemState.fileSystem || typeof systemState.fileSystem !== 'object') {
        systemState.fileSystem = {};
    }

    // Purge any legacy Windows / legacy storage keys if present
    const legacyKeys = ["Windows", "Program Files", "ProgramFiles", "System32", "sys32"];
    legacyKeys.forEach(k => {
        if (systemState.fileSystem[k]) delete systemState.fileSystem[k];
    });

    const defaults = {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 2!\nPersistent storage disk saving & dynamic VFS active." },
        "Zeb32": {
            type: "dir",
            content: {
                "kernel.zdl":    { type: "file", content: "ZebOS 2 Core Microkernel Execution Module [x86_64-zeb]\nVersion: 3.0.0.8f31b40" },
                "shell32.zdl":   { type: "file", content: "ZebOS Desktop User Interface Shell Controller" },
                "user32.zdl":    { type: "file", content: "ZebOS Windowing & Event Management Subsystem" },
                "gdi32.zdl":     { type: "file", content: "ZebOS Graphics Device Interface Subsystem" },
                "vfs32.zdl":     { type: "file", content: "Virtual File Allocation Subsystem & Disk Driver" },
                "net32.zdl":     { type: "file", content: "ZebOS Socket Protocol Subsystem" },
                "sound32.zdl":   { type: "file", content: "Web Audio Synthesizer Audio Driver" },
                "drivers": {
                    type: "dir",
                    content: {
                        "display.zdl":  { type: "file", content: "SVGA Color Display Controller Driver" },
                        "mouse.zdl":    { type: "file", content: "PS/2 Mouse Input Driver" },
                        "keyboard.zdl": { type: "file", content: "AT Standard Keyboard Driver" }
                    }
                }
            }
        },
        "ZebApps": {
            type: "dir",
            content: {
                "Paint Studio": { type: "dir", content: { "paint.exe": { type: "file", content: "Binary Executable: Paint Studio" } } },
                "Text Editor":  { type: "dir", content: { "editor.exe": { type: "file", content: "Binary Executable: Text Editor" } } },
                "Terminal":     { type: "dir", content: { "cmd.exe": { type: "file", content: "Binary Executable: Zeb Terminal Prompt" } } },
                "Minesweeper":   { type: "dir", content: { "mines.exe": { type: "file", content: "Binary Executable: Minesweeper Game" } } },
                "Media Player":  { type: "dir", content: { "player.exe": { type: "file", content: "Binary Executable: Retro Media Player" } } },
                "ZebVM":         { type: "dir", content: { "zebvm.exe": { type: "file", content: "Binary Executable: ZebVM Virtual Machine" } } },
                "Calculator":    { type: "dir", content: { "calc.exe": { type: "file", content: "Binary Executable: ZebOS Calculator" } } },
                "Snake Game":    { type: "dir", content: { "snake.exe": { type: "file", content: "Binary Executable: Snake Game" } } },
                "Task Manager":  { type: "dir", content: { "taskmgr.exe": { type: "file", content: "Binary Executable: ZebOS Task Manager" } } },
                "Solitaire":     { type: "dir", content: { "solitaire.exe": { type: "file", content: "Binary Executable: Klondike Solitaire" } } },
                "Chess":         { type: "dir", content: { "chess.exe": { type: "file", content: "Binary Executable: ZebOS Chess Engine" } } },
                "System Info":   { type: "dir", content: { "courgette.exe": { type: "file", content: "Binary Executable: System Info Daemon" } } },
                "Zeb Viewer":    { type: "dir", content: { "viewer.exe": { type: "file", content: "Binary Executable: Zeb Image Viewer" } } },
                "Activity Center": { type: "dir", content: { "activitycenter.exe": { type: "file", content: "Binary Executable: Activity Center" } } }
            }
        },
        "Users": {
            type: "dir",
            content: {
                "Guest": {
                    type: "dir",
                    content: {
                        "Desktop":   { type: "dir", content: {} },
                        "Documents": {
                            type: "dir",
                            content: {
                                "welcome.txt": { type: "file", content: "Welcome to ZebOS 2!\nEnjoy exploring the retro operating system interface." },
                                "notes.txt":   { type: "file", content: "ZebOS 2 Dev Notes:\n- Custom ZebOS controls\n- Dynamic taskbar\n- Synthesizer sound engine" }
                            }
                        },
                        "Pictures":  { type: "dir", content: {} },
                        "Downloads": { type: "dir", content: {} }
                    }
                }
            }
        },
        "ZebOS": {
            type: "dir",
            content: {
                "system.ini": { type: "file", content: "[boot]\nshell=shell32.zdl\ndrivers=display.zdl,mouse.zdl,sound32.zdl\n" },
                "win.ini":    { type: "file", content: "[ZebOS]\nVersion=3.0.0\nTheme=Standard\n" },
                "zebos.cfg":   { type: "file", content: "CONFIG_DEV_MODE=0\nCONFIG_VFS_QUOTA=2097152\n" }
            }
        }
    };

    let updated = false;
    for (const key in defaults) {
        const existing = systemState.fileSystem[key];
        if (!existing || typeof existing !== 'object' || (defaults[key].type === 'dir' && (existing.type !== 'dir' || !existing.content))) {
            systemState.fileSystem[key] = defaults[key];
            updated = true;
        }
    }

    if (systemState.fileSystem["ZebApps"] && systemState.fileSystem["ZebApps"].content) {
        const zebAppsContent = systemState.fileSystem["ZebApps"].content;
        const appDefaults = defaults["ZebApps"].content;
        for (const appName in appDefaults) {
            if (!zebAppsContent[appName]) {
                zebAppsContent[appName] = appDefaults[appName];
                updated = true;
            }
        }
    }

    ensureUserProfileFolder(systemState.currentUser || "Guest");
    if (updated) saveFileSystem();
}

export function ensureUserProfileFolder(rawUsername) {
    const name = (rawUsername && rawUsername.trim()) ? rawUsername.trim() : "Guest";
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    systemState.currentUser = formattedName;

    if (!systemState.fileSystem) systemState.fileSystem = {};
    if (!systemState.fileSystem["Users"]) {
        systemState.fileSystem["Users"] = { type: "dir", content: {} };
    }
    const usersContent = systemState.fileSystem["Users"].content;

    if (!usersContent[formattedName]) {
        usersContent[formattedName] = {
            type: "dir",
            content: {
                "Desktop":   { type: "dir", content: {} },
                "Documents": {
                    type: "dir",
                    content: {
                        "welcome.txt": { type: "file", content: `Welcome to ZebOS 2, ${formattedName}!\nEnjoy exploring your personal retro workspace.` },
                    }
                },
                "Pictures":  { type: "dir", content: {} },
                "Downloads": { type: "dir", content: {} }
            }
        };
        saveFileSystem();
    }
    window.zebosState = systemState;
    return formattedName;
}

export function saveFileSystem() {
    try {
        const serializedFS = JSON.stringify(systemState.fileSystem);
        localStorage.setItem('ZEBOS_V2_DISK', serializedFS);
        // Persist OS appearance settings
        const settings = {
            color:              systemState.desktopBackground,
            pattern:            systemState.desktopPattern,
            scheme:             systemState.desktopScheme,
            soundScheme:        systemState.soundScheme,
            roundedCorners:     systemState.roundedCorners,
            autoArrange:        systemState.autoArrange,
            taskbarAutoHide:    systemState.taskbarAutoHide,
            desktopSortBy:      systemState.desktopSortBy,
            skipBootAnimation:  systemState.skipBootAnimation,
            autoDevMode:        systemState.autoDevMode,
            hasLoggedInBefore:  systemState.hasLoggedInBefore,
            savedUsername:      systemState.savedUsername,
            savedAvatar:        systemState.savedAvatar,
            alwaysShowSetup:    systemState.alwaysShowSetup,
            disableKernelLogs:  systemState.disableKernelLogs,
        };
        localStorage.setItem('ZEBOS_V2_SETTINGS', JSON.stringify(settings));
        logKernel("Storage System: Changes committed to local storage sectors successfully.");
    } catch (err) {
        logKernel(`Storage System Error: Write operation failed to commit. (${err.message})`, "ERROR");
    }
}

// Apply all OS appearance settings to live DOM
function applyOsSettings(settings) {
    const desktop = document.getElementById('desktop-canvas');
    if (!desktop) return;

    // Background color + pattern
    const color   = settings.color   || systemState.desktopBackground || '#008080';
    const pattern = settings.pattern || systemState.desktopPattern    || 'solid';
    desktop.style.backgroundColor = color;
    if (pattern === 'gradient') {
        desktop.style.backgroundImage = `linear-gradient(135deg, ${color} 0%, #000080 100%)`;
    } else if (pattern === 'grid') {
        desktop.style.backgroundImage = `repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0px,rgba(0,0,0,.12) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,rgba(0,0,0,.12) 0px,rgba(0,0,0,.12) 1px,transparent 1px,transparent 24px)`;
    } else if (pattern === 'diamonds') {
        desktop.style.backgroundImage = `repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0px,rgba(255,255,255,.06) 8px,transparent 8px,transparent 16px),repeating-linear-gradient(-45deg,rgba(255,255,255,.06) 0px,rgba(255,255,255,.06) 8px,transparent 8px,transparent 16px)`;
    } else if (pattern === 'dots') {
        desktop.style.backgroundImage = `radial-gradient(rgba(255,255,255,.15) 1px,transparent 1px)`;
        desktop.style.backgroundSize  = '20px 20px';
    } else {
        desktop.style.backgroundImage = 'none';
        desktop.style.backgroundSize  = '';
    }

    // Color scheme — apply CSS custom properties that window headers reference
    const schemes = {
        'standard':      { '--os-titlebar-bg': '#000080', '--os-titlebar-fg': '#ffffff' },
        'high-contrast': { '--os-titlebar-bg': '#000000', '--os-titlebar-fg': '#ffffff' },
        'rose':          { '--os-titlebar-bg': '#8b1a4a', '--os-titlebar-fg': '#ffffff' },
        'emerald':       { '--os-titlebar-bg': '#064e3b', '--os-titlebar-fg': '#ffffff' },
        'midnight':      { '--os-titlebar-bg': '#1a237e', '--os-titlebar-fg': '#ffffff' },
    };
    const scheme = schemes[settings.scheme] || schemes['standard'];
    Object.entries(scheme).forEach(([prop, val]) => document.documentElement.style.setProperty(prop, val));

    // Rounded corners
    if (settings.roundedCorners) {
        document.body.classList.add('rounded-corners');
    } else {
        document.body.classList.remove('rounded-corners');
    }

    // Update systemState
    systemState.desktopBackground = color;
    systemState.desktopPattern    = pattern;
    if (settings.scheme)         systemState.desktopScheme   = settings.scheme;
    if (settings.soundScheme)    systemState.soundScheme     = settings.soundScheme;
    if (settings.roundedCorners !== undefined) systemState.roundedCorners = settings.roundedCorners;
}

// ==========================================================================
// REGISTRY EDITOR API
// The "registry" isn't a separate data store — it's a read/write window onto
// the same systemState fields Personalize and the desktop context menu edit.
// Editing a value here takes effect live, exactly like those do.
// ==========================================================================
export function getRegistrySnapshot() {
    return {
        desktopBackground: systemState.desktopBackground,
        desktopPattern:    systemState.desktopPattern,
        desktopScheme:     systemState.desktopScheme,
        soundScheme:       systemState.soundScheme,
        roundedCorners:    systemState.roundedCorners,
        autoArrange:       systemState.autoArrange,
        desktopSortBy:     systemState.desktopSortBy,
        taskbarAutoHide:   systemState.taskbarAutoHide,
        savedUsername:     systemState.savedUsername,
        hasLoggedInBefore: systemState.hasLoggedInBefore,
        alwaysShowSetup:   systemState.alwaysShowSetup,
        skipBootAnimation: systemState.skipBootAnimation,
        autoDevMode:       systemState.autoDevMode,
        disableKernelLogs: systemState.disableKernelLogs,
        version:           systemState.version,
        codename:          systemState.codename,
        currentUser:       systemState.currentUser,
        uptime:            systemState.uptime,
        buildHash:         BUILD_GIT_HASH,
    };
}

export function setRegistryValue(field, rawValue) {
    switch (field) {
        case 'desktopBackground':
        case 'desktopPattern':
        case 'desktopScheme':
        case 'soundScheme':
        case 'roundedCorners':
            applyOsSettings({
                color:          field === 'desktopBackground' ? rawValue : systemState.desktopBackground,
                pattern:        field === 'desktopPattern'    ? rawValue : systemState.desktopPattern,
                scheme:         field === 'desktopScheme'     ? rawValue : systemState.desktopScheme,
                soundScheme:    field === 'soundScheme'       ? rawValue : systemState.soundScheme,
                roundedCorners: field === 'roundedCorners'    ? rawValue : systemState.roundedCorners,
            });
            break;
        case 'taskbarAutoHide': {
            systemState.taskbarAutoHide = !!rawValue;
            setupTaskbarEvents();
            const tb = document.getElementById('system-taskbar');
            if (tb) tb.style.opacity = systemState.taskbarAutoHide ? '0' : '1';
            break;
        }
        case 'autoArrange':
            systemState.autoArrange = !!rawValue;
            renderDesktopIcons();
            break;
        case 'desktopSortBy':
            systemState.desktopSortBy = rawValue;
            renderDesktopIcons();
            break;
        default:
            systemState[field] = rawValue;
    }
    saveFileSystem();
    logKernel(`Registry: Set ${field} = ${rawValue}`);
}

let taskbarEventsInitialized = false;

function setupTaskbarEvents() {
    if (taskbarEventsInitialized) return;
    taskbarEventsInitialized = true;
    const tb = document.getElementById('system-taskbar');
    if (!tb) return;

    tb.addEventListener('mouseenter', () => {
        if (systemState.taskbarAutoHide) {
            tb.style.opacity = '1';
        }
    });
    tb.addEventListener('mouseleave', () => {
        if (systemState.taskbarAutoHide) {
            tb.style.opacity = '0';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!systemState.taskbarAutoHide) return;
        const pos = tb.dataset.position || 'bottom';
        let nearEdge = false;
        if (pos === 'bottom' && e.clientY >= window.innerHeight - 8) nearEdge = true;
        if (pos === 'top'    && e.clientY <= 8) nearEdge = true;
        if (pos === 'left'   && e.clientX <= 8) nearEdge = true;
        if (pos === 'right'  && e.clientX >= window.innerWidth - 8) nearEdge = true;
        if (nearEdge) {
            tb.style.opacity = '1';
        }
    });
}

// Apply taskbar layout properties from Taskbar Properties dialog
function applyTaskbarProperties({ pos, size, autoHide, alwaysTop, showClock }) {
    const tb = document.getElementById('system-taskbar');
    const startMenu = document.getElementById('start-menu');
    const trayMenu = document.getElementById('tray-menu');
    const buildTag = document.getElementById('desktop-build-tag');
    const iconsZone = document.getElementById('desktop-icons-zone');
    const startBtn = document.getElementById('start-button');
    const tabsZone = document.getElementById('taskbar-tabs-zone');
    const systemTray = document.getElementById('system-tray');
    const userTag = document.getElementById('current-user-tag');
    const clockEl = document.getElementById('live-clock');

    if (!tb) return;

    const sz = parseInt(size, 10) || 40;
    tb.dataset.position = pos;
    tb.dataset.size     = String(sz);

    tb.style.bottom = 'auto'; tb.style.top = 'auto'; tb.style.left = 'auto'; tb.style.right = 'auto';
    tb.style.width  = ''; tb.style.height = '';

    const isVertical = (pos === 'left' || pos === 'right');

    if (pos === 'bottom') {
        tb.style.bottom = '0'; tb.style.left = '0'; tb.style.right = 'auto'; tb.style.top = 'auto';
        tb.style.width = '100vw'; tb.style.height = sz + 'px';
        tb.style.flexDirection = 'row';
        tb.style.alignItems = 'center';
    } else if (pos === 'top') {
        tb.style.top = '0'; tb.style.left = '0'; tb.style.right = 'auto'; tb.style.bottom = 'auto';
        tb.style.width = '100vw'; tb.style.height = sz + 'px';
        tb.style.flexDirection = 'row';
        tb.style.alignItems = 'center';
    } else if (pos === 'left') {
        tb.style.top = '0'; tb.style.left = '0'; tb.style.right = 'auto'; tb.style.bottom = 'auto';
        tb.style.width = sz + 'px'; tb.style.height = '100vh';
        tb.style.flexDirection = 'column';
        tb.style.alignItems = 'stretch';
    } else if (pos === 'right') {
        tb.style.top = '0'; tb.style.right = '0'; tb.style.left = 'auto'; tb.style.bottom = 'auto';
        tb.style.width = sz + 'px'; tb.style.height = '100vh';
        tb.style.flexDirection = 'column';
        tb.style.alignItems = 'stretch';
    }

    tb.style.zIndex = alwaysTop ? '90000' : '1000';

    systemState.taskbarAutoHide = !!autoHide;
    setupTaskbarEvents();

    if (autoHide) {
        tb.style.opacity = '0';
        tb.style.transition = 'opacity 0.2s';
    } else {
        tb.style.opacity = '1';
        tb.style.transition = 'opacity 0.2s';
    }

    const offset = autoHide ? 0 : sz;
    const menuOffset = (autoHide ? 4 : sz) + 4;

    if (startMenu) {
        startMenu.style.bottom = 'auto'; startMenu.style.top = 'auto'; startMenu.style.left = 'auto'; startMenu.style.right = 'auto';
        if (pos === 'bottom') {
            startMenu.style.bottom = `${menuOffset}px`;
            startMenu.style.left = '4px';
        } else if (pos === 'top') {
            startMenu.style.top = `${menuOffset}px`;
            startMenu.style.left = '4px';
        } else if (pos === 'left') {
            startMenu.style.top = '4px';
            startMenu.style.left = `${menuOffset}px`;
        } else if (pos === 'right') {
            startMenu.style.top = '4px';
            startMenu.style.right = `${menuOffset}px`;
        }
    }

    if (trayMenu) {
        trayMenu.style.bottom = 'auto'; trayMenu.style.top = 'auto'; trayMenu.style.left = 'auto'; trayMenu.style.right = 'auto';
        if (pos === 'bottom') {
            trayMenu.style.bottom = `${menuOffset}px`;
            trayMenu.style.right = '4px';
        } else if (pos === 'top') {
            trayMenu.style.top = `${menuOffset}px`;
            trayMenu.style.right = '4px';
        } else if (pos === 'left') {
            trayMenu.style.bottom = '4px';
            trayMenu.style.left = `${menuOffset}px`;
        } else if (pos === 'right') {
            trayMenu.style.bottom = '4px';
            trayMenu.style.right = `${menuOffset}px`;
        }
    }

    if (startBtn) {
        if (isVertical) {
            startBtn.style.flexDirection = 'column';
            startBtn.style.width = 'calc(100% - 4px)';
            startBtn.style.height = '42px';
            startBtn.style.margin = '2px auto';
            startBtn.style.padding = '3px 2px';
            startBtn.style.gap = '1px';
            startBtn.style.justifyContent = 'center';
            startBtn.style.alignItems = 'center';

            const logoEl = startBtn.querySelector('.start-logo');
            const textEl = startBtn.querySelector('.start-text');
            if (logoEl) { logoEl.style.margin = '0 auto'; }
            if (textEl) { textEl.style.fontSize = '10px'; textEl.style.lineHeight = '1'; textEl.style.margin = '0'; textEl.style.whiteSpace = 'nowrap'; }
        } else {
            startBtn.style.flexDirection = 'row';
            startBtn.style.width = 'auto';
            startBtn.style.height = '30px';
            startBtn.style.margin = '0';
            startBtn.style.padding = '2px 10px';
            startBtn.style.gap = '6px';
            startBtn.style.justifyContent = 'flex-start';
            startBtn.style.alignItems = 'center';

            const logoEl = startBtn.querySelector('.start-logo');
            const textEl = startBtn.querySelector('.start-text');
            if (logoEl) { logoEl.style.margin = '0'; }
            if (textEl) { textEl.style.fontSize = '13px'; textEl.style.lineHeight = 'normal'; textEl.style.margin = '0'; textEl.style.whiteSpace = 'nowrap'; }
        }
    }

    if (tabsZone) {
        tabsZone.style.flexDirection = isVertical ? 'column' : 'row';
        tabsZone.style.width = isVertical ? '100%' : 'auto';
        tabsZone.style.height = isVertical ? 'auto' : '100%';
        tabsZone.style.flexGrow = '1';
        tabsZone.style.margin = isVertical ? '4px 0' : '0 10px';
        tabsZone.style.overflowX = isVertical ? 'hidden' : 'auto';
        tabsZone.style.overflowY = isVertical ? 'auto' : 'hidden';
        tabsZone.style.alignItems = isVertical ? 'stretch' : 'center';

        tabsZone.querySelectorAll('.taskbar-tab').forEach(tab => {
            if (isVertical) {
                tab.style.flexDirection = 'column';
                tab.style.width = 'calc(100% - 4px)';
                tab.style.height = '38px';
                tab.style.minHeight = '38px';
                tab.style.margin = '2px auto';
                tab.style.padding = '2px';
                tab.style.gap = '2px';
                tab.style.justifyContent = 'center';
                tab.style.alignItems = 'center';
                tab.style.textAlign = 'center';
            } else {
                tab.style.flexDirection = 'row';
                tab.style.width = '120px';
                tab.style.height = '28px';
                tab.style.minHeight = '28px';
                tab.style.margin = '0';
                tab.style.padding = '0 8px';
                tab.style.gap = '6px';
                tab.style.justifyContent = 'flex-start';
                tab.style.alignItems = 'center';
                tab.style.textAlign = 'left';
            }
        });
    }

    if (systemTray) {
        systemTray.style.flexDirection = isVertical ? 'column' : 'row';
        systemTray.style.width = isVertical ? 'calc(100% - 4px)' : 'auto';
        systemTray.style.height = isVertical ? 'auto' : '30px';
        systemTray.style.padding = isVertical ? '4px 2px' : '0 10px';
        systemTray.style.gap = isVertical ? '2px' : '8px';
        systemTray.style.margin = isVertical ? '2px auto' : '0';
        systemTray.style.justifyContent = 'center';
        systemTray.style.alignItems = 'center';
        systemTray.style.boxSizing = 'border-box';
    }

    if (userTag) {
        userTag.style.display = isVertical ? 'none' : 'inline';
    }

    if (clockEl) {
        clockEl.style.textAlign = 'center';
        clockEl.style.fontSize = isVertical ? '10px' : '11px';
        clockEl.style.lineHeight = '1.1';
        clockEl.style.whiteSpace = 'nowrap';
        const tray = clockEl.closest('#system-tray');
        if (tray) tray.style.display = showClock ? 'flex' : 'none';
    }

    document.documentElement.style.setProperty('--tb-height-offset', `${!autoHide && (pos === 'bottom' || pos === 'top') ? sz : 0}px`);
    document.documentElement.style.setProperty('--tb-top-offset', `${!autoHide && pos === 'top' ? sz : 0}px`);
    document.documentElement.style.setProperty('--tb-left-offset', `${!autoHide && pos === 'left' ? sz : 0}px`);
    document.documentElement.style.setProperty('--tb-right-offset', `${!autoHide && pos === 'right' ? sz : 0}px`);

    logKernel(`Taskbar: Applied props — pos:${pos} size:${sz}px autohide:${autoHide} ontop:${alwaysTop}`);
}


function provisionDefaultRootFS() {
    systemState.fileSystem = {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 2  Build v3.0.0!\nPersistent storage disk saving & dynamic VFS active." },
        "Zeb32": {
            type: "dir",
            content: {
                "kernel.zdl":    { type: "file", content: "ZebOS 2 Core Microkernel Execution Module [x86_64-zeb]\nVersion: 3.0.0.8f31b40" },
                "shell32.zdl":   { type: "file", content: "ZebOS Desktop User Interface Shell Controller" },
                "user32.zdl":    { type: "file", content: "ZebOS Windowing & Event Management Subsystem" },
                "gdi32.zdl":     { type: "file", content: "ZebOS Graphics Device Interface Subsystem" },
                "vfs32.zdl":     { type: "file", content: "Virtual File Allocation Subsystem & Disk Driver" },
                "net32.zdl":     { type: "file", content: "ZebOS Socket Protocol Subsystem" },
                "sound32.zdl":   { type: "file", content: "Web Audio Synthesizer Audio Driver" },
                "drivers": {
                    type: "dir",
                    content: {
                        "display.zdl":  { type: "file", content: "SVGA Color Display Controller Driver" },
                        "mouse.zdl":    { type: "file", content: "PS/2 Mouse Input Driver" },
                        "keyboard.zdl": { type: "file", content: "AT Standard Keyboard Driver" }
                    }
                }
            }
        },
        "ZebApps": {
            type: "dir",
            content: {
                "Paint Studio": { type: "dir", content: { "paint.exe": { type: "file", content: "Binary Executable: Paint Studio" } } },
                "Text Editor":  { type: "dir", content: { "editor.exe": { type: "file", content: "Binary Executable: Text Editor" } } },
                "Terminal":     { type: "dir", content: { "cmd.exe": { type: "file", content: "Binary Executable: Zeb Terminal Prompt" } } },
                "Minesweeper":   { type: "dir", content: { "mines.exe": { type: "file", content: "Binary Executable: Minesweeper Game" } } },
                "Media Player":  { type: "dir", content: { "player.exe": { type: "file", content: "Binary Executable: Retro Media Player" } } },
                "ZebVM":         { type: "dir", content: { "zebvm.exe": { type: "file", content: "Binary Executable: ZebVM Virtual Machine" } } },
                "Calculator":    { type: "dir", content: { "calc.exe": { type: "file", content: "Binary Executable: ZebOS Calculator" } } },
                "Snake Game":    { type: "dir", content: { "snake.exe": { type: "file", content: "Binary Executable: Snake Game" } } },
                "Task Manager":  { type: "dir", content: { "taskmgr.exe": { type: "file", content: "Binary Executable: ZebOS Task Manager" } } },
                "Solitaire":     { type: "dir", content: { "solitaire.exe": { type: "file", content: "Binary Executable: Klondike Solitaire" } } },
                "Chess":         { type: "dir", content: { "chess.exe": { type: "file", content: "Binary Executable: ZebOS Chess Engine" } } },
                "System Info":   { type: "dir", content: { "courgette.exe": { type: "file", content: "Binary Executable: System Info Daemon" } } },
                "Zeb Viewer":    { type: "dir", content: { "viewer.exe": { type: "file", content: "Binary Executable: Zeb Image Viewer" } } }
            }
        },
        "Users": {
            type: "dir",
            content: {
                "Guest": {
                    type: "dir",
                    content: {
                        "Desktop":   { type: "dir", content: {} },
                        "Documents": {
                            type: "dir",
                            content: {
                                "welcome.txt": { type: "file", content: "Welcome to ZebOS 2!\nEnjoy exploring the retro operating system interface." },
                                "notes.txt":   { type: "file", content: "ZebOS 2 Dev Notes:\n- Custom ZebOS controls\n- Dynamic taskbar\n- Synthesizer sound engine" }
                            }
                        },
                        "Pictures":  { type: "dir", content: {} },
                        "Downloads": { type: "dir", content: {} }
                    }
                }
            }
        },
        "ZebOS": {
            type: "dir",
            content: {
                "system.ini": { type: "file", content: "[boot]\nshell=shell32.zdl\ndrivers=display.zdl,mouse.zdl,sound32.zdl\n" },
                "win.ini":    { type: "file", content: "[ZebOS]\nVersion=3.0.0\nTheme=Standard\n" },
                "zebos.cfg":   { type: "file", content: "CONFIG_DEV_MODE=0\nCONFIG_VFS_QUOTA=2097152\n" }
            }
        }
    };
    saveFileSystem();
}

// ==========================================================================
// FILE SYSTEM WORKSPACE MANAGER ROUTINES
// ==========================================================================
export function getVfsNodeByPath(pathStr) {
    if (pathStr === null || pathStr === undefined) return systemState.fileSystem;
    let clean = String(pathStr).trim().replace(/^Z:\\?/i, '').replace(/\\/g, '/');
    if (!clean || clean === "" || clean === "/") return systemState.fileSystem;
    const parts = clean.split('/').filter(Boolean);
    let curr = systemState.fileSystem;
    for (const part of parts) {
        if (curr[part] && curr[part].type === 'dir') {
            if (!curr[part].content) curr[part].content = {};
            curr = curr[part].content;
        } else if (curr[part] && typeof curr[part] === 'object' && !curr[part].type) {
            curr = curr[part];
        } else {
            return systemState.fileSystem;
        }
    }
    return curr;
}

export function getActiveFolderContext(explicitPath = null) {
    if (explicitPath !== null && explicitPath !== undefined) {
        const ctx = getVfsNodeByPath(explicitPath);
        if (ctx) return ctx;
    }
    const activeWin = document.querySelector('.window-frame.active-window');
    if (activeWin) {
        const expEl = activeWin.querySelector('[data-current-path]');
        if (expEl && expEl.dataset.currentPath && expEl.dataset.currentPath !== 'HOME') {
            const ctx = getVfsNodeByPath(expEl.dataset.currentPath);
            if (ctx) return ctx;
        }
    }
    return getVfsNodeByPath(systemState.currentDirectory) || systemState.fileSystem;
}

export function saveFileToVfsPath(vfsPathOrName, filenameOrContent, dataUrlOrDefaultDir = null) {
    if (!vfsPathOrName) return false;

    let dirPath = "";
    let fileName = "";
    let content = "";

    // Signature A: saveFileToVfsPath(vfsPath, filename, dataUrl)
    if (typeof filenameOrContent === 'string' && dataUrlOrDefaultDir && typeof dataUrlOrDefaultDir === 'string' && (dataUrlOrDefaultDir.startsWith('data:') || dataUrlOrDefaultDir.length > 30)) {
        dirPath = vfsPathOrName;
        fileName = filenameOrContent;
        content = dataUrlOrDefaultDir;
    } else {
        // Signature B: saveFileToVfsPath(filePathOrName, fileContent, defaultDir)
        let cleanPath = String(vfsPathOrName).trim().replace(/^Z:\\?/i, '').replace(/\\/g, '/');
        content = filenameOrContent;
        if (cleanPath.includes('/')) {
            const parts = cleanPath.split('/');
            fileName = parts.pop();
            dirPath = parts.join('/');
        } else if (dataUrlOrDefaultDir && typeof dataUrlOrDefaultDir === 'string') {
            dirPath = dataUrlOrDefaultDir;
            fileName = cleanPath;
        } else {
            dirPath = systemState.currentDirectory;
            fileName = cleanPath;
        }
    }

    const dirNode = getVfsNodeByPath(dirPath);
    if (dirNode) {
        let finalName = fileName;
        if (typeof getUniqueVfsFilename === 'function') {
            finalName = getUniqueVfsFilename(dirNode, fileName);
        }
        dirNode[finalName] = { type: "file", content: content };
        saveFileSystem();
        refreshOpenExplorer();
        renderDesktopIcons();
        return finalName;
    }
    return false;
}

// ==========================================================================
// SYSTEM CLOCK SUBSYSTEM (REAL-TIME TASKBAR WIDGET)
// ==========================================================================
function startSystemClock() {
    const clockElement = document.getElementById('live-clock');

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; 

        if (clockElement) {
            const tb = document.getElementById('system-taskbar');
            const isVertical = tb && (tb.dataset.position === 'left' || tb.dataset.position === 'right');
            if (isVertical) {
                clockElement.innerHTML = `<div>${hours}:${minutes}</div><div style="font-size:9px; opacity:0.85;">${ampm}</div>`;
            } else {
                clockElement.textContent = `${hours}:${minutes} ${ampm}`;
            }
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// Various lines that our kernel uses to simulate a boot sequence.
const BOOT_LOG_SEQUENCE = [
    "KERN: Starting Kernel. ",
    "MISC: Probing display adapter... OK",
    "KERN: Initializing window manager subsystem...",
    "STOR: checking local disk image sector...",
    "MISC: Loading persistent file allocations...",
    "KERN: Starting system clock daemon...",
    "MISC: Registering desktop shortcuts...",
    "KERN: Handing off to Graphical Desktop Environment..."
];

// Turns the real Zeb32/ system files already sitting in the VFS into
// "LOAD: Loading file <file>" boot log lines, so the flavor text tracks
// whatever's actually on disk instead of being hardcoded.
function buildFileLoadLines() {
    const zeb32 = systemState.fileSystem?.Zeb32?.content;
    if (!zeb32) return [];
    const lines = [];
    Object.entries(zeb32).forEach(([name, entry]) => {
        if (entry.type === 'file') {
            lines.push(`LOAD: Loading file ${name}`);
        } else if (entry.type === 'dir' && entry.content) {
            Object.keys(entry.content).forEach(subName => {
                lines.push(`LOAD: Loading file ${name}/${subName}`);
            });
        }
    });
    return lines;
}

function initializeBootSequence() {
    // Routine startup chatter is gated behind disableKernelLogs; real errors
    // (logged directly via logKernel(..., "ERROR")) are never suppressed.
    function bootLog(message) {
        if (!systemState.disableKernelLogs) logKernel(message);
    }

    bootLog("SYSTEM START: Initializing Zeb Kernel v3.0.0 ...");
    const bootScreen = document.getElementById('boot-screen');
    const logConsole = document.getElementById('boot-log-console');

    if (systemState.autoDevMode && !devModeEnabled) enterDevMode();

    let finished = false;

    function revealDesktop(username) {
        systemState.currentUser = username;
        const activeUser = ensureUserProfileFolder(username);
        const desktopCanvas = document.getElementById('desktop-canvas');
        const taskbar = document.getElementById('system-taskbar');
        if (desktopCanvas) {
            desktopCanvas.style.display = 'block';
            requestAnimationFrame(() => { desktopCanvas.style.opacity = '1'; });
            // Apply persisted appearance settings
            applyOsSettings({
                color:          systemState.desktopBackground,
                pattern:        systemState.desktopPattern,
                scheme:         systemState.desktopScheme,
                soundScheme:    systemState.soundScheme,
                roundedCorners: systemState.roundedCorners,
            });
        }
        if (taskbar) {
            taskbar.style.display = 'flex';
            requestAnimationFrame(() => { taskbar.style.opacity = '1'; });
        }
        const userTag = document.getElementById('current-user-tag');
        const avatarHtml = systemState.savedAvatar
            ? `<img src="${systemState.savedAvatar}" style="width:16px; height:16px; border-radius:50%; display:block;" alt="">`
            : getIcon('user');
        if (userTag) userTag.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${avatarHtml} ${username}</span>`;
        bootLog(`Session: User '${username}' signed in.`);
    }

    function proceedToLogon() {
        bootLog("BOOT COMPLETE: Graphical Desktop Env Core loaded successfully.");

        // Recognized returning user: skip the sign-in screen entirely and
        // go straight to the desktop under their saved username — unless
        // System Flags has "always show setup screen" turned on.
        if (!systemState.alwaysShowSetup && systemState.hasLoggedInBefore && systemState.savedUsername) {
            bootLog(`Session: Recognized returning user '${systemState.savedUsername}', skipping sign-in screen.`);
            revealDesktop(systemState.savedUsername);
            return;
        }

        (async () => {
            try {
                const module = await import('./logon/logon.js');
                module.showLogonScreen((username, avatarPath) => {
                    systemState.savedUsername = username;
                    systemState.savedAvatar = avatarPath;
                    systemState.hasLoggedInBefore = true;
                    saveFileSystem();
                    revealDesktop(username);
                }, systemState.savedUsername || 'guest', systemState.savedAvatar);
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount logon/logon.js (${err.message})`, "ERROR");
                const desktopCanvas = document.getElementById('desktop-canvas');
                const taskbar = document.getElementById('system-taskbar');
                if (desktopCanvas) { desktopCanvas.style.display = 'block'; desktopCanvas.style.opacity = '1'; }
                if (taskbar) { taskbar.style.display = 'flex'; taskbar.style.opacity = '1'; }
            }
        })();
    }

    function showXpLoadingScreen(onComplete) {
        let loadingScreen = document.getElementById('zeb-loading-screen');
        if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'zeb-loading-screen';
            loadingScreen.innerHTML = `
                <div class="zeb-loading-content">
                    <img src="assets/system/z_logo.png" class="zeb-loading-logo" alt="ZebOS Logo" onerror="this.style.display='none'">
                    <div class="zeb-loading-title">Zeb<span class="brand-highlight">OS</span></div>
                    <div class="zeb-loading-version">Professional 3.0.0 </div>
                    <div class="zeb-loading-track">
                        <div class="zeb-loading-blocks">
                            <div class="zeb-loading-block"></div>
                            <div class="zeb-loading-block"></div>
                            <div class="zeb-loading-block"></div>
                        </div>
                    </div>
                    <div class="zeb-loading-subtext">Starting ZebOS...</div>
                </div>
            `;
            document.body.appendChild(loadingScreen);
        }

        requestAnimationFrame(() => {
            loadingScreen.style.opacity = '1';
        });

        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
                if (onComplete) onComplete();
            }, 600);
        }, 3200);
    }

    function finishBoot() {
        if (finished) return;
        finished = true;
        window.removeEventListener('keydown', devModeKeyHandler);
        if (bootScreen) {
            bootScreen.style.opacity = "0";
            setTimeout(() => {
                bootScreen.remove();
                proceedToLogon();
            }, 600);
        } else {
            proceedToLogon();
        }
    }

    function enterRecoveryMode() {
        if (finished) return;
        finished = true;
        window.removeEventListener('keydown', devModeKeyHandler);
        if (bootScreen) bootScreen.remove();
        logKernel("BOOT: Diverting to Recovery Mode.");
        (async () => {
            try {
                const module = await import('./recovery/recovery.js');
                module.showRecoveryScreen(buildRecoveryApi(proceedToLogon));
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount recovery/recovery.js (${err.message})`, "ERROR");
                proceedToLogon();
            }
        })();
    }

    // Holding Ctrl+Alt during boot skips straight past the log/splash animation.
    // Holding Ctrl+Shift+R during boot diverts into Recovery Mode instead.
    function devModeKeyHandler(e) {
        if (e.ctrlKey && e.altKey && !devModeEnabled) {
            enterDevMode();
            finishBoot();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
            e.preventDefault();
            launchApplication('start-link-taskmgr');
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            enterRecoveryMode();
        }
    }
    window.addEventListener('keydown', devModeKeyHandler);

    const fullBootLog = BOOT_LOG_SEQUENCE.concat(buildFileLoadLines());
    let lineIndex = 0;
    function printNextBootLine() {
        if (finished) return;
        if (lineIndex < fullBootLog.length) {
            const message = fullBootLog[lineIndex];
            if (!systemState.disableKernelLogs) {
                logKernel(message);
                if (logConsole) {
                    const lineEl = document.createElement('div');
                    lineEl.className = 'boot-log-line';
                    lineEl.textContent = `> ${message}`;
                    logConsole.appendChild(lineEl);
                    logConsole.scrollTop = logConsole.scrollHeight;
                }
            }
            lineIndex++;
            setTimeout(printNextBootLine, 180);
        } else {
            setTimeout(() => {
                if (finished) return;
                if (bootScreen) bootScreen.classList.add('splash-active');
                bootLog("BOOT: Kernel log complete, displaying splash screen.");
                setTimeout(finishBoot, 4200);
            }, 300);
        }
    }

    if (systemState.skipBootAnimation) {
        if (bootScreen) bootScreen.classList.add('splash-active');
        setTimeout(finishBoot, 1500);
    } else {
        printNextBootLine();
        setTimeout(finishBoot, Math.max(7500, fullBootLog.length * 180 + 4500));
    }
}

// Window manager code

const windowCleanupHandlers = new Map();

export function registerWindowCleanup(uniqueId, cleanupFn) {
    windowCleanupHandlers.set(uniqueId, cleanupFn);
}

export function closeWindow(uniqueId) {
    playSystemSound('close');
    const cleanup = windowCleanupHandlers.get(uniqueId);
    if (cleanup) {
        cleanup();
        windowCleanupHandlers.delete(uniqueId);
    }
    const win = document.getElementById(`win-${uniqueId}`);
    const tab = document.getElementById(`tab-${uniqueId}`);
    if (win) win.remove();
    if (tab) tab.remove();
    logKernel(`Window closed: ${uniqueId}`);
}

export function createWindow(title, iconName, uniqueId) {
    playSystemSound('open');
    const workspace = document.getElementById('window-workspace');
    const tabsZone = document.getElementById('taskbar-tabs-zone');
    
    const existingWin = document.getElementById(`win-${uniqueId}`);
    if (existingWin) {
        if (existingWin.classList.contains('hidden-view')) {
            existingWin.classList.remove('hidden-view');
            document.getElementById(`tab-${uniqueId}`)?.classList.add('active-tab');
        }
        bringToFront(existingWin);
        return null;
    }

    const win = document.createElement('div');
    win.className = 'window-frame active-window';
    win.id = `win-${uniqueId}`;
    win.style.zIndex = ++topZIndex;

    const currentWindows = document.querySelectorAll('.window-frame').length;
    const winWidth = 760;
    const winHeight = 500;
    const centerX = Math.max(20, Math.floor((window.innerWidth - winWidth) / 2) + (currentWindows * 20));
    const centerY = Math.max(20, Math.floor((window.innerHeight - 40 - winHeight) / 2) + (currentWindows * 20));
    
    win.style.width = `${winWidth}px`;
    win.style.height = `${winHeight}px`;
    win.style.left = `${centerX}px`;
    win.style.top = `${centerY}px`;

    const iconSvg = iconName.includes('<svg') ? iconName : getIcon(iconName);

    win.innerHTML = `
        <div class="window-header" style="cursor: move;">
            <div class="window-title"><span class="win-title-icon" style="display:inline-flex; align-items:center;">${iconSvg}</span> ${title}</div>
            <div class="window-controls">
                <button class="win-btn" id="win-min-${uniqueId}">${getIcon('winMin')}</button>
                <button class="win-btn" id="win-max-${uniqueId}">${getIcon('winMax')}</button>
                <button class="win-btn" id="win-close-${uniqueId}">${getIcon('winClose')}</button>
            </div>
        </div>
        <div class="window-body" id="body-${uniqueId}"></div>
        <div class="window-resize-handle" id="resize-${uniqueId}"></div>
    `;

    workspace.appendChild(win);
    logKernel(`Window opened: ${title} (#${uniqueId})`);

    const tab = document.createElement('div');
    tab.className = 'taskbar-tab active-tab';
    tab.id = `tab-${uniqueId}`;
    tab.innerHTML = `<span class="taskbar-tab-icon" style="display:inline-flex; align-items:center;">${iconSvg}</span> ${title}`;
    tabsZone.appendChild(tab);

    tab.addEventListener('click', () => {
        if (win.classList.contains('hidden-view') || !win.classList.contains('active-window')) {
            win.classList.remove('hidden-view');
            bringToFront(win);
        } else {
            win.classList.add('hidden-view');
            tab.classList.remove('active-tab');
        }
    });

    win.addEventListener('mousedown', () => bringToFront(win));

    document.getElementById(`win-min-${uniqueId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('hidden-view');
        tab.classList.remove('active-tab');
    });

    let isMaximized = false;
    let preMaxTop, preMaxLeft, preMaxWidth, preMaxHeight;
    
    document.getElementById(`win-max-${uniqueId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isMaximized) {
            preMaxTop = win.style.top; preMaxLeft = win.style.left;
            preMaxWidth = win.style.width; preMaxHeight = win.style.height;
            win.classList.add('window-maximized');
            isMaximized = true;
        } else {
            win.classList.remove('window-maximized');
            win.style.top = preMaxTop; win.style.left = preMaxLeft;
            win.style.width = preMaxWidth; win.style.height = preMaxHeight;
            isMaximized = false;
        }
    });

    document.getElementById(`win-close-${uniqueId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(uniqueId);
    });

    setupWindowDrag(win);
    setupWindowResize(win);
    bringToFront(win);
    
    return document.getElementById(`body-${uniqueId}`);
}

function bringToFront(windowElement) {
    document.querySelectorAll('.window-frame').forEach(f => f.classList.remove('active-window'));
    document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active-tab'));
    
    windowElement.classList.remove('hidden-view');
    windowElement.classList.add('active-window');
    windowElement.style.zIndex = ++topZIndex;

    const associatedTab = document.getElementById(`tab-${windowElement.id.substring(4)}`);
    if (associatedTab) associatedTab.classList.add('active-tab');
}

function setupWindowDrag(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false; let offsetX = 0; let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('win-btn') || win.classList.contains('window-maximized')) return;
        isDragging = true;
        offsetX = e.clientX - win.offsetLeft; offsetY = e.clientY - win.offsetTop;
        bringToFront(win);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let nextY = e.clientY - offsetY;
        if (nextY < 0) nextY = 0;
        win.style.left = `${e.clientX - offsetX}px`; win.style.top = `${nextY}px`;
    });

    document.addEventListener('mouseup', () => { isDragging = false; });
}

function setupWindowResize(win) {
    const handle = win.querySelector('.window-resize-handle');
    let isResizing = false; let startWidth, startHeight, startX, startY;

    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (win.classList.contains('window-maximized')) return;
        isResizing = true;
        startWidth = parseInt(document.defaultView.getComputedStyle(win).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(win).height, 10);
        startX = e.clientX; startY = e.clientY;
        bringToFront(win);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = startWidth + (e.clientX - startX);
        const newHeight = startHeight + (e.clientY - startY);
        
        if (newWidth > 220) win.style.width = `${newWidth}px`;
        if (newHeight > 140) win.style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', () => { isResizing = false; });
}

// ==========================================================================
// CENTRAL APPLICATION ROUTER SYSTEM
// ==========================================================================
function countFilesystemEntries(node) {
    let files = 0, dirs = 0;
    Object.values(node).forEach(item => {
        if (item.type === 'dir') {
            dirs++;
            const sub = countFilesystemEntries(item.content);
            files += sub.files;
            dirs += sub.dirs;
        } else {
            files++;
        }
    });
    return { files, dirs };
}

function setWindowBounds(bodyElement, width, height) {
    if (!bodyElement) return;
    const winFrame = bodyElement.closest('.window-frame');
    if (winFrame) {
        winFrame.style.width = `${width}px`;
        winFrame.style.height = `${height}px`;
        const currentWindows = document.querySelectorAll('.window-frame').length - 1;
        const left = Math.max(20, Math.floor((window.innerWidth - width) / 2) + (currentWindows * 20));
        const top = Math.max(20, Math.floor((window.innerHeight - 40 - height) / 2) + (currentWindows * 20));
        winFrame.style.left = `${left}px`;
        winFrame.style.top = `${top}px`;
    }
}

function launchFile(fileName, dirPath = null) {
    if (!fileName) return;
    const targetPath = dirPath !== null ? dirPath : systemState.currentDirectory;
    const targetContext = getVfsNodeByPath(targetPath);
    const item = targetContext ? targetContext[fileName] : null;

    if (fileName.endsWith('.zdl')) {
        showOsConfirm(
            "Cannot Open System Library",
            `'${fileName}' is a ZebOS System Dynamic Library (.zdl) binary module.\n\nSystem libraries are compiled binary components executed directly by ZebOS kernel drivers and cannot be opened in Text Editor.`,
            true,
            () => {}
        );
        return;
    }

    const isImage = fileName.endsWith('.png') ||
                    fileName.endsWith('.jpg') ||
                    fileName.endsWith('.jpeg') ||
                    fileName.endsWith('.bmp') ||
                    fileName.endsWith('.gif') ||
                    fileName.endsWith('.webp') ||
                    (item && item.content && typeof item.content === 'string' && item.content.startsWith('data:image/'));

    if (isImage) {
        launchApplication('start-link-viewer', fileName, targetPath);
        return;
    }

    if (fileName.endsWith('.exe')) {
        const lower = fileName.toLowerCase();
        if (lower.includes('paint')) launchApplication('start-link-paint');
        else if (lower.includes('editor')) launchApplication('start-link-text-editor');
        else if (lower.includes('cmd') || lower.includes('terminal')) launchApplication('start-link-prompt');
        else if (lower.includes('mines')) launchApplication('start-link-mines');
        else if (lower.includes('player')) launchApplication('start-link-media');
        else if (lower.includes('calc')) launchApplication('start-link-calc');
        else if (lower.includes('snake')) launchApplication('start-link-snake');
        else if (lower.includes('task') || lower.includes('mgr')) launchApplication('start-link-taskmgr');
        else if (lower.includes('solitaire')) launchApplication('start-link-solitaire');
        else if (lower.includes('chess')) launchApplication('start-link-chess');
        else if (lower.includes('courgette') || lower.includes('info')) launchApplication('start-link-courgette');
        else if (lower.includes('viewer')) launchApplication('start-link-viewer');
        else if (lower.includes('vm') || lower.includes('zebvm')) launchApplication('start-link-vm');
        else if (lower.includes('activity') || lower.includes('center')) launchApplication('start-link-activitycenter');
        else launchApplication('start-link-text-editor', fileName, targetPath);
        return;
    }
    launchApplication('start-link-text-editor', fileName, targetPath);
}

async function launchApplication(appId, customFileName = null, dirPath = null) {
    const targetPath = dirPath !== null ? dirPath : systemState.currentDirectory;
    const currentContext = getVfsNodeByPath(targetPath) || getActiveFolderContext();

    switch (appId) {
        case 'start-link-files': {
            const winId = 'explorer-root';
            try {
                const module = await import(`./programs/explorer.js?v=${Date.now()}`);
                const explorerBody = createWindow("Exploring - ZebRoot (Z:)", "explorer", winId);
                if (explorerBody) {
                    setWindowBounds(explorerBody, 760, 480);
                    const expInstance = new module.FileExplorerApp(
                        () => closeWindow(winId),
                        (fileName, fileDirPath) => launchFile(fileName, fileDirPath),
                        () => saveFileSystem(),
                        (path) => getVfsNodeByPath(path)
                    );
                    registerWindowCleanup(winId, () => expInstance.cleanup());
                    expInstance.open(explorerBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount explorer.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-prompt': {
            const winId = 'app-terminal';
            try {
                const module = await import(`./programs/terminal.js?v=${Date.now()}`);
                const termBody = createWindow("Zeb Terminal", "terminal", winId);
                if (termBody) {
                    setWindowBounds(termBody, 700, 440);
                    const shellApi = {
                        getContext: () => getActiveFolderContext(),
                        getPath: () => systemState.currentDirectory === "" ? "/" : `/${systemState.currentDirectory}`,
                        changeDirectory: (target) => shellChangeDirectory(target),
                        mkdir: (name) => shellMkdir(name),
                        touch: (name) => shellTouch(name),
                        remove: (name) => shellRemove(name),
                        openInEditor: (name) => launchApplication('start-link-text-editor', name),
                        getUsername: () => systemState.currentUser,
                        getVersion: () => systemState.version,
                        getCodename: () => systemState.codename
                    };
                    const termInstance = new module.ZebTerminal(() => closeWindow(winId), shellApi);
                    registerWindowCleanup(winId, () => termInstance.cleanup());
                    termInstance.open(termBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount terminal.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-text-editor':
            const targetEditFile = customFileName || "untitled.txt";
            try {
                const module = await import(`./programs/editor.js?v=${Date.now()}`);
                const existingContent = currentContext[targetEditFile] ? currentContext[targetEditFile].content : "";
                const cleanId = targetEditFile.replace(/[^a-zA-Z0-9]/g, '');
                const winId = `edit-${cleanId}`;
                const appBodyElement = createWindow(`Text Editor - ${targetEditFile}`, "editor", winId);

                if (appBodyElement) {
                    setWindowBounds(appBodyElement, 700, 460);
                    const editorInstance = new module.TextEditor(
                        targetEditFile,
                        existingContent,
                        (savedName, savedData) => {
                            if (savedName) {
                                const saveContext = getActiveFolderContext();
                                saveContext[savedName] = { type: "file", content: savedData };
                                saveFileSystem();
                                const activeExp = document.querySelector('.explorer-grid');
                                if (activeExp) renderZebExplorer(activeExp.parentElement);
                            }
                        },
                        () => closeWindow(winId)
                    );
                    registerWindowCleanup(winId, () => editorInstance.cleanup());
                    editorInstance.open(appBodyElement);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount editor.js (${err.message})`, "ERROR");
            }
            break;

        case 'start-link-paint': {
            const winId = 'app-paint';
            try {
                const module = await import(`./programs/paint.js?v=${Date.now()}`);
                const paintBody = createWindow("Paint Studio", "paint", winId);
                if (paintBody) {
                    setWindowBounds(paintBody, 920, 620);
                    const paintInstance = new module.PaintApp(
                        () => closeWindow(winId),
                        (filename, dataUrl) => {
                            const saveContext = getActiveFolderContext();
                            saveContext[filename] = { type: "file", content: dataUrl };
                            saveFileSystem();
                            const activeExp = document.querySelector('.explorer-grid');
                            if (activeExp) renderZebExplorer(activeExp.parentElement);
                        }
                    );
                    registerWindowCleanup(winId, () => paintInstance.cleanup());
                    paintInstance.open(paintBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount paint.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-viewer': {
            const targetImageFile = customFileName || "image.png";
            const cleanId = targetImageFile.replace(/[^a-zA-Z0-9]/g, '');
            const winId = `viewer-${cleanId}`;
            try {
                const module = await import(`./programs/viewer.js?v=${Date.now()}`);
                const appBodyElement = createWindow(`Zeb Viewer - ${targetImageFile}`, "viewer", winId);

                let imageDataUrl = null;
                const fileObj = currentContext[targetImageFile];
                if (fileObj && fileObj.content) {
                    imageDataUrl = fileObj.content;
                }

                if (appBodyElement) {
                    setWindowBounds(appBodyElement, 780, 520);
                    const viewerInstance = new module.ZebViewerApp(
                        targetImageFile,
                        imageDataUrl,
                        () => closeWindow(winId),
                        (path) => getVfsNodeByPath(path)
                    );
                    registerWindowCleanup(winId, () => viewerInstance.cleanup());
                    viewerInstance.open(appBodyElement);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount viewer.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-mines': {
            const winId = 'app-mines';
            try {
                const module = await import(`./programs/mines.js?v=${Date.now()}`);
                const minesBody = createWindow("Minesweeper", "mines", winId);
                if (minesBody) {
                    setWindowBounds(minesBody, 360, 420);
                    const minesInstance = new module.MinesweeperGame(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => minesInstance.cleanup());
                    minesInstance.open(minesBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount mines.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-media': {
            const winId = 'app-media';
            try {
                const module = await import(`./programs/media.js?v=${Date.now()}`);
                const mediaBody = createWindow("Media Player", "media", winId);
                if (mediaBody) {
                    setWindowBounds(mediaBody, 720, 480);
                    const mediaInstance = new module.MediaPlayer(
                        () => closeWindow(winId),
                        (filename) => {
                            const saveContext = getActiveFolderContext();
                            return saveContext[filename] ? saveContext[filename].content : null;
                        }
                    );
                    registerWindowCleanup(winId, () => mediaInstance.cleanup());
                    mediaInstance.open(mediaBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount media.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-camera': {
            const winId = 'app-camera';
            try {
                const module = await import(`./camera/camera.js?v=${Date.now()}`);
                const cameraBody = createWindow("Camera", "camera", winId);
                if (cameraBody) {
                    setWindowBounds(cameraBody, 640, 480);
                    const cameraInstance = new module.CameraApp(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => cameraInstance.cleanup());
                    cameraInstance.open(cameraBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount camera/camera.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-vm': {
            const winId = 'app-vm';
            try {
                const module = await import(`./programs/vm.js?v=${Date.now()}`);
                const vmBody = createWindow("ZebVM Manager", "vm", winId);
                if (vmBody) {
                    setWindowBounds(vmBody, 880, 560);
                    const vmInstance = new module.ZebVMManager(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => vmInstance.cleanup());
                    vmInstance.open(vmBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount vm.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-calc': {
            const winId = 'app-calc';
            try {
                const module = await import(`./programs/calc.js?v=${Date.now()}`);
                const calcBody = createWindow("Calculator", "calc", winId);
                if (calcBody) {
                    setWindowBounds(calcBody, 320, 400);
                    const calcInstance = new module.RetroCalculator(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => calcInstance.cleanup());
                    calcInstance.open(calcBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount calc.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-snake': {
            const winId = 'app-snake';
            try {
                const module = await import(`./programs/snake.js?v=${Date.now()}`);
                const snakeBody = createWindow("Snake", "snake", winId);
                if (snakeBody) {
                    setWindowBounds(snakeBody, 420, 460);
                    const snakeInstance = new module.SnakeGame(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => snakeInstance.cleanup());
                    snakeInstance.open(snakeBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount snake.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-courgette': {
            const winId = 'app-courgette';
            try {
                const module = await import('./programs/courgette.js');
                const cgBody = createWindow("Courgette", "courgette", winId);
                if (cgBody) {
                    setWindowBounds(cgBody, 660, 440);
                    const counts = countFilesystemEntries(systemState.fileSystem);
                    const diskBytes = new Blob([JSON.stringify(systemState.fileSystem)]).size;
                    const cgInstance = new module.CourgetteInfo(() => closeWindow(winId), {
                        version: systemState.version,
                        codename: systemState.codename,
                        uptimeSeconds: systemState.uptime,
                        fileCount: counts.files,
                        dirCount: counts.dirs,
                        diskBytes
                    });
                    registerWindowCleanup(winId, () => cgInstance.cleanup());
                    cgInstance.open(cgBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount courgette.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-personalize': {
            const winId = 'personalize-dialog';
            try {
                const module = await import(`./programs/personalize.js?v=${Date.now()}`);
                const pBody = createWindow("Display Properties", "personalize", winId);
                if (pBody) {
                    setWindowBounds(pBody, 470, 490);
                    const pInstance = new module.PersonalizeApp(
                        () => closeWindow(winId),
                        (settings) => {
                            // settings = { color, pattern, scheme, soundScheme, roundedCorners }
                            applyOsSettings(settings);
                            saveFileSystem();
                            logKernel(`Personalize: Applied settings — color:${settings.color} pattern:${settings.pattern} scheme:${settings.scheme} sound:${settings.soundScheme}`);
                        },
                        systemState.desktopBackground || '#008080',
                        systemState.desktopPattern    || 'solid',
                        systemState.desktopScheme     || 'standard',
                        systemState.soundScheme       || 'classic',
                        systemState.roundedCorners    || false
                    );
                    registerWindowCleanup(winId, () => pInstance.cleanup());
                    pInstance.open(pBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount personalize.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-taskmgr': {
            const winId = 'app-taskmgr';
            try {
                const module = await import(`./programs/taskmgr.js?v=${Date.now()}`);
                const taskmgrBody = createWindow("Task Manager", "taskmgr", winId);
                if (taskmgrBody) {
                    setWindowBounds(taskmgrBody, 640, 480);
                    const taskmgrInstance = new module.TaskManagerApp(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => taskmgrInstance.cleanup());
                    taskmgrInstance.open(taskmgrBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount taskmgr.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-solitaire': {
            const winId = 'app-solitaire';
            try {
                const module = await import(`./programs/solitaire.js?v=${Date.now()}`);
                const solitaireBody = createWindow("Solitaire", "solitaire", winId);
                if (solitaireBody) {
                    setWindowBounds(solitaireBody, 640, 560);
                    const solitaireInstance = new module.SolitaireGame(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => solitaireInstance.cleanup());
                    solitaireInstance.open(solitaireBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount solitaire.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-chess': {
            const winId = 'app-chess';
            try {
                const module = await import(`./programs/chess.js?v=${Date.now()}`);
                const chessBody = createWindow("Chess", "chess", winId);
                if (chessBody) {
                    setWindowBounds(chessBody, 780, 600);
                    const chessInstance = new module.ChessApp(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => chessInstance.cleanup());
                    chessInstance.open(chessBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount chess.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-activitycenter': {
            const winId = 'app-activitycenter';
            try {
                const module = await import(`./programs/activitycenter.js?v=${Date.now()}`);
                const acBody = createWindow("Activity Center", "activitycenter", winId);
                if (acBody) {
                    setWindowBounds(acBody, 860, 560);

                    window.launchApplicationFromActivityCenter = (targetAppId) => {
                        if (!targetAppId || targetAppId === 'start-link-activitycenter') return;
                        launchApplication(targetAppId);
                    };

                    const acInstance = new module.ActivityCenterApp(() => closeWindow(winId));
                    registerWindowCleanup(winId, () => {
                        acInstance.cleanup();
                        if (window.launchApplicationFromActivityCenter) {
                            delete window.launchApplicationFromActivityCenter;
                        }
                    });
                    acInstance.open(acBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount activitycenter.js (${err.message})`, "ERROR");
            }
            break;
        }
        case 'start-link-run': {
            const winId = 'app-run';
            try {
                const module = await import(`./programs/run.js?v=${Date.now()}`);
                const runBody = createWindow("Run", "run", winId);
                if (runBody) {
                    setWindowBounds(runBody, 460, 210);
                    const runInstance = new module.RunDialog(
                        () => closeWindow(winId),
                        (appId, arg) => launchApplication(appId, arg),
                        () => launchApplication('start-link-files')
                    );
                    registerWindowCleanup(winId, () => runInstance.cleanup());
                    runInstance.open(runBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount run.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-regedit': {
            const winId = 'app-regedit';
            try {
                const module = await import(`./programs/regedit.js?v=${Date.now()}`);
                const regeditBody = createWindow("Registry Editor", "regedit", winId);
                if (regeditBody) {
                    setWindowBounds(regeditBody, 700, 480);
                    const regeditInstance = new module.RegistryEditorApp(
                        () => closeWindow(winId),
                        { getSnapshot: getRegistrySnapshot, setValue: setRegistryValue }
                    );
                    registerWindowCleanup(winId, () => regeditInstance.cleanup());
                    regeditInstance.open(regeditBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount regedit.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-sysflags': {
            const winId = 'app-sysflags';
            try {
                const module = await import(`./devtools/sysflags.js?v=${Date.now()}`);
                const sysflagsBody = createWindow("System Flags", "settings", winId);
                if (sysflagsBody) {
                    setWindowBounds(sysflagsBody, 420, 520);
                    const sysflagsInstance = new module.SystemFlagsApp(
                        () => closeWindow(winId),
                        { getSnapshot: getRegistrySnapshot, setValue: setRegistryValue }
                    );
                    registerWindowCleanup(winId, () => sysflagsInstance.cleanup());
                    sysflagsInstance.open(sysflagsBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount devtools/sysflags.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-reinstall': {
            const winId = 'app-reinstaller';
            try {
                const module = await import(`./devtools/reinstaller.js?v=${Date.now()}`);
                const reinstallBody = createWindow("Reinstaller", "reinstall", winId);
                if (reinstallBody) {
                    setWindowBounds(reinstallBody, 420, 300);
                    const reinstallInstance = new module.ReinstallerApp(
                        () => closeWindow(winId),
                        { reinstallAndRestart }
                    );
                    registerWindowCleanup(winId, () => reinstallInstance.cleanup());
                    reinstallInstance.open(reinstallBody);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount devtools/reinstaller.js (${err.message})`, "ERROR");
            }
            break;
        }

        case 'start-link-shutdown':
            alert("ZebOS Shutdown Sequence Initiated.");
            break;
    }
}

// ==========================================================================
// DYNAMIC ZEB EXPLORER APP MODULE RENDERING ENGINE
// ==========================================================================
async function renderZebExplorer(containerElement) {
    try {
        const module = await import(`./programs/explorer.js?v=${Date.now()}`);
        const expInstance = new module.FileExplorerApp(
            () => {},
            (fileName) => launchApplication('start-link-text-editor', fileName),
            () => saveFileSystem(),
            (path) => getVfsNodeByPath(path)
        );
        expInstance.open(containerElement);
    } catch (err) {
        logKernel(`Kernel Error: Failed to mount explorer.js (${err.message})`, "ERROR");
    }
}

// ==========================================================================
// TERMINAL SHELL API
// The one-level directory model here mirrors Zeb Explorer's own limits
// (a single "Up to Root" hop, no deep nesting) — the terminal just gives
// the same virtual filesystem a command-line face.
// ==========================================================================
function refreshOpenExplorer() {
    const activeExp = document.querySelector('.explorer-grid');
    if (activeExp) renderZebExplorer(activeExp.parentElement);
}

function shellChangeDirectory(target) {
    if (target === '/' || target === '~') {
        systemState.currentDirectory = "";
        return { ok: true };
    }
    if (target === '..') {
        if (systemState.currentDirectory === "") return { ok: false, message: "Already at root." };
        const parts = systemState.currentDirectory.split('/');
        parts.pop();
        systemState.currentDirectory = parts.join('/');
        return { ok: true };
    }
    const fullPath = systemState.currentDirectory === "" ? target : `${systemState.currentDirectory}/${target}`;
    const context = getActiveFolderContext();
    const entry = context[target];
    if (!entry) return { ok: false, message: `cd: ${target}: No such directory` };
    if (entry.type !== 'dir') return { ok: false, message: `cd: ${target}: Not a directory` };
    systemState.currentDirectory = fullPath;
    return { ok: true };
}

function shellMkdir(name) {
    const context = getActiveFolderContext();
    if (context[name]) return { message: `mkdir: ${name}: already exists` };
    context[name] = { type: "dir", content: {} };
    saveFileSystem();
    refreshOpenExplorer();
    return { message: `Created directory: ${name}` };
}

function shellTouch(name) {
    const context = getActiveFolderContext();
    if (context[name]) return { message: `touch: ${name}: already exists` };
    context[name] = { type: "file", content: "" };
    saveFileSystem();
    refreshOpenExplorer();
    return { message: `Created file: ${name}` };
}

function shellRemove(name) {
    const context = getActiveFolderContext();
    if (!context[name]) return { message: `rm: ${name}: No such file or directory` };
    delete context[name];
    saveFileSystem();
    refreshOpenExplorer();
    return { message: `Removed: ${name}` };
}

// ==========================================================================
// RECOVERY MODE API
// Callbacks handed to recovery/recovery.js, which knows nothing about
// systemState directly — only os.js has access to it.
// ==========================================================================
const RECOVERY_FLAG_KEYS = ['autoArrange', 'taskbarAutoHide', 'desktopSortBy', 'skipBootAnimation', 'autoDevMode', 'alwaysShowSetup', 'disableKernelLogs', 'soundScheme', 'desktopScheme', 'roundedCorners'];
const RECOVERY_DEFAULT_SETTINGS = {
    desktopSortBy: 'type',
    autoArrange: true,
    desktopBackground: '#008080',
    desktopPattern: 'solid',
    desktopScheme: 'standard',
    soundScheme: 'classic',
    taskbarAutoHide: false,
    roundedCorners: false,
    skipBootAnimation: false,
    autoDevMode: false,
    alwaysShowSetup: false,
    disableKernelLogs: false,
    hasLoggedInBefore: false,
    savedUsername: null,
    savedAvatar: null
};

function buildRecoveryApi(onExit) {
    const createBackup = () => JSON.stringify({
        version: systemState.version,
        fileSystem: systemState.fileSystem,
        settings: {
            color: systemState.desktopBackground,
            pattern: systemState.desktopPattern,
            scheme: systemState.desktopScheme,
            hasLoggedInBefore: systemState.hasLoggedInBefore,
            savedUsername: systemState.savedUsername,
            savedAvatar: systemState.savedAvatar,
            ...Object.fromEntries(RECOVERY_FLAG_KEYS.map(k => [k, systemState[k]]))
        }
    }, null, 2);

    const restoreBackup = (jsonText) => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!parsed || typeof parsed !== 'object' || !parsed.fileSystem || typeof parsed.fileSystem !== 'object') {
                return { ok: false, message: 'Backup file is missing a valid fileSystem section.' };
            }
            systemState.fileSystem = parsed.fileSystem;
            const s = parsed.settings || {};
            if (s.color) systemState.desktopBackground = s.color;
            if (s.pattern) systemState.desktopPattern = s.pattern;
            if (s.scheme) systemState.desktopScheme = s.scheme;
            if (s.hasLoggedInBefore !== undefined) systemState.hasLoggedInBefore = s.hasLoggedInBefore;
            if (s.savedUsername) systemState.savedUsername = s.savedUsername;
            if (s.savedAvatar) systemState.savedAvatar = s.savedAvatar;
            RECOVERY_FLAG_KEYS.forEach(k => { if (s[k] !== undefined) systemState[k] = s[k]; });
            ensureSystemFoldersExist();
            saveFileSystem();
            logKernel("Recovery: Restored system state from backup file.");
            return { ok: true, message: 'Restore complete.' };
        } catch (err) {
            return { ok: false, message: `Could not read backup file: ${err.message}` };
        }
    };

    const reinstall = () => {
        Object.assign(systemState, RECOVERY_DEFAULT_SETTINGS);
        provisionDefaultRootFS();
        saveFileSystem();
        logKernel("Recovery: Fresh install provisioned, all prior data erased.", "WARN");
    };

    const getFlags = () => Object.fromEntries(RECOVERY_FLAG_KEYS.map(k => [k, systemState[k]]));
    const setFlag = (key, value) => {
        if (!RECOVERY_FLAG_KEYS.includes(key)) return;
        systemState[key] = value;
        saveFileSystem();
    };

    return {
        onExit,
        getVersion: () => systemState.version,
        createBackup,
        restoreBackup,
        reinstall,
        getFlags,
        setFlag,
        shellApi: {
            getContext: () => getActiveFolderContext(),
            getPath: () => systemState.currentDirectory === "" ? "/" : `/${systemState.currentDirectory}`,
            changeDirectory: (target) => shellChangeDirectory(target),
            mkdir: (name) => shellMkdir(name),
            touch: (name) => shellTouch(name),
            remove: (name) => shellRemove(name),
            openInEditor: () => {},
            getUsername: () => systemState.currentUser,
            getVersion: () => systemState.version,
            getCodename: () => systemState.codename,
            backup: createBackup,
            reinstall,
            getFlags,
            setFlag
        }
    };
}

// ==========================================================================
// DEVTOOLS: LIVE-SESSION REINSTALLER
// Same reset buildRecoveryApi's reinstall() does at the boot-time Recovery
// screen, but triggered mid-session — so it restarts ZebOS afterward instead
// of just falling through to the logon screen that hasn't rendered yet.
// ==========================================================================
export function reinstallAndRestart() {
    Object.assign(systemState, RECOVERY_DEFAULT_SETTINGS);
    provisionDefaultRootFS();
    saveFileSystem();
    logKernel("Devtools Reinstaller: Fresh install provisioned, all prior data erased. Restarting...", "WARN");
    setTimeout(() => window.location.reload(), 500);
}

// ==========================================================================
// DESKTOP SHORTCUT ICONS
// ==========================================================================
const INITIAL_DESKTOP_SHORTCUTS = [
    { id: 'start-link-files', icon: 'explorer', label: 'Zeb Explorer' },
    { id: 'start-link-text-editor', icon: 'editor', label: 'Text Editor' },
    { id: 'start-link-prompt', icon: 'terminal', label: 'Zeb Terminal' },
    { id: 'start-link-paint', icon: 'paint', label: 'Paint' },
    { id: 'start-link-mines', icon: 'mines', label: 'Minesweeper' },
    { id: 'start-link-calc', icon: 'calc', label: 'Calculator' },
    { id: 'start-link-snake', icon: 'snake', label: 'Snake' },
    { id: 'start-link-media', icon: 'media', label: 'Media Player' },
    { id: 'start-link-vm', icon: 'vm', label: 'ZebVM Manager' },
    { id: 'start-link-camera', icon: 'camera', label: 'Camera' },
    { id: 'start-link-courgette', icon: 'courgette', label: 'Courgette' },
    { id: 'start-link-taskmgr', icon: 'taskmgr', label: 'Task Manager' },
    { id: 'start-link-solitaire', icon: 'solitaire', label: 'Solitaire' },
    { id: 'start-link-chess', icon: 'chess', label: 'Chess' },
    { id: 'start-link-activitycenter', icon: 'activitycenter', label: 'Activity Center' },
];

let DESKTOP_SHORTCUTS = [...INITIAL_DESKTOP_SHORTCUTS];

export function showOsPrompt(title, message, defaultValue = "", onConfirm = null) {
    const overlay = document.createElement('div');
    overlay.className = 'os-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        z-index: 100005;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'os-prompt-modal active-window';
    dialog.style.cssText = `
        position: relative !important;
        left: auto !important; top: auto !important;
        width: 340px !important;
        height: auto !important;
        min-height: 140px !important;
        background-color: #c0c0c0;
        border: 2px solid #ffffff;
        border-right-color: #000000;
        border-bottom-color: #000000;
        box-shadow: 4px 4px 18px rgba(0,0,0,0.6);
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    `;

    dialog.innerHTML = `
        <div class="window-header">
            <div class="window-title">${title}</div>
            <div class="window-controls">
                <button class="win-btn" id="prompt-close">${getIcon('winClose')}</button>
            </div>
        </div>
        <div style="padding:14px; font-size:12px; display:flex; flex-direction:column; gap:10px;">
            <div style="font-weight:bold; color:#000080;">${message}</div>
            <input type="text" id="prompt-input" value="${defaultValue}" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:4px 6px; font-size:12px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; outline:none;">
            <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:4px;">
                <button id="prompt-ok" style="padding:4px 18px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold;">OK</button>
                <button id="prompt-cancel" style="padding:4px 12px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Cancel</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = dialog.querySelector('#prompt-input');
    const okBtn = dialog.querySelector('#prompt-ok');
    const cancelBtn = dialog.querySelector('#prompt-cancel');
    const closeBtn = dialog.querySelector('#prompt-close');

    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);

    const cleanup = () => overlay.remove();

    const submit = () => {
        const val = input.value.trim();
        cleanup();
        if (val && onConfirm) onConfirm(val);
    };

    okBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') cleanup();
    });
    cancelBtn.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
}

export function showOsConfirm(title, message, isWarning = false, onConfirm = null) {
    const isSingleOk = (!onConfirm);

    const overlay = document.createElement('div');
    overlay.className = 'os-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        z-index: 100005;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'os-prompt-modal active-window';
    dialog.style.cssText = `
        position: relative !important;
        left: auto !important; top: auto !important;
        width: 370px !important;
        height: auto !important;
        background-color: #c0c0c0;
        border: 2px solid #ffffff;
        border-right-color: #000000;
        border-bottom-color: #000000;
        box-shadow: 4px 4px 18px rgba(0,0,0,0.6);
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    `;

    const iconHtml = isWarning
        ? `<div style="width:34px;height:34px;flex-shrink:0;color:#ffffff;display:flex;align-items:center;justify-content:center;background:#d32f2f;border:2px solid #800000;border-radius:50%;font-weight:bold;font-size:22px;line-height:1;">!</div>`
        : `<div style="width:34px;height:34px;flex-shrink:0;color:#ffffff;display:flex;align-items:center;justify-content:center;background:#000080;border:2px solid #000040;border-radius:50%;font-weight:bold;font-family:serif;font-size:22px;line-height:1;font-style:italic;">i</div>`;

    const headerStyle = isWarning
        ? `background: linear-gradient(90deg, #800000 0%, #d32f2f 100%); color:#ffffff;`
        : ``;

    const buttonsHtml = isSingleOk
        ? `<button id="confirm-yes" style="padding:4px 24px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold;">OK</button>`
        : `<button id="confirm-yes" style="padding:4px 20px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold; ${isWarning ? 'color:#800000;' : ''}">Yes</button>
           <button id="confirm-no" style="padding:4px 16px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">No</button>`;

    dialog.innerHTML = `
        <div class="window-header" style="${headerStyle}">
            <div class="window-title" style="${isWarning ? 'color:#ffffff;' : ''}">${title}</div>
            <div class="window-controls">
                <button class="win-btn" id="confirm-close">${getIcon('winClose')}</button>
            </div>
        </div>
        <div style="padding:16px; font-size:12px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:flex-start; gap:12px;">
                ${iconHtml}
                <div style="font-size:12px; color:#000; line-height:1.4; word-break:break-word; white-space:pre-wrap;">${message}</div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                ${buttonsHtml}
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const yesBtn = dialog.querySelector('#confirm-yes');
    const noBtn = dialog.querySelector('#confirm-no');
    const closeBtn = dialog.querySelector('#confirm-close');

    const cleanup = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    yesBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });

    if (noBtn) noBtn.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);

    window.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            cleanup();
            window.removeEventListener('keydown', handleEsc);
        }
    });

    setTimeout(() => yesBtn.focus(), 50);
}

export function getUniqueVfsFilename(targetContext, originalFilename) {
    if (!targetContext || !targetContext[originalFilename]) return originalFilename;

    const lastDotIndex = originalFilename.lastIndexOf('.');
    let baseName = originalFilename;
    let ext = "";

    if (lastDotIndex > 0) {
        baseName = originalFilename.substring(0, lastDotIndex);
        ext = originalFilename.substring(lastDotIndex);
    }

    const match = baseName.match(/^(.*?)(?:\s*\(\d+\))?$/);
    const rootName = (match && match[1]) ? match[1].trim() : baseName;

    let counter = 1;
    let newFilename = `${rootName} (${counter})${ext}`;
    while (targetContext[newFilename]) {
        counter++;
        newFilename = `${rootName} (${counter})${ext}`;
    }
    return newFilename;
}

// (saveFileToVfsPath is exported above at VFS section)

export function showSaveFileDialog(defaultName, onSaveCallback) {
    const currentUser = systemState.currentUser || "Guest";
    const availableFolders = [
        { label: `Users/${currentUser}/Pictures`, path: `Users/${currentUser}/Pictures` },
        { label: `Users/${currentUser}/Documents`, path: `Users/${currentUser}/Documents` },
        { label: `Users/${currentUser}/Desktop`, path: `Users/${currentUser}/Desktop` },
        { label: `Users/${currentUser}/Downloads`, path: `Users/${currentUser}/Downloads` },
        { label: `ZebRoot (Z:)`, path: "" }
    ];

    const overlay = document.createElement('div');
    overlay.className = 'os-modal-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        z-index: 100010;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'os-prompt-modal active-window';
    dialog.style.cssText = `
        position: relative !important; width: 440px !important;
        background-color: #c0c0c0; border: 2px solid #ffffff;
        border-right-color: #000000; border-bottom-color: #000000;
        box-shadow: 4px 4px 18px rgba(0,0,0,0.6); font-family: Arial, sans-serif;
        box-sizing: border-box;
    `;

    dialog.innerHTML = `
        <div class="window-header">
            <div class="window-title">Save As - ZebOS File Allocation</div>
            <div class="window-controls">
                <button class="win-btn" id="save-dialog-close">${getIcon('winClose')}</button>
            </div>
        </div>
        <div style="padding:14px; font-size:11px; display:flex; flex-direction:column; gap:10px;">
            
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold; min-width:65px;">Save in:</span>
                <select id="save-folder-select" style="flex-grow:1; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:3px 6px; font-size:11px; font-weight:bold; color:#000080; outline:none;">
                    ${availableFolders.map(f => `<option value="${f.path}">${f.label}</option>`).join('')}
                </select>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold; min-width:65px;">File name:</span>
                <input type="text" id="save-filename-input" value="${defaultName || 'artwork.png'}" style="flex-grow:1; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:3px 6px; font-size:11px; outline:none; font-family:monospace;">
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:bold; min-width:65px;">Save type:</span>
                <select disabled style="flex-grow:1; background:#e0e0e0; border:1px solid #808080; padding:3px 6px; font-size:11px; color:#555;">
                    <option>PNG Portable Network Graphics (*.png)</option>
                </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                <button id="save-dialog-ok" style="padding:4px 24px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold;">Save</button>
                <button id="save-dialog-cancel" style="padding:4px 16px; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Cancel</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const filenameInput = dialog.querySelector('#save-filename-input');
    const folderSelect = dialog.querySelector('#save-folder-select');
    const okBtn = dialog.querySelector('#save-dialog-ok');
    const cancelBtn = dialog.querySelector('#save-dialog-cancel');
    const closeBtn = dialog.querySelector('#save-dialog-close');

    const cleanup = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    okBtn.addEventListener('click', () => {
        const name = filenameInput.value.trim();
        const folder = folderSelect.value;
        if (!name) return;
        cleanup();
        if (onSaveCallback) onSaveCallback(name, folder);
    });

    cancelBtn.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    filenameInput.focus();
    filenameInput.select();
}

let currentDesktopViewMode = 'large'; // 'large' or 'small'

function renderDesktopIcons() {
    const zone = document.getElementById('desktop-icons-zone');
    if (!zone) return;
    zone.innerHTML = '';

    if (!DESKTOP_SHORTCUTS || DESKTOP_SHORTCUTS.length === 0) {
        DESKTOP_SHORTCUTS = [...INITIAL_DESKTOP_SHORTCUTS];
    }

    const shortcuts = [...DESKTOP_SHORTCUTS];

    // Include custom VFS items inside Users/Guest/Desktop
    const desktopVfs = getVfsNodeByPath("Users/Guest/Desktop");
    if (desktopVfs && typeof desktopVfs === 'object') {
        Object.keys(desktopVfs).forEach(name => {
            if (!shortcuts.some(s => s.label === name || s.vfsName === name)) {
                const item = desktopVfs[name];
                const isDir = item?.type === 'dir';
                const iconName = isDir ? 'folder' : (name.endsWith('.zdl') ? 'zdl' : (name.endsWith('.png') || name.endsWith('.jpg') ? 'picture' : 'file'));
                shortcuts.push({
                    id: isDir ? 'start-link-files' : 'start-link-text-editor',
                    icon: iconName,
                    label: name,
                    vfsName: name,
                    isCustomVfs: true,
                    itemType: item?.type
                });
            }
        });
    }

    if (systemState.desktopSortBy === 'name') {
        shortcuts.sort((a, b) => a.label.localeCompare(b.label));
    } else if (systemState.desktopSortBy === 'type') {
        shortcuts.sort((a, b) => a.icon.localeCompare(b.icon));
    }

    shortcuts.forEach(shortcut => {
        const iconEl = document.createElement('div');
        iconEl.dataset.appId = shortcut.id;
        if (shortcut.vfsName) iconEl.dataset.vfsName = shortcut.vfsName;
        if (shortcut.isCustomVfs) iconEl.dataset.isCustomVfs = 'true';
        if (shortcut.itemType) iconEl.dataset.itemType = shortcut.itemType;
        
        if (currentDesktopViewMode === 'small') {
            iconEl.className = 'desktop-icon small-view';
            iconEl.innerHTML = `
                <div class="sys-icon" style="width:18px; height:18px; flex-shrink:0;">${getIcon(shortcut.icon)}</div>
                <div class="desktop-icon-label">${shortcut.label}</div>
            `;
        } else {
            iconEl.className = 'desktop-icon';
            iconEl.innerHTML = `
                <div class="desktop-icon-glyph">${getIcon(shortcut.icon)}</div>
                <div class="desktop-icon-label">${shortcut.label}</div>
            `;
        }

        iconEl.addEventListener('dblclick', () => {
            if (shortcut.isCustomVfs) {
                if (shortcut.itemType === 'dir') {
                    launchApplication('start-link-files', shortcut.vfsName || shortcut.label);
                } else {
                    launchApplication(shortcut.id, shortcut.vfsName || shortcut.label);
                }
            } else {
                launchApplication(shortcut.id);
            }
        });
        zone.appendChild(iconEl);
    });

    logKernel(`Desktop: Rendered ${shortcuts.length} shortcuts (${currentDesktopViewMode} view mode, sorted by ${systemState.desktopSortBy}).`);
}

// ==========================================================================
// START MENU INTERACTIVITY CONTROLLER
// ==========================================================================
function setupStartMenuController() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    const systemTray = document.getElementById('system-tray');
    const trayMenu = document.getElementById('tray-menu');

    // Render official Z logo on Start button logo container (same as logon)
    const startLogoEl = document.querySelector('.start-logo');
    if (startLogoEl) startLogoEl.innerHTML = `<img src="assets/system/z_logo.png" style="width:20px; height:20px; object-fit:contain; display:block;" alt="Z">`;

    const userTagEl = document.getElementById('current-user-tag');
    if (userTagEl) userTagEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${getIcon('user')} ${systemState.currentUser}</span>`;

    const trayVolIcon = document.getElementById('tray-vol-icon');
    if (trayVolIcon) trayVolIcon.innerHTML = `<span style="display:inline-flex; align-items:center;">${getIcon('volume')}</span>`;

    // Populate start menu SVG icons
    const menuItems = document.querySelectorAll('.start-menu-item');
    menuItems.forEach(item => {
        const iconName = item.dataset.icon;
        const iconSpan = item.querySelector('.menu-icon');
        if (iconName && iconSpan) {
            iconSpan.innerHTML = getIcon(iconName);
        }
        item.addEventListener('click', () => {
            launchApplication(item.id);
        });
    });

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        startMenu.classList.toggle('hidden-view');
        if (trayMenu) trayMenu.classList.add('hidden-view');
    });

    if (systemTray && trayMenu) {
        systemTray.addEventListener('click', (e) => {
            e.stopPropagation();
            trayMenu.classList.toggle('hidden-view');
            if (startMenu) startMenu.classList.add('hidden-view');

            // Update tray info dynamically
            const trayUser = document.getElementById('tray-user-name');
            if (trayUser) {
                const avatarHtml = systemState.savedAvatar
                    ? `<img src="${systemState.savedAvatar}" style="width:20px; height:20px; border-radius:50%; display:block; flex-shrink:0;" alt="">`
                    : getIcon('user');
                trayUser.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;">${avatarHtml} User: ${systemState.currentUser}</span>`;
            }

            const trayDate = document.getElementById('tray-date-text');
            if (trayDate) {
                const now = new Date();
                trayDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (startMenu && !startMenu.classList.contains('hidden-view')) {
            startMenu.classList.add('hidden-view');
        }
        if (trayMenu && !trayMenu.classList.contains('hidden-view') && !trayMenu.contains(e.target)) {
            trayMenu.classList.add('hidden-view');
        }
    });

    // Tray Menu Actions
    const trayCourgette = document.getElementById('tray-action-courgette');
    if (trayCourgette) {
        trayCourgette.addEventListener('click', () => launchApplication('start-link-courgette'));
    }

    const traySignout = document.getElementById('tray-action-signout');
    if (traySignout) {
        traySignout.addEventListener('click', async () => {
            if (trayMenu) trayMenu.classList.add('hidden-view');
            const desktopCanvas = document.getElementById('desktop-canvas');
            const taskbar = document.getElementById('system-taskbar');
            
            if (desktopCanvas) desktopCanvas.style.opacity = '0';
            if (taskbar) taskbar.style.opacity = '0';

            setTimeout(async () => {
                if (desktopCanvas) desktopCanvas.style.display = 'none';
                if (taskbar) taskbar.style.display = 'none';

                try {
                    const module = await import('./logon/logon.js');
                    module.showLogonScreen((username, avatarPath) => {
                        systemState.currentUser = username;
                        systemState.savedUsername = username;
                        systemState.savedAvatar = avatarPath;
                        saveFileSystem();
                        if (desktopCanvas) {
                            desktopCanvas.style.display = 'block';
                            requestAnimationFrame(() => { desktopCanvas.style.opacity = '1'; });
                        }
                        if (taskbar) {
                            taskbar.style.display = 'flex';
                            requestAnimationFrame(() => { taskbar.style.opacity = '1'; });
                        }
                        const avatarHtml = avatarPath
                            ? `<img src="${avatarPath}" style="width:16px; height:16px; border-radius:50%; display:block;" alt="">`
                            : getIcon('user');
                        if (userTagEl) userTagEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${avatarHtml} ${username}</span>`;
                        logKernel(`Session: User '${username}' signed in.`);
                    }, systemState.savedUsername || 'guest', systemState.savedAvatar);
                } catch (err) {
                    logKernel(`Logon Error: (${err.message})`, "ERROR");
                    if (desktopCanvas) { desktopCanvas.style.display = 'block'; desktopCanvas.style.opacity = '1'; }
                    if (taskbar) { taskbar.style.display = 'flex'; taskbar.style.opacity = '1'; }
                }
            }, 400);
        });
    }
}

// ==========================================================================
// GLOBAL DESKTOP SHORTCUTS
// ==========================================================================
function isDesktopSessionActive() {
    return !document.getElementById('boot-screen')
        && !document.getElementById('zeb-loading-screen')
        && !document.getElementById('logon-screen')
        && !document.getElementById('recovery-screen');
}

function isTypingContext() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function setupGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'r') {
            if (!isDesktopSessionActive() || isTypingContext() || document.querySelector('.os-modal-overlay')) return;
            e.preventDefault();
            launchApplication('start-link-run');
        }
    });
}

// ==========================================================================
// KERNEL INITIALIZATION LAUNCHPOINT
// ==========================================================================
loadFileSystem();
initializeBootSequence();
startSystemClock();
setupStartMenuController();
setupGlobalShortcuts();
renderDesktopIcons();

initContextMenuSystem({
    getCurrentViewMode: () => currentDesktopViewMode,
    getAutoArrange: () => !!systemState.autoArrange,
    getSortBy: () => systemState.desktopSortBy || 'type',
    onOpenApp: (appId) => launchApplication(appId),
    onOpenPersonalize: () => launchApplication('start-link-personalize'),
    onDeleteAppShortcut: (el) => {
        if (!el) return;
        const vfsName = el.dataset.vfsName;
        const label = el.querySelector('.desktop-icon-label, .desktop-shortcut-label')?.textContent.trim() || el.id;
        const targetName = vfsName || label;
        const isZdl = targetName.endsWith('.zdl');
        const isVfs = !!vfsName;
        const itemType = el.dataset.itemType;

        const title = isZdl ? "Confirm System Library Delete" : (isVfs ? (itemType === 'dir' ? "Confirm Folder Delete" : "Confirm File Delete") : "Confirm Shortcut Delete");
        const message = isZdl
            ? `Are you sure you want to delete '${targetName}'?\n\nWARNING: .zdl files are vital ZebOS System Dynamic Libraries. Deleting system libraries may corrupt system operation!`
            : `Are you sure you want to delete '${targetName}'?`;

        showOsConfirm(title, message, isZdl, () => {
            const desktopContext = getVfsNodeByPath("Users/Guest/Desktop");
            let deletedFromVfs = false;

            if (targetName && desktopContext && desktopContext[targetName]) {
                delete desktopContext[targetName];
                deletedFromVfs = true;
            }
            if (targetName && systemState.fileSystem[targetName]) {
                delete systemState.fileSystem[targetName];
                deletedFromVfs = true;
            }

            if (deletedFromVfs) {
                saveFileSystem();
                logKernel(`Desktop: Deleted VFS item '${targetName}' from disk storage.`);
            } else {
                const index = DESKTOP_SHORTCUTS.findIndex(s => s.label === label || s.vfsName === targetName || s.id === el.dataset.appId);
                if (index !== -1) {
                    DESKTOP_SHORTCUTS.splice(index, 1);
                }
                logKernel(`Desktop: Removed shortcut '${label}'.`);
            }
            renderDesktopIcons();
            refreshOpenExplorer();
            playSystemSound('close');
        });
    },
    onRenameAppShortcut: (el) => {
        const label = el.querySelector('.desktop-icon-label, .desktop-shortcut-label');
        const currentName = label ? label.textContent.trim() : "Shortcut";
        const vfsName = el.dataset.vfsName;
        showOsPrompt("Rename Item", "Enter new name:", currentName, (newName) => {
            if (!newName || newName === currentName) return;
            const desktopContext = getVfsNodeByPath("Users/Guest/Desktop");
            if (vfsName && desktopContext && desktopContext[vfsName]) {
                desktopContext[newName] = desktopContext[vfsName];
                delete desktopContext[vfsName];
                saveFileSystem();
            } else if (vfsName && systemState.fileSystem[vfsName]) {
                systemState.fileSystem[newName] = systemState.fileSystem[vfsName];
                delete systemState.fileSystem[vfsName];
                saveFileSystem();
            }
            if (label) label.textContent = newName;
            renderDesktopIcons();
            refreshOpenExplorer();
        });
    },
    onRestoreWindow: (winId) => {
        const win = document.getElementById(`win-${winId}`);
        if (win) { win.classList.remove('hidden-view'); bringToFront(win); }
    },
    onMinimizeWindow: (winId) => {
        const win = document.getElementById(`win-${winId}`);
        if (win) win.classList.add('hidden-view');
    },
    onMaximizeWindow: (winId) => {
        const win = document.getElementById(`win-${winId}`);
        if (win) toggleMaximize(win);
    },
    onCloseWindow: (winId) => closeWindow(winId),
    onOpenExplorerItem: (itemName, itemType, itemElement = null) => {
        let dirPath = null;
        if (itemElement && itemElement.closest) {
            const expContainer = itemElement.closest('[data-current-path]');
            if (expContainer && expContainer.dataset.currentPath && expContainer.dataset.currentPath !== 'HOME') {
                dirPath = expContainer.dataset.currentPath;
            }
        }
        if (itemType === 'dir') {
            const newPath = dirPath ? `${dirPath}/${itemName}` : itemName;
            launchApplication('start-link-files', newPath);
        } else {
            launchFile(itemName, dirPath);
        }
    },
    onDeleteFile: (itemName, itemElement = null) => {
        const isZdl = itemName.endsWith('.zdl');
        let context = getActiveFolderContext();
        if (itemElement && itemElement.closest) {
            const expContainer = itemElement.closest('[data-current-path]');
            if (expContainer && expContainer.dataset.currentPath && expContainer.dataset.currentPath !== 'HOME') {
                context = getVfsNodeByPath(expContainer.dataset.currentPath);
            }
        }
        const item = context ? context[itemName] : null;
        const isDir = item?.type === 'dir';

        const title = isZdl ? "Confirm System Library Delete" : (isDir ? "Confirm Folder Delete" : "Confirm File Delete");
        const message = isZdl
            ? `Are you sure you want to delete '${itemName}'?\n\nWARNING: .zdl files are vital ZebOS System Dynamic Libraries. Deleting system libraries may corrupt system operation!`
            : `Are you sure you want to delete '${itemName}'?`;

        showOsConfirm(title, message, isZdl, () => {
            if (context && context[itemName]) {
                delete context[itemName];
                saveFileSystem();
                refreshOpenExplorer();
                renderDesktopIcons();
                playSystemSound('close');
                logKernel(`VFS: Deleted '${itemName}' from storage.`);
            }
        });
    },
    onRenameFile: (itemName, itemElement = null) => {
        showOsPrompt("Rename File", "Enter new filename:", itemName, (newName) => {
            if (newName && newName !== itemName) {
                let context = getActiveFolderContext();
                if (itemElement && itemElement.closest) {
                    const expContainer = itemElement.closest('[data-current-path]');
                    if (expContainer && expContainer.dataset.currentPath && expContainer.dataset.currentPath !== 'HOME') {
                        context = getVfsNodeByPath(expContainer.dataset.currentPath);
                    }
                }
                if (context && context[itemName]) {
                    context[newName] = context[itemName];
                    delete context[itemName];
                    saveFileSystem();
                    refreshOpenExplorer();
                    renderDesktopIcons();
                }
            }
        });
    },
    onRefreshExplorer: () => {
        refreshOpenExplorer();
        logKernel("Explorer view refreshed.");
    },
    onCreateNewFolder: () => {
        showOsPrompt("New Folder", "Type a name for the new folder:", "New Folder", (folderName) => {
            const context = getActiveFolderContext();
            context[folderName] = { type: "dir", content: {} };
            
            if (systemState.currentDirectory === "") {
                if (!DESKTOP_SHORTCUTS.some(s => s.label === folderName)) {
                    DESKTOP_SHORTCUTS.push({
                        id: 'start-link-files',
                        icon: 'folder',
                        label: folderName,
                        isCustomVfs: true,
                        vfsName: folderName,
                        itemType: 'dir'
                    });
                }
            }

            saveFileSystem();
            refreshOpenExplorer();
            renderDesktopIcons();
            logKernel(`VFS: Created new folder '${folderName}'`);
        });
    },
    onCreateNewFile: (typeLabel, ext) => {
        const defaultFileName = `New ${typeLabel}.${ext}`;
        showOsPrompt(`New ${typeLabel}`, `Type a name for the new ${typeLabel.toLowerCase()}:`, defaultFileName, (fileName) => {
            const context = getActiveFolderContext();
            context[fileName] = { type: "file", content: ext === 'png' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : '' };
            
            if (systemState.currentDirectory === "") {
                if (!DESKTOP_SHORTCUTS.some(s => s.label === fileName)) {
                    DESKTOP_SHORTCUTS.push({
                        id: ext === 'png' ? 'start-link-paint' : 'start-link-text-editor',
                        icon: ext === 'png' ? 'paint' : 'editor',
                        label: fileName,
                        isCustomVfs: true,
                        vfsName: fileName,
                        itemType: 'file'
                    });
                }
            }

            saveFileSystem();
            refreshOpenExplorer();
            renderDesktopIcons();
            logKernel(`VFS: Created new file '${fileName}'`);
            if (ext === 'png') {
                launchApplication('start-link-paint');
            } else {
                launchApplication('start-link-text-editor', fileName);
            }
        });
    },
    onCreateNewShortcut: () => {
        showOsPrompt("New Shortcut", "Enter target application or item name:", "Paint Studio", (shortcutName) => {
            DESKTOP_SHORTCUTS.push({ id: 'start-link-paint', icon: 'paint', label: shortcutName });
            renderDesktopIcons();
            logKernel(`Desktop: Added new shortcut '${shortcutName}'`);
        });
    },
    onRefreshDesktop: () => {
        const zone = document.getElementById('desktop-icons-zone');
        if (zone) {
            zone.style.opacity = '0.5';
            setTimeout(() => {
                zone.style.opacity = '1';
                renderDesktopIcons();
            }, 100);
        }
        logKernel("Desktop refreshed.");
    },
    onChangeDesktopView: (mode) => {
        currentDesktopViewMode = mode;
        renderDesktopIcons();
    },
    onArrangeIcons: (sortBy) => {
        if (sortBy === 'auto') {
            systemState.autoArrange = !systemState.autoArrange;
        } else {
            systemState.desktopSortBy = sortBy;
        }
        renderDesktopIcons();
    },
    onCascadeWindows: () => {
        const wins = document.querySelectorAll('.window-frame:not(.hidden-view)');
        wins.forEach((win, idx) => {
            win.style.left = `${40 + (idx * 30)}px`;
            win.style.top = `${40 + (idx * 30)}px`;
        });
    },
    onShowDesktop: () => {
        const wins = document.querySelectorAll('.window-frame');
        wins.forEach(win => win.classList.add('hidden-view'));
    },
    onApplyTaskbarProps: ({ pos, size, autoHide, alwaysTop, showClock }) => {
        applyTaskbarProperties({ pos, size, autoHide, alwaysTop, showClock });
    }
});

const buildHashTag = document.getElementById('build-git-hash');
if (buildHashTag) buildHashTag.textContent = `git-${BUILD_GIT_HASH}`;

setInterval(() => { systemState.uptime++; }, 1000);
