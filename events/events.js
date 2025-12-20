// Events Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all image sliders
    const imageSliders = document.querySelectorAll('.image-slider');
    
    imageSliders.forEach(slider => {
        const images = slider.querySelectorAll('.slider-images img');
        const prevBtn = slider.querySelector('.img-prev');
        const nextBtn = slider.querySelector('.img-next');
        const counter = slider.querySelector('.img-counter');
        let currentIndex = 0;
        const totalImages = images.length;
        
        // Update counter display
        function updateCounter() {
            counter.textContent = `${currentIndex + 1} / ${totalImages}`;
        }
        
        // Show specific image
        function showImage(index) {
            // Handle wraparound
            if (index >= totalImages) index = 0;
            if (index < 0) index = totalImages - 1;
            
            // Update images
            images.forEach((img, i) => {
                img.classList.remove('active');
                if (i === index) {
                    img.classList.add('active');
                }
            });
            
            currentIndex = index;
            updateCounter();
        }
        
        // Button events
        prevBtn.addEventListener('click', () => {
            showImage(currentIndex - 1);
        });
        
        nextBtn.addEventListener('click', () => {
            showImage(currentIndex + 1);
        });
        
        // Initialize counter
        updateCounter();
        
        // Touch/swipe support
        const sliderImages = slider.querySelector('.slider-images');
        let touchStartX = 0;
        let touchEndX = 0;
        
        sliderImages.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sliderImages.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    showImage(currentIndex + 1);
                } else {
                    showImage(currentIndex - 1);
                }
            }
        }
    });
    
    // Animate timeline events on scroll
    const timelineEvents = document.querySelectorAll('.timeline-event');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    timelineEvents.forEach((event, index) => {
        event.style.opacity = '0';
        event.style.transform = 'translateY(30px)';
        event.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(event);
    });
    
    // Add visible class styles
    const visibleStyle = document.createElement('style');
    visibleStyle.textContent = `
        .timeline-event.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(visibleStyle);
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.img-prev, .img-next');
    buttons.forEach(btn => {
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
    
    console.log('Events page loaded!');
});

// Add ripple styles
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
    
    .img-prev, .img-next {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);