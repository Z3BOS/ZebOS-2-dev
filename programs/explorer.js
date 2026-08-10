import { getIcon } from '../icons.js';
import { showOsPrompt, showOsConfirm } from '../os.js';

export class FileExplorerApp {
    constructor(closeCallback, launchFileCallback, saveVfsCallback, getVfsContext) {
        this.closeCallback = closeCallback;
        this.launchFileCallback = launchFileCallback;
        this.saveVfsCallback = saveVfsCallback;
        this.getVfsContext = getVfsContext;

        this.currentPath = "HOME"; // Default to My Computer Home Page
        this.history = ["HOME"];
        this.historyIndex = 0;
        this.viewMode = "large"; // "large", "small", "list", "details"
        this.selectedItem = null;
        this.clipboardItem = null;
    }

    open(containerElement) {
        this.container = containerElement;
        this.renderLayout();
        this.refreshView();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="explorer-window-layout" style="display:flex; flex-direction:column; height:100%; font-family:Arial, sans-serif; font-size:12px; background:#c0c0c0; user-select:none; overflow:hidden;">
                <!-- 1. Menubar -->
                <div class="explorer-menubar" style="display:flex; gap:12px; padding:2px 6px; background:#c0c0c0; border-bottom:1px solid #808080; font-size:12px;">
                    <span class="exp-menu-link"><u>F</u>ile</span>
                    <span class="exp-menu-link"><u>E</u>dit</span>
                    <span class="exp-menu-link"><u>V</u>iew</span>
                    <span class="exp-menu-link"><u>G</u>o</span>
                    <span class="exp-menu-link"><u>F</u>avorites</span>
                    <span class="exp-menu-link"><u>H</u>elp</span>
                </div>

                <!-- 2. Standard Toolbar -->
                <div class="explorer-toolbar" style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:#c0c0c0; border-bottom:1px solid #808080; flex-wrap:wrap; overflow-x:auto;">
                    <button class="exp-tb-btn" id="exp-tb-home" title="My Computer (Home)" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span class="exp-icon-wrap" style="width:16px;height:16px;display:inline-flex;align-items:center;">${getIcon('home')}</span> Home
                    </button>
                    <button class="exp-tb-btn" id="exp-tb-back" title="Back" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span class="exp-icon-wrap" style="width:16px;height:16px;display:inline-flex;align-items:center;">${getIcon('back')}</span> Back
                    </button>
                    <button class="exp-tb-btn" id="exp-tb-up" title="Up One Level" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span class="exp-icon-wrap" style="width:16px;height:16px;display:inline-flex;align-items:center;">${getIcon('up')}</span> Up
                    </button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <button class="exp-tb-btn" id="exp-tb-cut" title="Cut" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Cut</button>
                    <button class="exp-tb-btn" id="exp-tb-copy" title="Copy" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Copy</button>
                    <button class="exp-tb-btn" id="exp-tb-paste" title="Paste" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Paste</button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <button class="exp-tb-btn" id="exp-tb-delete" title="Delete" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Delete</button>
                    <button class="exp-tb-btn" id="exp-tb-newfolder" title="New Folder" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">+ Folder</button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    
                    <!-- View Selector -->
                    <span style="font-size:11px; font-weight:bold; margin-left:4px;">Views:</span>
                    <button class="exp-view-btn active-view-btn" id="exp-view-large" title="Large Icons" style="padding:2px 6px; background:#c0c0c0; border:1px solid #000; border-right-color:#fff; border-bottom-color:#fff; cursor:pointer; font-weight:bold;">Large</button>
                    <button class="exp-view-btn" id="exp-view-small" title="Small Icons" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Small</button>
                    <button class="exp-view-btn" id="exp-view-list" title="List View" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">List</button>
                    <button class="exp-view-btn" id="exp-view-details" title="Details View" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Details</button>
                </div>

                <!-- 3. Address Bar -->
                <div class="explorer-addressbar" style="display:flex; align-items:center; gap:6px; padding:3px 6px; background:#c0c0c0; border-bottom:1px solid #808080;">
                    <span style="font-weight:bold; font-size:11px;">Address:</span>
                    <div style="display:flex; align-items:center; flex-grow:1; background:#fff; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; padding:1px 4px;">
                        <span class="exp-icon-wrap" id="exp-address-icon" style="margin-right:4px;width:16px;height:16px;display:inline-flex;align-items:center;">${getIcon('home')}</span>
                        <input type="text" id="exp-address-input" value="My Computer" style="flex-grow:1; border:none; outline:none; font-family:Arial, sans-serif; font-size:12px;">
                    </div>
                </div>

                <!-- 4. Split Main Workspace Panel -->
                <div class="explorer-body-split" style="display:flex; flex-grow:1; overflow:hidden; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; margin:2px;">
                    
                    <!-- Left Sidebar (Folder Tree & Information Card) -->
                    <div class="explorer-sidebar" style="width:200px; min-width:170px; background:#c0c0c0; border-right:2px solid #808080; display:flex; flex-direction:column; padding:8px; box-sizing:border-box; overflow-y:auto;">
                        <!-- Selected / Active Folder Info Card -->
                        <div id="exp-sidebar-info" style="display:flex; flex-direction:column; gap:6px; border-bottom:1px solid #808080; padding-bottom:12px; margin-bottom:8px;">
                            <div style="width:48px; height:48px;" id="exp-info-icon">${getIcon('computer')}</div>
                            <div style="font-size:15px; font-weight:bold; color:#000080; word-break:break-all;" id="exp-info-title">My Computer</div>
                            <div style="font-size:11px; color:#555;" id="exp-info-type">System Dashboard</div>
                            <div style="font-size:11px; color:#333; margin-top:4px;" id="exp-info-desc">Displays system disk drives, storage stats, and folders.</div>
                            <div style="margin-top:8px; font-size:11px; color:#000080;" id="exp-info-stats">
                                <div>System Volume (Z:)</div>
                                <div>ZebVFS Storage Engine</div>
                            </div>
                        </div>

                        <!-- Tree Navigation -->
                        <div style="font-weight:bold; font-size:11px; margin-bottom:4px; color:#000080;">All Locations</div>
                        <div id="exp-folder-tree" style="display:flex; flex-direction:column; gap:2px; font-size:11px;"></div>
                    </div>

                    <!-- Right Main Content Panel -->
                    <div class="explorer-main-view" style="flex-grow:1; background:#ffffff; overflow:auto; padding:6px; position:relative;">
                        <div id="exp-items-container"></div>
                    </div>
                </div>

                <!-- 5. Bottom Statusbar -->
                <div class="explorer-statusbar" style="display:flex; align-items:center; justify-content:space-between; padding:2px 8px; background:#c0c0c0; border-top:1px solid #fff; font-size:11px; color:#333;">
                    <div id="exp-status-left">Ready</div>
                    <div id="exp-status-mid">Disk Free: 2047 MB</div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span class="exp-icon-wrap" style="width:14px;height:14px;display:inline-flex;align-items:center;">${getIcon('computer')}</span> Zeb Machine
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const btnHome = this.container.querySelector('#exp-tb-home');
        const btnUp = this.container.querySelector('#exp-tb-up');
        const btnBack = this.container.querySelector('#exp-tb-back');
        const btnNewFolder = this.container.querySelector('#exp-tb-newfolder');
        const btnDelete = this.container.querySelector('#exp-tb-delete');
        const addressInput = this.container.querySelector('#exp-address-input');

        btnHome.addEventListener('click', () => this.navigateTo("HOME"));

        btnUp.addEventListener('click', () => {
            if (this.currentPath === "HOME") return;
            if (this.currentPath === "") {
                this.navigateTo("HOME");
            } else {
                const parts = this.currentPath.split('/');
                parts.pop();
                this.navigateTo(parts.join('/'));
            }
        });

        btnBack.addEventListener('click', () => {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.currentPath = this.history[this.historyIndex];
                this.refreshView();
            }
        });

