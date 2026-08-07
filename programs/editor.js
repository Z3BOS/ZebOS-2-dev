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
    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        
        // Inject the complete standalone editor interface inside this specific window container
        this.bodyElement.innerHTML = `
            <div class="app-editor-container">
                <div class="app-editor-menu">
                    <span class="app-menu-item">File</span>
                    <div class="app-file-dropdown hidden-view">
                        <div class="app-dropdown-option opt-save">Save (F2)</div>
                        <div class="app-dropdown-option opt-saveas">Save As... (F3)</div>
                        <div class="app-dropdown-option opt-exit">Exit (Esc)</div>
                    </div>
                    <span class="app-editor-filename">${this.fileName}</span>
                </div>
                <textarea class="app-editor-textarea" spellcheck="false"></textarea>
                <div class="app-editor-footer">F2: Save | F3: Save As | Esc: Exit</div>
            </div>
        `;

        // Query our newly generated local elements inside the container
        this.textarea = this.bodyElement.querySelector('.app-editor-textarea');
        this.menuFile = this.bodyElement.querySelector('.app-menu-item');
        this.fileDropdown = this.bodyElement.querySelector('.app-file-dropdown');
        this.footer = this.bodyElement.querySelector('.app-editor-footer');

        // Populate initial content buffer payload
        this.textarea.value = this.content;
        this.textarea.focus();

        // Connect Event Listeners
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
