// Simple responsive management for how-we-did-it page
class SimpleResponsiveManager {
    constructor() {
        this.init();
    }
    
    init() {
        // No complex section management needed
        // Just handle the original overflow behavior for region 2
        console.log('Simple layout initialized');
    }
}

// Legacy responsive content management for overflow section
class ResponsiveContentManager {
    constructor() {
        this.region2Content = document.getElementById('region-2-content');
        this.overflowSection = document.getElementById('overflow-section');
        this.overflowContent = document.getElementById('overflow-content');
        
        if (!this.region2Content) return; // Exit if element doesn't exist
        
        this.region2OriginalParent = this.region2Content.parentNode;
        this.isContentMoved = false;
        
        this.init();
    }
    
    init() {
        // Store original content
        this.originalContent = this.region2Content.cloneNode(true);
        
        // Listen for resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial check
        this.handleResize();
    }
    
    handleResize() {
        const windowWidth = window.innerWidth;
        
        if (windowWidth <= 900 && !this.isContentMoved) {
            // Move Region 2 to overflow section
            this.moveToOverflow();
        } else if (windowWidth > 900 && this.isContentMoved) {
            // Move Region 2 back to hero section
            this.moveToHero();
        }
    }
    
    moveToOverflow() {
        if (!this.isContentMoved && this.region2Content) {
            // Clone the content to overflow section
            const contentClone = this.region2Content.cloneNode(true);
            contentClone.classList.remove('region-2');
            contentClone.classList.add('overflow-region');
            contentClone.id = 'overflow-region-content';
            
            this.overflowContent.appendChild(contentClone);
            this.overflowSection.style.display = 'flex';
            this.isContentMoved = true;
        }
    }
    
    moveToHero() {
        if (this.isContentMoved) {
            // Clear overflow content
            this.overflowContent.innerHTML = '';
            this.overflowSection.style.display = 'none';
            this.isContentMoved = false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SimpleResponsiveManager();
    new ResponsiveContentManager();
});
