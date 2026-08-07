// State tracking & Advanced VFS Storage Device Module (ZebOS 2 Architecture)
let systemState = { 
    version: "1.6.3", 
    currentUser: "guest", 
    uptime: 0,
    activeApp: null,
    currentDirectory: "", 
    fileSystem: {
        "readme.txt": { type: "file", content: "Welcome to ZebOS 2! Graphical desktop setup is now in progress." },
        "test.txt": { type: "file", content: "Hello World line buffer data output test script." },
        "documents": { type: "dir", content: {} } 
    }
};

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
// KERNEL INITIALIZATION LAUNCHPOINT
// ==========================================================================
initializeBootSequence();
startSystemClock();

// Master internal uptime counters tracker
setInterval(() => { 
    systemState.uptime++; 
}, 1000);
