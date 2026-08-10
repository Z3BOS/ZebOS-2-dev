// programs/terminal.js - ZebOS Interactive Shell & CLI Application Suite
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

        this.isMatrixRunning = false;
        this.matrixInterval = null;

        this.startTime = Date.now();

        this.keyHandler = (e) => this.handleKeyDown(e);
        this.bodyClickHandler = () => this.inputEl && this.inputEl.focus();
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.bodyElement.innerHTML = `
            <div class="terminal-container" style="display:flex; flex-direction:column; height:100%; background:#0c0c0c; color:#d0ffd0; font-family:'Consolas','Courier New',monospace; box-sizing:border-box; padding:6px; overflow:hidden;">
                <div class="term-output" style="flex-grow:1; overflow-y:auto; white-space:pre-wrap; word-break:break-word; font-size:11px; line-height:1.35;"></div>
                <div style="display:flex; align-items:center; gap:6px; font-size:11px; flex-shrink:0; margin-top:4px;">
                    <span class="term-prompt"></span>
                    <input class="term-input" type="text" autocomplete="off" spellcheck="false" style="flex-grow:1; background:transparent; border:none; outline:none; color:inherit; font-family:inherit; font-size:11px;">
                </div>
            </div>
        `;

        this.outputEl = this.bodyElement.querySelector('.term-output');
        this.inputEl = this.bodyElement.querySelector('.term-input');
        this.promptEl = this.bodyElement.querySelector('.term-prompt');

        this.println("ZebOS Terminal Shell [Version 2.5.1]");
        this.println("Type 'help' to view all available commands and CLI apps.\n");
        this.updatePrompt();

        this.inputEl.addEventListener('keydown', this.keyHandler);
        this.bodyElement.addEventListener('click', this.bodyClickHandler);
        this.inputEl.focus();
    }

    updatePrompt() {
        this.promptEl.textContent = `${this.shell.getUsername()}@zebos:${this.shell.getPath()}$`;
    }

    println(text = "", color = null) {
        const line = document.createElement('div');
        line.textContent = text;
        if (color) line.style.color = color;
        this.outputEl.appendChild(line);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    printRawHtml(html) {
        const line = document.createElement('div');
        line.innerHTML = html;
        this.outputEl.appendChild(line);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    handleKeyDown(e) {
        if (this.isMatrixRunning) {
            this.stopMatrix();
            return;
        }

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
                this.println("  cat <file>           print a file's contents");
                this.println("  cd <dir|..|/>        change working directory");
                this.println("  calc <expr>          evaluate math expression");
                this.println("  clear                clear terminal output");
                this.println("  color <name>         change text color (green, cyan, amber, white)");
                this.println("  date                 print system date and time");
                this.println("  echo <text>          print text to output");
                this.println("  edit <file>          open file in Text Editor");
                this.println("  exit                 close terminal window");
                this.println("  fortune              print a fortune quote");
                this.println("  ls                   list directory contents");
                this.println("  matrix               digital rain screen animation");
                this.println("  mkdir <name>         create a new directory");
                this.println("  ping <host>          network ICMP latency test");
                this.println("  pwd                  print working directory");
                this.println("  rm <name>            delete a file or directory");
                this.println("  touch <name>         create an empty file");
                this.println("  top / ps             active process task manager");
                this.println("  ver                  print ZebOS build version");
                this.println("  weather <city>       ASCII weather forecast");
                this.println("  whoami               print logged in user");
                this.println("  zebfetch             system diagnostics & ASCII logo");
                break;

            case 'zebfetch':
            case 'neofetch':
            case 'sysinfo':
                this.renderSysfetch();
                break;

            case 'matrix':
            case 'cmatrix':
                this.startMatrix();
                break;

            case 'top':
            case 'htop':
            case 'ps':
                this.renderTaskManager();
                break;

            case 'calc':
                if (!args.length) { this.println("usage: calc <expression> (e.g. calc 15 * 4 + 250)"); break; }
                try {
                    const expr = args.join(' ').replace(/[^0-9+\-*/().%\s]/g, '');
                    const res = Function(`"use strict"; return (${expr})`)();
                    this.println(`${args.join(' ')} = ${res}`, "#55ff55");
                } catch (err) {
                    this.println(`calc: invalid math expression '${args.join(' ')}'`, "#ff5555");
                }
                break;

            case 'ping': {
                const target = args[0] || 'google.com';
                this.println(`PING ${target} (142.250.190.46) 56(84) bytes of data.`);
                let count = 0;
                const interval = setInterval(() => {
                    count++;
                    const ms = (10 + Math.random() * 8).toFixed(1);
                    this.println(`64 bytes from ${target}: icmp_seq=${count} ttl=115 time=${ms} ms`);
                    if (count >= 4) {
                        clearInterval(interval);
                        this.println(`--- ${target} ping statistics ---`);
                        this.println(`4 packets transmitted, 4 received, 0% packet loss, time 3012ms\n`);
                    }
                }, 500);
                break;
            }

            case 'weather': {
                const city = args.join(' ') || 'New York';
                this.println(`Weather report for ${city}:`, "#55ffff");
                this.printRawHtml(`
<pre style="margin:0; font-family:monospace; color:#ffff55;">
   \\  /       Sunny / Clear Sky
 _ /"".\\ _    Temperature: 72°F (22°C)
   \\_\\/_/     Humidity:    45%
     /  \\     Wind:        NW at 8 mph
</pre>`);
                break;
            }

            case 'fortune':
            case 'quote': {
                const quotes = [
                    '"There are only 10 types of people in the world: those who understand binary, and those who don\'t."',
                    '"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra',
                    '"First, solve the problem. Then, write the code." — John Johnson',
                    '"Experience is the name everyone gives to their mistakes." — Oscar Wilde',
                    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler'
                ];
                const choice = quotes[Math.floor(Math.random() * quotes.length)];
                this.println(choice, "#ff88ff");
                break;
            }

            case 'color':
            case 'theme': {
                const col = args[0]?.toLowerCase();
                const container = this.bodyElement.querySelector('.terminal-container');
                if (!container) break;
                if (col === 'green' || col === 'a') container.style.color = "#d0ffd0";
                else if (col === 'cyan' || col === 'b') container.style.color = "#a0ffff";
                else if (col === 'amber' || col === 'c') container.style.color = "#ffcc55";
                else if (col === 'white' || col === 'f') container.style.color = "#ffffff";
                else this.println("usage: color <green|cyan|amber|white>");
                break;
            }

            case 'ls': {
                const context = this.shell.getContext();
                const names = Object.keys(context);
                if (names.length === 0) { this.println("(empty directory)"); break; }
                names.forEach(name => {
                    const item = context[name];
                    this.println(item.type === 'dir' ? `📁 ${name}/` : `📄 ${name}`);
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
                this.println(`ZebOS 2 (Alpha Build 2.5.1)`);
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
                this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555");
        }
    }

    renderSysfetch() {
        const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(uptimeSec / 60);
        const secs = uptimeSec % 60;

        const ascii = `
 <span style="color:#00ffff; font-weight:bold;">  _____  ______ _____   ____   _____  ___ </span>
 <span style="color:#00ffff; font-weight:bold;"> / _  / / __  // __  \\ / __ \\ / ___/ |__ \\</span>
 <span style="color:#00aaff; font-weight:bold;">/ /_/ / / ___// /_/ // /_/ /(____ \\  __/ /</span>
 <span style="color:#00aaff; font-weight:bold;">/___/\\_\\/____/ \\____/ \\____//____/ /____/ </span>

<span style="color:#ffff55;">OS:</span>         ZebOS 2 (Alpha Build 2.5.1)
<span style="color:#ffff55;">Kernel:</span>     ZebOS VFS Hardened Engine v2.5.1
<span style="color:#ffff55;">User:</span>       ${this.shell.getUsername()}
<span style="color:#ffff55;">Shell:</span>      ZebShell (zebsh) v2.5.1
<span style="color:#ffff55;">Uptime:</span>     ${mins}m ${secs}s
<span style="color:#ffff55;">Memory:</span>     512 MB / 2048 MB (VFS Persistent)
<span style="color:#ffff55;">Palette:</span>    <span style="color:#000000; background:#000000;">  </span><span style="color:#ff5555; background:#ff5555;">  </span><span style="color:#55ff55; background:#55ff55;">  </span><span style="color:#ffff55; background:#ffff55;">  </span><span style="color:#5555ff; background:#5555ff;">  </span><span style="color:#ff55ff; background:#ff55ff;">  </span><span style="color:#55ffff; background:#55ffff;">  </span><span style="color:#ffffff; background:#ffffff;">  </span>
`;
        this.printRawHtml(`<pre style="margin:0; font-family:monospace;">${ascii}</pre>`);
    }

    renderTaskManager() {
        const windows = Array.from(document.querySelectorAll('.app-window')).map((w, idx) => {
            const title = w.querySelector('.window-title')?.textContent || 'App Window';
            return `  ${1000 + idx * 4}  ${title.padEnd(24)}  Running   0.${Math.floor(Math.random()*9)}%   ${12 + idx * 4} MB`;
        });

        this.println("PID   PROCESS NAME              STATUS    CPU%    RAM", "#55ffff");
        this.println("-------------------------------------------------------");
        this.println("  1000  Desktop Shell Engine      Running   0.2%    18 MB");
        this.println("  1004  VFS LocalStorage Daemon   Running   0.1%     8 MB");
        if (windows.length) windows.forEach(w => this.println(w));
        this.println("-------------------------------------------------------");
    }

    startMatrix() {
        this.isMatrixRunning = true;
        this.outputEl.innerHTML = "";
        this.println("--- Press ENTER or ANY KEY to stop Matrix animation ---", "#55ff55");
        
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
        this.matrixInterval = setInterval(() => {
            let line = "";
            for (let i = 0; i < 60; i++) {
                line += Math.random() > 0.4 ? chars[Math.floor(Math.random() * chars.length)] : " ";
            }
            this.println(line, "#00ff00");
        }, 80);
    }

    stopMatrix() {
        this.isMatrixRunning = false;
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
            this.matrixInterval = null;
        }
        this.println("\nMatrix animation stopped.\n", "#55ffff");
        this.updatePrompt();
    }

    cleanup() {
        if (this.matrixInterval) clearInterval(this.matrixInterval);
        if (this.inputEl) this.inputEl.removeEventListener('keydown', this.keyHandler);
        if (this.bodyElement) this.bodyElement.removeEventListener('click', this.bodyClickHandler);
    }
}
