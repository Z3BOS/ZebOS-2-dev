
// The setup / sign-in screen. os.js calls this two ways:
//   - First boot: a full OOBE wizard (Welcome -> Account -> Optional
//     Components -> Download), matching the shape of AnuraOS's OOBE — pick
//     what to install, see the size, watch it download.
//   - Switching user later (tray -> Sign out): just the Account step, same
//     as before this file grew the wizard around it.
// Builds and tears down its own full-screen overlay, so os.js just calls
// showLogonScreen() and gets a username + avatar path back via the callback.
import { LINUX_EMULATION_TOTAL_BYTES, downloadLinuxEmulationAssets } from '../linux/v86loader.js';

const AVATARS = [
    { file: 'avatar-zebra.svg',  label: 'Zebra' },
    { file: 'avatar-robot.svg',  label: 'Robot' },
    { file: 'avatar-cat.svg',    label: 'Cat' },
    { file: 'avatar-ghost.svg',  label: 'Ghost' },
    { file: 'avatar-star.svg',   label: 'Star' },
    { file: 'avatar-rocket.svg', label: 'Rocket' }
];
const AVATAR_DIR = 'logon/avatars/';

// Extensible on purpose — this is the one entry today, but the OOBE step
// below is built to list however many of these show up later.
const OPTIONAL_COMPONENTS = [
    {
        id: 'linuxEmulation',
        settingField: 'linuxEmulationEnabled',
        label: 'Linux Emulation (v86)',
        desc: 'Boot real Alpine Linux from ZebVM. The emulator downloads now; the rootfs itself streams in on demand the first time it boots.',
        bytes: LINUX_EMULATION_TOTAL_BYTES,
    },
];

