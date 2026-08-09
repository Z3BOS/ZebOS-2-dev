
// The sign-in screen shown once, right after the boot screen clears.
// Any username is accepted, this is a local single-user guest session,
// not real auth. Builds and tears down its own full-screen overlay, so
// os.js just calls showLogonScreen() and gets a username back.
export function showLogonScreen(onSignedIn) {
    const screen = document.createElement('div');
    screen.id = 'logon-screen';
    screen.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        background:linear-gradient(160deg, #001a33 0%, #004d66 60%, #008080 100%);
        display:flex; align-items:center; justify-content:center;
        z-index:96000; opacity:1; transition:opacity 0.4s ease-in-out;
    `;

    screen.innerHTML = `
        <div style="width:280px; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000; box-shadow:3px 3px 16px rgba(0,0,0,0.5); padding:24px 20px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:8px; font-family:Arial, sans-serif;">
            <div style="font-size:40px;">🖥️</div>
            <div style="font-size:18px; font-weight:bold; color:#000080;">ZebOS 2</div>
            <div style="font-size:12px; color:#404040; margin-bottom:10px;">Welcome back</div>
            <input class="logon-username" type="text" value="guest" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
            <input class="logon-password" type="password" placeholder="Password (optional)" autocomplete="off" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:2px solid #808080; border-right-color:#ffffff; border-bottom-color:#ffffff; background:#ffffff; font-family:Arial, sans-serif;">
            <button class="logon-btn" style="width:100%; margin-top:6px; padding:7px 8px; font-size:13px; font-weight:bold; cursor:pointer; background-color:#c0c0c0; border:2px solid #ffffff; border-right-color:#000000; border-bottom-color:#000000;">Sign In &rarr;</button>
            <div style="font-size:11px; color:#404040; text-align:center; margin-top:6px;">Any username works — this is a local guest session.</div>
        </div>
    `;

    document.body.appendChild(screen);

    const userInput = screen.querySelector('.logon-username');
    const passInput = screen.querySelector('.logon-password');
    const btn = screen.querySelector('.logon-btn');

    userInput.focus();
    userInput.select();

    function completeSignIn() {
        const username = userInput.value.trim() || 'guest';
        screen.style.opacity = "0";
        setTimeout(() => screen.remove(), 400);
        onSignedIn(username);
    }

    btn.addEventListener('click', completeSignIn);
    [userInput, passInput].forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') completeSignIn();
        });
    });
}
