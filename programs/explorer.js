import { getIcon } from '../icons.js';
import { showOsPrompt } from '../os.js';

export class FileExplorerApp {
    constructor(closeCallback, launchFileCallback, saveVfsCallback, getVfsContext) {
        this.closeCallback = closeCallback;
        this.launchFileCallback = launchFileCallback;
        this.saveVfsCallback = saveVfsCallback;
        this.getVfsContext = getVfsContext;

        this.currentPath = ""; // "" represents C:\
        this.history = [""];
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
                    <button class="exp-tb-btn" id="exp-tb-back" title="Back" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span class="exp-icon-wrap">${getIcon('back')}</span> Back
                    </button>
                    <button class="exp-tb-btn" id="exp-tb-up" title="Up One Level" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span class="exp-icon-wrap">${getIcon('up')}</span> Up
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
                        <span class="exp-icon-wrap" style="margin-right:4px;">${getIcon('drive')}</span>
                        <input type="text" id="exp-address-input" value="Z:\\" style="flex-grow:1; border:none; outline:none; font-family:Arial, sans-serif; font-size:12px;">
                    </div>
                </div>

                <!-- 4. Split Main Workspace Panel -->
                <div class="explorer-body-split" style="display:flex; flex-grow:1; overflow:hidden; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; margin:2px;">
                    
                    <!-- Left Sidebar (Folder Tree & Information Card) -->
                    <div class="explorer-sidebar" style="width:190px; min-width:160px; background:#c0c0c0; border-right:2px solid #808080; display:flex; flex-direction:column; padding:8px; box-sizing:border-box; overflow-y:auto;">
                        <!-- Selected / Active Folder Info Card -->
                        <div id="exp-sidebar-info" style="display:flex; flex-direction:column; gap:6px; border-bottom:1px solid #808080; padding-bottom:12px; margin-bottom:8px;">
                            <div style="width:48px; height:48px;" id="exp-info-icon">${getIcon('drive')}</div>
                            <div style="font-size:16px; font-weight:bold; color:#000080; word-break:break-all;" id="exp-info-title">ZebRoot (Z:)</div>
                            <div style="font-size:11px; color:#555;" id="exp-info-type">ZebOS System Volume</div>
                            <div style="font-size:11px; color:#333; margin-top:4px;" id="exp-info-desc">Select an item to view its description.</div>
                            <div style="margin-top:8px; font-size:11px; color:#000080;" id="exp-info-stats">
                                <div>Capacity: 2.00 GB</div>
                                <div>Free Space: 819 MB</div>
                            </div>
                        </div>

                        <!-- Mini Tree Navigation -->
                        <div style="font-weight:bold; font-size:11px; margin-bottom:4px; color:#000080;">All Folders</div>
                        <div id="exp-folder-tree" style="display:flex; flex-direction:column; gap:2px; font-size:11px;"></div>
                    </div>

                    <!-- Right Main Content Panel -->
                    <div class="explorer-main-view" style="flex-grow:1; background:#ffffff; overflow:auto; padding:6px; position:relative;">
                        <div id="exp-items-container"></div>
                    </div>
                </div>

                <!-- 5. Bottom Statusbar -->
                <div class="explorer-statusbar" style="display:flex; align-items:center; justify-content:space-between; padding:2px 8px; background:#c0c0c0; border-top:1px solid #fff; font-size:11px; color:#333;">
                    <div id="exp-status-left">0 object(s)</div>
                    <div id="exp-status-mid">Disk Free: 819 MB</div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span class="exp-icon-wrap">${getIcon('computer')}</span> Zeb Machine
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const btnUp = this.container.querySelector('#exp-tb-up');
        const btnBack = this.container.querySelector('#exp-tb-back');
        const btnNewFolder = this.container.querySelector('#exp-tb-newfolder');
        const btnDelete = this.container.querySelector('#exp-tb-delete');
        const addressInput = this.container.querySelector('#exp-address-input');

        btnUp.addEventListener('click', () => {
            if (this.currentPath !== "") {
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
            showOsPrompt("New Folder", "Type a name for the new folder:", "New Folder", (name) => {
                const context = this.getVfsContext(this.currentPath);
                context[name.trim()] = { type: "dir", content: {} };
                this.saveVfsCallback();
                this.refreshView();
            });
        });

        btnDelete.addEventListener('click', () => {
            if (this.selectedItem) {
                const context = this.getVfsContext(this.currentPath);
                delete context[this.selectedItem];
                this.selectedItem = null;
                this.saveVfsCallback();
                this.refreshView();
            }
        });

        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let target = addressInput.value.replace(/^C:\\?/i, '').replace(/\\/g, '/').trim();
                this.navigateTo(target);
            }
        });

        // View Mode Switchers
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
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(path);
        this.historyIndex = this.history.length - 1;
        this.selectedItem = null;
        this.refreshView();
    }

    refreshView() {
        const addressInput = this.container.querySelector('#exp-address-input');
        if (addressInput) {
            addressInput.value = this.currentPath === "" ? "Z:\\" : `Z:\\${this.currentPath.replace(/\//g, '\\')}`;
        }

        const context = this.getVfsContext(this.currentPath);
        const mainContainer = this.container.querySelector('#exp-items-container');
        mainContainer.innerHTML = "";

        const items = Object.keys(context || {});

        // Render according to View Mode
        if (this.viewMode === "details") {
            this.renderDetailsView(mainContainer, context, items);
        } else {
            this.renderGridView(mainContainer, context, items);
        }

        // Render Left Sidebar Tree Navigation & Info Card
        this.renderSidebar(context, items);

        // Calculate dynamic VFS storage stats
        const rootFs = this.getVfsContext("");
        const usedBytes = new Blob([JSON.stringify(rootFs)]).size;
        const usedStr = usedBytes < 1024 ? `${usedBytes} B` : `${(usedBytes / 1024).toFixed(1)} KB`;
        const freeMbStr = (2048 - (usedBytes / (1024 * 1024))).toFixed(0);

        // Update Bottom Statusbar
        const statusLeft = this.container.querySelector('#exp-status-left');
        if (statusLeft) statusLeft.textContent = `${items.length} object(s)`;

        const statusMid = this.container.querySelector('#exp-status-mid');
        if (statusMid) statusMid.textContent = `Disk Free: ${freeMbStr} MB (Used: ${usedStr})`;
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
            const iconSvg = isDir ? getIcon('folder') : getIcon('file');

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
            } else { // List
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
            const iconSvg = isDir ? getIcon('folder') : getIcon('file');
            const sizeStr = isDir ? "" : `${(new Blob([item.content || '']).size / 1024).toFixed(1)} KB`;
            const typeStr = isDir ? "File Folder" : (name.endsWith('.txt') ? "Text Document" : "System File");

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
        const typeEl = this.container.querySelector('#exp-info-type');
        const descEl = this.container.querySelector('#exp-info-desc');
        const iconEl = this.container.querySelector('#exp-info-icon');

        if (this.selectedItem && context[this.selectedItem]) {
            const item = context[this.selectedItem];
            titleEl.textContent = this.selectedItem;
            typeEl.textContent = item.type === "dir" ? "File Folder" : "Document File";
            descEl.textContent = `Selected object in Z:\\${this.currentPath}. Double-click to open.`;
            iconEl.innerHTML = item.type === "dir" ? getIcon('folder') : getIcon('file');
        } else {
            titleEl.textContent = this.currentPath === "" ? "ZebRoot (Z:)" : this.currentPath.split('/').pop();
            typeEl.textContent = this.currentPath === "" ? "ZebOS System Volume" : "Folder";
            descEl.textContent = "Select an item to view its description.";
            iconEl.innerHTML = getIcon('drive');
        }

        const rootFs = this.getVfsContext("");
        const usedBytes = new Blob([JSON.stringify(rootFs)]).size;
        const usedStr = usedBytes < 1024 ? `${usedBytes} B` : `${(usedBytes / 1024).toFixed(1)} KB`;
        const freeMbStr = (2048 - (usedBytes / (1024 * 1024))).toFixed(0);

        const statsEl = this.container.querySelector('#exp-info-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>Capacity: 2.00 GB</div>
                <div>Used Space: ${usedStr}</div>
                <div>Free Space: ${freeMbStr} MB</div>
            `;
        }

        // Render Tree Navigation
        const treeContainer = this.container.querySelector('#exp-folder-tree');
        treeContainer.innerHTML = `
            <div class="tree-node" style="cursor:pointer; display:flex; align-items:center; gap:4px; font-weight:${this.currentPath===''?'bold':'normal'}; color:${this.currentPath===''?'#000080':'#000'};">
                <span style="width:14px; height:14px; display:inline-flex; align-items:center;">${getIcon('drive')}</span> ZebRoot (Z:)
            </div>
        `;

        const rootNode = treeContainer.querySelector('.tree-node');
        rootNode.addEventListener('click', () => this.navigateTo(""));

        items.forEach(name => {
            if (context[name]?.type === "dir") {
                const node = document.createElement('div');
                const isCurrent = this.currentPath === name;
                node.style.cssText = `
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding-left: 12px;
                    font-weight: ${isCurrent ? 'bold' : 'normal'};
                    color: ${isCurrent ? '#000080' : '#000'};
                `;
                node.innerHTML = `<span style="width:14px; height:14px;">${getIcon('folder')}</span> ${name}`;
                node.addEventListener('click', () => this.navigateTo(name));
                treeContainer.appendChild(node);
            }
        });
    }
}
