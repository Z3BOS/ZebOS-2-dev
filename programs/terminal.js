// programs/terminal.js - ZebOS Interactive Shell & CLI Application Suite
import { BaseApp } from '../UIKit/framework/index.js';

export class ZebTerminal extends BaseApp {
    constructor(onCloseRequest, shell) {
        super(onCloseRequest);
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
        this.fakeSerial = this.generateFakeSerial();

        this.keyHandler = (e) => this.handleKeyDown(e);
        this.bodyClickHandler = () => this.inputEl && this.inputEl.focus();
    }

    mount() {
        this.bodyElement = this.body;
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

        this.println("ZebOS Terminal Shell [Version 2.7.0]");
        this.println("Type 'help' to view all available commands and CLI apps.\n");
        this.updatePrompt();

        this.listen(this.inputEl, 'keydown', this.keyHandler);
        this.listen(this.bodyElement, 'click', this.bodyClickHandler);
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
            this.close();
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
                this.println("  ls                   list directory contents");
                this.println("  matrix               digital rain screen animation");
                this.println("  mkdir <name>         create a new directory");
                this.println("  mosys <cmd> <sub>    platform/firmware diagnostics (try 'mosys help')");
                this.println("  ping <host>          network ICMP latency test");
                this.println("  pwd                  print working directory");
                this.println("  rm <name>            delete a file or directory");
                this.println("  touch <name>         create an empty file");
                this.println("  top / ps             active process task manager");
                this.println("  ver                  print ZebOS build version");
                this.println("  whoami               print logged in user");
                this.println("  zebfetch             system diagnostics & ASCII logo, sort of like a subsitute for courgette");
                if (this.shell.backup) {
                    this.println("  backup                download a full system backup");
                    this.println("  reinstall --confirm   wipe and reinstall ZebOS");
                    this.println("  flags                 list system flags");
                    this.println("  flag <name> <value>   set a system flag");
                }
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

            case 'mosys':
                this.runMosys(args);
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
                const interval = this.interval(() => {
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

            /* We don't need these anymore.
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
            */
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
                this.println(`ZebOS 2 (Beta Build 2.7.0 "Fawn")`);
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
                this.close();
                break;

            case 'backup': {
                if (!this.shell.backup) { this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555"); break; }
                const blob = new Blob([this.shell.backup()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'zebos-backup.json';
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                this.println("Backup downloaded.", "#55ff55");
                break;
            }

            case 'reinstall': {
                if (!this.shell.reinstall) { this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555"); break; }
                if (args[0] !== '--confirm') {
                    this.println("This permanently erases all data. Re-run as: reinstall --confirm", "#ff5555");
                    break;
                }
                this.shell.reinstall();
                this.println("Fresh install complete.", "#55ff55");
                break;
            }

            case 'flags': {
                if (!this.shell.getFlags) { this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555"); break; }
                Object.entries(this.shell.getFlags()).forEach(([k, v]) => this.println(`  ${k} = ${v}`));
                break;
            }

            case 'flag': {
                if (!this.shell.setFlag) { this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555"); break; }
                if (args.length < 2) { this.println("usage: flag <name> <true|false|value>"); break; }
                const [name, ...rest] = args;
                let value = rest.join(' ');
                if (value === 'true' || value === 'on') value = true;
                else if (value === 'false' || value === 'off') value = false;
                this.shell.setFlag(name, value);
                this.println(`${name} set to ${value}`);
                break;
            }

            default:
                this.println(`zebsh: command not found: ${cmd}. Type 'help' for command list.`, "#ff5555");
        }
    }

    generateFakeSerial() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
        let tail = "";
        for (let i = 0; i < 8; i++) tail += chars[Math.floor(Math.random() * chars.length)];
        return `ZB${new Date().getFullYear()}-${tail}`;
    }

    // Serial persists per-browser-profile via localStorage, same disk the rest of ZebOS uses,
    // rather than being re-rolled every terminal session.
    getSerialNumber() {
        const KEY = 'ZEBOS_V2_SERIAL';
        try {
            let serial = localStorage.getItem(KEY);
            if (!serial) {
                serial = this.generateFakeSerial();
                localStorage.setItem(KEY, serial);
            }
            return serial;
        } catch (e) {
            return this.fakeSerial;
        }
    }

    getBrowserVendor() {
        if (navigator.vendor) return navigator.vendor;
        const ua = navigator.userAgent;
        if (/Firefox\//.test(ua)) return "Mozilla Foundation";
        if (/Edg\//.test(ua)) return "Microsoft Corporation";
        return "Unknown";
    }

    getHostPlatform() {
        return (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "Unknown";
    }

    getChassisType() {
        const touch = navigator.maxTouchPoints > 0;
        const w = screen.width;
        if (touch && w <= 900) return "Tablet";
        if (touch) return "Convertible";
        if (w >= 1800) return "Desktop";
        return "Notebook";
    }

    getBrowserNameVersion() {
        const ua = navigator.userAgent;
        const patterns = [
            [/Edg\/([\d.]+)/, "Edge"],
            [/OPR\/([\d.]+)/, "Opera"],
            [/Chrome\/([\d.]+)/, "Chrome"],
            [/Firefox\/([\d.]+)/, "Firefox"],
            [/Version\/([\d.]+).*Safari/, "Safari"]
        ];
        for (const [re, name] of patterns) {
            const m = ua.match(re);
            if (m) return { name, version: m[1] };
        }
        return { name: "Unknown", version: "0.0" };
    }

    runMosys(args) {
        if (!args.length || args[0] === 'help' || args[0] === '-h') {
            this.println("mosys - ZebOS platform & firmware diagnostics utility");
            this.println("usage: mosys <command> <sub-command> [args]");
            this.println("");
            this.println("commands:");
            this.println("  platform [name|vendor|model|chassis|version]");
            this.println("  ec info");
            this.println("  smbios info bios");
            this.println("  memory spd print <all|geometry>");
            this.println("  vpd print <all|serial_number|region>");
            this.println("  eventlog list");
            return;
        }

        const [command, ...rest] = args;
        switch (command) {
            case 'platform': this.mosysPlatform(rest); break;
            case 'ec': this.mosysEc(rest); break;
            case 'smbios': this.mosysSmbios(rest); break;
            case 'memory': this.mosysMemory(rest); break;
            case 'vpd': this.mosysVpd(rest); break;
            case 'eventlog': this.mosysEventlog(rest); break;
            default:
                this.println(`mosys: unknown command: '${command}'. Try 'mosys help'.`, "#ff5555");
        }
    }

    mosysPlatform(rest) {
        const codename = this.shell.getCodename ? this.shell.getCodename() : "Unknown";
        const version = this.shell.getVersion ? this.shell.getVersion() : "0.0.0";
        const fields = {
            name: codename,
            vendor: this.getBrowserVendor(),
            model: this.getHostPlatform(),
            chassis: this.getChassisType(),
            version: `Rev ${version}`
        };
        const field = rest[0];
        if (!field) {
            Object.entries(fields).forEach(([k, v]) => this.println(`${k.padEnd(10)} | ${v}`));
            return;
        }
        if (!(field in fields)) { this.println(`mosys: platform: unknown field: '${field}'`, "#ff5555"); return; }
        this.println(fields[field]);
    }

    mosysEc(rest) {
        if (rest.length && rest[0] !== 'info') { this.println(`mosys: ec: unknown sub-command: '${rest[0]}'`, "#ff5555"); return; }
        const { name, version } = this.getBrowserNameVersion();
        this.println("vendor           | name  | fw_version");
        this.println(`${this.getBrowserVendor().padEnd(16)} | zebec | ${name.toLowerCase()}_v${version}`);
    }

    mosysSmbios(rest) {
        if (rest.join(' ') !== 'info bios') { this.println("usage: mosys smbios info bios"); return; }
        const { name, version } = this.getBrowserNameVersion();
        const romSize = (performance.memory && performance.memory.jsHeapSizeLimit)
            ? `${Math.round(performance.memory.jsHeapSizeLimit / 1024)} KB`
            : "Unavailable";
        this.println(`vendor        | ${this.getBrowserVendor()}`);
        this.println(`version       | ${name} ${version}`);
        this.println(`release_date  | ${new Date(document.lastModified).toLocaleDateString()}`);
        this.println(`rom_size      | ${romSize}`);
    }

    mosysMemory(rest) {
        const sub = rest.join(' ');
        if (sub === 'spd print all') {
            const deviceMemory = navigator.deviceMemory ? `${navigator.deviceMemory} GB (approx.)` : "Unavailable";
            this.println(`installed_memory | ${deviceMemory}`);
            this.println(`cpu_threads      | ${navigator.hardwareConcurrency || "Unknown"}`);
            if (performance.memory) {
                const fmt = b => `${(b / 1048576).toFixed(1)} MB`;
                this.println(`heap_used        | ${fmt(performance.memory.usedJSHeapSize)}`);
                this.println(`heap_total       | ${fmt(performance.memory.totalJSHeapSize)}`);
                this.println(`heap_limit       | ${fmt(performance.memory.jsHeapSizeLimit)}`);
            } else {
                this.println(`heap_stats       | Unavailable (performance.memory not supported)`);
            }
        } else if (sub === 'spd print geometry') {
            this.println(`resolution       | ${screen.width}x${screen.height}`);
            this.println(`color_depth      | ${screen.colorDepth}-bit`);
            this.println(`pixel_ratio      | ${window.devicePixelRatio}x`);
        } else {
            this.println("usage: mosys memory spd print <all|geometry>");
        }
    }

    mosysVpd(rest) {
        const sub = rest.join(' ');
        const locale = navigator.language || "en-US";
        const region = locale.includes('-') ? locale.split('-')[1].toUpperCase() : locale.toUpperCase();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const serial = this.getSerialNumber();

        if (sub === 'print all' || sub === '') {
            this.println(`"serial_number"="${serial}"`);
            this.println(`"region"="${region}"`);
            this.println(`"initial_locale"="${locale}"`);
            this.println(`"initial_timezone"="${timezone}"`);
        } else if (sub === 'print serial_number') {
            this.println(serial);
        } else if (sub === 'print region') {
            this.println(region);
        } else {
            this.println("usage: mosys vpd print <all|serial_number|region>");
        }
    }

    mosysEventlog(rest) {
        if (rest.length && rest[0] !== 'list') { this.println(`usage: mosys eventlog list`); return; }
        const origin = performance.timeOrigin;
        const nav = performance.getEntriesByType('navigation')[0];
        const events = nav ? [
            ["Navigation start", origin + nav.startTime],
            ["DOM interactive", origin + nav.domInteractive],
            ["DOM content loaded", origin + nav.domContentLoadedEventEnd],
            ["Page load complete", origin + nav.loadEventEnd]
        ] : [["Navigation start", origin]];
        events.push(["Terminal session start", this.startTime]);

        this.println("event | timestamp                | description");
        events.forEach(([desc, ts], i) => {
            this.println(`${String(i + 1).padStart(5)} | ${new Date(ts).toLocaleString()} | ${desc}`);
        });
    }

    renderSysfetch() {
        const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(uptimeSec / 60);
        const secs = uptimeSec % 60;

        const ascii = `
<span style="color:#00ffff; font-weight:bold;">█████ █████ ████. .███. .████</span>
<span style="color:#00ccff; font-weight:bold;">....█ █.... █...█ █...█ █....</span>
<span style="color:#00aaff; font-weight:bold;">...█. ████. ████. █...█ .███.</span>
<span style="color:#0088ff; font-weight:bold;">..█.. █.... █...█ █...█ ....█</span>
<span style="color:#0066ff; font-weight:bold;">█████ █████ ████. .███. ████.</span>

<span style="color:#ffff55;">OS:</span>         ZebOS 2 (Beta Build 2.7.0)
<span style="color:#ffff55;">Codename:</span>   "${this.shell.getCodename()}"
<span style="color:#ffff55;">Kernel:</span>     ZebOS VFS Hardened Engine v2.7.0
<span style="color:#ffff55;">User:</span>       ${this.shell.getUsername()}
<span style="color:#ffff55;">Shell:</span>      ZebShell (zebsh) v2.7.0
<span style="color:#ffff55;">Uptime:</span>     ${mins}m ${secs}s
<span style="color:#ffff55;">Memory:</span>     512 MB / 2048 MB (VFS Persistent)
<span style="color:#ffff55;">Palette:</span>    <span style="color:#000000; background:#000000;">  </span><span style="color:#ff5555; background:#ff5555;">  </span><span style="color:#55ff55; background:#55ff55;">  </span><span style="color:#ffff55; background:#ffff55;">  </span><span style="color:#5555ff; background:#5555ff;">  </span><span style="color:#ff55ff; background:#ff55ff;">  </span><span style="color:#55ffff; background:#55ffff;">  </span><span style="color:#ffffff; background:#ffffff;">  </span>
`;
        this.printRawHtml(`<pre style="margin:0; font-family:monospace;">${ascii}</pre>`);
    }

    renderTaskManager() {
        const rows = Array.from(document.querySelectorAll('.window-frame')).map((w, idx) => {
            const title = w.querySelector('.window-title')?.textContent.trim() || '(Untitled)';
            const status = w.classList.contains('active-window') ? 'Running' : 'Background';
            const pid = w.id ? w.id.slice(4) : `app-${idx}`;
            return `  ${pid.padEnd(13)} ${title.padEnd(24)}  ${status.padEnd(9)} 0.${Math.floor(Math.random()*9)}%   ${12 + idx * 4} MB`;
        });

        this.println("PID           PROCESS NAME              STATUS    CPU%    RAM", "#55ffff");
        this.println("---------------------------------------------------------------");
        if (rows.length) {
            rows.forEach(r => this.println(r));
        } else {
            this.println("  No application windows are currently open.");
        }
        this.println("---------------------------------------------------------------");
    }

    startMatrix() {
        this.isMatrixRunning = true;
        this.outputEl.innerHTML = "";
        this.println("--- Press ENTER or ANY KEY to stop Matrix animation ---", "#55ff55");
        
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
        this.matrixInterval = this.interval(() => {
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

}
