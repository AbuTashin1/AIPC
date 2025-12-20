// AIPC Vocabulary Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all sliders
    const vocabCards = document.querySelectorAll('.vocab-card');
    
    vocabCards.forEach((card, cardIndex) => {
        const slider = card.querySelector('.slider');
        const slides = slider.querySelectorAll('.slide');
        const prevBtn = card.querySelector('.arrow-btn.prev');
        const nextBtn = card.querySelector('.arrow-btn.next');
        const dots = card.querySelectorAll('.dot');
        let currentSlide = 0;
        
        // Function to show a specific slide
        function showSlide(index) {
            // Handle wraparound
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;
            
            // Update slides
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) {
                    slide.classList.add('active');
                }
            });
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === index) {
                    dot.classList.add('active');
                }
            });
            
            currentSlide = index;
        }
        
        // Arrow button events
        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
        });
        
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
        });
        
        // Dot click events
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showSlide(i);
            });
        });
        
        // Load YouTube thumbnail for this card
        const videoThumbnail = card.querySelector('.video-thumbnail');
        if (videoThumbnail) {
            const videoUrl = videoThumbnail.dataset.video || card.dataset.video;
            if (videoUrl) {
                const videoId = extractYouTubeId(videoUrl);
                if (videoId) {
                    const thumbnailImg = videoThumbnail.querySelector('.yt-thumbnail');
                    // Use high quality thumbnail
                    thumbnailImg.src = `https://img.youtube.com/vi/iL-cqyBm8nI/hqdefault.jpg`;
                    
                    // Click to open video
                    videoThumbnail.addEventListener('click', () => {
                        window.open(videoUrl, '_blank');
                    });
                }
            }
        }
        
        // Keyboard navigation when card is focused/hovered
        card.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                showSlide(currentSlide - 1);
            } else if (e.key === 'ArrowRight') {
                showSlide(currentSlide + 1);
            }
        });
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next slide
                    showSlide(currentSlide + 1);
                } else {
                    // Swipe right - previous slide
                    showSlide(currentSlide - 1);
                }
            }
        }
    });
    
    // Extract YouTube video ID from URL
    function extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    // Add hover effect enhancements
    const allBoxes = document.querySelectorAll('.vocab-box');
    allBoxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        box.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
        });
    });
    
    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    vocabCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        observer.observe(card);
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.arrow-btn, .example-tag');
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
    
    console.log('AIPC Vocabulary page loaded!');
});

// Add ripple effect styles dynamically
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
    
    .arrow-btn, .example-tag {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);