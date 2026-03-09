// AIPC About Page JS

document.addEventListener('DOMContentLoaded', function () {

    // Scroll-triggered animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.letter-card, .vision-card, .culture-card, .cta-inner').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });

    console.log('AIPC About page loaded.');
});