import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const TestCases = ({ functionalRequirements, onTestCasesUpdate }) => {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTestCases, setShowTestCases] = useState(true);

  useEffect(() => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateTestCases(functionalRequirements);
    }
  }, [functionalRequirements]);

  const generateTestCases = async (requirements) => {
    if (!requirements || requirements.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate test cases based on requirements
      const generatedTestCases = await ApiService.generateTestCases(requirements);
      setTestCases(generatedTestCases);
      
      // Notify parent component about new test cases
      if (onTestCasesUpdate) {
        onTestCasesUpdate(generatedTestCases);
      }
    } catch (err) {
      console.error('Error generating test cases:', err);
      setError('Failed to generate test cases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriority = (index, total) => {
    if (index < Math.ceil(total * 0.3)) return 'High';
    if (index < Math.ceil(total * 0.7)) return 'Medium';
    return 'Low';
  };

  const generateStepsForRequirement = (requirement) => {
    // Generate placeholder steps based on the requirement
    const baseSteps = [
      'Navigate to the relevant section',
      'Perform the required action',
      'Verify the expected outcome'
    ];
    
    return baseSteps;
  };

  const generateExpectedResult = (requirement) => {
    return `The system successfully performs the required function: ${requirement.substring(0, 100)}${requirement.length > 100 ? '...' : ''}`;
  };

  const toggleTestCases = () => {
    setShowTestCases(!showTestCases);
  };

  const regenerateTestCases = () => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateTestCases(functionalRequirements);
    }
  };

  return (
    <div className="section">
      <h2>
        Test Cases
        <button className="toggle-button" onClick={toggleTestCases}>
          {showTestCases ? 'Hide' : 'Show'}
        </button>
        {testCases.length > 0 && (
          <button className="regenerate-button" onClick={regenerateTestCases}>
            Regenerate
          </button>
        )}
      </h2>
      
      {loading && <div className="loading">Generating test cases...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && showTestCases && testCases.length > 0 && (
        <div className="test-cases-list">
          {testCases.map((testCase, index) => (
            <div key={index} className="test-case-item">
              <h3>{testCase.id}: {testCase.name}</h3>
              <p><strong>Description:</strong> {testCase.description}</p>
              <div className="test-steps">
                <strong>Steps:</strong>
                <ol>
                  {testCase.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
              <p><strong>Expected Result:</strong> {testCase.expectedResult}</p>
              <p><strong>Priority:</strong> <span className={`priority ${testCase.priority.toLowerCase()}`}>{testCase.priority}</span></p>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && testCases.length === 0 && (
        <div className="empty-state">
          <p>No test cases generated yet.</p>
          {functionalRequirements && functionalRequirements.length > 0 && (
            <button className="generate-button" onClick={() => generateTestCases(functionalRequirements)}>
              Generate Test Cases
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCases;