        btnNewFolder.addEventListener('click', () => {
            if (this.currentPath === "HOME") {
                this.navigateTo(""); // Switch to ZebRoot for folder creation
            }
            showOsPrompt("New Folder", "Type a name for the new folder:", "New Folder", (name) => {
                const folderName = name.trim();
                if (!folderName) return;
                const context = this.getVfsContext(this.currentPath);
                context[folderName] = { type: "dir", content: {} };
                this.saveVfsCallback();
                this.refreshView();
            });
        });

        btnDelete.addEventListener('click', () => {
            if (this.selectedItem && this.currentPath !== "HOME") {
                const itemName = this.selectedItem;
                const isZdl = itemName.endsWith('.zdl');
                const context = this.getVfsContext(this.currentPath);
                const item = context[itemName];
                const isDir = item?.type === 'dir';

                const title = isZdl ? "Confirm System Library Delete" : (isDir ? "Confirm Folder Delete" : "Confirm File Delete");
                const message = isZdl
                    ? `Are you sure you want to delete '${itemName}'?\n\nWARNING: .zdl files are vital ZebOS System Dynamic Libraries. Deleting system libraries may corrupt system operation!`
                    : `Are you sure you want to delete '${itemName}'?`;

                showOsConfirm(title, message, isZdl, () => {
                    delete context[itemName];
                    this.selectedItem = null;
                    this.saveVfsCallback();
                    this.refreshView();
                });
            }
        });

        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = addressInput.value.trim();
                if (val.toLowerCase() === 'my computer' || val.toLowerCase() === 'home') {
                    this.navigateTo("HOME");
                } else {
                    let target = val.replace(/^Z:\\?/i, '').replace(/^C:\\?/i, '').replace(/\\/g, '/').trim();
                    this.navigateTo(target);
                }
            }
        });

        const viewModes = ['large', 'small', 'list', 'details'];
        viewModes.forEach(mode => {
            const btn = this.container.querySelector(`#exp-view-${mode}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.viewMode = mode;
                    this.container.querySelectorAll('.exp-view-btn').forEach(b => {
                        b.style.border = '1px solid #fff';
                        b.style.borderRightColor = '#000';
                        b.style.borderBottomColor = '#000';
                        b.style.fontWeight = 'normal';
                    });
                    btn.style.border = '1px solid #000';
                    btn.style.borderRightColor = '#fff';
                    btn.style.borderBottomColor = '#fff';
                    btn.style.fontWeight = 'bold';
                    this.refreshView();
                });
            }
        });
    }

    navigateTo(path) {
        this.currentPath = path;
        if (this.history[this.historyIndex] !== path) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(path);
            this.historyIndex = this.history.length - 1;
        }
        this.selectedItem = null;
        this.refreshView();
    }

    getItemIcon(name, itemType) {
        if (itemType === 'dir') return getIcon('folder');
        if (name.endsWith('.zdl')) return getIcon('zdl');
        if (name.endsWith('.exe')) return getIcon('startLogo');
        if (name.endsWith('.png') || name.endsWith('.bmp')) return getIcon('paint');
        if (name.endsWith('.txt') || name.endsWith('.ini') || name.endsWith('.cfg')) return getIcon('editor');
        return getIcon('file');
    }

    getItemTypeName(name, itemType) {
        if (itemType === 'dir') return 'File Folder';
        if (name.endsWith('.zdl')) return 'System Dynamic Library (.zdl)';
        if (name.endsWith('.exe')) return 'Application Executable (.exe)';
        if (name.endsWith('.png')) return 'Bitmap Image (.png)';
        if (name.endsWith('.txt')) return 'Text Document (.txt)';
        if (name.endsWith('.ini') || name.endsWith('.cfg')) return 'Configuration File';
        return 'System File';
    }

    refreshView() {
        const addressInput = this.container.querySelector('#exp-address-input');
        const addressIcon  = this.container.querySelector('#exp-address-icon');

        if (this.currentPath === "HOME") {
            if (addressInput) addressInput.value = "My Computer";
            if (addressIcon)  addressIcon.innerHTML = getIcon('home');
            this.renderHomeView();
        } else {
            if (addressInput) addressInput.value = this.currentPath === "" ? "Z:\\" : `Z:\\${this.currentPath.replace(/\//g, '\\')}`;
            if (addressIcon)  addressIcon.innerHTML = getIcon('drive');

            const context = this.getVfsContext(this.currentPath);
            const mainContainer = this.container.querySelector('#exp-items-container');
            mainContainer.innerHTML = "";

            const items = Object.keys(context || {});

            if (this.viewMode === "details") {
                this.renderDetailsView(mainContainer, context, items);
            } else {
                this.renderGridView(mainContainer, context, items);
            }

            this.renderSidebar(context, items);

            const statusLeft = this.container.querySelector('#exp-status-left');
            if (statusLeft) statusLeft.textContent = `${items.length} object(s)`;
        }

        const rootFs = this.getVfsContext("");
        const usedBytes = new Blob([JSON.stringify(rootFs)]).size;
        const usedStr = usedBytes < 1024 ? `${usedBytes} B` : `${(usedBytes / 1024).toFixed(1)} KB`;
        const freeMbStr = (2048 - (usedBytes / (1024 * 1024))).toFixed(0);

        const statusMid = this.container.querySelector('#exp-status-mid');
        if (statusMid) statusMid.textContent = `Disk Free: ${freeMbStr} MB (Used: ${usedStr})`;
    }

    renderHomeView() {
        const mainContainer = this.container.querySelector('#exp-items-container');
        if (!mainContainer) return;

        const rootFs = this.getVfsContext("");
        const usedBytes = new Blob([JSON.stringify(rootFs)]).size;
        const usedStr = usedBytes < 1024 ? `${usedBytes} B` : `${(usedBytes / 1024).toFixed(1)} KB`;
        const usedPercent = Math.min(100, Math.max(4, Math.round((usedBytes / (2 * 1024 * 1024 * 1024)) * 100)));
        const freeMbStr = (2048 - (usedBytes / (1024 * 1024))).toFixed(0);

        mainContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;padding:10px;font-family:Arial,sans-serif;">
            
            <!-- Dashboard Header -->
            <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:2px solid #c0c0c0;">
              <div style="width:36px;height:36px;">${getIcon('computer')}</div>
              <div>
                <div style="font-size:16px;font-weight:bold;color:#000080;">My Computer</div>
                <div style="font-size:11px;color:#555;">ZebOS System Storage &amp; Virtual Media Drives</div>
              </div>
            </div>

            <!-- Hard Disk & Media Drives Section -->
            <div>
              <div style="font-size:12px;font-weight:bold;color:#000080;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                <span>Hard Disk &amp; Media Drives</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;">
                
                <!-- Drive Z: -->
                <div class="exp-drive-card" style="background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:28px;height:28px;flex-shrink:0;">${getIcon('drive')}</div>
                    <div>
                      <div style="font-weight:bold;font-size:12px;color:#000080;">ZebRoot (Z:)</div>
                      <div style="font-size:10px;color:#444;">ZebVFS Primary Volume</div>
                    </div>
                  </div>
                  <div style="width:100%;height:12px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;box-sizing:border-box;">
                    <div style="width:${usedPercent}%;height:100%;background:#000080;"></div>
                  </div>
                  <div style="font-size:10px;color:#333;">${usedStr} used of 2.00 GB (${freeMbStr} MB free)</div>
                </div>

                <!-- Drive R: -->
                <div class="exp-drive-card" style="background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;padding:8px;cursor:pointer;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:28px;height:28px;flex-shrink:0;">${getIcon('drive')}</div>
                    <div>
                      <div style="font-weight:bold;font-size:12px;color:#000080;">RAM Disk (R:)</div>
                      <div style="font-size:10px;color:#444;">Volatile Memory Cache</div>
                    </div>
                  </div>
                  <div style="width:100%;height:12px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;box-sizing:border-box;">
                    <div style="width:12%;height:100%;background:#000080;"></div>
                  </div>
                  <div style="font-size:10px;color:#333;">64 MB used of 512 MB (448 MB free)</div>
                </div>

                <!-- Drive D: -->
                <div class="exp-drive-card" style="background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;padding:8px;cursor:default;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:28px;height:28px;flex-shrink:0;">${getIcon('media')}</div>
                    <div>
                      <div style="font-weight:bold;font-size:12px;color:#000080;">ZebOS CD-ROM (D:)</div>
                      <div style="font-size:10px;color:#444;">Disc Media (Read-Only)</div>
                    </div>
                  </div>
                  <div style="width:100%;height:12px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;box-sizing:border-box;">
                    <div style="width:100%;height:100%;background:#808080;"></div>
                  </div>
                  <div style="font-size:10px;color:#333;">650 MB / 650 MB (Optical Disc)</div>
                </div>

              </div>
            </div>

            <!-- Quick Access System Folders -->
            <div>
              <div style="font-size:12px;font-weight:bold;color:#000080;margin-bottom:8px;">System Quick Locations</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:8px;">
                ${[
                  { name: 'System32', path: 'System32', icon: 'zdl', desc: 'Core Libraries' },
                  { name: 'Program Files', path: 'Program Files', icon: 'folder', desc: 'Applications' },
                  { name: 'Users', path: 'Users', icon: 'user', desc: 'User Profiles' },
                  { name: 'Windows', path: 'Windows', icon: 'settings', desc: 'System Config' },
                  { name: 'Documents', path: 'Users/Guest/Documents', icon: 'editor', desc: 'My Documents' }
                ].map(loc => `
                <div class="exp-quick-loc" data-path="${loc.path}" style="background:#c0c0c0;border:2px solid #fff;border-right-color:#808080;border-bottom-color:#808080;padding:6px;cursor:pointer;display:flex;align-items:center;gap:8px;">
                  <div style="width:24px;height:24px;flex-shrink:0;">${getIcon(loc.icon)}</div>
                  <div>
                    <div style="font-weight:bold;font-size:11px;color:#000;">${loc.name}</div>
                    <div style="font-size:9px;color:#555;">${loc.desc}</div>
                  </div>
                </div>`).join('')}
              </div>
            </div>

            <!-- System Info Summary Card -->
            <fieldset style="border:2px solid #fff;border-left-color:#808080;border-top-color:#808080;padding:8px 12px;background:#c0c0c0;">
              <legend style="color:#000080;font-weight:bold;padding:0 4px;">ZebOS System Summary</legend>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:#000;">
                <div>OS Version: <strong>ZebOS 2.5.0 Alpha</strong></div>
                <div>Processor: <strong>ZebCore™ x86 Virtual CPU</strong></div>
                <div>System Memory: <strong>1024 MB RAM</strong></div>
                <div>Graphics: <strong>SVGA TrueColor (32-bit)</strong></div>
              </div>
            </fieldset>

        </div>`;

        // Bind clicks on drive cards & quick locations
        mainContainer.querySelectorAll('.exp-drive-card').forEach(card => {
            card.addEventListener('dblclick', () => this.navigateTo(""));
            card.addEventListener('click', () => this.navigateTo(""));
        });
        mainContainer.querySelectorAll('.exp-quick-loc').forEach(loc => {
            loc.addEventListener('click', () => this.navigateTo(loc.dataset.path));
        });

        this.renderSidebar(null, []);
    }

    renderGridView(container, context, items) {
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: ${this.viewMode === 'large' ? '16px' : '8px'};
            padding: 4px;
        `;

        items.forEach(name => {
            const item = context[name];
            const isDir = item.type === "dir";
            const iconSvg = this.getItemIcon(name, item.type);

            const card = document.createElement('div');
            card.className = 'explorer-item';
            card.dataset.itemName = name;
            card.dataset.itemType = item.type;

            if (this.viewMode === 'large') {
                card.style.cssText = `
                    width: 72px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4px;
                    border: 1px transparent solid;
                    cursor: pointer;
                    text-align: center;
                `;
                card.innerHTML = `
                    <div style="width:36px; height:36px;">${iconSvg}</div>
                    <div style="font-size:11px; margin-top:4px; word-break:break-word; max-width:68px;">${name}</div>
                `;
            } else if (this.viewMode === 'small') {
                card.style.cssText = `
                    width: 140px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 6px;
                    cursor: pointer;
                `;
                card.innerHTML = `
                    <div style="width:18px; height:18px;">${iconSvg}</div>
                    <div style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
                `;
            } else {
                card.style.cssText = `
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                    cursor: pointer;
                `;
                card.innerHTML = `
                    <div style="width:18px; height:18px;">${iconSvg}</div>
                    <div style="font-size:12px;">${name}</div>
                `;
            }

            if (this.selectedItem === name) {
                card.style.backgroundColor = '#000080';
                card.style.color = '#ffffff';
            }

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedItem = name;
                this.refreshView();
            });

            card.addEventListener('dblclick', () => {
                if (isDir) {
                    const newPath = this.currentPath === "" ? name : `${this.currentPath}/${name}`;
                    this.navigateTo(newPath);
                } else {
                    this.launchFileCallback(name);
                }
            });

            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    renderDetailsView(container, context, items) {
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            text-align: left;
        `;

        table.innerHTML = `
            <thead>
                <tr style="background:#c0c0c0; border-bottom:1px solid #808080; font-weight:bold;">
                    <th style="padding:4px 8px; border-right:1px solid #808080;">Name</th>
                    <th style="padding:4px 8px; border-right:1px solid #808080;">Type</th>
                    <th style="padding:4px 8px; border-right:1px solid #808080;">Size</th>
                    <th style="padding:4px 8px;">Date Modified</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        items.forEach(name => {
            const item = context[name];
            const isDir = item.type === "dir";
            const iconSvg = this.getItemIcon(name, item.type);
            const sizeStr = isDir ? "" : `${(new Blob([item.content || '']).size / 1024).toFixed(1)} KB`;
            const typeStr = this.getItemTypeName(name, item.type);

            const row = document.createElement('tr');
            row.className = 'explorer-table-row';
            row.dataset.itemName = name;
            row.dataset.itemType = item.type;
            row.style.cssText = `cursor:pointer; border-bottom:1px solid #f0f0f0;`;

            if (this.selectedItem === name) {
                row.style.backgroundColor = '#000080';
                row.style.color = '#ffffff';
            }

            row.innerHTML = `
                <td style="padding:3px 8px; display:flex; align-items:center; gap:6px;">
                    <span style="width:16px; height:16px;">${iconSvg}</span> ${name}
                </td>
                <td style="padding:3px 8px;">${typeStr}</td>
                <td style="padding:3px 8px;">${sizeStr}</td>
                <td style="padding:3px 8px;">${new Date().toLocaleDateString()}</td>
            `;

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedItem = name;
                this.refreshView();
            });

            row.addEventListener('dblclick', () => {
                if (isDir) {
                    const newPath = this.currentPath === "" ? name : `${this.currentPath}/${name}`;
                    this.navigateTo(newPath);
                } else {
                    this.launchFileCallback(name);
                }
            });

            tbody.appendChild(row);
        });

        container.appendChild(table);
    }

    renderSidebar(context, items) {
        const titleEl = this.container.querySelector('#exp-info-title');
        const typeEl  = this.container.querySelector('#exp-info-type');
        const descEl  = this.container.querySelector('#exp-info-desc');
        const iconEl  = this.container.querySelector('#exp-info-icon');

        if (this.currentPath === "HOME") {
            titleEl.textContent = "My Computer";
            typeEl.textContent  = "System Dashboard";
            descEl.textContent  = "Displays system drives and quick locations.";
            iconEl.innerHTML    = getIcon('computer');
        } else if (this.selectedItem && context && context[this.selectedItem]) {
            const item = context[this.selectedItem];
            titleEl.textContent = this.selectedItem;
            typeEl.textContent  = this.getItemTypeName(this.selectedItem, item.type);
            descEl.textContent  = `Selected object in Z:\\${this.currentPath ? this.currentPath.replace(/\//g, '\\') : ''}. Double-click to open.`;
            iconEl.innerHTML    = this.getItemIcon(this.selectedItem, item.type);
        } else {
            titleEl.textContent = this.currentPath === "" ? "ZebRoot (Z:)" : this.currentPath.split('/').pop();
            typeEl.textContent  = this.currentPath === "" ? "ZebOS System Volume" : "Folder";
            descEl.textContent  = "Select an item to view its description.";
            iconEl.innerHTML    = getIcon('drive');
        }

        const rootFs    = this.getVfsContext("");
        const usedBytes = new Blob([JSON.stringify(rootFs)]).size;
        const usedStr   = usedBytes < 1024 ? `${usedBytes} B` : `${(usedBytes / 1024).toFixed(1)} KB`;
        const freeMbStr = (2048 - (usedBytes / (1024 * 1024))).toFixed(0);

        const statsEl = this.container.querySelector('#exp-info-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>Capacity: 2.00 GB</div>
                <div>Used Space: ${usedStr}</div>
                <div>Free Space: ${freeMbStr} MB</div>
            `;
        }

        // Render Recursive Folder Tree Navigation
        const treeContainer = this.container.querySelector('#exp-folder-tree');
        treeContainer.innerHTML = '';

        // My Computer Home Node
        const homeNode = document.createElement('div');
        const isHome = this.currentPath === 'HOME';
        homeNode.style.cssText = `
            cursor: pointer; display: flex; align-items: center; gap: 4px;
            font-weight: ${isHome ? 'bold' : 'normal'};
            color: ${isHome ? '#000080' : '#000'};
            padding: 2px 0;
        `;
        homeNode.innerHTML = `<span style="width:14px; height:14px; display:inline-flex; align-items:center;">${getIcon('home')}</span> My Computer`;
        homeNode.addEventListener('click', () => this.navigateTo('HOME'));
        treeContainer.appendChild(homeNode);

        // Root Node (ZebRoot Z:\)
        const rootNode = document.createElement('div');
        const isRootCurrent = this.currentPath === '';
        rootNode.style.cssText = `
            cursor: pointer; display: flex; align-items: center; gap: 4px;
            padding-left: 10px;
            font-weight: ${isRootCurrent ? 'bold' : 'normal'};
            color: ${isRootCurrent ? '#000080' : '#000'};
            padding-top: 2px; padding-bottom: 2px;
        `;
        rootNode.innerHTML = `<span style="width:14px; height:14px; display:inline-flex; align-items:center;">${getIcon('drive')}</span> ZebRoot (Z:)`;
        rootNode.addEventListener('click', () => this.navigateTo(''));
        treeContainer.appendChild(rootNode);

        const renderBranch = (dirMap, parentPath = '', depth = 2) => {
            if (!dirMap || typeof dirMap !== 'object') return;
            Object.keys(dirMap).forEach(key => {
                const item = dirMap[key];
                if (item && item.type === 'dir') {
                    const fullPath = parentPath ? `${parentPath}/${key}` : key;
                    const isCurrent = this.currentPath === fullPath;
                    const node = document.createElement('div');
                    node.style.cssText = `
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        padding-left: ${depth * 10}px;
                        font-weight: ${isCurrent ? 'bold' : 'normal'};
                        color: ${isCurrent ? '#000080' : '#000'};
                        padding-top: 2px;
                        padding-bottom: 2px;
                    `;
                    node.innerHTML = `<span style="width:14px; height:14px; display:inline-flex; align-items:center;">${getIcon('folder')}</span> ${key}`;
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.navigateTo(fullPath);
                    });
                    treeContainer.appendChild(node);

                    if (item.content && typeof item.content === 'object') {
                        renderBranch(item.content, fullPath, depth + 1);
                    }
                }
            });
        };

        renderBranch(rootFs, '', 2);
    }
}
