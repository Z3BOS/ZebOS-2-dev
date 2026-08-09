// programs/editor.js
import { showOsPrompt } from '../os.js';

export class TextEditor {
    constructor(fileName, fileContent, onExitCallback, onCloseRequest) {
        this.fileName = fileName;
        this.content = fileContent;
        this.onExit = onExitCallback;
        this.onCloseRequest = onCloseRequest;
        
        this.bodyElement = null;
        this.textarea = null;
        this.fileDropdown = null;
        this.menuFile = null;
        this.footer = null;

        // Bound Event Handlers for Clean Memory Management Cleanup
        this.keyHandler = (e) => this.handleKeyDown(e);
        this.menuToggleHandler = (e) => this.toggleDropdown(e);
        this.saveClickHandler = () => this.saveFile();
        this.saveAsClickHandler = () => this.saveAsFile();
        this.exitClickHandler = () => this.close();
        this.documentClickHandler = () => this.hideMenu();
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        
        // Force structural fluid scaling behavior directly on parent window body
        this.bodyElement.style.display = "flex";
        this.bodyElement.style.flexDirection = "column";
        this.bodyElement.style.height = "100%";
        this.bodyElement.style.margin = "0";
        this.bodyElement.style.padding = "0";

        // Injects your exact layout preference with fluid 100% canvas bounds
        this.bodyElement.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background-color: #ffffff; box-sizing: border-box; font-family: Arial, sans-serif;">
                
                <!-- Menu / Filename Header Strip Line -->
                <div style="background-color: #c0c0c0; color: #000000; padding: 4px 10px; font-size: 14px; border-bottom: 2px solid #808080; position: relative; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; flex-shrink: 0; height: 32px;">
                    <span class="app-menu-item" style="cursor: pointer; font-weight: bold; padding: 2px 6px;">File</span>
                    <div class="app-file-dropdown hidden-view" style="position: absolute; top: 28px; left: 10px; background-color: #c0c0c0; color: #000000; border: 2px solid #ffffff; border-right-color: #000000; border-bottom-color: #000000; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3); z-index: 1000; min-width: 120px;">
                        <div class="opt-save" style="padding: 6px 12px; cursor: pointer;">Save (F2)</div>
                        <div class="opt-saveas" style="padding: 6px 12px; cursor: pointer;">Save As... (F3)</div>
                        <div class="opt-exit" style="padding: 6px 12px; cursor: pointer;">Exit (Esc)</div>
                    </div>
                    <span class="app-editor-filename" style="font-size: 13px; font-weight: bold; color: #404040; padding-right: 6px;">${this.fileName}</span>
                </div>

                <!-- Standalone Text Area Content Block (Fills full frame fluidly) -->
                <textarea class="app-editor-textarea" spellcheck="false" style="flex-grow: 1; width: 100%; border: none; outline: none; padding: 12px; font-family: monospace; font-size: 1.05em; resize: none; box-sizing: border-box; background-color: #ffffff; color: #000000; display: block; margin: 0;"></textarea>
                
                <!-- Full-Width Bottom Hotkey Shortcut Assist Strip -->
                <div class="app-editor-footer" style="background-color: #c0c0c0; color: #000000; padding: 4px 10px; font-size: 13px; font-weight: bold; border-top: 2px solid #ffffff; flex-shrink: 0; box-sizing: border-box; height: 28px; display: flex; align-items: center;">
                    F2: Save | F3: Save As | Esc: Exit
                </div>
            </div>
        `;

        this.textarea = this.bodyElement.querySelector('.app-editor-textarea');
        this.menuFile = this.bodyElement.querySelector('.app-menu-item');
        this.fileDropdown = this.bodyElement.querySelector('.app-file-dropdown');
        this.footer = this.bodyElement.querySelector('.app-editor-footer');

        this.textarea.value = this.content;
        this.textarea.focus();

        window.addEventListener('keydown', this.keyHandler);
        document.addEventListener('click', this.documentClickHandler);
        this.menuFile.addEventListener('click', this.menuToggleHandler);
        this.bodyElement.querySelector('.opt-save').addEventListener('click', this.saveClickHandler);
        this.bodyElement.querySelector('.opt-saveas').addEventListener('click', this.saveAsClickHandler);
        this.bodyElement.querySelector('.opt-exit').addEventListener('click', this.exitClickHandler);
    }

    toggleDropdown(e) {
        e.stopPropagation(); 
        this.fileDropdown.classList.toggle('hidden-view');
        this.menuFile.classList.toggle('active');
    }

    handleKeyDown(e) {
        if (document.activeElement !== this.textarea) return;

        if (e.key === 'F2') { e.preventDefault(); this.saveFile(); }
        if (e.key === 'F3') { e.preventDefault(); this.saveAsFile(); }
        if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    }

    saveFile() {
        this.content = this.textarea.value;
        this.hideMenu();
        
        // FIX: Notify the OS kernel callback that a write action happened to sync disk sectors
        this.onExit(this.fileName, this.content);
        
        this.flashFooterFeedback(`Saved: ${this.fileName}`);
    }

    saveAsFile() {
        this.hideMenu();
        showOsPrompt("Save As", "Enter new filename to save as:", this.fileName, (newName) => {
            this.fileName = newName.trim();
            this.content = this.textarea.value;
            
            const titleEl = this.bodyElement.querySelector('.app-editor-filename');
            if (titleEl) titleEl.textContent = this.fileName;
            
            this.onExit(this.fileName, this.content);
            this.flashFooterFeedback(`Saved as: ${this.fileName}`);
            this.textarea.focus();
        });
    }

    hideMenu() {
        if (this.fileDropdown) {
            this.fileDropdown.classList.add('hidden-view');
            this.menuFile.classList.remove('active');
        }
    }

    flashFooterFeedback(message) {
        this.footer.textContent = message;
        this.footer.style.backgroundColor = "#55ff55";
        setTimeout(() => {
            if (this.footer) {
                this.footer.textContent = "F2: Save | F3: Save As | Esc: Exit";
                this.footer.style.backgroundColor = "#c0c0c0";
            }
        }, 1500);
    }

    close() {
        this.content = this.textarea.value;
        this.onExit(this.fileName, this.content);
        this.onCloseRequest();
    }
}
