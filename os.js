// State tracking & Advanced VFS Storage Device Module (ZebOS 2 Release Candidate v1.7.0)
let systemState = { 
    version: "1.7.0-RC1", 
    currentUser: "guest", 
    uptime: 0,
    activeApp: null,
    currentDirectory: "", // "" means root directory. Matches folder name if nested (e.g., "documents")
    fileSystem: {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 1.7.0! Resizable floating window matrices are now active." },
        "test.txt": { type: "file", content: "Hello World lines data tracking matrix storage block." },
        "documents": { type: "dir", content: {
            "notes.txt": { type: "file", content: "Inside folders text reference mapping loop array data payload." }
        } } 
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
// BOOT SCREEN HANDOFF CONTROLLER
// ==========================================================================
function initializeBootSequence() {
    console.log("SYSTEM START: Initializing Zeb Kernel v1.7.0...");
    setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            bootScreen.style.opacity = "0"; 
            setTimeout(() => {
                bootScreen.remove();
                console.log("BOOT COMPLETE: Graphical Desktop Env Core loaded successfully.");
            }, 800); 
        }
    }, 4000);
}

// ==========================================================================
// PHASE 2: RESIZABLE & MAXIMIZABLE WINDOW MANAGER CORE ENGINE
// ==========================================================================
export function createWindow(title, icon, uniqueId) {
    const workspace = document.getElementById('window-workspace');
    const tabsZone = document.getElementById('taskbar-tabs-zone');
    
    // If window is currently open but minimized/hidden, restore it instantly
    const existingWin = document.getElementById(`win-${uniqueId}`);
    if (existingWin) {
        if (existingWin.classList.contains('hidden-view')) {
            existingWin.classList.remove('hidden-view');
            document.getElementById(`tab-${uniqueId}`).classList.add('active-tab');
        }
        bringToFront(existingWin);
        return null;
    }

    // 1. Build Window Shell Layout Nodes
    const win = document.createElement('div');
    win.className = 'window-frame active-window';
    win.id = `win-${uniqueId}`;
    win.style.zIndex = ++topZIndex;

    const currentWindows = document.querySelectorAll('.window-frame').length;
    win.style.top = `${60 + (currentWindows * 25)}px`;
    win.style.left = `${60 + (currentWindows * 25)}px`;

    win.innerHTML = `
        <!-- CHANGE id="window-header" TO class="window-header" BELOW: -->
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

    // 2. Generate Taskbar Tab Button Link Component 
    const tab = document.createElement('div');
    tab.className = 'taskbar-tab active-tab';
    tab.id = `tab-${uniqueId}`;
    tab.innerHTML = `<span>${icon}</span> ${title}`;
    tabsZone.appendChild(tab);

    // Tab Click Logic: Toggles Minimize/Restore visibility focus on toggle
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

    // Minimize Button Handler
    document.getElementById(`win-min-${uniqueId}`).addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('hidden-view');
        tab.classList.remove('active-tab');
    });

                // Maximize Button Handler
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

            // Close Button Action: Purges layout nodes completely from frame sets
            document.getElementById(`win-close-${uniqueId}`).addEventListener('click', (e) => {
                e.stopPropagation();
                win.remove();
                tab.remove();
            });

            // Inject Drag and Drag-Sizing Event Subsystem Hooks
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

        // ==========================================================================
        // WINDOW MANAGER UTILITY HANDLERS (DRAG & RESIZE SUB-ENGINES)
        // ==========================================================================
        function setupWindowDrag(win) {
            const header = win.querySelector('.window-header');
            let isDragging = false; 
            let offsetX = 0; 
            let offsetY = 0;

            header.addEventListener('mousedown', (e) => {
                // Ignore drag if clicking header buttons or if maximized
                if (e.target.classList.contains('win-btn') || win.classList.contains('window-maximized')) return;
                
                isDragging = true;
                offsetX = e.clientX - win.offsetLeft; 
                offsetY = e.clientY - win.offsetTop;
                bringToFront(win);
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                let nextX = e.clientX - offsetX;
                let nextY = e.clientY - offsetY;

                // Keep header bar from being dragged above top of screen
                if (nextY < 0) nextY = 0; 
                
                win.style.left = `${nextX}px`; 
                win.style.top = `${nextY}px`;
            });

            document.addEventListener('mouseup', () => { 
                isDragging = false; 
            });
        }

        function setupWindowResize(win) {
            const handle = win.querySelector('.window-resize-handle');
            let isResizing = false; 
            let startWidth, startHeight, startX, startY;

            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation(); 
                e.preventDefault();
                if (win.classList.contains('window-maximized')) return;
                
                isResizing = true;
                startWidth = parseInt(document.defaultView.getComputedStyle(win).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(win).height, 10);
                startX = e.clientX; 
                startY = e.clientY;
                bringToFront(win);
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const newWidth = startWidth + (e.clientX - startX);
                const newHeight = startHeight + (e.clientY - startY);
                
                // Enforce safe structural size floors
                if (newWidth > 200) win.style.width = `${newWidth}px`;
                if (newHeight > 120) win.style.height = `${newHeight}px`;
            });

            document.addEventListener('mouseup', () => { 
                isResizing = false; 
            });
        }

        // ==========================================================================
        // CENTRAL APPLICATION ROUTER SYSTEM
        // ==========================================================================
        async function launchApplication(appId) {
            const currentContext = getActiveFolderContext();

            switch (appId) {
                case 'start-link-files':
                    const explorerBody = createWindow("Zeb Explorer", "📁", "explorer-root");
                    if (explorerBody) {
                        renderZebExplorer(explorerBody);
                    }
                    break;

                case 'start-link-text-editor':
                    const targetEditFile = "untitled.txt";
                    try {
                        const module = await import('./programs/editor.js');
                        const existingContent = currentContext[targetEditFile] ? currentContext[targetEditFile].content : "";
                        const appBodyElement = createWindow(`Text Editor - ${targetEditFile}`, "📝", `edit-${targetEditFile}`);
                        
                        if (appBodyElement) {
                            const editorInstance = new module.TextEditor(
                                targetEditFile,
                                existingContent,
                                (savedName, savedData) => {
                                    if (savedName) {
                                        const saveContext = getActiveFolderContext();
                                        saveContext[savedName] = { type: "file", content: savedData };
                                        const activeExp = document.querySelector('.explorer-grid');
                                        if (activeExp) renderZebExplorer(activeExp.parentElement);
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
                    const fallbackTitles = {
                        'start-link-prompt': { name: "Zeb Terminal", icon: "🐚" },
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
                    launchApplication('start-link-text-editor');
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
            refreshExplorerGrid();
        }
    });

    refreshExplorerGrid();
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
// KERNEL INITIALIZATION LAUNCHPOINT (calling functions)
// ==========================================================================
initializeBootSequence();
startSystemClock();
setupStartMenuController();

setInterval(() => { systemState.uptime++; }, 1000);
