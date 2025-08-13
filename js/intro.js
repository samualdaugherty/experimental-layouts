document.addEventListener('DOMContentLoaded', async () => {
  const flow = new TextFlow({
    regionSelector: '.region',
    contentUrl: 'content/intro.json',
    debug: true,
    debounceMs: 180,
  });

  // Renderers
  const traditionalContainer = document.getElementById('traditional-container');

  function shouldUseTextFlow() {
    // Use TextFlow on xl and up (>1280px)
    return window.innerWidth > 1280;
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
    const html = blocks.map(renderBlockToHtml).join('');
    traditionalContainer.innerHTML = html;
  }

  async function initLayout() {
    clearTraditional();
    if (shouldUseTextFlow()) {
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

