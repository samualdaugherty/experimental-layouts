/**
 * Global Navigation Component
 * Handles hamburger menu toggle and page detection
 */

class GlobalNavigation {
  constructor() {
    this.hamburgerBtn = document.getElementById('hamburger-btn');
    this.closeBtn = document.getElementById('nav-close-btn');
    this.overlay = document.getElementById('nav-overlay');
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    // Bind event listeners
    this.hamburgerBtn.addEventListener('click', () => this.openNav());
    this.closeBtn.addEventListener('click', () => this.closeNav());
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeNav();
      }
    });
    
    // Close on overlay click (outside content)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.closeNav();
      }
    });
    
    // Prevent body scroll when nav is open
    this.overlay.addEventListener('transitionend', () => {
      if (this.isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    
    // Set active page indicator
    this.setActivePage();
  }
  
  openNav() {
    this.isOpen = true;
    this.overlay.classList.add('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');
    
    // Animate in the links with stagger
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link, index) => {
      link.style.transform = 'translateY(100px)';
      link.style.opacity = '0';
      
      setTimeout(() => {
        link.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        link.style.transform = 'translateY(0)';
        link.style.opacity = '1';
      }, 100 + (index * 100));
    });
  }
  
  closeNav() {
    this.isOpen = false;
    this.overlay.classList.remove('active');
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    
    // Reset link animations
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.style.transition = '';
      link.style.transform = '';
      link.style.opacity = '';
    });
  }
  
  setActivePage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Remove trailing slash for comparison
      const normalizedPath = currentPath.replace(/\/$/, '') || '/';
      const normalizedHref = href.replace(/\/$/, '') || '/';
      
      if (normalizedPath === normalizedHref || 
          (normalizedPath.includes('/stoic-drama') && href.includes('/stoic-drama')) ||
          (normalizedPath.includes('/algorithm') && href.includes('/algorithm')) ||
          (normalizedPath.includes('/how-we-did-it') && href.includes('/how-we-did-it'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GlobalNavigation();
});
