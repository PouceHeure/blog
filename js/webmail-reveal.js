
// Escape string for safe RegExp use
const escapeForRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Decode obfuscated email
function decodeObfuscated(str, noise) {
    const clean = (str || '').trim().replace(/\s+/g, '');
    const withoutNoise = noise
        ? clean.replace(new RegExp(escapeForRegExp(noise), 'g'), '')
        : clean;
    return atob(withoutNoise.split('').reverse().join(''));
}

// Encode email (dev use)
function encodeObfuscated(email, noise = '~') {
    const b64 = btoa(email);
    const reversed = b64.split('').reverse().join('');
    return reversed.replace(/.{3}/g, `$&${noise}`).replace(new RegExp(`${escapeForRegExp(noise)}$`), '');
}

// Expose encode/decode for dev
window.emailObfuscator = { encode: encodeObfuscated, decode: decodeObfuscated };

// Reveal button handler
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('revealEmailBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        const el = document.getElementById('email');
        const live = document.getElementById('emailLive');
        try {
            const email = decodeObfuscated(el.getAttribute('data-email'), el.getAttribute('data-noise'));
            el.innerHTML = `<a href="mailto:${email}">${email}</a>`;
            if (live) live.textContent = `Email: ${email}`;
            this.remove();
        } catch {
            el.textContent = '[Invalid email encoding]';
        }
    });
});
