document.addEventListener('DOMContentLoaded', async () => {
  const flow = new TextFlow({
    regionSelector: '.region',
    contentUrl: '../content/algorithm.json',
    debug: true,
    debounceMs: 180,
  });

  // Renderers
  const traditionalContainer = document.getElementById('traditional-container');

  function shouldUseTextFlow() {
    // Use TextFlow on larger screens (>1024px)
    // Switch to traditional layout at 1024px and below
    return window.innerWidth > 1024;
  }

  function clearTraditional() {
    if (traditionalContainer) traditionalContainer.innerHTML = '';
  }

  function renderBlockToHtml(block) {
    if (block.type === 'heading') {
      const level = Math.min(Math.max(Number(block.level || 2), 2), 4);
      return `<h${level} class="flow-heading flow-h${level}">${block.text}</h${level}>`;
    }
    return `<p class="flow-p">${block.text}</p>`;
  }

  function renderTraditionalLayout(blocks) {
    if (!traditionalContainer) return;
    
    // Insert blockquote at the middle of the content
    const middleIndex = Math.floor(blocks.length / 2);
    const firstHalf = blocks.slice(0, middleIndex);
    const secondHalf = blocks.slice(middleIndex);
    
    const blockquoteHtml = `
      <div class="blockquote-break">
        <p class="quote-text">"Today I searched for <span class="accent-color">hope</span>. It gave me old photos of my ex."</p>
        <cite class="quote-attribution">– user_7392034, 2:14am, incognito tab</cite>
      </div>
    `;
    
    const html = firstHalf.map(renderBlockToHtml).join('') + 
                 blockquoteHtml + 
                 secondHalf.map(renderBlockToHtml).join('');
    
    traditionalContainer.innerHTML = html;
    
    // Show traditional container
    traditionalContainer.classList.remove('hidden');

    // Ensure content layout stays visible (hero/blockquote/robot-heart remain)
    const contentLayout = document.querySelector('.content-layout');
    if (contentLayout) contentLayout.style.display = '';

    // Hide only region sections for traditional layout
    const regions = document.querySelectorAll('.region');
    regions.forEach((region) => {
      region.style.display = 'none';
    });
  }

  function showContentLayout() {
    // Show content layout, hide traditional container
    if (traditionalContainer) traditionalContainer.classList.add('hidden');
    
    const contentLayout = document.querySelector('.content-layout');
    if (contentLayout) contentLayout.style.display = 'flex';

    // Ensure regions are visible again when using TextFlow
    const regions = document.querySelectorAll('.region');
    regions.forEach((region) => {
      region.style.display = '';
    });
  }

  async function initLayout() {
    clearTraditional();
    
    if (shouldUseTextFlow()) {
      showContentLayout();
      await flow.init();
    } else {
      if (!flow.content) {
        await flow.loadContent();
        flow.blocks = flow.buildBlocks(flow.content);
      }
      renderTraditionalLayout(flow.blocks);
    }
  }

  const debounced = (fn, delay) => {
    let t = null;
    return (...args) => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => fn.apply(null, args), delay);
    };
  };

  await initLayout();

  window.addEventListener('resize', debounced(initLayout, 200));
});
