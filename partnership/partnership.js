document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.p-card').forEach(card => {
        const slides = card.querySelectorAll('.p-slide');
        const dotsWrap = card.querySelector('.sl-dots');
        const contactBtn = card.querySelector('.p-btn-contact');
        let current = 0;

        // Build dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'sl-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
        });

        function goTo(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach((s, i) => s.classList.toggle('active', i === current));
            dotsWrap.querySelectorAll('.sl-dot').forEach((d, i) => d.classList.toggle('active', i === current));
        }

        // Prev / Next arrows
        const prev = card.querySelector('.sl-prev');
        const next = card.querySelector('.sl-next');
        if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
        if (next) next.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });

        // Contact button → last slide
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                goTo(slides.length - 1);
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        // Touch swipe
        let startX = 0;
        const sl = card.querySelector('.p-slider');
        sl.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, { passive: true });
        sl.addEventListener('touchend', e => {
            const diff = startX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
        }, { passive: true });

        // Click to advance (on image area, not contact slide)
        sl.addEventListener('click', (e) => {
            if (e.target.closest('.contact-slide') || e.target.closest('.sl-dot')) return;
            goTo(current + 1);
        });
    });

    // Scroll animation
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.p-card, .become-left, .cta-box, .partner-intro').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
        obs.observe(el);
    });

    console.log('Partnership page loaded!');
});