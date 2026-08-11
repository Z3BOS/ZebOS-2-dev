// icons.js - ZebOS 2 Pro Custom Retro SVG Icon Engine
// Code-based SVG icons matching retro Windows 95 / ZebOS 2 aesthetic

const SVGS = {
    terminal: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="18" rx="1" fill="#1e1e1e" stroke="#808080" stroke-width="1.5"/>
            <rect x="3" y="4" width="18" height="3" fill="#000080"/>
            <path d="M6 10L10 13L6 16" stroke="#55ff55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="16" x2="17" y2="16" stroke="#55ff55" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    personalize: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="13" rx="1.5" fill="#c0c0c0" stroke="#444444" stroke-width="1.5"/>
            <rect x="4" y="5" width="16" height="9" fill="#008080" stroke="#000000" stroke-width="1"/>
            <path d="M8 16L7 19H17L16 16" fill="#808080" stroke="#444444" stroke-width="1.2"/>
            <rect x="5" y="19" width="14" height="2" fill="#aaaaaa" stroke="#444444" stroke-width="1"/>
            <path d="M14 8L18 4C18.5 3.5 19.5 3.5 20 4C20.5 4.5 20.5 5.5 20 6L16 10L14 8Z" fill="#ffca28" stroke="#000000" stroke-width="0.8"/>
            <circle cx="13.5" cy="10.5" r="1.5" fill="#e53935"/>
        </svg>
    `,
    explorer: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5C2 4.1 2.9 3.5 3.8 3.8L8 5H18C19.1 5 20 5.9 20 7V15C20 16.1 19.1 17 18 17H4C2.9 17 2 16.1 2 15V5Z" fill="#ffb300" stroke="#b27b00" stroke-width="1.2"/>
            <path d="M2 9C2 7.9 2.9 7 4 7H20C21.1 7 22 7.9 22 9V17C22 18.1 21.1 19 20 19H4C2.9 19 2 18.1 2 17V9Z" fill="#ffca28" stroke="#c79100" stroke-width="1.2"/>
            <rect x="7" y="10" width="10" height="7" rx="1" fill="#000080" stroke="#00ffff" stroke-width="1"/>
            <circle cx="10" cy="13.5" r="1.5" fill="#55ffff"/>
            <rect x="13" y="12.5" width="3" height="2" fill="#ffffff"/>
        </svg>
    `,
    editor: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V3Z" fill="#ffffff" stroke="#555555" stroke-width="1.5"/>
            <path d="M14 3V8H19" stroke="#555555" stroke-width="1.5" fill="#e0e0e0"/>
            <line x1="8" y1="11" x2="16" y2="11" stroke="#444444" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8" y1="14" x2="16" y2="14" stroke="#444444" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8" y1="17" x2="13" y2="17" stroke="#444444" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    paint: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.1 22 14 21.1 14 20C14 19.5 13.8 19.04 13.48 18.7C13.16 18.36 13 17.9 13 17.4C13 16.3 13.9 15.4 15 15.4H17C19.76 15.4 22 13.16 22 10.4C22 5.76 17.52 2 12 2Z" fill="#e0e0e0" stroke="#444444" stroke-width="1.5"/>
            <circle cx="6.5" cy="11.5" r="1.5" fill="#e53935"/>
            <circle cx="9.5" cy="6.5" r="1.5" fill="#1e88e5"/>
            <circle cx="14.5" cy="6.5" r="1.5" fill="#43a047"/>
            <circle cx="17.5" cy="10.5" r="1.5" fill="#fdd835"/>
        </svg>
    `,
    mines: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="13" r="7" fill="#222222" stroke="#000000" stroke-width="1.5"/>
            <line x1="12" y1="3" x2="12" y2="6" stroke="#222222" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="6" x2="7" y2="8" stroke="#222222" stroke-width="2" stroke-linecap="round"/>
            <line x1="19" y1="6" x2="17" y2="8" stroke="#222222" stroke-width="2" stroke-linecap="round"/>
            <line x1="2" y1="13" x2="5" y2="13" stroke="#222222" stroke-width="2" stroke-linecap="round"/>
            <line x1="19" y1="13" x2="22" y2="13" stroke="#222222" stroke-width="2" stroke-linecap="round"/>
            <circle cx="10" cy="11" r="1.5" fill="#ffffff"/>
            <path d="M12 2C13.5 2 14.5 1 16 1.5" stroke="#ff3333" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    snake: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" fill="#000500" stroke="#00aa00" stroke-width="1.5"/>
            <rect x="5" y="5" width="4" height="4" fill="#00aa00"/>
            <rect x="9" y="5" width="4" height="4" fill="#00aa00"/>
            <rect x="13" y="5" width="4" height="4" fill="#55ff55"/>
            <rect x="13" y="9" width="4" height="4" fill="#00aa00"/>
            <rect x="13" y="13" width="4" height="4" fill="#00aa00"/>
            <rect x="9" y="13" width="4" height="4" fill="#00aa00"/>
            <rect x="5" y="15" width="3" height="3" fill="#ff5555"/>
        </svg>
    `,
    calc: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2" width="18" height="20" rx="2" fill="#c0c0c0" stroke="#444444" stroke-width="1.5"/>
            <rect x="5" y="4" width="14" height="4" fill="#9fbf8f" stroke="#555555" stroke-width="1"/>
            <rect x="5" y="10" width="3" height="3" fill="#e0e0e0" stroke="#666666"/>
            <rect x="10" y="10" width="3" height="3" fill="#e0e0e0" stroke="#666666"/>
            <rect x="15" y="10" width="4" height="3" fill="#d0d0d0" stroke="#666666"/>
            <rect x="5" y="14" width="3" height="3" fill="#e0e0e0" stroke="#666666"/>
            <rect x="10" y="14" width="3" height="3" fill="#e0e0e0" stroke="#666666"/>
            <rect x="15" y="14" width="4" height="3" fill="#d0d0d0" stroke="#666666"/>
            <rect x="5" y="18" width="8" height="3" fill="#e0e0e0" stroke="#666666"/>
            <rect x="15" y="18" width="4" height="3" fill="#000080" stroke="#000000"/>
        </svg>
    `,
    media: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="2" fill="#2a2a2a" stroke="#000000" stroke-width="1.5"/>
            <rect x="4" y="6" width="16" height="10" fill="#000000"/>
            <polygon points="10,8 15,11 10,14" fill="#00e5ff"/>
            <rect x="4" y="17" width="16" height="2" fill="#555555"/>
            <rect x="4" y="17" width="7" height="2" fill="#00e5ff"/>
        </svg>
    `,
    vm: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#333333" stroke="#000000" stroke-width="1.5"/>
            <rect x="5" y="5" width="14" height="7" fill="#0c101c" stroke="#555555" stroke-width="1"/>
            <circle cx="8" cy="16" r="1.5" fill="#55ff55"/>
            <circle cx="12" cy="16" r="1.5" fill="#ffcc00"/>
            <circle cx="16" cy="16" r="1.5" fill="#00ccff"/>
            <line x1="5" y1="8" x2="12" y2="8" stroke="#00ccff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    viewer: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="18" rx="2" fill="#ffffff" stroke="#444444" stroke-width="1.5"/>
            <rect x="4" y="5" width="16" height="11" fill="#e0f7fa" stroke="#00838f" stroke-width="1"/>
            <circle cx="8" cy="8.5" r="1.5" fill="#fbc02d"/>
            <path d="M4 15L9 10L14 15L16 13L20 16V16H4V15Z" fill="#43a047"/>
            <rect x="5" y="18" width="14" height="1.5" fill="#000080"/>
        </svg>
    `,
    picture: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="18" rx="2" fill="#ffffff" stroke="#444444" stroke-width="1.5"/>
            <rect x="4" y="5" width="16" height="14" fill="#e0f7fa" stroke="#00838f" stroke-width="1"/>
            <circle cx="8" cy="9" r="1.8" fill="#fbc02d"/>
            <path d="M4 17L9 11L14 16L16 14L20 18H4V17Z" fill="#43a047"/>
        </svg>
    `,
    zoomIn: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="6" stroke="#000000" stroke-width="2" fill="none"/>
            <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="10" y1="7" x2="10" y2="13" stroke="#000080" stroke-width="2" stroke-linecap="round"/>
            <line x1="7" y1="10" x2="13" y2="10" stroke="#000080" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    zoomOut: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="6" stroke="#000000" stroke-width="2" fill="none"/>
            <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="7" y1="10" x2="13" y2="10" stroke="#000080" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    zoomFit: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="1" stroke="#000080" stroke-width="1.8" fill="none"/>
            <path d="M7 10V7H10" stroke="#000000" stroke-width="1.8"/>
            <path d="M17 10V7H14" stroke="#000000" stroke-width="1.8"/>
            <path d="M7 14V17H10" stroke="#000000" stroke-width="1.8"/>
            <path d="M17 14V17H14" stroke="#000000" stroke-width="1.8"/>
        </svg>
    `,
    rotCw: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C8.5 20 5.5 17.8 4.4 14.5" stroke="#000080" stroke-width="2" stroke-linecap="round" fill="none"/>
            <polygon points="12,1 12,7 17,4" fill="#000080"/>
        </svg>
    `,
    rotCcw: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4C7.6 4 4 7.6 4 12C4 16.4 7.6 20 12 20C15.5 20 18.5 17.8 19.6 14.5" stroke="#000080" stroke-width="2" stroke-linecap="round" fill="none"/>
            <polygon points="12,1 12,7 7,4" fill="#000080"/>
        </svg>
    `,
    flipH: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="3" x2="12" y2="21" stroke="#808080" stroke-width="1.5" stroke-dasharray="3,3"/>
            <polygon points="4,12 8,8 8,16" fill="#000080"/>
            <polygon points="20,12 16,8 16,16" fill="#000080"/>
            <line x1="7" y1="12" x2="17" y2="12" stroke="#000080" stroke-width="1.8"/>
        </svg>
    `,
    flipV: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="3" y1="12" x2="21" y2="12" stroke="#808080" stroke-width="1.5" stroke-dasharray="3,3"/>
            <polygon points="12,4 8,8 16,8" fill="#000080"/>
            <polygon points="12,20 8,16 16,16" fill="#000080"/>
            <line x1="12" y1="7" x2="12" y2="17" stroke="#000080" stroke-width="1.8"/>
        </svg>
    `,
    courgette: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 19C4 16 3 11 5 7C7 3 12 2 16 4C19 6 21 11 19 16C17 20 11 21 7 19Z" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.5"/>
            <path d="M8 7C10 5.5 14 5.5 17 8" stroke="#81c784" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="10" cy="12" r="1" fill="#a5d6a7"/>
            <circle cx="14" cy="15" r="1" fill="#a5d6a7"/>
        </svg>
    `,
    shutdown: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="12" y1="2" x2="12" y2="11" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    user: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="#000080"/>
            <path d="M4 20C4 16 7.58172 14 12 14C16.4183 14 20 16 20 20" stroke="#000080" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    startLogo: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="3" fill="url(#startZGrad)" stroke="#003380" stroke-width="1"/>
            <path d="M6 7.5H18L8.5 16.5H18" stroke="#ffffff" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/>
            <defs>
                <linearGradient id="startZGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stop-color="#0080ff"/>
                    <stop offset="100%" stop-color="#003399"/>
                </linearGradient>
            </defs>
        </svg>
    `,
    officialZLogo: `
        <svg class="sys-official-logo" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block; filter:drop-shadow(0 0 12px rgba(54,209,220,0.4));">
            <defs>
                <linearGradient id="zLogoGradUnique" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#20b2aa" />
                    <stop offset="50%" stop-color="#008080" />
                    <stop offset="100%" stop-color="#003366" />
                </linearGradient>
            </defs>
            <polygon points="256,30 446,140 446,372 256,482 66,372 66,140" fill="url(#zLogoGradUnique)" stroke="#55ffff" stroke-width="16"/>
            <path d="M150 150 H362 L150 362 H362" stroke="#ffffff" stroke-width="44" stroke-linecap="square" stroke-linejoin="miter"/>
        </svg>
    `,
    winMin: `<svg viewBox="0 0 10 10" style="width:10px; height:10px; display:block;"><line x1="1" y1="8" x2="9" y2="8" stroke="#000000" stroke-width="2" stroke-linecap="square"/></svg>`,
    winMax: `<svg viewBox="0 0 10 10" style="width:10px; height:10px; display:block;"><rect x="1" y="1" width="8" height="8" fill="none" stroke="#000000" stroke-width="1.5"/></svg>`,
    winClose: `<svg viewBox="0 0 10 10" style="width:10px; height:10px; display:block;"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="#000000" stroke-width="1.8" stroke-linecap="square"/></svg>`,
    back: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    up: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 14H9V20H15V14H20L12 4Z" fill="#000000"/>
        </svg>
    `,
    drive: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="6" width="20" height="12" rx="2" fill="#d0d0d0" stroke="#000000" stroke-width="1.5"/>
            <line x1="2" y1="14" x2="22" y2="14" stroke="#808080" stroke-width="1"/>
            <circle cx="18" cy="10" r="1" fill="#00e676"/>
            <rect x="5" y="9" width="8" height="2" fill="#555555"/>
        </svg>
    `,
    computer: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="3" width="16" height="11" rx="1" fill="#e0e0e0" stroke="#000000" stroke-width="1.5"/>
            <rect x="6" y="5" width="12" height="7" fill="#008080"/>
            <path d="M10 14V17H14V14" stroke="#000000" stroke-width="1.5" fill="none"/>
            <rect x="2" y="17" width="20" height="4" rx="1" fill="#c0c0c0" stroke="#000000" stroke-width="1.5"/>
            <circle cx="18" cy="19" r="0.8" fill="#00e676"/>
        </svg>
    `,
    file: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2H14L19 7V21C19 21.5523 18.5523 22 18 22H6C5.44772 22 5 21.5523 5 21V3C5 2.44772 5.44772 2 6 2Z" fill="#ffffff" stroke="#444444" stroke-width="1.5"/>
            <path d="M14 2V7H19" stroke="#444444" stroke-width="1.5" fill="#d0d0d0"/>
        </svg>
    `,
    folder: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6C3 4.89543 3.89543 4 5 4H10L12 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" fill="#ffca28" stroke="#c79100" stroke-width="1.5"/>
            <path d="M3 9H21V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" fill="#ffd54f" stroke="#c79100" stroke-width="1.5"/>
        </svg>
    `,
    newFolder: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6C3 4.89543 3.89543 4 5 4H10L12 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" fill="#ffca28" stroke="#c79100" stroke-width="1.5"/>
            <circle cx="16" cy="14" r="5" fill="#2e7d32"/>
            <line x1="16" y1="11" x2="16" y2="17" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="13" y1="14" x2="19" y2="14" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    home: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z" fill="#c0c0c0" stroke="#000080" stroke-width="1.5"/>
            <rect x="10" y="15" width="4" height="6" fill="#000080"/>
        </svg>
    `,
    zdl: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V3Z" fill="#e8eaf6" stroke="#1a237e" stroke-width="1.5"/>
            <path d="M14 3V8H19" stroke="#1a237e" stroke-width="1.5" fill="#c5cae9"/>
            <circle cx="12" cy="14" r="3.5" fill="#3949ab" stroke="#1a237e" stroke-width="1"/>
            <path d="M12 11.5V16.5M9.5 14H14.5" stroke="#ffffff" stroke-width="1"/>
        </svg>
    `,
    smileyNormal: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ffeb3b" stroke="#000000" stroke-width="1.5"/>
            <circle cx="8.5" cy="9.5" r="1.5" fill="#000000"/>
            <circle cx="15.5" cy="9.5" r="1.5" fill="#000000"/>
            <path d="M7 14.5C8.5 17 15.5 17 17 14.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    smileyPressed: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ffeb3b" stroke="#000000" stroke-width="1.5"/>
            <circle cx="8.5" cy="9.5" r="1.5" fill="#000000"/>
            <circle cx="15.5" cy="9.5" r="1.5" fill="#000000"/>
            <circle cx="12" cy="15" r="2.5" fill="#000000"/>
        </svg>
    `,
    smileyDead: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ffeb3b" stroke="#000000" stroke-width="1.5"/>
            <path d="M7 7L10 10M10 7L7 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14 7L17 10M17 7L14 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M8 16C10 14 14 14 16 16" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    smileyCool: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ffeb3b" stroke="#000000" stroke-width="1.5"/>
            <path d="M5 8.5H19V11.5C19 11.5 16 13 14 11.5C12 10 12 10 10 11.5C8 13 5 11.5 5 11.5V8.5Z" fill="#000000"/>
            <path d="M7 15C9 17 15 17 17 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    flag: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="4" x2="6" y2="20" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
            <polygon points="6,4 18,8 6,12" fill="#d32f2f"/>
            <rect x="3" y="19" width="8" height="2" fill="#000000"/>
        </svg>
    `,
    play: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="6,4 19,12 6,20" fill="#000000"/>
        </svg>
    `,
    pause: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" fill="#000000"/>
            <rect x="14" y="4" width="4" height="16" fill="#000000"/>
        </svg>
    `,
    stop: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="14" height="14" fill="#000000"/>
        </svg>
    `,
    volume: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="3,9 7,9 12,5 12,19 7,15 3,15" fill="#000000"/>
            <path d="M15 9C16.5 10.5 16.5 13.5 15 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M18 6C21 9 21 15 18 18" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `,
    pencil: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#000000"/>
        </svg>
    `,
    brush: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 14C5.5 14 4 15.5 4 17C4 18.5 5 20 7 20C8.5 20 10 19 10 17.5C10 16 8.5 14 7 14ZM20.7 4.3C20.3 3.9 19.7 3.9 19.3 4.3L11 12.6L12.4 14L20.7 5.7C21.1 5.3 21.1 4.7 20.7 4.3Z" fill="#000000"/>
        </svg>
    `,
    eraser: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.14 3C14.63 3 14.12 3.2 13.73 3.59L2.59 14.73C1.81 15.51 1.81 16.78 2.59 17.56L6.44 21.41C6.83 21.8 7.34 22 7.85 22H21V20H11.41L18.97 12.44C19.75 11.66 19.75 10.39 18.97 9.61L15.12 5.76C14.73 5.37 14.22 5.18 13.71 5.18" fill="#e0a0a0" stroke="#000000" stroke-width="1.5"/>
        </svg>
    `,
    line: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="20" x2="20" y2="4" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    rect: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" fill="none" stroke="#000000" stroke-width="2"/>
        </svg>
    `,
    circle: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="none" stroke="#000000" stroke-width="2"/>
        </svg>
    `,
    clear: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#d32f2f"/>
        </svg>
    `,
    save: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM15 9H5V5H15V9Z" fill="#000080"/>
        </svg>
    `,
    powerOn: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="7,4 19,12 7,20" fill="#2e7d32"/>
        </svg>
    `,
    powerOff: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="14" height="14" fill="#c62828"/>
        </svg>
    `,
    settings: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.14 12.94C19.18 12.63 19.2 12.32 19.2 12C19.2 11.68 19.18 11.37 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.08 21.28 8.87L19.37 5.56C19.25 5.35 19 5.27 18.78 5.35L16.4 6.31C15.9 5.93 15.37 5.61 14.79 5.37L14.43 2.83C14.39 2.6 14.2 2.43 13.97 2.43H10.13C9.9 2.43 9.71 2.6 9.67 2.83L9.31 5.37C8.73 5.61 8.2 5.93 7.7 6.31L5.32 5.35C5.1 5.27 4.85 5.35 4.73 5.56L2.82 8.87C2.71 9.08 2.76 9.34 2.94 9.48L4.96 11.06C4.92 11.37 4.9 11.68 4.9 12C4.9 12.32 4.92 12.63 4.96 12.94L2.94 14.52C2.76 14.66 2.71 14.92 2.82 15.13L4.73 18.44C4.85 18.65 5.1 18.73 5.32 18.65L7.7 17.69C8.2 18.07 8.73 18.39 9.31 18.63L9.67 21.17C9.71 21.4 9.9 21.57 10.13 21.57H13.97C14.2 21.57 14.39 21.4 14.43 21.17L14.79 18.63C15.37 18.39 15.9 18.07 16.4 17.69L18.78 18.65C19 18.73 19.25 18.65 19.37 18.44L21.28 15.13C21.39 14.92 21.34 14.66 21.16 14.52L19.14 12.94ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="#333333"/>
        </svg>
    `,
    fill: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 11L13 5L5 13L11 19L19 11Z" fill="#1976d2" stroke="#000000" stroke-width="1.5"/>
            <path d="M19 11C20.5 12.5 21 14.5 19.5 16C18 17.5 16 17 14.5 15.5" stroke="#1976d2" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 20C4 20 7 18 8 20" stroke="#1976d2" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    frect: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" fill="#000000" stroke="#000000" stroke-width="1.5"/>
        </svg>
    `,
    fcircle: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#000000" stroke="#000000" stroke-width="1.5"/>
        </svg>
    `,
    layerAdd: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#c0c0c0" stroke="#000000" stroke-width="1.5"/>
            <path d="M2 12L12 17L22 12" stroke="#000000" stroke-width="1.5"/>
            <path d="M2 17L12 22L22 17" stroke="#000000" stroke-width="1.5"/>
            <circle cx="18" cy="18" r="4" fill="#2e7d32"/>
            <line x1="18" y1="16" x2="18" y2="20" stroke="#ffffff" stroke-width="1.5"/>
            <line x1="16" y1="18" x2="20" y2="18" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
    `,
    layerDel: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#c0c0c0" stroke="#000000" stroke-width="1.5"/>
            <path d="M2 12L12 17L22 12" stroke="#000000" stroke-width="1.5"/>
            <circle cx="18" cy="18" r="4" fill="#c62828"/>
            <line x1="16" y1="18" x2="20" y2="18" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
    `,
    layerVis: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" fill="none" stroke="#000000" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="#000080"/>
        </svg>
    `,
    layerHide: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" fill="none" stroke="#808080" stroke-width="1.5"/>
            <line x1="3" y1="3" x2="21" y2="21" stroke="#d32f2f" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    taskmgr: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="18" rx="1" fill="#c0c0c0" stroke="#000000" stroke-width="1.5"/>
            <rect x="3" y="4" width="18" height="4" fill="#000080"/>
            <rect x="4" y="9" width="16" height="3" fill="#ffffff" stroke="#808080" stroke-width="0.8"/>
            <rect x="4" y="13" width="16" height="3" fill="#e0e0e0" stroke="#808080" stroke-width="0.8"/>
            <rect x="4" y="17" width="10" height="3" fill="#ffffff" stroke="#808080" stroke-width="0.8"/>
            <rect x="15" y="17" width="5" height="3" fill="#c62828" stroke="#000000" stroke-width="0.8"/>
        </svg>
    `,
    solitaire: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="12" height="17" rx="1.5" fill="#ffffff" stroke="#000000" stroke-width="1.2" transform="rotate(-8 8 12)"/>
            <path d="M13 9L14 7L15 9L17 9.5L15 10.5L14 12.5L13 10.5L11 9.5Z" fill="#c62828" transform="rotate(-8 14 9)"/>
            <rect x="9" y="3" width="12" height="17" rx="1.5" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
            <path d="M15 7C15 7 12 9.5 12 12C12 13.5 13.2 14.5 15 14.5C16.8 14.5 18 13.5 18 12C18 9.5 15 7 15 7Z" fill="#000000"/>
            <rect x="13.5" y="14" width="3" height="4" fill="#000000"/>
        </svg>
    `,
    run: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="1.5" fill="#c0c0c0" stroke="#444444" stroke-width="1.5"/>
            <rect x="4" y="6" width="16" height="4" fill="#000080"/>
            <path d="M7 13V19H12" stroke="#444444" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="8" y1="16" x2="14" y2="16" stroke="#2e7d32" stroke-width="2" stroke-linecap="round"/>
            <polygon points="15,13.3 20,16 15,18.7" fill="#2e7d32"/>
        </svg>
    `,
    regedit: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="14" rx="1" fill="#e8d9b5" stroke="#7a5c2e" stroke-width="1.5"/>
            <rect x="3" y="6" width="18" height="4" fill="#c9a86a" stroke="#7a5c2e" stroke-width="1"/>
            <line x1="6" y1="12" x2="16" y2="12" stroke="#7a5c2e" stroke-width="1"/>
            <line x1="6" y1="15" x2="16" y2="15" stroke="#7a5c2e" stroke-width="1"/>
            <line x1="6" y1="18" x2="12" y2="18" stroke="#7a5c2e" stroke-width="1"/>
            <circle cx="17.5" cy="17" r="3.2" fill="#455a64" stroke="#263238" stroke-width="0.8"/>
            <circle cx="17.5" cy="16.2" r="0.9" fill="#eeeeee"/>
            <rect x="16.9" y="16.7" width="1.2" height="1.8" fill="#eeeeee"/>
        </svg>
    `,
    reinstall: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="6" width="20" height="12" rx="2" fill="#d0d0d0" stroke="#000000" stroke-width="1.5"/>
            <line x1="2" y1="14" x2="22" y2="14" stroke="#808080" stroke-width="1"/>
            <rect x="5" y="9" width="8" height="2" fill="#555555"/>
            <path d="M15 15.5C15 13.6 16.6 12 18.5 12C19.6 12 20.6 12.5 21.2 13.4" stroke="#c62828" stroke-width="1.6" stroke-linecap="round" fill="none"/>
            <polygon points="21.2,11.2 21.6,13.7 19.1,13.3" fill="#c62828"/>
            <path d="M22 17.5C22 19.4 20.4 21 18.5 21C17.4 21 16.4 20.5 15.8 19.6" stroke="#c62828" stroke-width="1.6" stroke-linecap="round" fill="none"/>
            <polygon points="15.8,21.8 15.4,19.3 17.9,19.7" fill="#c62828"/>
        </svg>
    `,
    chess: `
        <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" fill="#e0e0e0" stroke="#000000" stroke-width="1.5"/>
            <rect x="2" y="2" width="5" height="5" fill="#000000"/>
            <rect x="12" y="2" width="5" height="5" fill="#000000"/>
            <rect x="7" y="7" width="5" height="5" fill="#000000"/>
            <rect x="17" y="7" width="5" height="5" fill="#000000"/>
            <rect x="2" y="12" width="5" height="5" fill="#000000"/>
            <rect x="12" y="12" width="5" height="5" fill="#000000"/>
            <rect x="7" y="17" width="5" height="5" fill="#000000"/>
            <rect x="17" y="17" width="5" height="5" fill="#000000"/>
            <path d="M12 6C10.9 6 10 6.9 10 8C10 8.6 10.3 9.1 10.7 9.5L9.5 16H14.5L13.3 9.5C13.7 9.1 14 8.6 14 8C14 6.9 13.1 6 12 6Z" fill="#c62828" stroke="#000000" stroke-width="0.8"/>
            <rect x="9" y="16" width="6" height="2" fill="#c62828" stroke="#000000" stroke-width="0.8"/>
        </svg>
    `,
activitycenter: `
    <svg class="sys-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="1.5" fill="#c0c0c0" stroke="#000000" stroke-width="1.3"/>
        <rect x="3.5" y="4.5" width="17" height="4" fill="#000080"/>
        <rect x="5" y="10" width="6" height="4" fill="#ffffff" stroke="#808080" stroke-width="0.8"/>
        <rect x="13" y="10" width="6" height="4" fill="#ffffff" stroke="#808080" stroke-width="0.8"/>
        <rect x="5" y="16" width="14" height="3" fill="#008080" stroke="#004c4c" stroke-width="0.8"/>
        <circle cx="7" cy="6.5" r="0.9" fill="#55ff55"/>
        <circle cx="10" cy="6.5" r="0.9" fill="#ffeb3b"/>
        <circle cx="13" cy="6.5" r="0.9" fill="#ff5555"/>
    </svg>
`,
};

export function getIcon(name, customClass = "") {
    const rawSvg = SVGS[name] || SVGS.file;
    if (!customClass) return rawSvg.trim();
    return rawSvg.replace('class="sys-icon"', `class="sys-icon ${customClass}"`).trim();
}
