import { useState, useEffect } from 'react';
import ApiService from './ApiService';
import './TestCases.css';

const TestCases = ({ functionalRequirements, onTestCasesUpdate }) => {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTestCases, setShowTestCases] = useState(true);

  useEffect(() => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateTestCases();
    }
  }, [functionalRequirements]);

  const generateTestCases = async () => {
    if (!functionalRequirements || functionalRequirements.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate test cases based on requirements
      const generatedTestCases = await ApiService.generateTestCases(functionalRequirements);
      
      // Ensure each test case has the required properties
      const normalizedTestCases = generatedTestCases.map(testCase => {
        // If testCase is a string, convert it to an object with default properties
        if (typeof testCase === 'string') {
          return {
            id: `TC-${Math.random().toString(36).substr(2, 5)}`,
            title: testCase,
            steps: ['Navigate to application', 'Verify functionality'],
            expectedResult: 'Functionality works as expected'
          };
        }
        
        // Ensure test case has required properties
        return {
          id: testCase.id || `TC-${Math.random().toString(36).substr(2, 5)}`,
          title: testCase.title || testCase.name || 'Test Case',
          steps: Array.isArray(testCase.steps) ? testCase.steps : ['Verify functionality'],
          expectedResult: testCase.expectedResult || 'Functionality works as expected'
        };
      });
      
      setTestCases(normalizedTestCases);
      
      // Notify parent component about new test cases
      if (onTestCasesUpdate) {
        onTestCasesUpdate(normalizedTestCases);
      }
    } catch (err) {
      console.error('Error generating test cases:', err);
      setError(`Failed to generate test cases: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTestCases = () => {
    setShowTestCases(!showTestCases);
  };

  const regenerateTestCases = () => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateTestCases();
    }
  };

  return (
    <div className="section">
      <h2>
        Test Cases
        <div className="button-group">
          <button className="toggle-button" onClick={toggleTestCases}>
            {showTestCases ? 'Hide' : 'Show'}
          </button>
          {testCases.length > 0 && (
            <button className="regenerate-button" onClick={regenerateTestCases}>
              Regenerate
            </button>
          )}
        </div>
      </h2>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating test cases...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={generateTestCases}
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && showTestCases && testCases.length > 0 && (
        <div className="test-cases-list">
          {testCases.map((testCase, index) => (
            <div key={index} className="test-case-item">
              <h3>{testCase.id || `Case ${index + 1}`}: {testCase.title}</h3>
              <div className="test-steps">
                <strong>Steps:</strong>
                <ol>
                  {testCase.steps && testCase.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
              <p><strong>Expected Result:</strong> {testCase.expectedResult}</p>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && !testCases.length && (
        <div className="empty-state">
          <p>No test cases generated yet.</p>
          {functionalRequirements?.length > 0 && (
            <button 
              className="generate-button" 
              onClick={generateTestCases}
            >
              Generate Test Cases
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCases;
