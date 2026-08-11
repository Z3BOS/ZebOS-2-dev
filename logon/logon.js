
// The first-time setup screen. os.js only calls this on a user's very first
// boot — once they've signed in, os.js remembers the username and avatar and
// skips this screen on every later boot. Any username is accepted, this is a
// local single-user guest session, not real auth. Builds and tears down its
// own full-screen overlay, so os.js just calls showLogonScreen() and gets a
// username + avatar path back.

const AVATARS = [
    { file: 'avatar-zebra.svg',  label: 'Zebra' },
    { file: 'avatar-robot.svg',  label: 'Robot' },
    { file: 'avatar-cat.svg',    label: 'Cat' },
    { file: 'avatar-ghost.svg',  label: 'Ghost' },
    { file: 'avatar-star.svg',   label: 'Star' },
    { file: 'avatar-rocket.svg', label: 'Rocket' }
];
const AVATAR_DIR = 'logon/setup/';

export function showLogonScreen(onSignedIn, defaultUsername = 'guest', defaultAvatarPath = null) {
    const screen = document.createElement('div');
    screen.id = 'logon-screen';
    screen.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        background:linear-gradient(160deg, #001a33 0%, #004d66 60%, #008080 100%);
        display:flex; align-items:center; justify-content:center;
        z-index:96000; opacity:1; transition:opacity 0.4s ease-in-out;
    `;

    let selectedAvatarPath = defaultAvatarPath || (AVATAR_DIR + AVATARS[0].file);

    const avatarGridHtml = AVATARS.map(a => {
        const path = AVATAR_DIR + a.file;
        return `<img class="logon-avatar-option" data-avatar-path="${path}" src="${path}" alt="${a.label}" title="${a.label}" style="width:38px; height:38px; border-radius:50%; cursor:pointer; box-sizing:border-box; border:3px solid transparent; background:#ffffff;">`;
    }).join('');

    screen.innerHTML = `
        <div style="width:310px; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 16px rgba(0,0,0,0.5); padding:24px 20px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px; font-family:Arial, sans-serif;">
            <img src="assets/system/z_logo.png" style="width:72px; height:72px; object-fit:contain; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));" alt="ZebOS Logo">
            <div style="font-size:20px; font-weight:bold; color:#000080; letter-spacing:0.5px;">ZebOS 2</div>
            <div style="font-size:12px; color:#404040; margin-bottom:6px;">Let's get you set up</div>
            <div style="font-size:11px; color:#404040; align-self:flex-start;">Choose an avatar:</div>
            <div class="logon-avatar-grid" style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-bottom:4px;">${avatarGridHtml}</div>
            <input class="logon-username" type="text" value="${defaultUsername}" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
            <input class="logon-password" type="password" placeholder="Password (optional)" autocomplete="off" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
            <button class="logon-btn" style="width:100%; margin-top:6px; padding:7px 8px; font-size:13px; font-weight:bold; cursor:pointer; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; display:flex; align-items:center; justify-content:center; gap:6px;">Get Started &rarr;</button>
            <div style="font-size:11px; color:#404040; text-align:center; margin-top:6px;">Any username works — this account is remembered on this device from now on.</div>
        </div>
    `;

    document.body.appendChild(screen);

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

    function completeSignIn() {
        const username = userInput.value.trim() || defaultUsername;
        onSignedIn(username, selectedAvatarPath);
        screen.style.opacity = "0";
        setTimeout(() => screen.remove(), 500);
    }

    btn.addEventListener('click', completeSignIn);
    [userInput, passInput].forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') completeSignIn();
        });
    });
}
