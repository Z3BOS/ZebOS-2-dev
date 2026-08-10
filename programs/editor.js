// programs/editor.js - ZebOS 2 Pro Retro Text Editor (Notepad)
import { getIcon } from '../icons.js';
import { showOsPrompt } from '../os.js';

export class TextEditor {
    constructor(fileName, fileContent, onExitCallback, onCloseRequest) {
        this.fileName = fileName;
        this.content = fileContent || "";
        this.onExit = onExitCallback;
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.textarea = null;
        this.wordWrap = true;
        this.activeMenu = null;

        // Bound Event Handlers for Clean Memory Management Cleanup
        this.keyHandler = (e) => this.handleKeyDown(e);
        this.documentClickHandler = (e) => this.handleDocumentClick(e);
        this.selectionHandler = () => this.updateCursorStats();
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;

        // Force structural fluid scaling behavior directly on parent window body
        this.bodyElement.style.display = "flex";
        this.bodyElement.style.flexDirection = "column";
        this.bodyElement.style.height = "100%";
        this.bodyElement.style.margin = "0";
        this.bodyElement.style.padding = "0";

        this.renderLayout();
        this.bindEvents();
        this.updateCursorStats();
    }

    renderLayout() {
        this.bodyElement.innerHTML = `
            <div class="editor-window-layout" style="display:flex; flex-direction:column; height:100%; width:100%; background-color:#c0c0c0; user-select:none; font-family:Arial, sans-serif; font-size:12px; box-sizing:border-box; overflow:hidden;">
                
                <!-- 1. Win95 Standard Menubar -->
                <div class="editor-menubar" style="display:flex; gap:2px; padding:2px 4px; background:#c0c0c0; border-bottom:1px solid #808080; font-size:12px; position:relative; flex-shrink:0;">
                    
                    <!-- File Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="editor-menu-btn" data-menu="file" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>F</u>ile</span>
                        <div class="editor-dropdown hidden-view" id="menu-file-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:2px 2px 5px rgba(0,0,0,0.3); z-index:99999; min-width:160px; padding:2px 0;">
                            <div class="dropdown-opt opt-save" style="padding:4px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>Save</span><span style="font-size:10px; color:#666; margin-left:16px;">F2</span></div>
                            <div class="dropdown-opt opt-saveas" style="padding:4px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>Save As...</span><span style="font-size:10px; color:#666; margin-left:16px;">F3</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="dropdown-opt opt-exit" style="padding:4px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>Exit</span><span style="font-size:10px; color:#666; margin-left:16px;">Esc</span></div>
                        </div>
                    </div>

                    <!-- Edit Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="editor-menu-btn" data-menu="edit" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>E</u>dit</span>
                        <div class="editor-dropdown hidden-view" id="menu-edit-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:2px 2px 5px rgba(0,0,0,0.3); z-index:99999; min-width:160px; padding:2px 0;">
                            <div class="dropdown-opt opt-undo" style="padding:4px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>Undo</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+Z</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="dropdown-opt opt-cut" style="padding:4px 14px; cursor:pointer;">Cut</div>
                            <div class="dropdown-opt opt-copy" style="padding:4px 14px; cursor:pointer;">Copy</div>
                            <div class="dropdown-opt opt-paste" style="padding:4px 14px; cursor:pointer;">Paste</div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="dropdown-opt opt-selectall" style="padding:4px 14px; cursor:pointer;">Select All</div>
                        </div>
                    </div>

                    <!-- Search Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="editor-menu-btn" data-menu="search" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>S</u>earch</span>
                        <div class="editor-dropdown hidden-view" id="menu-search-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:2px 2px 5px rgba(0,0,0,0.3); z-index:99999; min-width:140px; padding:2px 0;">
                            <div class="dropdown-opt opt-find" style="padding:4px 14px; cursor:pointer;">Find...</div>
                        </div>
                    </div>

                    <!-- Help Menu -->
                    <div class="menu-item-wrap" style="position:relative;">
                        <span class="editor-menu-btn" data-menu="help" style="padding:2px 8px; cursor:pointer; display:inline-block;"><u>H</u>elp</span>
                        <div class="editor-dropdown hidden-view" id="menu-help-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:2px 2px 5px rgba(0,0,0,0.3); z-index:99999; min-width:160px; padding:2px 0;">
                            <div class="dropdown-opt opt-about" style="padding:4px 14px; cursor:pointer;">About Text Editor</div>
                        </div>
                    </div>
                </div>

                <!-- 2. Standard Win95 Quick Toolbar -->
                <div class="editor-toolbar" style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:#c0c0c0; border-bottom:1px solid #808080; flex-shrink:0; flex-wrap:wrap;">
                    <button class="exp-tb-btn opt-save" title="Save File (F2)" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span style="width:14px;height:14px;display:inline-flex;align-items:center;">${getIcon('file')}</span> Save
                    </button>
                    <button class="exp-tb-btn opt-saveas" title="Save As (F3)" style="display:flex; align-items:center; gap:4px; padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">
                        <span style="width:14px;height:14px;display:inline-flex;align-items:center;">${getIcon('editor')}</span> Save As
                    </button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <button class="exp-tb-btn opt-cut" title="Cut" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Cut</button>
                    <button class="exp-tb-btn opt-copy" title="Copy" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Copy</button>
                    <button class="exp-tb-btn opt-paste" title="Paste" style="padding:2px 6px; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer;">Paste</button>
                    <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                    <label style="display:flex; align-items:center; gap:4px; font-size:11px; cursor:pointer; user-select:none;">
                        <input type="checkbox" id="editor-wrap-check" checked style="accent-color:#000080;"> Word Wrap
                    </label>
                    <div style="margin-left:auto; font-size:11px; font-weight:bold; color:#000080; padding-right:4px;" class="app-editor-filename">Z:\\${this.fileName}</div>
                </div>

                <!-- 3. Text Area Content Canvas Block with Sunken 3D Border -->
                <div style="flex-grow:1; display:flex; flex-direction:column; padding:2px; background:#c0c0c0; overflow:hidden;">
                    <div style="flex-grow:1; display:flex; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff;">
                        <textarea class="app-editor-textarea" spellcheck="false" style="flex-grow:1; width:100%; height:100%; border:none; outline:none; padding:8px 10px; font-family:'Courier New', Consolas, monospace; font-size:13px; line-height:1.4; resize:none; box-sizing:border-box; background:#ffffff; color:#000000; display:block; margin:0;"></textarea>
                    </div>
                </div>

                <!-- 4. Win95 Inset Statusbar -->
                <div class="editor-statusbar" style="display:flex; align-items:center; justify-content:space-between; padding:3px 8px; background:#c0c0c0; border-top:1px solid #fff; font-size:11px; color:#333; flex-shrink:0;">
                    <div id="editor-line-col" style="min-width:90px;">Ln 1, Col 1</div>
                    <div id="editor-stats">0 chars | 0 words</div>
                    <div id="editor-footer-hint" style="color:#000080; font-weight:bold;">F2: Save | F3: Save As | Esc: Exit</div>
                </div>
            </div>
        `;

        this.textarea = this.bodyElement.querySelector('.app-editor-textarea');
        this.textarea.value = this.content;
    }

