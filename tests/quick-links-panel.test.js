// Tests for QuickLinksPanel
// Property tests in tasks 8.3, 8.4, 8.6, unit tests in task 8.7

describe('QuickLinksPanel', () => {
  describe('addLink', () => {
    it.todo('Property 14: Valid link addition persists label and URL');
    it.todo('Property 15: Invalid link input is always rejected — empty label');
    it.todo('Property 15: Invalid link input is always rejected — label > 100 chars');
    it.todo('Property 15: Invalid link input is always rejected — empty URL');
    it.todo('Property 15: Invalid link input is always rejected — URL without http/https prefix');
  });

  describe('deleteLink', () => {
    it.todo('Property 16: Deleting a link removes it from panel and localStorage');
  });

  describe('link button', () => {
    it.todo('window.open called with correct URL, _blank, and noopener,noreferrer on click');
  });
});
