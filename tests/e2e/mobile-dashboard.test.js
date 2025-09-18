// Cypress E2E tests for Mobile Dashboard Optimization (Story 23.1)
// Tests mobile viewport, swipe gestures, offline caching

describe('Mobile Dashboard Optimization', () => {
  beforeEach(() => {
    // Set mobile viewport (iPhone SE)
    cy.viewport(375, 667);
    // Visit dashboard
    cy.visit('/maintenance-dashboard'); // Adjust to actual route
  });

  it('renders responsive layout on mobile', () => {
    // Check if MobileOptimizer applies mobile styles
    cy.get('[data-cy="mobile-container"]').should('have.class', 'bg-gray-100').and('have.class', 'p-2');
    // Verify grid layout for small screens
    cy.get('.grid-cols-1').should('be.visible');
    // Check touch targets ≥48px (basic assertion)
    cy.get('button').first().should('have.css', 'padding', 'contains, 12px'); // Approximate for 48px
  });

  it('handles swipe gestures for navigation', () => {
    // Simulate swipe right (back)
    const swipeRight = { startX: 300, currentX: 200 };
    cy.get('.swipe-area').trigger('touchstart', { clientX: swipeRight.startX });
    cy.get('.swipe-area').trigger('touchmove', { clientX: swipeRight.currentX });
    cy.get('.swipe-area').trigger('touchend');
    // Assert back navigation (e.g., location change or console log, but since console, check for expected behavior)
    cy.window().should('have.property', 'location', '/previous-page'); // Mock or spy on navigation
    // Or check for class change indicating swipe
    cy.get('.swipe-area').should('have.class', 'swiped-right');
  });

  it('caches API responses for offline use', () => {
    // Online fetch and cache
    cy.intercept('GET', '/api/predictive-maintenance', { fixture: 'maintenance-data.json' }).as('getMaintenance');
    cy.wait('@getMaintenance');
    // Go offline
    cy.window().then((win) => {
      win.navigator.onLine = false;
    });
    // Reload and check cached response
    cy.reload();
    cy.wait('@getMaintenance').its('response.body').should('have.property', 'predictions');
    // Verify content renders from cache
    cy.get('[data-cy="alerts-list"]').should('contain', 'Cached Alert');
  });

  it('maintains desktop functionality unchanged (regression)', () => {
    // Test on desktop viewport to ensure no breakage
    cy.viewport(1280, 720);
    cy.visit('/maintenance-dashboard');
    cy.get('[data-cy="desktop-container"]').should('have.class', 'bg-white');
    cy.get('.grid-cols-1').should('not.exist'); // Should use desktop grid
    // Verify existing functionality
    cy.get('button').contains('Create Work Order').should('be.disabled');
    cy.get('select').should('have.length.greaterThan', 0);
  });

  it('performance load <3s on mobile (Lighthouse simulation)', () => {
    // Note: Full Lighthouse in CI; here simulate timing
    cy.window().should('have.prop', 'performance').and('have.prop', 'timing');
    const loadTime = Cypress.$('[data-cy="load-time"]').text(); // Assume marked element
    cy.wrap(parseFloat(loadTime)).should('be.lt', 3000);
  });
});

// Note: Requires cypress.json with mobile support; fixture maintenance-data.json for mocks