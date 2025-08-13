'use strict';

/*
  TextFlow: A lightweight, region-based text flow system for the web.
  - Loads structured JSON content
  - Converts blocks to DOM elements
  - Measures and flows content into ordered regions
  - Respects keep-with-next and basic orphan protection
  - Reflows on resize (debounced)
*/

(function () {
  class TextFlow {
    /**
     * @param {Object} options
     * @param {string} options.regionSelector - CSS selector for regions
     * @param {string} options.contentUrl - URL to JSON content
     * @param {boolean} [options.debug=false] - Enable verbose logging
     * @param {number} [options.debounceMs=150] - Resize debounce interval
     */
    constructor(options) {
      this.regionSelector = options.regionSelector || '.region';
      this.contentUrl = options.contentUrl;
      this.debug = Boolean(options.debug);
      this.debounceMs = options.debounceMs || 150;

      this.content = null;
      this.blocks = [];
      this.regions = [];
      this.sandbox = null;
      this.resizeHandler = null;
    }

    async init() {
      await this.waitForFonts();
      await this.loadContent();
      this.scanRegions();
      this.createSandbox();
      this.flow();
      this.attachResize();
    }

    log(...args) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log('[TextFlow]', ...args);
      }
    }

    error(...args) {
      // eslint-disable-next-line no-console
      console.error('[TextFlow]', ...args);
    }

    async waitForFonts() {
      if (document && 'fonts' in document) {
        try {
          await document.fonts.ready;
        } catch (_) {
          // ignore
        }
      }
    }

    async loadContent() {
      if (!this.contentUrl) {
        this.error('No contentUrl provided');
        return;
      }
      try {
        const res = await fetch(this.contentUrl, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        this.validateContent(json);
        this.content = json;
        this.blocks = this.buildBlocks(json);
        document.title = json.title ? `${json.title} — EXPERI-MENTAL` : document.title;
        this.log('Loaded content:', json);
      } catch (err) {
        this.error('Failed to load content', err);
        const container = document.querySelector('#regions') || document.body;
        const msg = document.createElement('div');
        msg.className = 'text-red-600 p-4';
        msg.textContent = 'Failed to load content.';
        container.appendChild(msg);
      }
    }

    validateContent(json) {
      if (!json || typeof json !== 'object') throw new Error('Invalid JSON root');
      if (!Array.isArray(json.blocks)) throw new Error('JSON missing blocks[] array');
    }

    buildBlocks(json) {
      const blocks = [];
      json.blocks.forEach((b, index) => {
        const type = b.type;
        const id = b.id || `blk-${index}`;
        const keepWithNext = Boolean(b.keepWithNext);
        const orphanProtection = typeof b.orphanProtection === 'number' ? b.orphanProtection : 2;
        const text = String(b.text || '');
        const level = b.level || (type === 'heading' ? 2 : undefined);

        if (type === 'heading') {
          blocks.push({ id, type, level, text, keepWithNext, orphanProtection, elFactory: () => this.createHeading(level, text) });
        } else if (type === 'paragraph') {
          blocks.push({ id, type, text, keepWithNext, orphanProtection, elFactory: (t = text) => this.createParagraph(t) });
        } else {
          this.log('Skipping unsupported block type', type);
        }
      });
      return blocks;
    }

    scanRegions() {
      const nodes = Array.from(document.querySelectorAll(this.regionSelector));
      if (nodes.length === 0) {
        this.error('No regions found for selector', this.regionSelector);
      }
      
      // Filter to only visible regions
      const visibleNodes = nodes.filter(el => {
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0';
        
        if (!isVisible) {
          this.log(`Skipping hidden region: ${el.className}`);
        }
        
        return isVisible;
      });
      
      const ordered = visibleNodes
        .map((el) => ({ el, order: Number(el.getAttribute('data-flow-order') || '0') }))
        .sort((a, b) => a.order - b.order)
        .map((r) => r.el);
      this.regions = ordered;
      
      // ensure inner containers
      this.regions.forEach((region) => {
        region.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'flow-content';
        region.appendChild(wrap);
      });
      this.log('Visible regions found:', this.regions.length);
      
      // Log region details for debugging
      this.regions.forEach((region, index) => {
        const rect = region.getBoundingClientRect();
        this.log(`Region ${index + 1}: width=${rect.width}, height=${rect.height}, order=${region.getAttribute('data-flow-order')}`);
      });
    }

    createHeading(level, text) {
      const lvl = Math.min(Math.max(Number(level || 2), 2), 4);
      const tag = `h${lvl}`;
      const h = document.createElement(tag);
      h.className = `flow-heading flow-h${lvl}`;
      h.textContent = text;
      this.log(`Created heading: ${tag}, text="${text.substring(0, 30)}...", className=${h.className}`);
      return h;
    }

    createParagraph(text) {
      const p = document.createElement('p');
      p.className = 'flow-p';
      p.textContent = text;
      this.log(`Created paragraph: text="${text.substring(0, 30)}...", className=${p.className}`);
      return p;
    }

    attachResize() {
      const handler = this.debounce(() => {
        this.log('Resize -> reflow');
        this.flow();
      }, this.debounceMs);
      window.addEventListener('resize', handler);
      this.resizeHandler = handler;
    }

    destroy() {
      if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
      if (this.sandbox && this.sandbox.parentNode) this.sandbox.parentNode.removeChild(this.sandbox);
    }

    createSandbox() {
      if (this.sandbox) return;
      const sb = document.createElement('div');
      sb.className = 'measure-sandbox';
      sb.style.width = '1000px';
      sb.style.position = 'absolute';
      sb.style.visibility = 'hidden';
      sb.style.left = '-99999px';
      sb.style.top = '0';
      sb.style.pointerEvents = 'none';
      document.body.appendChild(sb);
      this.sandbox = sb;
      
      // Test if CSS is working
      const testP = document.createElement('p');
      testP.className = 'flow-p';
      testP.textContent = 'Test paragraph for CSS measurement';
      sb.appendChild(testP);
      const testHeight = testP.getBoundingClientRect().height;
      this.log(`CSS test: testP height=${testHeight}, className=${testP.className}`);
      sb.innerHTML = '';
    }

    clearRegions() {
      this.regions.forEach((region) => {
        const wrap = region.querySelector('.flow-content');
        if (wrap) wrap.innerHTML = '';
      });
    }

    flow() {
      if (!this.blocks || this.blocks.length === 0 || this.regions.length === 0) {
        this.log('No blocks or regions to flow');
        return;
      }

      this.log('Starting flow with', this.blocks.length, 'blocks and', this.regions.length, 'regions');

      // Start fresh
      this.clearRegions();

      // Work on a mutable queue
      const queue = this.blocks.map((b) => ({ ...b, text: b.text }));

      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        const wrap = region.querySelector('.flow-content');
        if (!wrap) {
          this.log('No flow-content wrapper found in region', i);
          continue;
        }

        const { availableHeight, innerWidth } = this.getRegionMetrics(region, wrap);
        this.log(`Region ${i + 1}: availableHeight=${availableHeight}, innerWidth=${innerWidth}, queue.length=${queue.length}`);
        
        if (availableHeight <= 0 || innerWidth <= 0) {
          this.log(`Region ${i + 1}: Invalid dimensions, skipping`);
          continue;
        }
        
        this.sandbox.style.width = `${innerWidth}px`;

        let used = 0;
        let blocksAdded = 0;

        while (queue.length > 0) {
          const remaining = availableHeight - used;
          if (remaining <= 0) {
            this.log(`Region ${i + 1}: No more space (used=${used}, available=${availableHeight})`);
            break;
          }

          const block = queue[0];
          this.log(`Region ${i + 1}: Processing block "${block.text.substring(0, 30)}..."`);

          // keep-with-next handling
          if (block.keepWithNext && queue.length >= 2) {
            const elA = block.elFactory(block.text);
            const elB = queue[1].type === 'paragraph'
              ? queue[1].elFactory(queue[1].text)
              : queue[1].elFactory();

            const heightTogether = this.measureHeight([elA, elB]);
            this.log(`Region ${i + 1}: keep-with-next height=${heightTogether}, remaining=${remaining}`);
            
            if (heightTogether <= remaining) {
              wrap.appendChild(elA);
              wrap.appendChild(elB);
              used += heightTogether;
              queue.shift();
              queue.shift();
              blocksAdded += 2;
              this.log(`Region ${i + 1}: Added 2 blocks with keep-with-next`);
              continue;
            } else {
              this.log(`Region ${i + 1}: Cannot fit keep-with-next blocks, moving to next region`);
              break;
            }
          }

          // Single block fit check
          const el = block.type === 'paragraph' ? block.elFactory(block.text) : block.elFactory();
          const h = this.measureHeight([el]);
          this.log(`Region ${i + 1}: Single block height=${h}, remaining=${remaining}`);

          if (h <= remaining) {
            wrap.appendChild(el);
            used += h;
            queue.shift();
            blocksAdded++;
            this.log(`Region ${i + 1}: Added single block`);
            continue;
          }

          // Does not fit. Headings never split.
          if (block.type !== 'paragraph') {
            this.log(`Region ${i + 1}: Heading does not fit, moving to next region`);
            break;
          }

          // Paragraph splitting with orphan protection
          const split = this.splitParagraph(block, remaining);
          this.log(`Region ${i + 1}: Split result: fitsWords=${split.fitsWords}, firstText="${split.firstText.substring(0, 30)}..."`);
          
          if (split.fitsWords === 0) {
            this.log(`Region ${i + 1}: Nothing can fit, moving entire paragraph to next region`);
            break;
          }

          // Append the fitting fragment
          const firstText = split.firstText;
          const restText = split.restText;
          const fragEl = block.elFactory(firstText);
          const fragHeight = this.measureHeight([fragEl]);
          if (fragHeight <= remaining) {
            wrap.appendChild(fragEl);
            used += fragHeight;
            // Update the queue head with remaining text
            block.text = restText;
            blocksAdded++;
            this.log(`Region ${i + 1}: Added paragraph fragment, remaining text: "${restText.substring(0, 30)}..."`);
          } else {
            this.log(`Region ${i + 1}: Fragment measurement changed, moving to next region`);
            break;
          }
        }
        
        this.log(`Region ${i + 1}: Added ${blocksAdded} blocks, used ${used}px of ${availableHeight}px`);
      }

      this.log('Flow complete, remaining blocks:', queue.length);
    }

    getRegionMetrics(region, wrap) {
      const cs = getComputedStyle(wrap);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const innerWidth = region.clientWidth - padLeft - padRight;
      const availableHeight = region.clientHeight - padTop - padBottom;
      return { availableHeight, innerWidth };
    }

    measureHeight(nodes) {
      if (!this.sandbox) this.createSandbox();
      const sb = this.sandbox;
      sb.innerHTML = '';
      
      // Ensure the sandbox has the right width for measurement
      const targetWidth = this.sandbox.style.width || '1000px';
      sb.style.width = targetWidth;
      
      // Create a temporary container that mimics the region environment
      const tempContainer = document.createElement('div');
      tempContainer.style.width = targetWidth;
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.left = '-99999px';
      tempContainer.style.top = '0';
      tempContainer.style.pointerEvents = 'none';
      
      // Add the temp container to the document temporarily
      document.body.appendChild(tempContainer);
      
      nodes.forEach((n) => {
        const clone = n.cloneNode(true);
        tempContainer.appendChild(clone);
      });
      
      // Force layout calculation
      tempContainer.offsetHeight; // trigger reflow
      const rect = tempContainer.getBoundingClientRect();
      const height = rect.height;
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      this.log(`MeasureHeight: ${nodes.length} nodes, width=${targetWidth}, height=${height}`);
      return height;
    }

    splitParagraph(block, availableHeight) {
      const text = block.text || '';
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return { fitsWords: 0, firstText: '', restText: '' };

      // Establish a measuring element with the paragraph style
      const measureP = block.elFactory('');
      this.sandbox.innerHTML = '';
      this.sandbox.appendChild(measureP);
      const lineHeight = this.getLineHeightPx(measureP);
      const minLines = Math.max(1, Number(block.orphanProtection || 2));
      const minHeight = lineHeight * minLines;

      // If we cannot fit even the minimum lines, defer to next region
      if (availableHeight < minHeight) {
        return { fitsWords: 0, firstText: '', restText: text };
      }

      // Binary search the maximum words that fit within availableHeight
      let lo = 1;
      let hi = words.length;
      let best = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        measureP.textContent = words.slice(0, mid).join(' ');
        const h = measureP.getBoundingClientRect().height;
        if (h <= availableHeight) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (best === 0) return { fitsWords: 0, firstText: '', restText: text };

      // Ensure fragment itself has at least minLines
      measureP.textContent = words.slice(0, best).join(' ');
      const fragHeight = measureP.getBoundingClientRect().height;
      if (fragHeight < minHeight) {
        return { fitsWords: 0, firstText: '', restText: text };
      }

      const firstText = words.slice(0, best).join(' ');
      const restText = words.slice(best).join(' ');
      return { fitsWords: best, firstText, restText };
    }

    getLineHeightPx(el) {
      const cs = getComputedStyle(el);
      const lh = cs.lineHeight;
      if (lh.endsWith('px')) return parseFloat(lh);
      const fontSize = parseFloat(cs.fontSize) || 16;
      return 1.2 * fontSize; // rough fallback for 'normal'
    }

    debounce(fn, delay) {
      let t = null;
      return (...args) => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => fn.apply(this, args), delay);
      };
    }
  }

  window.TextFlow = TextFlow;
})();

