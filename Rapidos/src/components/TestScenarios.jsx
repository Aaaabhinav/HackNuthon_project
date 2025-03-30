import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const TestScenarios = ({ testCases, applicationCode, onScenariosGenerated }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);

  useEffect(() => {
    if (testCases?.length > 0 && applicationCode) {
      generateScenarios();
    }
  }, [testCases, applicationCode]);

  const generateScenarios = async () => {
    if (!testCases || testCases.length === 0 || !applicationCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate test scenarios
      const generatedScenarios = await ApiService.generateTestScenarios(testCases, applicationCode);
      setScenarios(generatedScenarios);
      
      // Notify parent component
      if (onScenariosGenerated) {
        onScenariosGenerated(generatedScenarios);
      }
    } catch (err) {
      console.error('Error generating test scenarios:', err);
      setError('Failed to generate test scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleScenarios = () => {
    setShowScenarios(!showScenarios);
  };

  return (
    <div className="section">
      <h2>
        Test Scenarios
        <button className="toggle-button" onClick={toggleScenarios}>
          {showScenarios ? 'Hide' : 'Show'}
        </button>
        {scenarios.length > 0 && (
          <button className="regenerate-button" onClick={generateScenarios}>
            Regenerate
          </button>
        )}
      </h2>
      
      {loading && <div className="loading">Generating test scenarios...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && showScenarios && scenarios.length > 0 && (
        <div className="scenarios-list">
          {scenarios.map((scenario, index) => (
            <div key={index} className="scenario-item">
              <h3>{scenario.id}: {scenario.name}</h3>
              <p><strong>Description:</strong> {scenario.description}</p>
              
              {scenario.preconditions && (
                <p><strong>Preconditions:</strong> {scenario.preconditions}</p>
              )}
              
              <div className="scenario-steps">
                <strong>Steps:</strong>
                <ol>
                  {scenario.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
              
              <p><strong>Expected Outcome:</strong> {scenario.expectedOutcome}</p>
              
              {scenario.testData && (
                <p><strong>Test Data:</strong> {scenario.testData}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && scenarios.length === 0 && (
        <div className="empty-state">
          <p>No test scenarios generated yet.</p>
          {testCases?.length > 0 && applicationCode && (
            <button className="generate-button" onClick={generateScenarios}>
              Generate Test Scenarios
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestScenarios;
