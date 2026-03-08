// AIPC Homepage — page-specific JS
// (nav.js handles header, hamburger, and scroll shadow)

document.addEventListener('DOMContentLoaded', function () {

    // ── Scroll-triggered fade-in for cards ─────────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.event-card').forEach(card => {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });

    console.log('AIPC Homepage loaded.');
});