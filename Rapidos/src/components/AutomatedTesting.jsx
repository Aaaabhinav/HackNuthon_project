import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const AutomatedTesting = ({ testScenarios, applicationCode, onTestingComplete }) => {
  const [testCode, setTestCode] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [testingFramework, setTestingFramework] = useState('cypress');
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (testScenarios?.length > 0 && applicationCode) {
      generateTestCode();
    }
  }, [testScenarios, applicationCode, testingFramework]);

  const generateTestCode = async () => {
    if (!testScenarios || testScenarios.length === 0 || !applicationCode) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Call Gemini API to generate automated test code
      const generatedTestCode = await ApiService.generateTestCode(testScenarios, testingFramework);
      setTestCode(generatedTestCode);
    } catch (err) {
      console.error('Error generating test code:', err);
      setError(`Failed to generate test code: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const runTests = async () => {
    if (!testCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // This is a simulation of running tests since we can't actually run Cypress/Playwright in this context
      // In a real app, you'd integrate with your testing framework of choice
      const results = await simulateTestRun(testScenarios);
      setTestResults(results);
      
      // Notify parent component
      if (onTestingComplete) {
        onTestingComplete(results);
      }
    } catch (err) {
      console.error('Error running tests:', err);
      setError(`Failed to run automated tests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Simulate test execution
  const simulateTestRun = async (scenarios) => {
    // Add artificial delay to simulate test execution
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate pseudo-random results (in a real app, these would come from actual test runs)
    const results = {
      framework: testingFramework,
      timestamp: new Date().toISOString(),
      summary: {
        total: scenarios.length,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      scenarioResults: []
    };
    
    // Generate random results for each scenario
    scenarios.forEach(scenario => {
      // 80% pass rate for simulation purposes
      const passed = Math.random() > 0.2;
      
      results.scenarioResults.push({
        id: scenario.id,
        name: scenario.name,
        status: passed ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 2000) + 500, // Random duration between 500-2500ms
        error: passed ? null : 'Element not found or timeout occurred',
        steps: scenario.steps.map(step => ({
          text: step,
          status: passed ? 'passed' : (Math.random() > 0.5 ? 'passed' : 'failed')
        }))
      });
      
      // Update summary counts
      if (passed) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
    });
    
    return results;
  };

  const changeTestingFramework = (framework) => {
    setTestingFramework(framework);
  };

  const toggleCodeVisibility = () => {
    setShowCode(!showCode);
  };

  return (
    <div className="section">
      <h2>
        Automated Testing
        <div className="button-group">
          <button className="toggle-button" onClick={toggleCodeVisibility}>
            {showCode ? 'Hide' : 'Show'}
          </button>
        </div>
      </h2>
      
      <div className="framework-selector">
        <label>Testing Framework:</label>
        <select 
          value={testingFramework}
          onChange={(e) => changeTestingFramework(e.target.value)}
          disabled={generating || loading}
        >
          <option value="cypress">Cypress</option>
          <option value="playwright">Playwright</option>
          <option value="selenium">Selenium</option>
        </select>
        
        {testCode && !loading && (
          <button 
            className="run-tests-button" 
            onClick={runTests}
            disabled={generating}
          >
            Run Tests
          </button>
        )}
      </div>
      
      {generating && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating test code...</p>
        </div>
      )}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Running automated tests...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('rate limit') && (
            <p className="rate-limit-note">Note: You can add your own Gemini API key in the API Settings to avoid rate limiting.</p>
          )}
          <button 
            className="retry-button" 
            onClick={generating ? generateTestCode : runTests}
          >
            Retry
          </button>
        </div>
      )}
      
      {!generating && !loading && showCode && testCode && (
        <div className="code-container">
          <h3>Generated {testingFramework.charAt(0).toUpperCase() + testingFramework.slice(1)} Test Code</h3>
          <pre className="test-code">{testCode}</pre>
        </div>
      )}
      
      {!generating && !loading && !testCode && (
        <div className="empty-state">
          <p>No test code generated yet.</p>
          {testScenarios?.length > 0 && applicationCode && (
            <button className="generate-button" onClick={generateTestCode}>
              Generate Test Code
            </button>
          )}
        </div>
      )}
      
      {testResults && (
        <div className="test-results">
          <h3>Test Results</h3>
          <div className="results-summary">
            <div className="summary-item">
              <span>Total:</span> {testResults.summary.total}
            </div>
            <div className="summary-item passed">
              <span>Passed:</span> {testResults.summary.passed}
            </div>
            <div className="summary-item failed">
              <span>Failed:</span> {testResults.summary.failed}
            </div>
          </div>
          
          <div className="scenario-results">
            {testResults.scenarioResults.map((result, index) => (
              <div 
                key={index} 
                className={`scenario-result ${result.status}`}
              >
                <h4>{result.id}: {result.name}</h4>
                <p className="status">Status: <span>{result.status.toUpperCase()}</span></p>
                <p>Duration: {result.duration}ms</p>
                
                {result.error && (
                  <p className="error">Error: {result.error}</p>
                )}
                
                <div className="step-results">
                  <strong>Steps:</strong>
                  <ul>
                    {result.steps.map((step, stepIndex) => (
                      <li 
                        key={stepIndex}
                        className={step.status}
                      >
                        {step.text}
                        <span className="step-status">{step.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedTesting;
