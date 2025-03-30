describe('Homepage Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the application title', () => {
    cy.get('header h1').should('contain', 'AutoTestPilot')
  })

  it('should have URL input field', () => {
    cy.get('.url-input').should('exist')
    cy.get('.input-group input').should('be.visible')
  })

  it('should show validation error for invalid URL', () => {
    cy.get('.input-group input').type('invalid-url')
    cy.get('.button').click()
    cy.get('.error-message').should('be.visible')
  })
})
