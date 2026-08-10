// programs/vm.js - ZebOS 2 ZebVM Virtual Machine Manager Engine
import { getIcon } from '../icons.js';
import { showOsPrompt } from '../os.js';

export class ZebVMManager {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.vms = [
            {
                id: 'vm-zebos-162',
                name: 'ZebOS v1.6.2 SP1',
                url: 'https://z3bos.github.io/ZebOS/',
                os: 'ZebOS v1.6.2 SP1',
                ram: 512,
                cpus: 2,
                status: 'stopped',
                booting: false,
                desc: 'Classic ZebOS v1.6.2 Service Pack 1 Virtual Workstation'
            },
            {
                id: 'vm-zebos-legacy',
                name: 'ZebOS 1.0 Classic',
                url: 'https://z3bos.github.io/ZebOS/',
                os: 'ZebOS v1.0.0',
                ram: 256,
                cpus: 1,
                status: 'stopped',
                booting: false,
                desc: 'Legacy 16-Bit ZebOS v1.0 Architecture Virtual Instance'
            }
        ];

        this.selectedVmId = 'vm-zebos-162';
        this.bootTimers = {};
        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";
        window.addEventListener('keydown', this.boundKeyDown);

        this.render();
    }

    render() {
        if (!this.bodyElement) return;

        const activeVm = this.vms.find(v => v.id === this.selectedVmId) || this.vms[0];

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none; overflow:hidden;">
                
                <!-- Toolbar Header Strip -->
                <div style="background:#c0c0c0; padding:4px 8px; border-bottom:2px solid #808080; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; font-size:12px;">
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="vm-tb-btn btn-new-vm" style="padding:3px 8px; font-weight:bold; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; display:flex; align-items:center; gap:4px;">
                            <span class="exp-icon-wrap">${getIcon('newFolder')}</span> New VM
                        </button>
                        <div style="width:1px; height:18px; background:#808080; margin:0 2px;"></div>
                        <button class="vm-tb-btn btn-start-vm" ${activeVm.status === 'running' || activeVm.booting ? 'disabled' : ''} style="padding:3px 8px; font-weight:bold; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; display:flex; align-items:center; gap:4px; color:${activeVm.status === 'running' ? '#888' : '#008000'}; opacity:${activeVm.status === 'running' ? 0.6 : 1};">
                            <span class="exp-icon-wrap">${getIcon('powerOn')}</span> Power On
                        </button>
                        <button class="vm-tb-btn btn-restart-vm" ${activeVm.status !== 'running' ? 'disabled' : ''} style="padding:3px 8px; font-weight:bold; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; display:flex; align-items:center; gap:4px; color:${activeVm.status === 'running' ? '#000080' : '#888'}; opacity:${activeVm.status === 'running' ? 1 : 0.6};">
                            Restart
                        </button>
                        <button class="vm-tb-btn btn-stop-vm" ${activeVm.status !== 'running' ? 'disabled' : ''} style="padding:3px 8px; font-weight:bold; background:#c0c0c0; border:1px solid #fff; border-right-color:#000; border-bottom-color:#000; cursor:pointer; display:flex; align-items:center; gap:4px; color:${activeVm.status === 'running' ? '#c62828' : '#888'}; opacity:${activeVm.status === 'running' ? 1 : 0.6};">
                            <span class="exp-icon-wrap">${getIcon('powerOff')}</span> Power Off
                        </button>
                    </div>
                    <div style="font-weight:bold; color:#000080; display:flex; align-items:center; gap:6px;">
                        <span class="exp-icon-wrap">${getIcon('vm')}</span> ZebVM Hypervisor v2.5.1
                    </div>
                </div>

                <!-- Main Workspace Split: VM Navigation Sidebar (Left) + Virtual Screen (Right) -->
                <div style="flex-grow:1; display:flex; overflow:hidden;">
                    
                    <!-- VM Sidebar List -->
                    <div style="width:230px; background:#ffffff; border-right:2px solid #808080; padding:6px; display:flex; flex-direction:column; gap:6px; flex-shrink:0; overflow-y:auto;">
                        <div style="font-size:11px; font-weight:bold; color:#000080; margin-bottom:2px; display:flex; align-items:center; justify-content:space-between;">
                            <span>VIRTUAL MACHINES</span>
                            <span style="font-weight:normal; color:#666;">(${this.vms.length})</span>
                        </div>
                        ${this.vms.map(vm => `
                            <div class="vm-card ${vm.id === this.selectedVmId ? 'selected-vm-card' : ''}" data-id="${vm.id}" style="padding:8px; border:1px solid ${vm.id === this.selectedVmId ? '#000080' : '#cccccc'}; background:${vm.id === this.selectedVmId ? '#000080' : '#f9f9f9'}; color:${vm.id === this.selectedVmId ? '#ffffff' : '#000000'}; cursor:pointer; border-radius:2px; font-size:12px; display:flex; flex-direction:column; gap:4px;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <div style="font-weight:bold; display:flex; align-items:center; gap:6px;">
                                        <span class="exp-icon-wrap">${getIcon('vm')}</span>
                                        <span>${vm.name}</span>
                                    </div>
                                    <span style="font-size:9px; font-weight:bold; padding:2px 5px; background:${vm.status === 'running' ? '#2e7d32' : (vm.booting ? '#f57f17' : '#757575')}; color:#ffffff; border-radius:2px;">${vm.booting ? 'BOOTING' : vm.status.toUpperCase()}</span>
                                </div>
                                <div style="font-size:10px; opacity:0.85;">RAM: ${vm.ram}MB | CPU: ${vm.cpus} Cores</div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Virtual Machine Display Console Container -->
                    <div style="flex-grow:1; background:#000000; display:flex; flex-direction:column; position:relative; overflow:hidden;">
                        ${this.renderVirtualViewport(activeVm)}
                    </div>
                </div>

                <!-- Footer System Status Bar -->
                <div style="background:#c0c0c0; border-top:1px solid #ffffff; padding:3px 8px; font-size:11px; font-weight:bold; color:#333333; flex-shrink:0; display:flex; justify-content:space-between; align-items:center;">
                    <div>Active Machine: <span style="color:#000080;">${activeVm.name}</span> (${activeVm.os})</div>
                    <div>Running VMs: ${this.vms.filter(v => v.status === 'running').length}/${this.vms.length}</div>
                </div>
            </div>
        `;

        this.bindEvents(activeVm);
    }

    renderVirtualViewport(vm) {
        if (vm.booting) {
            return `
                <div style="flex-grow:1; background:#0c0c0c; color:#00ff00; font-family:'Consolas','Courier New',monospace; padding:16px; font-size:12px; line-height:1.6; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                    <div style="width:50px; height:50px; margin-bottom:12px;">${getIcon('vm')}</div>
                    <div style="font-weight:bold; font-size:14px; color:#ffffff;">ZebVM BIOS v2.5.1 Post Diagnostic Check</div>
                    <div style="color:#00ff00; margin-top:8px;">Initializing Virtual Hardware Layer...</div>
                    <div style="color:#888888; margin-top:4px;">Probing ${vm.cpus} vCPU cores | Allocating ${vm.ram}MB Virtual RAM</div>
                    <div style="color:#55ffff; margin-top:8px;">Booting Guest OS: [${vm.name}]...</div>
                </div>
            `;
        }

        if (vm.status === 'running') {
            return `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; position:relative; background:#ffffff;">
                    <iframe src="${vm.url}" style="width:100%; height:100%; border:none; outline:none; display:block;" allow="fullscreen; autoplay; clipboard-write;"></iframe>
                </div>
            `;
        }

        // STOPPED State Display Screen
        return `
            <div style="flex-grow:1; background:#111827; color:#f3f4f6; padding:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-family:Arial, sans-serif;">
                <div style="width:64px; height:64px; margin-bottom:12px; filter:drop-shadow(0 0 12px rgba(59,130,246,0.5));">${getIcon('vm')}</div>
                <div style="font-size:20px; font-weight:bold; color:#ffffff;">${vm.name}</div>
                <div style="font-size:12px; color:#9ca3af; margin-top:4px;">${vm.desc}</div>
                
                <div style="margin-top:18px; display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#1f2937; padding:12px 18px; border-radius:6px; border:1px solid #374151; font-size:12px; text-align:left; min-width:280px;">
                    <div><strong style="color:#60a5fa;">Guest OS:</strong> ${vm.os}</div>
                    <div><strong style="color:#60a5fa;">Virtual RAM:</strong> ${vm.ram} MB</div>
                    <div><strong style="color:#60a5fa;">vCPU Cores:</strong> ${vm.cpus} Cores</div>
                    <div><strong style="color:#60a5fa;">Target URL:</strong> <a href="${vm.url}" target="_blank" style="color:#93c5fd; text-decoration:none;">Link ↗</a></div>
                </div>

                <button class="btn-power-on-center" style="margin-top:20px; padding:10px 24px; font-size:13px; font-weight:bold; background:linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; border:1px solid #60a5fa; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                    <span class="exp-icon-wrap">${getIcon('powerOn')}</span> Power On Virtual Machine
                </button>
            </div>
        `;
    }

    bindEvents(activeVm) {
        // List Card Click
        this.bodyElement.querySelectorAll('.vm-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedVmId = card.dataset.id;
                this.render();
            });
        });

        // Start VM Buttons
        const startBtn = this.bodyElement.querySelector('.btn-start-vm');
        const startCenterBtn = this.bodyElement.querySelector('.btn-power-on-center');

        const doStart = () => this.startVm(activeVm);
        if (startBtn) startBtn.addEventListener('click', doStart);
        if (startCenterBtn) startCenterBtn.addEventListener('click', doStart);

        // Stop VM
        const stopBtn = this.bodyElement.querySelector('.btn-stop-vm');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopVm(activeVm));
        }

        // Restart VM
        const restartBtn = this.bodyElement.querySelector('.btn-restart-vm');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.stopVm(activeVm);
                setTimeout(() => this.startVm(activeVm), 300);
            });
        }

        // New VM Wizard
        const newBtn = this.bodyElement.querySelector('.btn-new-vm');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                showOsPrompt("New Virtual Machine", "Enter Virtual Machine Name:", "Custom Web VM", (name) => {
                    showOsPrompt("New Virtual Machine", "Enter Target Embed Web URL:", "https://example.com", (url) => {
                        const newId = `vm_${Date.now()}`;
                        this.vms.push({
                            id: newId,
                            name: name.trim(),
                            url: url.trim(),
                            os: "Web Application OS",
                            ram: 1024,
                            cpus: 2,
                            status: 'stopped',
                            booting: false,
                            desc: "Custom Web Embed Virtual Machine Instance"
                        });
                        this.selectedVmId = newId;
                        this.render();
                    });
                });
            });
        }
    }

    startVm(vm) {
        if (vm.status === 'running' || vm.booting) return;
        vm.booting = true;
        this.render();

        if (this.bootTimers[vm.id]) clearTimeout(this.bootTimers[vm.id]);
        this.bootTimers[vm.id] = setTimeout(() => {
            vm.booting = false;
            vm.status = 'running';
            this.render();
        }, 1200);
    }

    stopVm(vm) {
        if (vm.status === 'stopped' && !vm.booting) return;
        vm.booting = false;
        vm.status = 'stopped';
        if (this.bootTimers[vm.id]) clearTimeout(this.bootTimers[vm.id]);
        this.render();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    cleanup() {
        Object.keys(this.bootTimers).forEach(id => clearTimeout(this.bootTimers[id]));
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}
