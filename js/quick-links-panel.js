/**
 * quick-links-panel.js — ES module
 *
 * Testable core logic for QuickLinksPanel.
 * The runtime copy lives inside the QuickLinksPanel IIFE in js/app.js.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 10.1, 10.2, 10.3
 */

/**
 * Returns true when `link` is a plain object with:
 *   - id:    non-empty string
 *   - label: non-empty string
 *   - url:   string beginning with "http://" or "https://"
 *
 * Used during deserialisation to silently drop malformed entries.
 *
 * @param {unknown} link
 * @returns {boolean}
 */
export function isValidLink(link) {
  if (!link || typeof link !== 'object' || Array.isArray(link)) return false;
  if (typeof link.id !== 'string' || link.id.trim() === '') return false;
  if (typeof link.label !== 'string' || link.label.trim() === '') return false;
  if (typeof link.url !== 'string') return false;
  return link.url.startsWith('http://') || link.url.startsWith('https://');
}

/**
 * Factory that creates a QuickLinksPanel instance bound to a given DOM root
 * and storage implementation. Designed for testability — callers inject both.
 *
 * @param {{
 *   container:       HTMLElement,
 *   addBtn:          HTMLElement,
 *   labelInput:      HTMLInputElement,
 *   urlInput:        HTMLInputElement,
 *   labelError:      HTMLElement,
 *   urlError:        HTMLElement,
 *   storage:         { load(key: string): any, save(key: string, value: any): boolean, KEYS: { LINKS: string } },
 *   errorBanner:     { show(msg: string): void },
 * }} deps
 * @returns {{ init(): void, getLinks(): Array, addLink(label: string, url: string): boolean, deleteLink(id: string): void }}
 */
export function createQuickLinksPanel(deps) {
  const { container, addBtn, labelInput, urlInput, labelError, urlError, storage, errorBanner } = deps;

  /** In-memory link array. Always kept in sync with localStorage. */
  let _links = [];

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Shows an error message in a given error element. */
  function _showFieldError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.removeAttribute('hidden');
  }

  /** Hides a field error element. */
  function _clearFieldError(el) {
    if (!el) return;
    el.textContent = '';
    el.setAttribute('hidden', '');
  }

  /** Hides both field error elements. */
  function _clearAllFieldErrors() {
    _clearFieldError(labelError);
    _clearFieldError(urlError);
  }

  /**
   * Renders the current `_links` array into the container.
   * Each link is rendered as:
   *   <div class="link-item" data-id="...">
   *     <button class="btn link__btn" type="button">Label</button>
   *     <button class="btn btn--danger link__delete" data-id="..." type="button" aria-label="Delete …">Delete</button>
   *   </div>
   */
  function _render() {
    if (!container) return;
    container.innerHTML = '';

    _links.forEach(function (link) {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.dataset.id = link.id;

      // Link launch button
      const btn = document.createElement('button');
      btn.className = 'btn link__btn';
      btn.type = 'button';
      btn.textContent = link.label;
      btn.dataset.url = link.url;
      item.appendChild(btn);

      // Delete button
      const del = document.createElement('button');
      del.className = 'btn btn--danger link__delete';
      del.type = 'button';
      del.dataset.id = link.id;
      del.setAttribute('aria-label', `Delete ${link.label}`);
      del.textContent = 'Delete';
      item.appendChild(del);

      container.appendChild(item);
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Loads links from storage, renders the panel, and attaches all event
   * listeners. Safe to call once on DOMContentLoaded.
   * Requirements: 8.6, 10.2, 10.3
   */
  function init() {
    const stored = storage.load(storage.KEYS.LINKS);

    if (stored === null || !Array.isArray(stored)) {
      // Null = missing key or parse failure; non-array = corrupt data
      if (stored !== null) {
        // Data existed but was not an array — warn the user
        errorBanner.show('Saved links could not be loaded. Starting with an empty list.');
      }
      _links = [];
    } else {
      // Keep only structurally valid entries; silently drop the rest
      _links = stored.filter(isValidLink);
    }

    _render();

    // --- Event: Add button (or form submit) ---
    // The form is submitted when the user clicks Add or presses Enter inside
    // either input. We listen on the button here; form-submit wiring lives in
    // app.js init() / task 10.
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const label = labelInput ? labelInput.value : '';
        const url   = urlInput   ? urlInput.value   : '';
        addLink(label, url);
      });
    }

    // --- Event delegation: link launch + delete ---
    if (container) {
      container.addEventListener('click', function (e) {
        const target = e.target;

        // Delete button
        if (target.classList.contains('link__delete')) {
          const id = target.dataset.id;
          if (id) deleteLink(id);
          return;
        }

        // Link launch button
        if (target.classList.contains('link__btn')) {
          const url = target.dataset.url;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      });
    }
  }

  /**
   * Validates inputs, appends a new link, persists, and re-renders.
   * Returns false (and shows inline errors) when validation fails.
   * Requirements: 8.1, 8.2, 8.3, 8.7
   *
   * @param {string} rawLabel
   * @param {string} rawUrl
   * @returns {boolean}
   */
  function addLink(rawLabel, rawUrl) {
    _clearAllFieldErrors();

    const label = (rawLabel || '').trim();
    const url   = (rawUrl   || '').trim();
    let valid = true;

    if (label === '') {
      _showFieldError(labelError, 'Label is required.');
      valid = false;
    } else if (label.length > 100) {
      _showFieldError(labelError, 'Label must be 100 characters or fewer.');
      valid = false;
    }

    if (url === '') {
      _showFieldError(urlError, 'URL is required.');
      valid = false;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      _showFieldError(urlError, 'URL must begin with http:// or https://.');
      valid = false;
    }

    if (!valid) return false;

    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString();

    const link = { id, label, url };
    _links.push(link);
    _render();
    storage.save(storage.KEYS.LINKS, _links);

    // Clear inputs on success
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    return true;
  }

  /**
   * Removes the link with the given id, persists, and re-renders.
   * Requirements: 9.1, 9.2
   *
   * @param {string} id
   */
  function deleteLink(id) {
    _links = _links.filter(function (l) { return l.id !== id; });
    _render();
    storage.save(storage.KEYS.LINKS, _links);
  }

  /**
   * Returns a shallow copy of the current in-memory link array.
   * Useful for tests to inspect state without accessing the DOM.
   *
   * @returns {Array<{id: string, label: string, url: string}>}
   */
  function getLinks() {
    return _links.slice();
  }

  return { init, getLinks, addLink, deleteLink };
}
