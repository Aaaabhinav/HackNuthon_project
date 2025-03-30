import { useState, useEffect } from 'react';

const TestAutomation = ({ testCases }) => {
  const [automationCode, setAutomationCode] = useState({});
  const [selectedFramework, setSelectedFramework] = useState('playwright');
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (testCases && testCases.length > 0) {
      generateAllFrameworkCode(testCases);
    }
  }, [testCases, selectedFramework]);

  const generateAllFrameworkCode = (testCases) => {
    // Generate code for all supported frameworks
    const codeMap = {
      playwright: generatePlaywrightCode(testCases),
      cypress: generateCypressCode(testCases),
      selenium: generateSeleniumCode(testCases)
    };
    
    setAutomationCode(codeMap);
  };

  const generatePlaywrightCode = (testCases) => {
    // Generate Playwright test automation code
    return `const { test, expect } = require('@playwright/test');

// Test suite for the web application
${testCases.map(tc => `
test('${tc.name}', async ({ page }) => {
  // Description: ${tc.description}
  // Priority: ${tc.priority}
  
  // Navigate to the application
  await page.goto('http://localhost:5173/');
  
  ${generatePlaywrightSteps(tc.steps, tc.expectedResult)}
});`).join('\n')}

// Helper functions for testing
async function validateTextContent(page, selector, expectedText) {
  const content = await page.textContent(selector);
  expect(content).toContain(expectedText);
}

async function validateVisibility(page, selector) {
  await expect(page.locator(selector)).toBeVisible();
}

async function validateElementCount(page, selector, expectedCount) {
  const count = await page.locator(selector).count();
  expect(count).toBeGreaterThanOrEqual(expectedCount);
}`;
  };

  const generatePlaywrightSteps = (steps, expectedResult) => {
    // Convert steps to Playwright test code
    let playwrightCode = '';
    steps.forEach(step => {
      const stepLower = step.toLowerCase();
      
      if (stepLower.includes('navigate')) {
        playwrightCode += `// ${step}\n  // Navigation is handled in the page.goto above`;
      } else if (stepLower.includes('verify') && stepLower.includes('visible')) {
        playwrightCode += `// ${step}\n  await validateVisibility(page, '.relevant-selector');`;
      } else if (stepLower.includes('click')) {
        playwrightCode += `// ${step}\n  await page.click('.nav-link');`;
      } else if (stepLower.includes('resize')) {
        const size = stepLower.includes('mobile') ? '375, 667' : 
                     stepLower.includes('tablet') ? '768, 1024' : '1920, 1080';
        playwrightCode += `// ${step}\n  await page.setViewportSize({ width: ${size} });`;
      } else if (stepLower.includes('form')) {
        if (stepLower.includes('without')) {
          playwrightCode += `// ${step}\n  await page.click('button[type="submit"]');`;
        } else if (stepLower.includes('invalid')) {
          playwrightCode += `// ${step}\n  await page.fill('input[type="text"]', 'invalid input');\n  await page.click('button[type="submit"]');`;
        } else if (stepLower.includes('valid')) {
          playwrightCode += `// ${step}\n  await page.fill('input[type="text"]', 'valid input');\n  await page.click('button[type="submit"]');`;
        }
      } else if (stepLower.includes('inspect')) {
        playwrightCode += `// ${step}\n  await validateElementCount(page, 'img[alt]', 1);`;
      }
      
      playwrightCode += `\n  // ${step}\n  console.log('Executing: ${step}');`;
    });
    
    // Add expected result validation
    playwrightCode += `\n  // Verify expected result: ${expectedResult}\n`;
    playwrightCode += `  console.log('Verifying: ${expectedResult}');\n`;
    
    if (expectedResult.toLowerCase().includes('visible')) {
      playwrightCode += `  await expect(page.locator('.content-selector')).toBeVisible();\n`;
    } else if (expectedResult.toLowerCase().includes('correct page')) {
      playwrightCode += `  await expect(page).toHaveURL(/.*expected-page/);\n`;
    } else if (expectedResult.toLowerCase().includes('alt text')) {
      playwrightCode += `  const images = await page.locator('img').all();\n`;
      playwrightCode += `  const count = await images.length;\n`;
      playwrightCode += `  for (let i = 0; i < count; i++) {\n`;
      playwrightCode += `    const img = await images[i];\n`;
      playwrightCode += `    const hasAlt = await img.getAttribute('alt');\n`;
      playwrightCode += `    expect(hasAlt).not.toBeNull();\n`;
      playwrightCode += `  }\n`;
    }
    
    return playwrightCode;
  };

  const generateCypressCode = (testCases) => {
    // Generate Cypress test automation code
    return `describe('Web Application Tests', () => {
${testCases.map(tc => `
  it('${tc.name}', () => {
    // Description: ${tc.description}
    // Priority: ${tc.priority}
    
    // Navigate to the application
    cy.visit('http://localhost:5173/');
    
    ${generateCypressSteps(tc.steps, tc.expectedResult)}
  });`).join('\n')}
});

// Helper functions
function validateContent(selector, expectedText) {
  cy.get(selector).should('contain', expectedText);
}

function validateVisibility(selector) {
  cy.get(selector).should('be.visible');
}

function validateElementCount(selector, minCount) {
  cy.get(selector).should('have.length.at.least', minCount);
}`;
  };

  const generateCypressSteps = (steps, expectedResult) => {
    // Convert steps to Cypress test code
    let cypressCode = '';
    steps.forEach(step => {
      const stepLower = step.toLowerCase();
      
      if (stepLower.includes('navigate')) {
        cypressCode += `// ${step}\n    // Navigation is handled in cy.visit above`;
      } else if (stepLower.includes('verify') && stepLower.includes('visible')) {
        cypressCode += `// ${step}\n    validateVisibility('.relevant-selector');`;
      } else if (stepLower.includes('click')) {
        cypressCode += `// ${step}\n    cy.get('.nav-link').click();`;
      } else if (stepLower.includes('resize')) {
        const size = stepLower.includes('mobile') ? '375, 667' : 
                     stepLower.includes('tablet') ? '768, 1024' : '1920, 1080';
        cypressCode += `// ${step}\n    cy.viewport(${size});`;
      } else if (stepLower.includes('form')) {
        if (stepLower.includes('without')) {
          cypressCode += `// ${step}\n    cy.get('button[type="submit"]').click();`;
        } else if (stepLower.includes('invalid')) {
          cypressCode += `// ${step}\n    cy.get('input[type="text"]').type('invalid input');\n    cy.get('button[type="submit"]').click();`;
        } else if (stepLower.includes('valid')) {
          cypressCode += `// ${step}\n    cy.get('input[type="text"]').type('valid input');\n    cy.get('button[type="submit"]').click();`;
        }
      } else if (stepLower.includes('inspect')) {
        cypressCode += `// ${step}\n    validateElementCount('img[alt]', 1);`;
      }
      
      cypressCode += `\n    // ${step}\n    cy.log('Executing: ${step}');`;
    });
    
    // Add expected result validation
    cypressCode += `\n    // Verify expected result: ${expectedResult}\n`;
    cypressCode += `    cy.log('Verifying: ${expectedResult}');\n`;
    
    if (expectedResult.toLowerCase().includes('visible')) {
      cypressCode += `    cy.get('.content-selector').should('be.visible');\n`;
    } else if (expectedResult.toLowerCase().includes('correct page')) {
      cypressCode += `    cy.url().should('include', 'expected-page');\n`;
    } else if (expectedResult.toLowerCase().includes('alt text')) {
      cypressCode += `    cy.get('img').each(($img) => {\n`;
      cypressCode += `      cy.wrap($img).should('have.attr', 'alt');\n`;
      cypressCode += `    });\n`;
    }
    
    return cypressCode;
  };

  const generateSeleniumCode = (testCases) => {
    // Generate Selenium test automation code
    return `const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Web Application Tests', function() {
  let driver;

  before(async function() {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function() {
    await driver.quit();
  });

${testCases.map(tc => `
  it('${tc.name}', async function() {
    // Description: ${tc.description}
    // Priority: ${tc.priority}
    
    // Navigate to the application
    await driver.get('http://localhost:5173/');
    
    ${generateSeleniumSteps(tc.steps, tc.expectedResult)}
  });`).join('\n')}

  // Helper functions
  async function validateTextContent(selector, expectedText) {
    const element = await driver.findElement(By.css(selector));
    const text = await element.getText();
    assert(text.includes(expectedText));
  }

  async function validateVisibility(selector) {
    const element = await driver.findElement(By.css(selector));
    const isDisplayed = await element.isDisplayed();
    assert(isDisplayed);
  }

  async function validateElementCount(selector, minCount) {
    const elements = await driver.findElements(By.css(selector));
    assert(elements.length >= minCount);
  }
});`;
  };

  const generateSeleniumSteps = (steps, expectedResult) => {
    // Convert steps to Selenium test code
    let seleniumCode = '';
    steps.forEach(step => {
      const stepLower = step.toLowerCase();
      
      if (stepLower.includes('navigate')) {
        seleniumCode += `// ${step}\n    // Navigation is handled in driver.get above`;
      } else if (stepLower.includes('verify') && stepLower.includes('visible')) {
        seleniumCode += `// ${step}\n    await validateVisibility('.relevant-selector');`;
      } else if (stepLower.includes('click')) {
        seleniumCode += `// ${step}\n    await driver.findElement(By.css('.nav-link')).click();`;
      } else if (stepLower.includes('resize')) {
        const size = stepLower.includes('mobile') ? '{width: 375, height: 667}' : 
                     stepLower.includes('tablet') ? '{width: 768, height: 1024}' : '{width: 1920, height: 1080}';
        seleniumCode += `// ${step}\n    await driver.manage().window().setRect(${size});`;
      } else if (stepLower.includes('form')) {
        if (stepLower.includes('without')) {
          seleniumCode += `// ${step}\n    await driver.findElement(By.css('button[type="submit"]')).click();`;
        } else if (stepLower.includes('invalid')) {
          seleniumCode += `// ${step}\n    await driver.findElement(By.css('input[type="text"]')).sendKeys('invalid input');\n    await driver.findElement(By.css('button[type="submit"]')).click();`;
        } else if (stepLower.includes('valid')) {
          seleniumCode += `// ${step}\n    await driver.findElement(By.css('input[type="text"]')).sendKeys('valid input');\n    await driver.findElement(By.css('button[type="submit"]')).click();`;
        }
      } else if (stepLower.includes('inspect')) {
        seleniumCode += `// ${step}\n    await validateElementCount('img[alt]', 1);`;
      }
      
      seleniumCode += `\n    // ${step}\n    console.log('Executing: ${step}');`;
    });
    
    // Add expected result validation
    seleniumCode += `\n    // Verify expected result: ${expectedResult}\n`;
    seleniumCode += `    console.log('Verifying: ${expectedResult}');\n`;
    
    if (expectedResult.toLowerCase().includes('visible')) {
      seleniumCode += `    const element = await driver.findElement(By.css('.content-selector'));\n`;
      seleniumCode += `    assert(await element.isDisplayed());\n`;
    } else if (expectedResult.toLowerCase().includes('correct page')) {
      seleniumCode += `    const url = await driver.getCurrentUrl();\n`;
      seleniumCode += `    assert(url.includes('expected-page'));\n`;
    } else if (expectedResult.toLowerCase().includes('alt text')) {
      seleniumCode += `    const images = await driver.findElements(By.css('img'));\n`;
      seleniumCode += `    for (const img of images) {\n`;
      seleniumCode += `      const alt = await img.getAttribute('alt');\n`;
      seleniumCode += `      assert(alt !== null && alt !== '');\n`;
      seleniumCode += `    }\n`;
    }
    
    return seleniumCode;
  };

  const runTests = () => {
    setIsRunning(true);
    
    // Simulate running tests with a timer
    setTimeout(() => {
      const results = generateMockTestResults(testCases);
      setTestResults(results);
      setIsRunning(false);
    }, 3000);
  };

  const generateMockTestResults = (testCases) => {
    // Generate mock test results
    const results = {
      framework: selectedFramework,
      timestamp: new Date().toISOString(),
      summary: {
        total: testCases.length,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      tests: []
    };

    // Generate individual test results
    testCases.forEach((tc, index) => {
      // For demonstration, make most tests pass but have some failures
      const passed = Math.random() > 0.2;
      const skipped = !passed && Math.random() > 0.8;
      
      if (passed) results.summary.passed++;
      else if (skipped) results.summary.skipped++;
      else results.summary.failed++;
      
      results.tests.push({
        id: tc.id,
        name: tc.name,
        status: passed ? 'passed' : (skipped ? 'skipped' : 'failed'),
        duration: Math.floor(Math.random() * 1000) + 500,
        error: !passed && !skipped ? generateMockError() : null,
        steps: tc.steps.map(step => ({
          description: step,
          status: passed ? 'passed' : (Math.random() > 0.3 ? 'passed' : 'failed'),
          duration: Math.floor(Math.random() * 300) + 100
        }))
      });
    });
    
    return results;
  };

  const generateMockError = () => {
    const errors = [
      "Element not found: .some-selector",
      "Expected element to be visible",
      "Timed out waiting for element",
      "Text content does not match expected value",
      "Navigation failed: timeout exceeded"
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  };

  const renderTestResult = (test) => {
    return (
      <div key={test.id} className={`test-result test-${test.status}`}>
        <div className="test-result-header">
          <h6>{test.id}: {test.name}</h6>
          <span className={`status-badge status-${test.status}`}>{test.status}</span>
        </div>
        <div className="test-result-body">
          <p className="test-duration">Duration: {test.duration}ms</p>
          {test.error && <div className="test-error">Error: {test.error}</div>}
          <div className="test-steps">
            <p><strong>Steps:</strong></p>
            <ul>
              {test.steps.map((step, i) => (
                <li key={i} className={`step-${step.status}`}>
                  {step.description}
                  <span className={`step-status status-${step.status}`}>{step.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card automation-card">
      <div className="card-header">
        <h5>Test Automation</h5>
        <div className="automation-controls">
          <select 
            className="form-select framework-select"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
          >
            <option value="playwright">Playwright</option>
            <option value="cypress">Cypress</option>
            <option value="selenium">Selenium</option>
          </select>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={runTests}
            disabled={isRunning || !testCases || testCases.length === 0}
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {showCode && automationCode[selectedFramework] && (
        <div className="card-body">
          <div className="output-container">
            <pre className="language-javascript">{automationCode[selectedFramework]}</pre>
          </div>
        </div>
      )}

      {testResults && (
        <div className="card-body test-results-section">
          <div className="test-results-header">
            <h6>Test Results</h6>
            <div className="test-summary">
              <span className="test-total">Total: {testResults.summary.total}</span>
              <span className="test-passed">Passed: {testResults.summary.passed}</span>
              <span className="test-failed">Failed: {testResults.summary.failed}</span>
              <span className="test-skipped">Skipped: {testResults.summary.skipped}</span>
            </div>
          </div>
          <div className="test-results-container">
            {testResults.tests.map(test => renderTestResult(test))}
          </div>
          <div className="test-report-footer">
            <p className="text-center">
              {testResults.summary.failed === 0 ? 
                'All tests passed! The project is local env ready.' : 
                `${testResults.summary.failed} tests failed. Please fix the issues before proceeding.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAutomation;
