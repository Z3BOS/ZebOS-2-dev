// State tracking & Advanced VFS Storage Device Module (ZebOS 2 Architecture)
let systemState = { 
    version: "1.6.5", 
    currentUser: "guest", 
    uptime: 0,
    activeApp: null,
    currentDirectory: "", // "" means root directory. Matches folder name if nested (e.g., "documents")
    fileSystem: {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 2! Graphical desktop setup is now in progress." },
        "test.txt": { type: "file", content: "Hello World line buffer data output test script." },
        "documents": { type: "dir", content: {} } // Sub-directory container
    }
};

let topZIndex = 100; // Track screen depth layers globally across desktop workspace

// ==========================================================================
// FILE SYSTEM ROUTINES
// ==========================================================================
function getActiveFolderContext() {
    if (systemState.currentDirectory === "") {
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

        // Convert 24h format to 12h retro taskbar presentation standard
        hours = hours % 12;
        hours = hours ? hours : 12; // The hour '0' should be '12'

        if (clockElement) {
            clockElement.textContent = `${hours}:${minutes} ${ampm}`;
        }
    }

    // Fire clock immediately on load and set recursive loop tick every 1000ms
    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================================================
// BOOT SCREEN HANDOFF CONTROLLER
// ==========================================================================
function initializeBootSequence() {
    console.log("SYSTEM START: Initializing Zeb Kernel v2.0...");
    console.log(`ZebOS Version ${systemState.version} mapping complete.`);

    // Keep splash graphic active for 4 seconds so viewers can admire the sky artwork
    setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            // Apply the transition styling class to slide opacity down smoothly
            bootScreen.style.opacity = "0"; 

            // Purge the element completely from the active browser DOM tree after fade finish
            setTimeout(() => {
                bootScreen.remove();
                console.log("BOOT HANDOFF COMPLETE: Core Graphical Workspace Revealed.");
            }, 800); 
        }
    }, 4000);
}

// ==========================================================================
// PHASE 2: GRAPHICAL WINDOW MANAGER CORE ENGINE
// ==========================================================================
export function createWindow(title, icon, uniqueId) {
    const workspace = document.getElementById('window-workspace');
    
    // Prevent duplicate windows spawning with the same application identifier handle
    if (document.getElementById(`win-${uniqueId}`)) {
        bringToFront(document.getElementById(`win-${uniqueId}`));
        return null;
    }

    // 1. Build Window Shell Layout Nodes
    const win = document.createElement('div');
    win.className = 'window-frame active-window';
    win.id = `win-${uniqueId}`;
    win.style.zIndex = ++topZIndex;

    // Center layout variations so staggered icons spawn cascading frames
    const currentWindows = document.querySelectorAll('.window-frame').length;
    win.style.top = `${60 + (currentWindows * 25)}px`;
    win.style.left = `${60 + (currentWindows * 25)}px`;

    win.innerHTML = `
        <div id="window-header">
            <div id="window-title"><span>${icon}</span> ${title}</div>
            <div id="window-controls">
                <button class="win-btn" id="win-min-${uniqueId}">_</button>
                <button class="win-btn" id="win-max-${uniqueId}">⤏</button>
                <button class="win-btn" id="win-close-${uniqueId}">X</button>
            </div>
        </div>
        <div class="window-body" id="body-${uniqueId}"></div>
    `;

    workspace.appendChild(win);

    // 2. Setup Click Focus Layer Stacking Listener
    win.addEventListener('mousedown', () => bringToFront(win));

    // 3. Connect Close Button Unmount Action
    document.getElementById(`win-close-${uniqueId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        win.remove();
    });

    // 4. Inject Drag Mechanics Intercept Loops
    setupWindowDrag(win);
    bringToFront(win);
    
    return document.getElementById(`body-${uniqueId}`);
}

function bringToFront(windowElement) {
    // Clear active headers on all other frames running across desktop canvas
    document.querySelectorAll('.window-frame').forEach(f => f.classList.remove('active-window'));
    
    // Elevate current window element block z-index depth properties
    windowElement.classList.add('active-window');
    windowElement.style.zIndex = ++topZIndex;
}

function setupWindowDrag(win) {
    const header = win.querySelector('#window-header');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('win-btn')) return;
        
        isDragging = true;
        offsetX = e.clientX - win.offsetLeft;
        offsetY = e.clientY - win.offsetTop;
        bringToFront(win);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let nextX = e.clientX - offsetX;
        let nextY = e.clientY - offsetY;

        // Boundary constraint check layers keeps header strip reachable
        if (nextY < 0) nextY = 0;
        
        win.style.left = `${nextX}px`;
        win.style.top = `${nextY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// ==========================================================================
// CENTRAL APPLICATION ROUTER SYSTEM
// ==========================================================================
async function launchApplication(appId) {
    const currentContext = getActiveFolderContext();

    switch (appId) {
        case 'start-link-text-editor':
            const targetEditFile = "untitled.txt";
            try {
                const module = await import('./programs/editor.js');
                const existingContent = currentContext[targetEditFile] ? currentContext[targetEditFile].content : "";
                
                // Trigger Window Manager template instance
                const appBodyElement = createWindow(`Text Editor - ${targetEditFile}`, "📝", `edit-${targetEditFile}`);
                
                if (appBodyElement) {
                    const editorInstance = new module.TextEditor(
                        targetEditFile,
                        existingContent,
                        (savedName, savedData) => {
                            if (savedName) {
                                const saveContext = getActiveFolderContext();
                                saveContext[savedName] = { type: "file", content: savedData };
                            }
                        }
                    );
                    editorInstance.open(appBodyElement);
                }
            } catch (err) {
                console.error("Kernel Error: Failed to mount editor.js", err);
            }
            break;

        case 'start-link-shutdown':
            alert("ZebOS Shutdown Sequence Initiated.");
            break;

        default:
            // Fallback framework for program shells currently under development
            const fallbackTitles = {
                'start-link-prompt': { name: "Zeb Terminal", icon: "🐚" },
                'start-link-files': { name: "Zeb Explorer", icon: "📁" },
                'start-link-paint': { name: "Paint", icon: "🎨" },
                'start-link-mines': { name: "Minesweeper", icon: "💣" },
                'start-link-snake': { name: "Snake", icon: "🐍" },
                'start-link-calc': { name: "Calc", icon: "🧮" },
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
// START MENU INTERACTIVITY CONTROLLER
// ==========================================================================
function setupStartMenuController() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    // Click handler to toggle the start menu visibility layer
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        startMenu.classList.toggle('hidden-view');
    });

    // Automatically hide the start menu tray if a user clicks anywhere else on the desktop
    document.addEventListener('click', (e) => {
        if (!startMenu.classList.contains('hidden-view')) {
            startMenu.classList.add('hidden-view');
        }
    });

    // Hook up individual menu choices to fire our Application Launcher pipeline
    const menuItems = document.querySelectorAll('.start-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            console.log(`Launcher Registry: Clicked system shortcut target '${item.id}'.`);
            launchApplication(item.id);
        });
    });
}

// ==========================================================================
// KERNEL INITIALIZATION LAUNCHPOINT (call our functions)
// ==========================================================================
initializeBootSequence();
startSystemClock();
setupStartMenuController();

// Master internal uptime counters tracker
setInterval(() => { 
    systemState.uptime++; 
}, 1000);