function formatMb(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cardShellStyle() {
    return `width:340px; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 16px rgba(0,0,0,0.5); padding:24px 20px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px; font-family:Arial, sans-serif;`;
}

function primaryBtnStyle() {
    return `width:100%; margin-top:6px; padding:7px 8px; font-size:13px; font-weight:bold; cursor:pointer; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; display:flex; align-items:center; justify-content:center; gap:6px;`;
}

function secondaryBtnStyle() {
    return `width:100%; margin-top:4px; padding:6px 8px; font-size:12px; cursor:pointer; background-color:#c0c0c0; border:1px solid #808080; color:#333;`;
}

export function showLogonScreen(onSignedIn, defaultUsername = 'guest', defaultAvatarPath = null, options = {}) {
    const { isFirstBoot = false, settingsApi = null } = options;

    const screen = document.createElement('div');
    screen.id = 'logon-screen';
    screen.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        background:linear-gradient(160deg, #001a33 0%, #004d66 60%, #008080 100%);
        display:flex; align-items:center; justify-content:center;
        z-index:96000; opacity:1; transition:opacity 0.4s ease-in-out;
    `;
    document.body.appendChild(screen);

    let username = defaultUsername;
    let selectedAvatarPath = defaultAvatarPath || (AVATAR_DIR + AVATARS[0].file);
    const selectedComponentIds = new Set();

    const steps = isFirstBoot ? ['welcome', 'account', 'components'] : ['account'];
    let stepIndex = 0;

    function goNext() {
        if (stepIndex < steps.length - 1) {
            stepIndex++;
            renderStep();
        } else {
            afterAccountAndComponents();
        }
    }

    function afterAccountAndComponents() {
        if (selectedComponentIds.has('linuxEmulation')) {
            renderDownloadStep();
        } else {
            completeSignIn();
        }
    }

    function completeSignIn() {
        if (settingsApi && isFirstBoot) {
            settingsApi.setValue('linuxEmulationEnabled', selectedComponentIds.has('linuxEmulation'));
        }
        onSignedIn(username, selectedAvatarPath);
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 500);
    }

    function renderStep() {
        const step = steps[stepIndex];
        if (step === 'welcome') renderWelcomeStep();
        else if (step === 'account') renderAccountStep();
        else if (step === 'components') renderComponentsStep();
    }

    function renderWelcomeStep() {
        screen.innerHTML = `
            <div style="${cardShellStyle()}">
                <img src="assets/system/z_logo.png" style="width:72px; height:72px; object-fit:contain; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));" alt="ZebOS Logo">
                <div style="font-size:22px; font-weight:bold; color:#000080; letter-spacing:0.5px;">Welcome to ZebOS 2</div>
                <div style="font-size:12px; color:#404040; text-align:center; margin-bottom:6px;">Let's get your machine set up — this only takes a minute.</div>
                <button class="logon-btn" style="${primaryBtnStyle()}">Get Started &rarr;</button>
            </div>
        `;
        screen.querySelector('.logon-btn').addEventListener('click', goNext);
    }

    function renderAccountStep() {
        const isLastStep = stepIndex === steps.length - 1;
        const avatarGridHtml = AVATARS.map(a => {
            const path = AVATAR_DIR + a.file;
            return `<img class="logon-avatar-option" data-avatar-path="${path}" src="${path}" alt="${a.label}" title="${a.label}" style="width:38px; height:38px; border-radius:50%; cursor:pointer; box-sizing:border-box; border:3px solid transparent; background:#ffffff;">`;
        }).join('');

        screen.innerHTML = `
            <div style="${cardShellStyle()}">
                <img src="assets/system/z_logo.png" style="width:72px; height:72px; object-fit:contain; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));" alt="ZebOS Logo">
                <div style="font-size:20px; font-weight:bold; color:#000080; letter-spacing:0.5px;">ZebOS 2</div>
                <div style="font-size:12px; color:#404040; margin-bottom:6px;">${isFirstBoot ? 'Choose an account' : "Let's get you set up"}</div>
                <div style="font-size:11px; color:#404040; align-self:flex-start;">Choose an avatar:</div>
                <div class="logon-avatar-grid" style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-bottom:4px;">${avatarGridHtml}</div>
                <input class="logon-username" type="text" value="${username}" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
                <input class="logon-password" type="password" placeholder="Password (optional)" autocomplete="off" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
                <button class="logon-btn" style="${primaryBtnStyle()}">${isLastStep ? 'Get Started' : 'Next'} &rarr;</button>
                <div style="font-size:11px; color:#404040; text-align:center; margin-top:6px;">Any username works — this account is remembered on this device from now on.</div>
            </div>
        `;

        const userInput = screen.querySelector('.logon-username');
        const passInput = screen.querySelector('.logon-password');
        const btn = screen.querySelector('.logon-btn');
        const avatarEls = Array.from(screen.querySelectorAll('.logon-avatar-option'));

        function updateAvatarSelection() {
            avatarEls.forEach(el => {
                el.style.borderColor = el.dataset.avatarPath === selectedAvatarPath ? '#000080' : 'transparent';
            });
        }
        updateAvatarSelection();
        avatarEls.forEach(el => {
            el.addEventListener('click', () => {
                selectedAvatarPath = el.dataset.avatarPath;
                updateAvatarSelection();
            });
        });

        userInput.focus();
        userInput.select();

        function submit() {
            username = userInput.value.trim() || defaultUsername;
            goNext();
        }

        btn.addEventListener('click', submit);
        [userInput, passInput].forEach(el => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submit();
            });
        });
    }

    function renderComponentsStep() {
        const totalBytes = OPTIONAL_COMPONENTS
            .filter(c => selectedComponentIds.has(c.id))
            .reduce((sum, c) => sum + c.bytes, 0);
        const hasSelection = selectedComponentIds.size > 0;

        const rowsHtml = OPTIONAL_COMPONENTS.map(c => `
            <label class="oobe-component-row" data-id="${c.id}" style="display:flex; align-items:flex-start; gap:8px; padding:8px; background:#ffffff; border:1px solid #808080; cursor:pointer; text-align:left;">
                <input type="checkbox" class="oobe-component-checkbox" data-id="${c.id}" ${selectedComponentIds.has(c.id) ? 'checked' : ''} style="margin-top:2px;">
                <span>
                    <span style="display:block; font-size:12px; font-weight:bold; color:#000;">${c.label} <span style="font-weight:normal; color:#666;">(${formatMb(c.bytes)})</span></span>
                    <span style="display:block; font-size:11px; color:#555; margin-top:2px;">${c.desc}</span>
                </span>
            </label>
        `).join('');

        screen.innerHTML = `
            <div style="${cardShellStyle()}">
                <div style="font-size:18px; font-weight:bold; color:#000080; align-self:flex-start;">Optional Components</div>
                <div style="font-size:11px; color:#404040; align-self:flex-start; margin-bottom:4px;">Nothing here is bundled with ZebOS — opting in downloads it now. You can change this later in System Flags.</div>
                <div style="display:flex; flex-direction:column; gap:6px; width:100%;">${rowsHtml}</div>
                <div style="align-self:flex-start; font-size:11px; color:#404040; margin-top:8px;">Estimated download: <strong id="oobe-total-size">${formatMb(totalBytes)}</strong></div>
                <button class="logon-btn" style="${primaryBtnStyle()}">${hasSelection ? 'Next' : 'Finish'} &rarr;</button>
            </div>
        `;

        screen.querySelectorAll('.oobe-component-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) selectedComponentIds.add(cb.dataset.id);
                else selectedComponentIds.delete(cb.dataset.id);
                renderComponentsStep();
            });
        });

        screen.querySelector('.logon-btn').addEventListener('click', afterAccountAndComponents);
    }

    function renderDownloadStep() {
        screen.innerHTML = `
            <div style="${cardShellStyle()}">
                <div style="font-size:18px; font-weight:bold; color:#000080;">Setting things up&hellip;</div>
                <div id="oobe-dl-status" style="font-size:11px; color:#404040; align-self:flex-start;">Downloading Linux Emulation&hellip;</div>
                <div style="width:100%; height:14px; background:#ffffff; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; box-sizing:border-box; margin-top:4px;">
                    <div id="oobe-dl-fill" style="width:0%; height:100%; background:linear-gradient(180deg, #1084d0 0%, #000080 100%);"></div>
                </div>
                <div id="oobe-dl-pct" style="font-size:11px; color:#404040; align-self:flex-end;">0%</div>
                <div id="oobe-dl-error" style="display:none; font-size:11px; color:#c62828; align-self:flex-start; margin-top:4px;"></div>
                <div id="oobe-dl-actions" style="display:none; width:100%;">
                    <button class="oobe-retry-btn" style="${primaryBtnStyle()}">Retry</button>
                    <button class="oobe-skip-btn" style="${secondaryBtnStyle()}">Skip for now</button>
                </div>
            </div>
        `;

        const fillEl = screen.querySelector('#oobe-dl-fill');
        const pctEl = screen.querySelector('#oobe-dl-pct');
        const statusEl = screen.querySelector('#oobe-dl-status');
        const errorEl = screen.querySelector('#oobe-dl-error');
        const actionsEl = screen.querySelector('#oobe-dl-actions');

        function runDownload() {
            errorEl.style.display = 'none';
            actionsEl.style.display = 'none';
            statusEl.textContent = 'Downloading Linux Emulation…';
            fillEl.style.width = '0%';
            pctEl.textContent = '0%';

            downloadLinuxEmulationAssets(({ loaded, total }) => {
                const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
                fillEl.style.width = `${pct}%`;
                pctEl.textContent = `${pct}%`;
            }).then(() => {
                statusEl.textContent = 'Done.';
                completeSignIn();
            }).catch((err) => {
                statusEl.textContent = 'Download failed.';
                errorEl.textContent = err.message || 'Could not reach the CDN. Check your connection and try again.';
                errorEl.style.display = 'block';
                actionsEl.style.display = 'flex';
                actionsEl.style.gap = '0';
                actionsEl.style.flexDirection = 'column';
            });
        }

        screen.querySelector('.oobe-retry-btn').addEventListener('click', runDownload);
        screen.querySelector('.oobe-skip-btn').addEventListener('click', () => {
            selectedComponentIds.delete('linuxEmulation');
            completeSignIn();
        });

        runDownload();
    }

    renderStep();
}
