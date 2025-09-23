/**
 * StoryUI Module (minimal)
 * Handles story/dialogue overlays in a resilient way for tests with minimal DOM.
 */
class StoryUI extends BaseUIModule {
  constructor(uiManager, options = {}) {
    super('story', uiManager, options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      persistent: false,
      transition: 'fade'
    };
  }

  init() {
    this.cacheElements();
    this.ensureElements();
    this.attachEvents();
    this.setupState();
    this.logDebug('Module story initialized');
  }

  cacheElements() {
    this.elements = {
      container: document.getElementById('story-modal') || null,
      dialogue: document.getElementById('story-text') || null,
      speaker: document.getElementById('story-speaker') || null,
      nextBtn: document.getElementById('story-next') || null,
      choiceList: document.getElementById('story-choices') || null,
      closeBtn: document.getElementById('story-close') || null
    };
  }

  attachEvents() {
    const { nextBtn, choiceList, closeBtn } = this.elements || {};

    if (nextBtn) {
      this.addEventListener(nextBtn, 'click', () => this.advance());
    }

    if (choiceList) {
      this.addEventListener(choiceList, 'click', (e) => {
        const btn = e.target.closest('[data-choice-index]');
        if (!btn) return;
        const idx = Number(btn.getAttribute('data-choice-index'));
        this.selectChoice(idx);
      });
    }

    if (closeBtn) {
      this.addEventListener(closeBtn, 'click', () => this.close());
    }

    // Also handle clicking on modal backdrop to close
    if (this.elements?.container) {
      this.addEventListener(this.elements.container, 'click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
          this.close();
        }
      });
    }
  }

  setupState() {
    this.state = {
      active: false,
      node: null,
      index: 0,
      lastRenderedNode: null, // Track what was last rendered to prevent unnecessary re-renders
      isRendering: false // Prevent render loops
    };
  }

  onShow() {
    if (!this.elements || !this.elements.container) {
      this.cacheElements();
      this.ensureElements();
      this.attachEvents();
    }
    this.render();
  }

  // Public: present a dialogue node { text, choices?: [{label, eventName, outcome, next}], next?: node }
  showDialogue(node) {
    this.state.active = true;
    this.state.node = node || null;
    this.state.index = 0;
    this.render();
  }

  // Build a linked node chain from a dialogue array [{speaker?, text}]
  buildDialogueChain(dialogueArr) {
    if (!Array.isArray(dialogueArr) || dialogueArr.length === 0) return null;
    const nodes = dialogueArr.map(d => ({ text: d?.text || '' }));
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
    return nodes[0];
  }

  // Render a full ending by key using StoryData.endings
  playEnding(endingKey) {
    try {
      const ending = (typeof window !== 'undefined' && window.StoryData?.getEnding)
        ? window.StoryData.getEnding(endingKey)
        : null;
      if (!ending) return false;
      const first = this.buildDialogueChain(ending.dialogue || []);
      if (!first) return false;
      this.showDialogue(first);
      return true;
    } catch (_) { return false; }
  }

  advance() {
    const node = this.state.node;
    if (!node) { this.close(); return true; }
    if (node.next) {
      this.state.node = node.next;
      this.render();
      return true;
    }
    // No next: close
    this.close();
    return true;
  }

  selectChoice(index) {

    const node = this.state.node;
    if (!node || !Array.isArray(node.choices)) {
      console.warn('StoryUI: No node or choices available');
      return false;
    }

    const choice = node.choices[index];
    if (!choice) {
      console.warn(`StoryUI: No choice found at index ${index}`);
      return false;
    }

    // Apply story choice if specified
    try {
      const gs = this.getGameState();
      if (gs && typeof gs.processStoryChoice === 'function' && choice.eventName) {
        gs.processStoryChoice(choice.eventName, choice.outcome || null);
      }
    } catch (error) {
      console.error('StoryUI: Error processing story choice:', error);
    }

    // Move to next node if provided, else close
    if (choice.next) {
      this.state.node = choice.next;
      this.render();
    } else {
      this.close();
    }
    return true;
  }

  close() {
    this.state.active = false;
    this.state.lastRenderedNode = null; // Reset render tracking
    this.state.isRendering = false; // Reset render state

    try {
      if (this.elements?.container) {
        this.elements.container.classList.add('hidden');

        // Clear choices when closing
        if (this.elements.choiceList) {
          this.elements.choiceList.innerHTML = '';
        }
      }

      console.log('📖 StoryUI: Modal closed');
    } catch (error) {
      console.warn('StoryUI close error:', error);
    }
  }

  /**
   * Show a story event by loading it from StoryData
   * This method is called by GameWorldUI when story events trigger during exploration
   */
  showStoryEvent(eventName) {
    if (typeof window.StoryData === 'undefined') {
      console.warn('StoryData not available for story event');
      return false;
    }

    try {
      const event = window.StoryData.getEvent(eventName);
      if (!event) {
        console.warn(`Story event not found: ${eventName}`);
        return false;
      }

      // Load the event as the current story node
      this.state.node = {
        speaker: event.dialogue?.[0]?.speaker || 'Narrator',
        text: event.dialogue?.[0]?.text || event.description || `Story: ${event.name}`,
        choices: (event.choices || []).map((choice, index) => ({
          text: choice.text,
          eventName: eventName,
          outcome: choice.outcome,
          next: null // Will close after choice
        }))
      };


      this.state.active = true;
      this.render();
      this.show();

      console.log(`📖 StoryUI: Loaded story event ${eventName}`);
      return true;
    } catch (error) {
      console.warn('Failed to show story event:', error);
      return false;
    }
  }

  // Ensure minimal DOM elements exist for resilience in tests and minimal pages
  ensureElements() {
    try {
      // Use existing story modal or create fallback
      if (!this.elements?.container) {
        let container = document.getElementById('story-modal');
        if (!container) {
          // Fallback: create simple story container for tests
          container = document.createElement('div');
          container.id = 'story-modal';
          container.className = 'hidden';
          container.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
              <header class="modal-header">
                <h3>Story</h3>
                <button id="story-close">✕</button>
              </header>
              <div class="modal-body">
                <div id="story-speaker"></div>
                <div id="story-text"></div>
              </div>
            </div>
          `;
          document.body.appendChild(container);
        }
        this.elements = this.elements || {};
        this.elements.container = container;
      }

      // Re-cache elements only if we just created the container
      if (this.elements?.container && !this.elements?.speaker) {
        this.cacheElements();
      }
    } catch (error) {
      console.warn('StoryUI ensureElements error:', error);
    }
  }

  render() {
    const node = this.state.node;

    // Prevent render loops
    if (this.state.isRendering) {
      console.warn('📖 StoryUI: Render loop detected, skipping render');
      return;
    }

    // Check if we need to re-render (node changed)
    if (this.state.lastRenderedNode === node) {
      return; // No need to re-render the same content
    }

    this.state.isRendering = true;

    try {
      this.ensureElements();

      // Show the modal (only log once per node)
      if (this.elements?.container) {
        this.elements.container.classList.remove('hidden');
        if (this.state.lastRenderedNode !== node) {
          console.log('📖 StoryUI: Modal displayed');
        }
      } else {
        console.warn('📖 StoryUI: No container element found!');
      }

      // Set speaker
      if (this.elements?.speaker) {
        this.elements.speaker.textContent = node?.speaker || 'Narrator';
      }

      // Set dialogue text
      if (this.elements?.dialogue) {
        this.elements.dialogue.textContent = node?.text || 'No text available';
      }

      // Handle choices or next button
      this.renderChoices(node);

      // Mark this node as rendered
      this.state.lastRenderedNode = node;

    } catch (error) {
      console.warn('StoryUI render error:', error);
    } finally {
      this.state.isRendering = false;
    }
  }

  renderChoices(node) {
    // Create choices container if it doesn't exist
    if (!this.elements?.choiceList) {
      const modal = this.elements?.container;
      if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
          const choicesDiv = document.createElement('div');
          choicesDiv.id = 'story-choices';
          choicesDiv.className = 'story-choices';
          choicesDiv.style.cssText = '';
          modalBody.appendChild(choicesDiv);
          this.elements.choiceList = choicesDiv;
        }
      }
    }

    if (this.elements?.choiceList) {
      this.elements.choiceList.innerHTML = '';
      this.elements.choiceList.classList.remove('hidden'); // Make sure choices are visible

      if (Array.isArray(node?.choices) && node.choices.length > 0) {

        // Show choices
        node.choices.forEach((choice, i) => {
          const btn = document.createElement('button');
          btn.className = 'story-choice-btn';
          btn.setAttribute('data-choice-index', String(i));
          btn.textContent = choice.text || `Choice ${i + 1}`;
          btn.style.cssText = '';

          // Add direct click handler - capture choice data to avoid state issues
          btn.onclick = (e) => {
            // Process the choice directly instead of relying on selectChoice
            try {
              const gs = this.getGameState();
              if (gs && typeof gs.processStoryChoice === 'function' && choice.eventName) {
                gs.processStoryChoice(choice.eventName, choice.outcome || null);
              }
              this.close();
            } catch (error) {
              console.error('StoryUI: Error processing choice:', error);
            }
          };

          this.elements.choiceList.appendChild(btn);
        });

        // Hide next button if it exists
        if (this.elements.nextBtn) this.elements.nextBtn.style.display = 'none';
      } else {

        // No choices, show next button or auto-advance
        if (this.elements.nextBtn) {
          this.elements.nextBtn.style.display = '';
        } else {
          // Create a simple "Continue" button
          const continueBtn = document.createElement('button');
          continueBtn.className = 'story-continue-btn';
          continueBtn.textContent = 'Continue';
          continueBtn.onclick = () => this.advance();
          continueBtn.style.cssText = '';
          this.elements.choiceList.appendChild(continueBtn);
        }
      }
    }
  }

  logDebug(msg) {
    if (this.uiManager?.config?.debugMode) console.log(`✅ ${msg}`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoryUI;
} else if (typeof window !== 'undefined') {
  window.StoryUI = StoryUI;
}
