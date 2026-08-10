// programs/editor.js - ZebOS 2 Pro Retro Text Editor (Notepad)
import { getIcon } from '../icons.js';
import { showOsPrompt } from '../os.js';

const W95_CHECKMARK_SVG = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="display:block;margin:0;padding:0;"><path d="M1.5 4.5L3.5 6.5L7.5 1.5" stroke="#000000" stroke-width="1.8" stroke-linecap="square"/></svg>`;

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
                        <div class="editor-dropdown hidden-view" id="menu-edit-drop" style="display:none; position:absolute; top:100%; left:0; background:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:2px 2px 5px rgba(0,0,0,0.3); z-index:99999; min-width:170px; padding:2px 0;">
                            <div class="dropdown-opt opt-undo" style="padding:4px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;"><span>Undo</span><span style="font-size:10px; color:#666; margin-left:16px;">Ctrl+Z</span></div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            <div class="dropdown-opt opt-cut" style="padding:4px 14px; cursor:pointer;">Cut</div>
                            <div class="dropdown-opt opt-copy" style="padding:4px 14px; cursor:pointer;">Copy</div>
                            <div class="dropdown-opt opt-paste" style="padding:4px 14px; cursor:pointer;">Paste</div>
                            <div style="height:1px; background:#808080; margin:3px 1px; border-bottom:1px solid #fff;"></div>
                            
                            <!-- Custom Win95 Checkbox for Word Wrap -->
                            <div class="dropdown-opt opt-wordwrap" style="padding:4px 14px; cursor:pointer; display:flex; align-items:center; gap:8px;">
                                <div id="editor-wrap-box" style="width:13px;height:13px;background:#fff;border:2px solid #808080;border-right-color:#fff;border-bottom-color:#fff;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;">${W95_CHECKMARK_SVG}</div>
                                <span>Word Wrap</span>
                            </div>
                            
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

                <!-- 2. Text Area Content Canvas Block with Sunken 3D Border -->
                <div style="flex-grow:1; display:flex; flex-direction:column; padding:2px; background:#c0c0c0; overflow:hidden;">
                    <div style="flex-grow:1; display:flex; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff;">
                        <textarea class="app-editor-textarea" spellcheck="false" style="flex-grow:1; width:100%; height:100%; border:none; outline:none; padding:8px 10px; font-family:'Courier New', Consolas, monospace; font-size:13px; line-height:1.4; resize:none; box-sizing:border-box; background:#ffffff; color:#000000; display:block; margin:0;"></textarea>
                    </div>
                </div>

                <!-- 3. Win95 Inset Statusbar -->
                <div class="editor-statusbar" style="display:flex; align-items:center; justify-content:space-between; padding:3px 8px; background:#c0c0c0; border-top:1px solid #fff; font-size:11px; color:#333; flex-shrink:0;">
                    <div id="editor-line-col" style="min-width:90px;">Ln 1, Col 1</div>
                    <div id="editor-stats">0 chars | 0 words</div>
                    <div id="editor-footer-hint" style="color:#000080; font-weight:bold;" class="app-editor-filename">Z:\\${this.fileName}</div>
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

        // Word wrap dropdown toggle
        const wrapOpt = this.bodyElement.querySelector('.opt-wordwrap');
        if (wrapOpt) {
            wrapOpt.addEventListener('click', (e) => {
                e.stopPropagation();
                this.wordWrap = !this.wordWrap;
                const box = this.bodyElement.querySelector('#editor-wrap-box');
                if (box) box.innerHTML = this.wordWrap ? W95_CHECKMARK_SVG : '';
                this.textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
                this.hideAllMenus();
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
        this.bodyElement.querySelectorAll('.opt-find').forEach(el => el.addEventListener('click', () => this.showFindDialog()));
        this.bodyElement.querySelectorAll('.opt-about').forEach(el => el.addEventListener('click', () => this.showAboutDialog()));

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
        if (e.key === 'F4' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
            e.preventDefault();
            this.showFindDialog();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    showFindDialog() {
        this.hideAllMenus();
        showOsPrompt("Find Text", "Enter text string to find in document:", this.lastSearchQuery || "", (query) => {
            if (!query) return;
            this.lastSearchQuery = query;
            const text = this.textarea.value;
            const searchLower = query.toLowerCase();
            const startPos = (this.textarea.selectionEnd || 0);
            let index = text.toLowerCase().indexOf(searchLower, startPos);
            
            if (index === -1) {
                index = text.toLowerCase().indexOf(searchLower, 0);
            }

            if (index !== -1) {
                this.textarea.focus();
                this.textarea.setSelectionRange(index, index + query.length);
                this.flashFooterFeedback(`Found: "${query}"`);
            } else {
                this.flashFooterFeedback(`Cannot find "${query}"`);
            }
        });
    }

    showAboutDialog() {
        this.hideAllMenus();
        const modal = document.createElement('div');
        modal.className = 'os-prompt-modal active-window';
        modal.style.cssText = `
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 320px !important;
            background-color: #c0c0c0;
            border: 2px solid #ffffff;
            border-right-color: #000000;
            border-bottom-color: #000000;
            box-shadow: 4px 4px 16px rgba(0,0,0,0.5);
            z-index: 100001;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        `;

        modal.innerHTML = `
            <div class="window-header">
                <div class="window-title">About Text Editor</div>
                <div class="window-controls">
                    <button class="win-btn" id="about-close-btn">${getIcon('winClose')}</button>
                </div>
            </div>
            <div style="padding:16px; display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:36px; height:36px; flex-shrink:0;">${getIcon('editor')}</div>
                    <div>
                        <div style="font-weight:bold; font-size:14px; color:#000080;">ZebOS Text Editor</div>
                        <div style="font-size:11px; color:#555;">Version 2.5.0 (Build 2026)</div>
                    </div>
                </div>
                <div style="height:1px; background:#808080; border-bottom:1px solid #fff;"></div>
                <div style="font-size:11px; line-height:1.4; color:#222;">
                    Copyright © 2026 ZebOS System Utilities.<br>
                    A retro plain-text editor featuring Win95 menubars, live stats, and VFS file management.
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:6px;">
                    <button id="about-ok-btn" style="padding:4px 20px; background:#c0c0c0; border:2px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; font-weight:bold;">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeAbout = () => modal.remove();
        modal.querySelector('#about-close-btn').addEventListener('click', closeAbout);
        modal.querySelector('#about-ok-btn').addEventListener('click', closeAbout);
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
                    hintEl.textContent = `Z:\\${this.fileName}`;
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
