// AIPC Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all event cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });

    // Smooth hover effect for cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.3s ease';
        });
    });

    // Character limit function (for future dynamic content)
    function truncateText(element, maxLength = 150) {
        const text = element.textContent;
        if (text.length > maxLength) {
            element.textContent = text.substring(0, maxLength).trim() + '...';
        }
    }

    // Apply character limit to all event descriptions
    document.querySelectorAll('.event-details p').forEach(p => {
        truncateText(p, 150);
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.cash-app-btn, nav a').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Parallax effect on scroll for tagline
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            tagline.style.transform = `translateY(${scrolled * 0.1}px)`;
        });
    }

    // Add loading animation class after page load
    document.body.classList.add('loaded');

    console.log('AIPC Website loaded successfully!');
});

// CSS for ripple effect (added dynamically)
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    nav a, .cash-app-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);