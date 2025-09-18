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
      container: document.getElementById('story') || null,
      dialogue: document.getElementById('story-dialogue') || null,
      nextBtn: document.getElementById('story-next') || null,
      choiceList: document.getElementById('story-choices') || null
    };
  }

  attachEvents() {
    const { nextBtn, choiceList } = this.elements || {};
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
  }

  setupState() {
    this.state = { active: false, node: null, index: 0 };
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
    if (!node || !Array.isArray(node.choices)) return false;
    const choice = node.choices[index];
    if (!choice) return false;

    // Apply story choice if specified
    try {
      const gs = this.getGameState();
      if (gs && typeof gs.processStoryChoice === 'function' && choice.eventName) {
        gs.processStoryChoice(choice.eventName, choice.outcome || null);
      }
    } catch (_) {}

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
    try {
      if (this.elements?.container) this.elements.container.classList.add('hidden');
    } catch (_) {}
  }

  // Ensure minimal DOM elements exist for resilience in tests and minimal pages
  ensureElements() {
    try {
      // Container
      if (!this.elements?.container) {
        let container = document.getElementById('story');
        if (!container) {
          container = document.createElement('div');
          container.id = 'story';
          document.body.appendChild(container);
        }
        this.elements = this.elements || {};
        this.elements.container = container;
      }
      const container = this.elements.container;
      // Dialogue
      if (!this.elements.dialogue) {
        let dlg = document.getElementById('story-dialogue');
        if (!dlg) {
          dlg = document.createElement('div');
          dlg.id = 'story-dialogue';
          container.appendChild(dlg);
        }
        this.elements.dialogue = dlg;
      }
      // Choices
      if (!this.elements.choiceList) {
        let choices = document.getElementById('story-choices');
        if (!choices) {
          choices = document.createElement('div');
          choices.id = 'story-choices';
          container.appendChild(choices);
        }
        this.elements.choiceList = choices;
      }
      // Next button
      if (!this.elements.nextBtn) {
        let nextBtn = document.getElementById('story-next');
        if (!nextBtn) {
          nextBtn = document.createElement('button');
          nextBtn.id = 'story-next';
          container.appendChild(nextBtn);
        }
        this.elements.nextBtn = nextBtn;
      }
    } catch (_) {}
  }

  render() {
    const node = this.state.node;
    try {
      this.ensureElements();
      if (this.elements?.container) this.elements.container.classList.remove('hidden');
      if (this.elements?.dialogue) this.elements.dialogue.textContent = node?.text || '';
      if (this.elements?.choiceList) {
        this.elements.choiceList.innerHTML = '';
        if (Array.isArray(node?.choices) && node.choices.length > 0) {
          node.choices.forEach((c, i) => {
            const btn = document.createElement('button');
            btn.setAttribute('data-choice-index', String(i));
            btn.textContent = c.label || `Choice ${i + 1}`;
            this.elements.choiceList.appendChild(btn);
          });
          if (this.elements.nextBtn) this.elements.nextBtn.style.display = 'none';
        } else {
          if (this.elements.nextBtn) this.elements.nextBtn.style.display = '';
        }
      }
    } catch (_) {}
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
