// ═══════════════════════════════════════════════════════
//  AIPC — Shared Navigation (nav.js)
//  Include this on EVERY page:  <script src="nav.js"></script>
//  or from a subfolder:         <script src="../nav.js"></script>
//
//  It auto-detects root vs subfolder and fixes all paths.
// ═══════════════════════════════════════════════════════

(function () {
    // ── Path prefix: root pages use './' , subfolder pages use '../' ──
    const depth = (function () {
        // If this script's own src contains '../' it's being loaded from a subfolder
        const scripts = document.querySelectorAll('script[src*="nav.js"]');
        for (const s of scripts) {
            if (s.src && s.getAttribute('src').startsWith('../')) return '../';
        }
        return './';
    })();

    const p = depth; // shorthand

    // ── Build header HTML ──
    const headerHTML = `
    <a href="${p}index.html" class="logo" aria-label="AIPC Home">
        <svg class="logo-svg" viewBox="0 0 170 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 4C16 4 7 16 7 23C7 27.97 11.03 32 16 32C20.97 32 25 27.97 25 23C25 16 16 4 16 4Z" fill="url(#dropG)" />
            <defs>
                <linearGradient id="dropG" x1="7" y1="4" x2="25" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#3b82f6"/>
                    <stop offset="1" stop-color="#0047d4"/>
                </linearGradient>
            </defs>
            <path d="M10.5 24C12.2 22.2 14 25.5 16 23.8C18 22 19.8 25.5 21.5 24" stroke="white" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.65"/>
            <text x="34" y="27" font-family="'DM Sans', sans-serif" font-weight="700" font-size="24" fill="#0059ff" letter-spacing="3">AIPC</text>
        </svg>
    </a>

    <nav id="mainNav">
        <ul>
            <li><a href="${p}partnership/partenership.html">Partnership</a></li>
            <li><a href="${p}vocab/aipcvocab.html">Apic Vocab</a></li>
            <li><a href="${p}involved/involved.html">Get Involved</a></li>
            <li><a href="${p}contact/contact.html">Contact</a></li>
        </ul>
    </nav>

    <!-- Hamburger -->
    <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" id="mobileOverlay"></div>
    <nav class="mobile-nav" id="mobileNav">
        <button class="mobile-close" id="mobileClose" aria-label="Close menu">&times;</button>
        <ul>
            <li><a href="${p}partnership/partenership.html">Partnership</a></li>
            <li><a href="${p}vocab/aipcvocab.html">Apic Vocab</a></li>
            <li><a href="${p}involved/involved.html">Get Involved</a></li>
            <li><a href="${p}contact/contact.html">Contact</a></li>
        </ul>
        <div class="mobile-nav-footer">
            <div class="mobile-socials">
                <a href="https://youtube.com/@aipcofficial" target="_blank"><img src="${p}images/video.png" alt="YouTube"></a>
                <a href="https://www.instagram.com/aipc.world" target="_blank"><img src="${p}images/instagram.png" alt="Instagram"></a>
                <a href="https://www.facebook.com/share/17GWzR4HaJ/" target="_blank"><img src="${p}images/facebook.png" alt="Facebook"></a>
                <a href="https://www.tiktok.com/@aipcofficial" target="_blank"><img src="${p}images/tiktok.png" alt="TikTok"></a>
            </div>
        </div>
    </nav>
    `;

    // ── Inject into <header> ──
    const header = document.querySelector('header');
    if (header) {
        header.innerHTML = headerHTML;
    }

    // ── Highlight current page ──
    const currentPath = window.location.pathname;
    document.querySelectorAll('#mainNav a, .mobile-nav ul a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace(/^\.\.\/|^\.\//, ''))) {
            link.classList.add('active');
        }
    });

    // ── Hamburger logic ──
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileClose = document.getElementById('mobileClose');

    function openMenu() {
        hamburger.classList.add('active');
        mobileNav.classList.add('active');
        mobileOverlay.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileOverlay.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.contains('active') ? closeMenu() : openMenu();
        });
    }
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);

    document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // ── Sticky header shadow ──
    window.addEventListener('scroll', () => {
        if (header) {
            header.style.boxShadow = window.pageYOffset > 10
                ? '0 2px 20px rgba(0,0,0,0.08)'
                : 'none';
        }
    }, { passive: true });

})();