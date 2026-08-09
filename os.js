// State tracking & Persistent VFS Storage Module (ZebOS 2 Alpha v1.8.0 Core)
let systemState = { 
    version: "1.8.0", 
    currentUser: "guest", 
    uptime: 0,
    activeApp: null,
    currentDirectory: "", // "" means root directory. Matches folder name if nested (e.g., "documents")
    fileSystem: {} // Initialized dynamically below from local disk image
};

let topZIndex = 100; // Track screen depth layers globally across desktop workspace

// No build pipeline generates this — it's the short commit hash as of the
// last time this file was edited, updated by hand alongside the version bump.
const BUILD_GIT_HASH = "29b3e97";

let devModeEnabled = false;
let devConsoleEl = null; // set once Dev Mode is entered; logKernel mirrors into it when present

// ==========================================================================
// KERNEL LOGGING SUBSYSTEM
// Every system message flows through here so console output stays levelled
// and timestamped, and so the on-screen boot log (and, in Dev Mode, the
// persistent floating console) can mirror the same lines.
// ==========================================================================
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

// ==========================================================================
// DEV MODE (ChromeOS-style) — hold Ctrl+Alt during boot to enter.
// Skips the rest of the boot animation and leaves a live log console
// floating on screen for the rest of the session.
// ==========================================================================
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
    const diskImage = localStorage.getItem('ZEBOS_V2_DISK');

    if (diskImage) {
        try {
            systemState.fileSystem = JSON.parse(diskImage);
            logKernel("Storage System: Restored persistent file allocations from disk image sector.");
        } catch (err) {
            logKernel(`Storage System Error: Hard drive image corrupted. Resetting data cells. (${err.message})`, "ERROR");
            provisionDefaultRootFS();
        }
    } else {
        logKernel("Storage System: Initializing new root filesystem partition.");
        provisionDefaultRootFS();
    }
}

export function saveFileSystem() {
    try {
        const serializedFS = JSON.stringify(systemState.fileSystem);
        localStorage.setItem('ZEBOS_V2_DISK', serializedFS);
        logKernel("Storage System: Changes committed to local storage sectors successfully.");
    } catch (err) {
        logKernel(`Storage System Error: Write operation failed to commit. (${err.message})`, "ERROR");
    }
}

function provisionDefaultRootFS() {
    systemState.fileSystem = {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 1.8.0! Persistent storage disk saving is now active." },
        "test.txt": { type: "file", content: "Hello World lines data tracking matrix storage block." },
        "documents": { type: "dir", content: {
            "notes.txt": { type: "file", content: "Inside folders text reference mapping loop array data payload." }
        } } 
    };
    saveFileSystem(); 
}

// ==========================================================================
// FILE SYSTEM WORKSPACE MANAGER ROUTINES
// ==========================================================================
function getActiveFolderContext() {
    if (systemState.currentDirectory === "") {
        return systemState.fileSystem; 
    }
    if (!systemState.fileSystem[systemState.currentDirectory]) {
        systemState.currentDirectory = "";
        return systemState.fileSystem;
    }
    return systemState.fileSystem[systemState.currentDirectory].content; 
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
            clockElement.textContent = `${hours}:${minutes} ${ampm}`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================================================
// STARTUP CHIME (SYNTHESIZED — NO AUDIO ASSET REQUIRED)
// A short major arpeggio played via Web Audio API oscillators, timed to
// the splash art reveal. Browsers may block audio without a prior user
// gesture on the page — that failure is expected and non-fatal.
// ==========================================================================
function playStartupChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [
            { freq: 523.25, start: 0.00, dur: 0.24 },  // C5
            { freq: 659.25, start: 0.16, dur: 0.24 },  // E5
            { freq: 783.99, start: 0.32, dur: 0.24 },  // G5
            { freq: 1046.50, start: 0.48, dur: 0.60 }  // C6 (held)
        ];
        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.0001, now + note.start);
            gain.gain.linearRampToValueAtTime(0.18, now + note.start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + note.start);
            osc.stop(now + note.start + note.dur + 0.05);
        });
        setTimeout(() => ctx.close(), 1500);
        logKernel("Audio: Startup chime scheduled.");
    } catch (err) {
        logKernel(`Audio: Startup chime unavailable (${err.message})`, "WARN");
    }
}