    bindEvents() {
        this.textarea.focus();

        // Keyboard shortcuts
        window.addEventListener('keydown', this.keyHandler);
        document.addEventListener('click', this.documentClickHandler);

        // Selection & cursor change listeners for dynamic line/col counter
        this.textarea.addEventListener('keyup', this.selectionHandler);
        this.textarea.addEventListener('click', this.selectionHandler);

        // Word wrap checkbox
        const wrapCheck = this.bodyElement.querySelector('#editor-wrap-check');
        if (wrapCheck) {
            wrapCheck.addEventListener('change', (e) => {
                this.wordWrap = e.target.checked;
                this.textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
            });
        }

        // Menubar buttons & dropdown hover/click handling
        const menuBtns = this.bodyElement.querySelectorAll('.editor-menu-btn');
        menuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuName = btn.dataset.menu;
                this.toggleMenu(menuName, btn);
            });
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#000080';
                btn.style.color = '#ffffff';
            });
            btn.addEventListener('mouseleave', () => {
                if (this.activeMenu !== btn.dataset.menu) {
                    btn.style.background = 'transparent';
                    btn.style.color = '#000000';
                }
            });
        });

        // Dropdown option click handlers
        this.bodyElement.querySelectorAll('.opt-save').forEach(el => el.addEventListener('click', () => this.saveFile()));
        this.bodyElement.querySelectorAll('.opt-saveas').forEach(el => el.addEventListener('click', () => this.saveAsFile()));
        this.bodyElement.querySelectorAll('.opt-exit').forEach(el => el.addEventListener('click', () => this.close()));

        this.bodyElement.querySelectorAll('.opt-cut').forEach(el => el.addEventListener('click', () => {
            document.execCommand('cut');
            this.hideAllMenus();
        }));
        this.bodyElement.querySelectorAll('.opt-copy').forEach(el => el.addEventListener('click', () => {
            document.execCommand('copy');
            this.hideAllMenus();
        }));
        this.bodyElement.querySelectorAll('.opt-paste').forEach(el => el.addEventListener('click', () => {
            document.execCommand('paste');
            this.hideAllMenus();
        }));
        this.bodyElement.querySelectorAll('.opt-selectall').forEach(el => el.addEventListener('click', () => {
            this.textarea.select();
            this.hideAllMenus();
        }));
        this.bodyElement.querySelectorAll('.opt-undo').forEach(el => el.addEventListener('click', () => {
            document.execCommand('undo');
            this.hideAllMenus();
        }));

        // Dropdown options hover styling
        this.bodyElement.querySelectorAll('.dropdown-opt').forEach(opt => {
            opt.addEventListener('mouseenter', () => {
                opt.style.background = '#000080';
                opt.style.color = '#ffffff';
            });
            opt.addEventListener('mouseleave', () => {
                opt.style.background = 'transparent';
                opt.style.color = '#000000';
            });
        });
    }

    toggleMenu(menuName, btnEl) {
        const drop = this.bodyElement.querySelector(`#menu-${menuName}-drop`);
        if (this.activeMenu === menuName) {
            this.hideAllMenus();
            return;
        }
        this.hideAllMenus();
        this.activeMenu = menuName;
        btnEl.style.background = '#000080';
        btnEl.style.color = '#ffffff';

        if (drop) {
            drop.classList.remove('hidden-view');
            drop.style.display = 'block';
        }
    }

    hideAllMenus() {
        this.activeMenu = null;
        this.bodyElement.querySelectorAll('.editor-dropdown').forEach(d => {
            d.classList.add('hidden-view');
            d.style.display = 'none';
        });
        this.bodyElement.querySelectorAll('.editor-menu-btn').forEach(b => {
            b.style.background = 'transparent';
            b.style.color = '#000000';
        });
    }

    handleDocumentClick(e) {
        if (e.target.closest && e.target.closest('.menu-item-wrap')) return;
        this.hideAllMenus();
    }

    handleKeyDown(e) {
        if (document.activeElement !== this.textarea) return;

        if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 's')) {
            e.preventDefault();
            this.saveFile();
        }
        if (e.key === 'F3') {
            e.preventDefault();
            this.saveAsFile();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    updateCursorStats() {
        if (!this.textarea) return;
        const val = this.textarea.value;
        const selStart = this.textarea.selectionStart || 0;

        const lines = val.substring(0, selStart).split('\n');
        const lineNum = lines.length;
        const colNum = lines[lines.length - 1].length + 1;

        const charCount = val.length;
        const wordCount = val.trim() ? val.trim().split(/\s+/).length : 0;

        const lineColEl = this.bodyElement.querySelector('#editor-line-col');
        if (lineColEl) lineColEl.textContent = `Ln ${lineNum}, Col ${colNum}`;

        const statsEl = this.bodyElement.querySelector('#editor-stats');
        if (statsEl) statsEl.textContent = `${charCount} chars | ${wordCount} words`;
    }

    saveFile() {
        this.content = this.textarea.value;
        this.hideAllMenus();

        this.onExit(this.fileName, this.content);
        this.flashFooterFeedback(`Saved: ${this.fileName}`);
    }

    saveAsFile() {
        this.hideAllMenus();
        showOsPrompt("Save As", "Enter new filename to save as:", this.fileName, (newName) => {
            this.fileName = newName.trim();
            this.content = this.textarea.value;

            const filenameEls = this.bodyElement.querySelectorAll('.app-editor-filename');
            filenameEls.forEach(el => el.textContent = `Z:\\${this.fileName}`);

            this.onExit(this.fileName, this.content);
            this.flashFooterFeedback(`Saved as: ${this.fileName}`);
            this.textarea.focus();
        });
    }

    flashFooterFeedback(message) {
        const hintEl = this.bodyElement.querySelector('#editor-footer-hint');
        if (hintEl) {
            hintEl.textContent = message;
            hintEl.style.color = "#008000";
            setTimeout(() => {
                if (hintEl) {
                    hintEl.textContent = "F2: Save | F3: Save As | Esc: Exit";
                    hintEl.style.color = "#000080";
                }
            }, 1800);
        }
    }

    close() {
        this.content = this.textarea.value;
        this.onExit(this.fileName, this.content);
        this.onCloseRequest();
    }
}
