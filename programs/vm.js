// programs/vm.js - ZebOS 2 Pro ZebVM Virtual Machine Manager
import { getIcon } from '../icons.js';

export class ZebVMManager {
    constructor(onCloseRequest) {
        this.onCloseRequest = onCloseRequest;

        this.bodyElement = null;
        this.vms = [
            { id: 'vm1', name: 'ZebOS 1.0 (Alpha)', os: 'ZebOS v1.0', ram: 64, cpus: 1, status: 'stopped', log: [] },
            { id: 'vm2', name: 'ZebLinux Core 2.4', os: 'ZebLinux 2.4', ram: 256, cpus: 2, status: 'stopped', log: [] }
        ];

        this.selectedVmId = 'vm1';
        this.bootIntervals = {};

        this.boundKeyDown = (e) => this.handleKeyDown(e);
    }

    open(windowBodyElement) {
        this.bodyElement = windowBodyElement;
        this.bodyElement.style.height = "100%";

        this.render();
        window.addEventListener('keydown', this.boundKeyDown);
    }

    render() {
        if (!this.bodyElement) return;

        const activeVm = this.vms.find(v => v.id === this.selectedVmId) || this.vms[0];

        this.bodyElement.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; background:#c0c0c0; font-family:Arial, sans-serif; box-sizing:border-box; user-select:none;">
                
                <!-- Toolbar Header Strip -->
                <div style="background:#c0c0c0; padding:6px 10px; border-bottom:2px solid #808080; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
                    <div style="display:flex; gap:6px;">
                        <button class="vm-toolbar-btn btn-new-vm" style="padding:3px 8px; font-size:12px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; gap:4px;">
                            ${getIcon('newFolder')} New VM
                        </button>
                        <button class="vm-toolbar-btn btn-power-on" style="padding:3px 8px; font-size:12px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; gap:4px; color:#008000;">
                            ${getIcon('powerOn')} Start
                        </button>
                        <button class="vm-toolbar-btn btn-power-off" style="padding:3px 8px; font-size:12px; font-weight:bold; background:#c0c0c0; border:1px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; cursor:pointer; display:flex; align-items:center; gap:4px; color:#c62828;">
                            ${getIcon('powerOff')} Stop
                        </button>
                    </div>
                    <div style="font-size:12px; font-weight:bold; color:#000080;">ZebVM Manager v1.0</div>
                </div>

                <!-- Main Grid Split: VM List (Left) + Console Screen (Right) -->
                <div style="flex-grow:1; display:flex; overflow:hidden;">
                    
                    <!-- VM Instance Sidebar -->
                    <div style="width:200px; background:#ffffff; border-right:2px solid #808080; padding:6px; display:flex; flex-direction:column; gap:4px; flex-shrink:0; overflow-y:auto;">
                        <div style="font-size:11px; font-weight:bold; color:#666666; margin-bottom:4px;">VIRTUAL MACHINES</div>
                        ${this.vms.map(vm => `
                            <div class="vm-list-item ${vm.id === this.selectedVmId ? 'selected-vm' : ''}" data-id="${vm.id}" style="padding:6px; border:1px solid ${vm.id === this.selectedVmId ? '#000080' : '#d0d0d0'}; background:${vm.id === this.selectedVmId ? '#000080' : '#f5f5f5'}; color:${vm.id === this.selectedVmId ? '#ffffff' : '#000000'}; cursor:pointer; border-radius:2px; font-size:12px; display:flex; align-items:center; justify-content:space-between;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="width:16px; height:16px;">${getIcon('vm')}</span>
                                    <span style="font-weight:bold;">${vm.name}</span>
                                </div>
                                <span style="font-size:10px; font-weight:bold; padding:1px 4px; background:${vm.status==='running'?'#2e7d32':'#757575'}; color:#ffffff; border-radius:2px;">${vm.status.toUpperCase()}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Virtual Display Screen / Terminal Output -->
                    <div style="flex-grow:1; background:#0c0c0c; display:flex; flex-direction:column; padding:10px; box-sizing:border-box; color:#00ff00; font-family:'Consolas','Courier New',monospace; overflow:hidden;">
                        
                        <!-- VM Info Header Strip -->
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333333; padding-bottom:6px; margin-bottom:8px; font-size:12px; flex-shrink:0;">
                            <div>
                                <span style="color:#ffffff; font-weight:bold;">${activeVm.name}</span>
                                <span style="color:#888888; margin-left:8px;">[OS: ${activeVm.os} | RAM: ${activeVm.ram}MB | CPU: ${activeVm.cpus} Core(s)]</span>
                            </div>
                            <div style="color:${activeVm.status==='running'?'#55ff55':'#ff5555'}; font-weight:bold;">
                                Status: ${activeVm.status.toUpperCase()}
                            </div>
                        </div>

                        <!-- Console Display Frame -->
                        <div class="vm-console-output" style="flex-grow:1; overflow-y:auto; font-size:12px; line-height:1.5; white-space:pre-wrap; word-break:break-word;">
                            ${activeVm.log.length > 0 ? activeVm.log.join('\n') : `<span style="color:#666666;">VM powered off. Click 'Start' to boot virtual machine BIOS.</span>`}
                        </div>
                    </div>
                </div>

                <!-- Footer Status Bar -->
                <div style="background:#c0c0c0; border-top:2px solid #ffffff; padding:4px 10px; font-size:11px; font-weight:bold; color:#404040; flex-shrink:0; display:flex; justify-content:space-between;">
                    <span>Hypervisor: ZebVM Core v1.0.4 (Virtual CPU Engine)</span>
                    <span>Active VMs: ${this.vms.filter(v => v.status==='running').length}/${this.vms.length}</span>
                </div>
            </div>
        `;

        // Bind list selection
        this.bodyElement.querySelectorAll('.vm-list-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedVmId = item.dataset.id;
                this.render();
            });
        });

