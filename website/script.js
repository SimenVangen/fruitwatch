
        // Password protection script
        const CORRECT_PASSWORD = "nurocrop"; // CHANGE THIS TO YOUR DESIRED PASSWORD
        
        function checkPassword() {
            const input = document.getElementById('password-input').value;
            const errorMessage = document.getElementById('error-message');
            const websiteContent = document.getElementById('website-content');
            const passwordOverlay = document.getElementById('password-overlay');
            
            if (input === CORRECT_PASSWORD) {
                // Correct password - show website
                passwordOverlay.style.display = 'none';
                websiteContent.style.display = 'block';
                
                // Store in session storage so password isn't needed on refresh
                sessionStorage.setItem('authenticated', 'true');
            } else {
                // Incorrect password - show error
                errorMessage.style.display = 'block';
                document.getElementById('password-input').value = '';
                document.getElementById('password-input').focus();
            }
        }

        // Check if already authenticated
        document.addEventListener('DOMContentLoaded', function() {
            if (sessionStorage.getItem('authenticated') === 'true') {
                document.getElementById('password-overlay').style.display = 'none';
                document.getElementById('website-content').style.display = 'block';
            } else {
                // Focus on password input
                document.getElementById('password-input').focus();
                
                // Allow Enter key to submit
                document.getElementById('password-input').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        checkPassword();
                    }
                });
            }
        });

// Horizontal Gallery Functionality
let currentSlide = 0;
const totalSlides = 4;

function scrollGallery(direction) {
    currentSlide += direction;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    if (currentSlide >= totalSlides) currentSlide = 0;
    updateGallery();
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateGallery();
}

function updateGallery() {
    const track = document.querySelector('.gallery-track');
    const slides = document.querySelectorAll('.gallery-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    // Move track
    if (track) {
        track.style.transform = `translateX(-${currentSlide * 25}%)`;
    }
    
    // Update active states
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

// Mobile menu functionality
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Video play functionality
const videoWrapper = document.querySelector('.video-wrapper');
const video = document.querySelector('.tech-video');
const playOverlay = document.querySelector('.video-play-overlay');

if (videoWrapper && video && playOverlay) {
    playOverlay.addEventListener('click', () => {
        video.play();
        videoWrapper.classList.add('playing');
    });

    video.addEventListener('play', () => {
        videoWrapper.classList.add('playing');
    });

    video.addEventListener('pause', () => {
        videoWrapper.classList.remove('playing');
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});





// Simple scroll animations and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        fadeObserver.observe(el);
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize gallery on page load
    updateGallery();
    const videoWrappers = document.querySelectorAll('.video-wrapper');
    
    videoWrappers.forEach(wrapper => {
        const video = wrapper.querySelector('.tech-video');
        const playOverlay = wrapper.querySelector('.video-play-overlay');
        
        if (video && playOverlay) {
            // Click overlay to play
            playOverlay.addEventListener('click', function() {
                video.play();
                wrapper.classList.add('playing');
            });
            
            // Show overlay when video pauses
            video.addEventListener('pause', function() {
                wrapper.classList.remove('playing');
            });
            
            // Hide overlay when video plays
            video.addEventListener('play', function() {
                wrapper.classList.add('playing');
            });
            
            // Show overlay when video ends
            video.addEventListener('ended', function() {
                wrapper.classList.remove('playing');
            });
        }
    });
});

let calculatorOpen = false;

function toggleCalculator() {
    const content = document.getElementById('calculatorContent');
    const button = document.querySelector('.calculator-toggle');
    
    calculatorOpen = !calculatorOpen;
    
    if (calculatorOpen) {
        content.classList.add('open');
        button.textContent = '💰 Close Calculator';
    } else {
        content.classList.remove('open');
        button.textContent = '💰 Want to calculate what you can save?';
    }
}

function calculateSavings() {
    const cropRevenue = parseFloat(document.getElementById('cropRevenue').value);
    const lossEstimate = parseFloat(document.getElementById('lossEstimate').value);
    
    if (!cropRevenue || cropRevenue === 0) {
        alert('Please enter your annual crop revenue');
        return;
    }

    // Feature-based savings calculations
    const detectionSavings = cropRevenue * 0.04;    // 4% from fruit detection
    const ripenessSavings = cropRevenue * 0.10;     // 10% from premium pricing
    const mappingSavings = cropRevenue * 0.06;      // 6% from labor efficiency
    const predictionSavings = (cropRevenue * (lossEstimate/100)) * 0.35; // 35% reduction of current losses
    
    const totalSavings = detectionSavings + ripenessSavings + mappingSavings + predictionSavings;
    const netReturn = totalSavings - 4000;

    // Update display with formatted numbers
    document.getElementById('detectionSavings').textContent = Math.round(detectionSavings).toLocaleString();
    document.getElementById('ripenessSavings').textContent = Math.round(ripenessSavings).toLocaleString();
    document.getElementById('mappingSavings').textContent = Math.round(mappingSavings).toLocaleString();
    document.getElementById('predictionSavings').textContent = Math.round(predictionSavings).toLocaleString();
    document.getElementById('totalSavings').textContent = Math.round(totalSavings).toLocaleString();
    document.getElementById('netReturn').textContent = Math.round(netReturn).toLocaleString();
    
    // Ensure results are visible
    document.getElementById('calculatorResults').style.display = 'block';
}

// Initialize with default values
calculateSavings();

