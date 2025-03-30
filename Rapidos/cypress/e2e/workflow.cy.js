describe('Workflow Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    // Mock the API responses to simulate successful workflow
    cy.intercept('POST', 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent*', {
      statusCode: 200,
      body: {
        candidates: [{
          content: {
            parts: [{
              text: 'Mocked response from API'
            }]
          }
        }]
      }
    }).as('apiRequest')
  })

  it('should process valid Figma URL', () => {
    // Enter a sample Figma URL
    cy.get('.input-group input').type('https://www.figma.com/file/example12345/Test-Design')
    cy.get('.button').click()
    
    // Check that loading state is shown
    cy.get('.loading').should('be.visible')
    
    // Wait for API request
    cy.wait('@apiRequest')
    
    // Verify requirements are generated
    cy.get('.requirements-list').should('exist')
    cy.get('.requirement-checkbox').should('have.length.at.least', 1)
  })

  it('should navigate through workflow steps', () => {
    // Setup test by processing a URL first
    cy.get('.input-group input').type('https://www.figma.com/file/example12345/Test-Design')
    cy.get('.button').click()
    cy.wait('@apiRequest')
    
    // Find and click through the workflow steps
    cy.get('.workflow-step').eq(1).click()
    cy.get('.workflow-step').eq(2).click()
    cy.get('.workflow-step').eq(3).click()
    
    // Verify test cases are displayed
    cy.get('.test-case-item').should('be.visible')
  })
})