// ==========================================================================
// BOOT SCREEN HANDOFF CONTROLLER
// Real kernel log lines — the same files the browser is actually loading —
// print to the screen one at a time first, then the splash art and
// progress bar fade in to take over, with the startup chime on the beat.
// ==========================================================================
const BOOT_LOG_SEQUENCE = [
    "Loading style.css...",
    "Loading os.js...",
    "Loading assets/system/splashboot.png...",
    "Loading programs/editor.js...",
    "Loading programs/calc.js...",
    "Loading programs/snake.js...",
    "Loading courgette/courgette.js...",
    "Mounting ZEBOS_V2_DISK from localStorage...",
    "Starting system clock daemon...",
    "Registering desktop shortcuts...",
    "Kernel handoff to Graphical Desktop Environment..."
];

function initializeBootSequence() {
    logKernel("SYSTEM START: Initializing Zeb Kernel v1.8.0...");
    const bootScreen = document.getElementById('boot-screen');
    const logConsole = document.getElementById('boot-log-console');

    let finished = false;
    function finishBoot() {
        if (finished) return;
        finished = true;
        window.removeEventListener('keydown', devModeKeyHandler);
        if (bootScreen) {
            bootScreen.style.opacity = "0";
            setTimeout(() => {
                bootScreen.remove();
                logKernel("BOOT COMPLETE: Graphical Desktop Env Core loaded successfully.");
                showSignInScreen();
            }, 800);
        }
    }

    // ChromeOS-style dev mode entry: holding Ctrl+Alt during boot skips
    // straight to the desktop and leaves a live log console on screen.
    function devModeKeyHandler(e) {
        if (e.ctrlKey && e.altKey && !devModeEnabled) {
            enterDevMode();
            finishBoot();
        }
    }
    window.addEventListener('keydown', devModeKeyHandler);

    let lineIndex = 0;
    function printNextBootLine() {
        if (finished) return;
        if (lineIndex < BOOT_LOG_SEQUENCE.length) {
            const message = BOOT_LOG_SEQUENCE[lineIndex];
            logKernel(message);
            if (logConsole) {
                const lineEl = document.createElement('div');
                lineEl.className = 'boot-log-line';
                lineEl.textContent = `> ${message}`;
                logConsole.appendChild(lineEl);
                logConsole.scrollTop = logConsole.scrollHeight;
            }
            lineIndex++;
            setTimeout(printNextBootLine, 180);
        } else {
            setTimeout(() => {
                if (finished) return;
                if (bootScreen) bootScreen.classList.add('splash-active');
                logKernel("BOOT: Kernel log complete, splash handoff engaged.");
                playStartupChime();
            }, 300);
        }
    }
    printNextBootLine();

    setTimeout(finishBoot, 4000);
}

// ==========================================================================
// SIGN-IN SCREEN
// Shown once, right after the boot screen clears. Any username is
// accepted — this is a local single-user guest session, not real auth.
// ==========================================================================
function showSignInScreen() {
    const screen = document.getElementById('signin-screen');
    const userInput = document.getElementById('signin-username');
    const passInput = document.getElementById('signin-password');
    const btn = document.getElementById('signin-btn');
    const userTag = document.getElementById('current-user-tag');
    if (!screen || !userInput || !btn) return;

    screen.classList.remove('hidden-view');
    userInput.focus();
    userInput.select();

    function completeSignIn() {
        const username = userInput.value.trim() || 'guest';
        systemState.currentUser = username;
        if (userTag) userTag.textContent = `👤 ${username}`;
        logKernel(`Session: User '${username}' signed in.`);

        screen.style.opacity = "0";
        setTimeout(() => screen.classList.add('hidden-view'), 400);
    }

    btn.addEventListener('click', completeSignIn);
    [userInput, passInput].forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') completeSignIn();
        });
    });
}