        // Bind Start
        this.bodyElement.querySelector('.btn-power-on').addEventListener('click', () => {
            this.startVm(activeVm);
        });

        // Bind Stop
        this.bodyElement.querySelector('.btn-power-off').addEventListener('click', () => {
            this.stopVm(activeVm);
        });

        // Bind New VM
        this.bodyElement.querySelector('.btn-new-vm').addEventListener('click', () => {
            const name = prompt("Enter Virtual Machine Name:", "MS-DOS 6.22");
            if (!name) return;
            const newId = `vm_${Date.now()}`;
            this.vms.push({
                id: newId,
                name: name.trim(),
                os: "ZebOS Compatible OS",
                ram: 128,
                cpus: 1,
                status: 'stopped',
                log: []
            });
            this.selectedVmId = newId;
            this.render();
        });
    }

    startVm(vm) {
        if (vm.status === 'running') return;
        vm.status = 'running';
        vm.log = [
            `ZebVM BIOS v2.4 (C) 2026 ZebOS Foundation`,
            `Probing virtual CPU: 0x00000001 [${vm.cpus} Cores OK]`,
            `Allocating ${vm.ram}MB system memory RAM... OK`,
            `Mounting virtual disk image hda1... OK`,
            `Booting kernel image [${vm.os}]...`
        ];

        this.render();

        // Boot sequence simulation ticker
        let step = 0;
        const bootMessages = [
            "KERN: Initializing device drivers...",
            "MISC: Probing virtual PCI bus...",
            "NET: Virtual Ethernet adapter eth0 online.",
            "SYSTEM: Shell ready. Type commands in ZebOS host shell."
        ];

        if (this.bootIntervals[vm.id]) clearInterval(this.bootIntervals[vm.id]);
        this.bootIntervals[vm.id] = setInterval(() => {
            if (step < bootMessages.length && vm.status === 'running') {
                vm.log.push(bootMessages[step]);
                step++;
                this.render();
            } else {
                clearInterval(this.bootIntervals[vm.id]);
            }
        }, 800);
    }

    stopVm(vm) {
        if (vm.status === 'stopped') return;
        vm.status = 'stopped';
        if (this.bootIntervals[vm.id]) clearInterval(this.bootIntervals[vm.id]);
        vm.log.push("ACPI: Power down signal received. System halted.");
        this.render();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.onCloseRequest();
        }
    }

    cleanup() {
        Object.keys(this.bootIntervals).forEach(id => clearInterval(this.bootIntervals[id]));
        window.removeEventListener('keydown', this.boundKeyDown);
    }
}
