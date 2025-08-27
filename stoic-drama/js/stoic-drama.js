// Stoic Drama - Horizontal Scrolling Handler
document.addEventListener('DOMContentLoaded', function() {
    
    // Only apply horizontal scroll behavior on desktop (above 768px)
    function initHorizontalScroll() {
        if (window.innerWidth > 768) {
            // Handle all wheel events (mouse wheel + trackpad)
            window.addEventListener('wheel', function(e) {
                // Check if this is primarily horizontal movement (trackpad swipe)
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    // Let natural horizontal scrolling work for trackpad swipes
                    return;
                }
                
                // For vertical wheel movement, convert to horizontal scroll
                e.preventDefault();
                
                // Improved scroll speed - multiply by 1.5 for more natural feel
                const scrollAmount = e.deltaY * 1.5;
                
                // Use immediate scrolling for responsiveness
                window.scrollBy(scrollAmount, 0);
                
            }, { passive: false });
        }
    }
    
    // Initialize on load
    initHorizontalScroll();
    
    // Re-initialize on window resize
    window.addEventListener('resize', function() {
        // Remove existing listeners by reloading if crossing the 768px threshold
        initHorizontalScroll();
    });
    
    // Smooth scroll behavior for any navigation
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
    
    // Add keyboard navigation for horizontal sections
    window.addEventListener('keydown', function(e) {
        if (window.innerWidth > 768) {
            const scrollAmount = window.innerWidth;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    window.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    window.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                    break;
            }
        }
    });
});

// Debug function to help with layout adjustments
function logScrollPosition() {
    console.log('Scroll position:', window.scrollX, window.scrollY);
    console.log('Window size:', window.innerWidth, window.innerHeight);
}

// Uncomment for debugging
// window.addEventListener('scroll', logScrollPosition);