// ==========================================================================
// PHASE 2: RESIZABLE & MAXIMIZABLE WINDOW MANAGER CORE ENGINE
// ==========================================================================
// Apps that attach global listeners/intervals (calc, snake, courgette, the
// editor) register a teardown function here. closeWindow() is the single
// path for closing a window — whether the user hits the X button or the
// app closes itself (Esc, File > Exit) — so cleanup always runs exactly
// once and the taskbar tab never gets orphaned.
const windowCleanupHandlers = new Map();

export function registerWindowCleanup(uniqueId, cleanupFn) {
    windowCleanupHandlers.set(uniqueId, cleanupFn);
}

export function closeWindow(uniqueId) {
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

export function createWindow(title, icon, uniqueId) {
    const workspace = document.getElementById('window-workspace');
    const tabsZone = document.getElementById('taskbar-tabs-zone');
    
    const existingWin = document.getElementById(`win-${uniqueId}`);
    if (existingWin) {
        if (existingWin.classList.contains('hidden-view')) {
            existingWin.classList.remove('hidden-view');
            document.getElementById(`tab-${uniqueId}`).classList.add('active-tab');
        }
        bringToFront(existingWin);
        return null;
    }

    const win = document.createElement('div');
    win.className = 'window-frame active-window';
    win.id = `win-${uniqueId}`;
    win.style.zIndex = ++topZIndex;

    const currentWindows = document.querySelectorAll('.window-frame').length;
    win.style.top = `${60 + (currentWindows * 25)}px`;
    win.style.left = `${60 + (currentWindows * 25)}px`;

    win.innerHTML = `
        <div class="window-header" style="cursor: move;">
            <div class="window-title"><span>${icon}</span> ${title}</div>
            <div class="window-controls">
                <button class="win-btn" id="win-min-${uniqueId}">_</button>
                <button class="win-btn" id="win-max-${uniqueId}">⤏</button>
                <button class="win-btn" id="win-close-${uniqueId}">X</button>
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
    tab.innerHTML = `<span>${icon}</span> ${title}`;
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
// Every dynamic module fetch flows through here so the log shows exactly
// which real file is being pulled in, not just a generic status message.
async function loadModule(path) {
    logKernel(`Loading ${path}...`);
    const module = await import(path);
    logKernel(`Loaded ${path}`);
    return module;
}

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

// Overwrite this specific switch block section inside your launchApplication(appId) in os.js:
// We add an optional second parameter to dynamically handle targeted file names
async function launchApplication(appId, customFileName = null) {
    logKernel(`Launching application: ${appId}`);
    const currentContext = getActiveFolderContext();

    switch (appId) {
        case 'start-link-files':
            const explorerBody = createWindow("Zeb Explorer", "📁", "explorer-root");
            if (explorerBody) {
                renderZebExplorer(explorerBody);
            }
            break;

        case 'start-link-prompt': {
            const winId = 'app-terminal';
            try {
                const module = await loadModule('./programs/terminal.js');
                const termBody = createWindow("Zeb Terminal", "🐚", winId);
                if (termBody) {
                    const shellApi = {
                        getContext: () => getActiveFolderContext(),
                        getPath: () => systemState.currentDirectory === "" ? "/" : `/${systemState.currentDirectory}`,
                        changeDirectory: (target) => shellChangeDirectory(target),
                        mkdir: (name) => shellMkdir(name),
                        touch: (name) => shellTouch(name),
                        remove: (name) => shellRemove(name),
                        openInEditor: (name) => launchApplication('start-link-text-editor', name),
                        getUsername: () => systemState.currentUser,
                        getVersion: () => systemState.version
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
            // FIX: If a filename is passed by Explorer, use it. Otherwise fallback to untitled.txt
            const targetEditFile = customFileName || "untitled.txt";
            try {
                const module = await loadModule('./programs/editor.js');
                
                // Read content from the context based on the correct filename variable
                const existingContent = currentContext[targetEditFile] ? currentContext[targetEditFile].content : "";
                
                // Generate a unique window ID using the file name string to avoid frame conflicts
                const cleanId = targetEditFile.replace(/[^a-zA-Z0-9]/g, '');
                const winId = `edit-${cleanId}`;
                const appBodyElement = createWindow(`Text Editor - ${targetEditFile}`, "📝", winId);

                if (appBodyElement) {
                    const editorInstance = new module.TextEditor(
                        targetEditFile,
                        existingContent,
                        (savedName, savedData) => {
                            if (savedName) {
                                const saveContext = getActiveFolderContext();
                                saveContext[savedName] = { type: "file", content: savedData };

                                // Call your localStorage persistent write system
                                saveFileSystem();

                                // Repaint open Explorer grids immediately to list the fresh document row
                                const activeExp = document.querySelector('.explorer-grid');
                                if (activeExp) renderZebExplorer(activeExp.parentElement);
                            }
                        },
                        () => closeWindow(winId)
                    );
                    registerWindowCleanup(winId, () => {
                        window.removeEventListener('keydown', editorInstance.keyHandler);
                        document.removeEventListener('click', editorInstance.documentClickHandler);
                    });
                    editorInstance.open(appBodyElement);
                }
            } catch (err) {
                logKernel(`Kernel Error: Failed to mount editor.js (${err.message})`, "ERROR");
            }
            break;

        case 'start-link-calc': {
            const winId = 'app-calc';
            try {
                const module = await loadModule('./programs/calc.js');
                const calcBody = createWindow("Calculator", "🧮", winId);
                if (calcBody) {
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
                const module = await loadModule('./programs/snake.js');
                const snakeBody = createWindow("Snake", "🐍", winId);
                if (snakeBody) {
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
                const module = await loadModule('./courgette/courgette.js');
                const cgBody = createWindow("Courgette Info", "🥒", winId);
                if (cgBody) {
                    const counts = countFilesystemEntries(systemState.fileSystem);
                    const diskBytes = new Blob([JSON.stringify(systemState.fileSystem)]).size;
                    const cgInstance = new module.CourgetteInfo(() => closeWindow(winId), {
                        version: systemState.version,
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

        case 'start-link-shutdown':
            alert("ZebOS Shutdown Sequence Initiated.");
            break;

        default:
            const fallbackTitles = {
                'start-link-paint': { name: "Paint", icon: "🎨" },
                'start-link-mines': { name: "Minesweeper", icon: "💣" },
                'start-link-media': { name: "Media Player", icon: "🎬" },
                'start-link-vm': { name: "ZebVM Manager", icon: "🎛️" }
            };

            if (fallbackTitles[appId]) {
                const app = fallbackTitles[appId];
                const placeholderBody = createWindow(app.name, app.icon, appId);
                if (placeholderBody) {
                    placeholderBody.innerHTML = `
                        <div style="padding:20px; font-size:14px; color:#000000; font-family:sans-serif;">
                            <strong>${app.name}</strong> core architecture coming soon in Phase 4!
                        </div>
                    `;
                }
            }
            break;
    }
}

// ==========================================================================
// DYNAMIC ZEB EXPLORER APP MODULE RENDERING ENGINE
// ==========================================================================
function renderZebExplorer(containerElement) {
    containerElement.innerHTML = `
        <div class="explorer-container">
            <div class="explorer-toolbar">
                <button class="explorer-btn" id="exp-btn-up">🔼 Up to Root</button>
                <button class="explorer-btn" id="exp-btn-mkdir">📁 New Folder</button>
            </div>
            <div class="explorer-grid"></div>
        </div>
    `;

    const grid = containerElement.querySelector('.explorer-grid');
    const btnUp = containerElement.querySelector('#exp-btn-up');
    const btnMkdir = containerElement.querySelector('#exp-btn-mkdir');

    btnUp.disabled = (systemState.currentDirectory === "");

    function refreshExplorerGrid() {
        grid.innerHTML = "";
        const context = getActiveFolderContext();
        
        Object.keys(context).forEach(name => {
            const item = context[name];
            const icon = item.type === "dir" ? "📁" : "📄";
            
            const itemEl = document.createElement('div');
            itemEl.className = 'explorer-item';
            itemEl.innerHTML = `
                <div class="explorer-icon">${icon}</div>
                <div class="explorer-name">${name}</div>
            `;
            
            itemEl.addEventListener('dblclick', () => {
                if (item.type === "dir") {
                    systemState.currentDirectory = name;
                    renderZebExplorer(containerElement);
                } else {
                    launchApplication('start-link-text-editor', name);
                }
            });
            grid.appendChild(itemEl);
        });
    }

    btnUp.addEventListener('click', () => {
        systemState.currentDirectory = "";
        renderZebExplorer(containerElement);
    });

    btnMkdir.addEventListener('click', () => {
        const folderName = prompt("Enter new folder name:");
        if (folderName && folderName.trim() !== "") {
            const context = getActiveFolderContext();
            context[folderName.trim()] = { type: "dir", content: {} };
            saveFileSystem(); // Save changes permanently to disk
            refreshExplorerGrid();
        }
    });

    refreshExplorerGrid();
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
    if (target === '/' || target === '~' || target === '..') {
        if (target === '..' && systemState.currentDirectory === "") {
            return { ok: false, message: "Already at root." };
        }
        systemState.currentDirectory = "";
        return { ok: true };
    }
    const context = getActiveFolderContext();
    const entry = context[target];
    if (!entry) return { ok: false, message: `cd: ${target}: No such directory` };
    if (entry.type !== 'dir') return { ok: false, message: `cd: ${target}: Not a directory` };
    if (systemState.currentDirectory !== "") return { ok: false, message: "cd: nesting more than one level deep isn't supported yet" };
    systemState.currentDirectory = target;
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
// DESKTOP SHORTCUT ICONS
// ==========================================================================
const DESKTOP_SHORTCUTS = [
    { id: 'start-link-files', icon: '📁', label: 'Zeb Explorer' },
    { id: 'start-link-text-editor', icon: '📝', label: 'Text Editor' },
    { id: 'start-link-prompt', icon: '🐚', label: 'Zeb Terminal' },
    { id: 'start-link-calc', icon: '🧮', label: 'Calculator' },
    { id: 'start-link-snake', icon: '🐍', label: 'Snake' },
    { id: 'start-link-courgette', icon: '🥒', label: 'Courgette Info' }
];

function renderDesktopIcons() {
    const zone = document.getElementById('desktop-icons-zone');
    if (!zone) return;

    DESKTOP_SHORTCUTS.forEach(shortcut => {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.innerHTML = `
            <div class="desktop-icon-glyph">${shortcut.icon}</div>
            <div class="desktop-icon-label">${shortcut.label}</div>
        `;
        iconEl.addEventListener('dblclick', () => launchApplication(shortcut.id));
        zone.appendChild(iconEl);
    });

    logKernel(`Desktop: Rendered ${DESKTOP_SHORTCUTS.length} application shortcuts.`);
}

// ==========================================================================
// START MENU INTERACTIVITY CONTROLLER
// ==========================================================================
function setupStartMenuController() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        startMenu.classList.toggle('hidden-view');
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.classList.contains('hidden-view')) {
            startMenu.classList.add('hidden-view');
        }
    });

    const menuItems = document.querySelectorAll('.start-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            launchApplication(item.id);
        });
    });
}

// ==========================================================================
// KERNEL INITIALIZATION LAUNCHPOINT
// ==========================================================================
loadFileSystem();
initializeBootSequence();
startSystemClock();
setupStartMenuController();
renderDesktopIcons();

const buildHashTag = document.getElementById('build-git-hash');
if (buildHashTag) buildHashTag.textContent = `git-${BUILD_GIT_HASH}`;

setInterval(() => { systemState.uptime++; }, 1000);
