/**
 * ErrorBanner — ES module version for testing.
 * The same logic is mirrored in js/app.js as an IIFE for browser (file://) use.
 *
 * Singleton that accumulates human-readable error messages in a persistent
 * <div id="error-banner"> element. Hidden when empty, visible when non-empty.
 *
 * Requirements: 1.7, 4.6, 7.3, 10.3
 */

function _getEl() {
  return document.getElementById('error-banner');
}

export const ErrorBanner = {
  /**
   * Appends a <p> containing `message` to the banner and makes the banner
   * visible by removing the `hidden` attribute.
   *
   * @param {string} message
   */
  show(message) {
    const banner = _getEl();
    if (!banner) return;
    const p = document.createElement('p');
    p.textContent = message;
    banner.appendChild(p);
    banner.removeAttribute('hidden');
  },

  /**
   * Removes all child content from the banner and hides it by setting
   * the `hidden` attribute.
   */
  clear() {
    const banner = _getEl();
    if (!banner) return;
    banner.innerHTML = '';
    banner.setAttribute('hidden', '');
  },
};
