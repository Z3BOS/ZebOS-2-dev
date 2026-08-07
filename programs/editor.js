// programs/editor.js
export class TextEditor {
    constructor(fileName, fileContent, onExitCallback) {
        this.fileName = fileName;
        this.content = fileContent;
        this.onExit = onExitCallback;
        
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

    // Called right after your Window Manager spawns the window frame
        // Replace the open function in programs/editor.js with this:
    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        
        // Restores your exact HTML layout from the right screenshot image
        this.bodyElement.innerHTML = `
            <div style="padding: 10px; font-family: Arial, sans-serif; font-size: 16px; color: #000000; display: flex; flex-direction: column; height: calc(100% - 20px); box-sizing: border-box;">
                
                <!-- Menu / Filename Header Strip Line -->
                <div style="margin-bottom: 8px; font-size: 18px;">
                    <span class="app-menu-item" style="cursor: pointer; font-weight: normal; margin-right: 4px;">File</span>
                    <div class="app-file-dropdown hidden-view" style="position: absolute; background: #c0c0c0; border: 1px solid black; padding: 4px; z-index: 1000; font-size: 14px; margin-top: 4px;">
                        <div class="opt-save" style="padding: 4px 8px; cursor: pointer;">Save (F2)</div>
                        <div class="opt-saveas" style="padding: 4px 8px; cursor: pointer;">Save As... (F3)</div>
                        <div class="opt-exit" style="padding: 4px 8px; cursor: pointer;">Exit (Esc)</div>
                    </div>
                    <span class="app-editor-filename">${this.fileName}</span>
                </div>

                <!-- Your Classic White Inset Text Box Element Frame -->
                <textarea class="app-editor-textarea" spellcheck="false" style="width: 175px; height: 50px; padding: 5px; font-size: 16px; border: 1px solid black; font-family: Arial, sans-serif; resize: both; box-sizing: border-box; margin-bottom: 10px; display: block;"></textarea>
                
                <!-- Hotkey Shortcut Legend Bar Line -->
                <div class="app-editor-footer" style="font-size: 18px; margin-top: auto; padding-bottom: 5px;">
                    F2: Save | F3: Save As | Esc: Exit
                </div>

            </div>
        `;

        // Map component variable references back cleanly
        this.textarea = this.bodyElement.querySelector('.app-editor-textarea');
        this.menuFile = this.bodyElement.querySelector('.app-menu-item');
        this.fileDropdown = this.bodyElement.querySelector('.app-file-dropdown');
        this.footer = this.bodyElement.querySelector('.app-editor-footer');

        // Feed original storage contents back onto the canvas array logic
        this.textarea.value = this.content;
        this.textarea.focus();

        // Bind application workspace action interceptors
        window.addEventListener('keydown', this.keyHandler);
        document.addEventListener('click', this.documentClickHandler);
        this.menuFile.addEventListener('click', this.menuToggleHandler);
        this.bodyElement.querySelector('.opt-save').addEventListener('click', this.saveClickHandler);
        this.bodyElement.querySelector('.opt-saveas').addEventListener('click', this.saveAsClickHandler);
        this.bodyElement.querySelector('.opt-exit').addEventListener('click', this.exitClickHandler);
    }


    toggleDropdown(e) {
        e.stopPropagation(); // Stops the master document click from closing it instantly
        this.fileDropdown.classList.toggle('hidden-view');
        this.menuFile.classList.toggle('active');
    }

    handleKeyDown(e) {
        // Only intercept shortcuts if this window textarea has active document focus
        if (document.activeElement !== this.textarea) return;

        if (e.key === 'F2') { e.preventDefault(); this.saveFile(); }
        if (e.key === 'F3') { e.preventDefault(); this.saveAsFile(); }
        if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    }

    saveFile() {
        this.content = this.textarea.value;
        this.hideMenu();
        this.flashFooterFeedback(`Saved: ${this.fileName}`);
    }

    saveAsFile() {
        this.hideMenu();
        const newName = prompt("Enter new filename:", this.fileName);
        if (newName === null || newName.trim() === "") {
            this.textarea.focus();
            return;
        }
        this.fileName = newName.trim();
        this.content = this.textarea.value;
        
        // Dynamically update file label readout inside menu bar
        this.bodyElement.querySelector('.app-editor-filename').textContent = this.fileName;
        
        this.flashFooterFeedback(`Saved As: ${this.fileName}`);
        this.textarea.focus();
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
        this.footer.style.color = "#000000";
        setTimeout(() => {
            if (this.footer) {
                this.footer.textContent = "F2: Save | F3: Save As | Esc: Exit";
                this.footer.style.backgroundColor = "#c0c0c0";
                this.footer.style.color = "#000000";
            }
        }, 1500);
    }

    close() {
        this.content = this.textarea.value;
        
        // Clean out active global scope window event listener intercepts cleanly
        window.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('click', this.documentClickHandler);
        
        // Find parent main window frame element and purge it from window-workspace context
        const windowFrame = this.bodyElement.closest('.window-frame');
        if (windowFrame) windowFrame.remove();
        
        // Send output data payload back to your filesystem map tracker state
        this.onExit(this.fileName, this.content);
    }
}
