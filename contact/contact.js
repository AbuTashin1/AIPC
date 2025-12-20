// Contact Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    const contactForm = document.getElementById('contactForm');
    const formBox = document.querySelector('.contact-form-box');
    const successMessage = document.getElementById('successMessage');
    
    // Check if redirected back with success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        showSuccess();
    }
    
    // Form submission handler
    contactForm.addEventListener('submit', function(e) {
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<span>Sending...</span><span class="btn-icon">⏳</span>';
        submitBtn.disabled = true;
        
        // If using FormSubmit, let the form submit normally
        // If you want AJAX submission, uncomment below:
        
        /*
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        
        fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showSuccess();
            } else {
                throw new Error('Failed to send');
            }
        })
        .catch(error => {
            submitBtn.innerHTML = '<span>Send Message</span><span class="btn-icon">→</span>';
            submitBtn.disabled = false;
            alert('Sorry, there was an error. Please try again.');
        });
        */
    });
    
    // Show success message
    function showSuccess() {
        formBox.classList.add('success');
        successMessage.classList.add('show');
        
        // Clear URL params
        if (urlParams.get('success')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    // Input focus animations
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.contact-form-box, .info-section, .donate-section');
    
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
    
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.15}s, transform 0.5s ease ${index * 0.15}s`;
        observer.observe(el);
    });
    
    // Social card hover sounds (optional - visual feedback)
    const socialCards = document.querySelectorAll('.social-card');
    socialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
    
    // Donate button pulse effect
    const donateBtn = document.querySelector('.donate-btn');
    if (donateBtn) {
        setInterval(() => {
            donateBtn.style.boxShadow = '0 8px 25px rgba(0, 194, 68, 0.5)';
            setTimeout(() => {
                donateBtn.style.boxShadow = '0 4px 15px rgba(0, 194, 68, 0.3)';
            }, 500);
        }, 3000);
    }
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.submit-btn, .donate-btn');
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
    
    console.log('Contact page loaded!');
});

// Add ripple styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
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
    
    .submit-btn, .donate-btn {
        position: relative;
        overflow: hidden;
    }
    
    .form-group.focused label {
        color: #0059ff;
    }
`;
document.head.appendChild(rippleStyle);