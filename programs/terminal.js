// programs/terminal.js
// A small shell over the ZebOS virtual filesystem. os.js hands in a
// `shell` object (see the start-link-prompt case in launchApplication)
// so this file never touches systemState directly.
export class ZebTerminal {
    constructor(onCloseRequest, shell) {
        this.onCloseRequest = onCloseRequest;
        this.shell = shell;

        this.bodyElement = null;
        this.outputEl = null;
        this.inputEl = null;
        this.promptEl = null;
        this.history = [];
        this.historyIndex = -1;

        this.keyHandler = (e) => this.handleKeyDown(e);
        this.bodyClickHandler = () => this.inputEl && this.inputEl.focus();
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#0c0c0c; color:#d0ffd0; font-family:'Consolas','Courier New',monospace; box-sizing:border-box; padding:8px; overflow:hidden;">
                <div class="term-output" style="flex-grow:1; overflow-y:auto; white-space:pre-wrap; word-break:break-word; font-size:0.95em; line-height:1.4;"></div>
                <div style="display:flex; align-items:center; gap:6px; font-size:0.95em; flex-shrink:0;">
                    <span class="term-prompt"></span>
                    <input class="term-input" type="text" autocomplete="off" spellcheck="false" style="flex-grow:1; background:transparent; border:none; outline:none; color:#d0ffd0; font-family:inherit; font-size:1em;">
                </div>
            </div>
        `;

        this.outputEl = this.bodyElement.querySelector('.term-output');
        this.inputEl = this.bodyElement.querySelector('.term-input');
        this.promptEl = this.bodyElement.querySelector('.term-prompt');

        this.println("ZebOS Terminal — type 'help' for a list of commands.");
        this.updatePrompt();

        this.inputEl.addEventListener('keydown', this.keyHandler);
        this.bodyElement.addEventListener('click', this.bodyClickHandler);
        this.inputEl.focus();
    }

    updatePrompt() {
        this.promptEl.textContent = `${this.shell.getUsername()}@zebos:${this.shell.getPath()}$`;
    }

    println(text = "") {
        const line = document.createElement('div');
        line.textContent = text;
        this.outputEl.appendChild(line);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            const raw = this.inputEl.value;
            this.println(`${this.promptEl.textContent} ${raw}`);
            this.inputEl.value = "";
            if (raw.trim() !== "") {
                this.history.push(raw);
                this.historyIndex = this.history.length;
                this.runCommand(raw.trim());
            }
            this.updatePrompt();
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputEl.value = this.history[this.historyIndex];
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.inputEl.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.inputEl.value = "";
            }
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    runCommand(raw) {
        const parts = raw.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                this.println("Available commands:");
                this.println("  ls                list files in the current directory");
                this.println("  cd <dir|..|/>     change directory");
                this.println("  pwd               print working directory");
                this.println("  cat <file>        print a file's contents");
                this.println("  mkdir <name>      create a directory");
                this.println("  touch <name>      create an empty file");
                this.println("  rm <name>         delete a file or directory");
                this.println("  edit <file>       open a file in the Text Editor");
                this.println("  whoami            print the current user");
                this.println("  ver               print the ZebOS version");
                this.println("  date              print the current date and time");
                this.println("  echo <text>       print text");
                this.println("  clear             clear the screen");
                this.println("  exit              close the terminal");
                break;

            case 'ls': {
                const context = this.shell.getContext();
                const names = Object.keys(context);
                if (names.length === 0) { this.println("(empty directory)"); break; }
                names.forEach(name => {
                    const item = context[name];
                    this.println(item.type === 'dir' ? `${name}/` : name);
                });
                break;
            }

            case 'pwd':
                this.println(this.shell.getPath());
                break;

            case 'cd': {
                const result = this.shell.changeDirectory(args[0] || "/");
                if (!result.ok) this.println(result.message);
                break;
            }

            case 'cat': {
                if (!args[0]) { this.println("usage: cat <file>"); break; }
                const context = this.shell.getContext();
                const item = context[args[0]];
                if (!item) this.println(`cat: ${args[0]}: No such file`);
                else if (item.type === 'dir') this.println(`cat: ${args[0]}: Is a directory`);
                else this.println(item.content);
                break;
            }

            case 'mkdir': {
                if (!args[0]) { this.println("usage: mkdir <name>"); break; }
                this.println(this.shell.mkdir(args[0]).message);
                break;
            }

            case 'touch': {
                if (!args[0]) { this.println("usage: touch <name>"); break; }
                this.println(this.shell.touch(args[0]).message);
                break;
            }

            case 'rm': {
                if (!args[0]) { this.println("usage: rm <name>"); break; }
                this.println(this.shell.remove(args[0]).message);
                break;
            }

            case 'edit':
            case 'open': {
                if (!args[0]) { this.println(`usage: ${cmd} <file>`); break; }
                const context = this.shell.getContext();
                if (!context[args[0]] || context[args[0]].type !== 'file') {
                    this.println(`${cmd}: ${args[0]}: No such file`);
                    break;
                }
                this.shell.openInEditor(args[0]);
                break;
            }

            case 'whoami':
                this.println(this.shell.getUsername());
                break;

            case 'ver':
                this.println(`ZebOS 2 (Alpha v${this.shell.getVersion()})`);
                break;

            case 'date':
                this.println(new Date().toString());
                break;

            case 'echo':
                this.println(args.join(' '));
                break;

            case 'clear':
                this.outputEl.innerHTML = "";
                break;

            case 'exit':
                this.onCloseRequest();
                break;

            default:
                this.println(`zebsh: command not found: ${cmd}`);
        }
    }

    cleanup() {
        if (this.inputEl) this.inputEl.removeEventListener('keydown', this.keyHandler);
        if (this.bodyElement) this.bodyElement.removeEventListener('click', this.bodyClickHandler);
    }
}
