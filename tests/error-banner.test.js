// Tests for ErrorBanner — task 3.2
// Requirements: 1.7

import { ErrorBanner } from '../js/error-banner.js';

describe('ErrorBanner', () => {
  beforeEach(() => {
    // Reset DOM to a clean banner before every test
    document.body.innerHTML = '<div id="error-banner" hidden></div>';
  });

  // -------------------------------------------------------------------------
  // show()
  // -------------------------------------------------------------------------

  it('show() appends a <p> with the correct message text', () => {
    ErrorBanner.show('Something went wrong');

    const banner = document.getElementById('error-banner');
    const paragraphs = banner.querySelectorAll('p');

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe('Something went wrong');
  });

  it('show() removes the hidden attribute, making the banner visible', () => {
    ErrorBanner.show('Storage unavailable');

    const banner = document.getElementById('error-banner');
    expect(banner.hasAttribute('hidden')).toBe(false);
  });

  it('show() accumulates multiple messages as separate <p> elements', () => {
    ErrorBanner.show('First error');
    ErrorBanner.show('Second error');

    const banner = document.getElementById('error-banner');
    const paragraphs = banner.querySelectorAll('p');

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('First error');
    expect(paragraphs[1].textContent).toBe('Second error');
  });

  it('show() does nothing when the banner element is absent', () => {
    // Remove the banner from the DOM
    document.body.innerHTML = '';

    // Should not throw
    expect(() => ErrorBanner.show('orphaned message')).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // clear()
  // -------------------------------------------------------------------------

  it('clear() empties all child content from the banner', () => {
    ErrorBanner.show('Error one');
    ErrorBanner.show('Error two');

    ErrorBanner.clear();

    const banner = document.getElementById('error-banner');
    expect(banner.children).toHaveLength(0);
    expect(banner.innerHTML).toBe('');
  });

  it('clear() sets the hidden attribute, hiding the banner', () => {
    ErrorBanner.show('Some error');   // banner is visible now
    ErrorBanner.clear();

    const banner = document.getElementById('error-banner');
    expect(banner.hasAttribute('hidden')).toBe(true);
  });

  it('clear() on an already-empty banner does nothing harmful', () => {
    // Banner starts hidden and empty — calling clear() should be a no-op
    ErrorBanner.clear();

    const banner = document.getElementById('error-banner');
    expect(banner.innerHTML).toBe('');
    expect(banner.hasAttribute('hidden')).toBe(true);
  });

  it('clear() does nothing when the banner element is absent', () => {
    document.body.innerHTML = '';

    expect(() => ErrorBanner.clear()).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // show() → clear() → show() cycle
  // -------------------------------------------------------------------------

  it('banner can be reused after clear()', () => {
    ErrorBanner.show('First session error');
    ErrorBanner.clear();

    ErrorBanner.show('Second session error');

    const banner = document.getElementById('error-banner');
    const paragraphs = banner.querySelectorAll('p');

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe('Second session error');
    expect(banner.hasAttribute('hidden')).toBe(false);
  });
});
