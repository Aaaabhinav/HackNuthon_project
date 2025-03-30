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
      
      // Normalize scenario data structure
      const normalizedScenarios = generatedScenarios.map(scenario => {
        // If scenario is a string, convert it to an object with default properties
        if (typeof scenario === 'string') {
          return {
            id: `TS-${Math.random().toString(36).substr(2, 5)}`,
            name: scenario,
            description: 'Test scenario generated from requirements',
            steps: ['Navigate to application', 'Perform test actions', 'Verify results'],
            expectedOutcome: 'All tests pass successfully'
          };
        }
        
        // Ensure scenario has required properties
        return {
          id: scenario.id || `TS-${Math.random().toString(36).substr(2, 5)}`,
          name: scenario.name || scenario.title || 'Test Scenario',
          description: scenario.description || 'Test scenario generated from requirements',
          preconditions: scenario.preconditions || '',
          steps: Array.isArray(scenario.steps) ? scenario.steps : ['Navigate to application', 'Perform test actions', 'Verify results'],
          expectedOutcome: scenario.expectedOutcome || scenario.expected || 'All tests pass successfully'
        };
      });
      
      setScenarios(normalizedScenarios);
      
      // Notify parent component
      if (onScenariosGenerated) {
        onScenariosGenerated(normalizedScenarios);
      }
    } catch (err) {
      console.error('Error generating test scenarios:', err);
      setError(`Failed to generate test scenarios: ${err.message}`);
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
        <div className="button-group">
          <button className="toggle-button" onClick={toggleScenarios}>
            {showScenarios ? 'Hide' : 'Show'}
          </button>
          {scenarios.length > 0 && (
            <button className="regenerate-button" onClick={generateScenarios}>
              Regenerate
            </button>
          )}
        </div>
      </h2>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating test scenarios...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={generateScenarios}
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && showScenarios && scenarios.length > 0 && (
        <div className="scenarios-list">
          {scenarios.map((scenario, index) => (
            <div key={index} className="scenario-item">
              <h3>{scenario.id || `Scenario ${index + 1}`}: {scenario.name}</h3>
              
              {scenario.description && (
                <p><strong>Description:</strong> {scenario.description}</p>
              )}
              
              {scenario.preconditions && (
                <p><strong>Preconditions:</strong> {scenario.preconditions}</p>
              )}
              
              <div className="scenario-steps">
                <strong>Steps:</strong>
                <ol>
                  {scenario.steps && scenario.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
              
              {scenario.expectedOutcome && (
                <p><strong>Expected Outcome:</strong> {scenario.expectedOutcome}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && !scenarios.length && (
        <div className="empty-state">
          <p>No test scenarios generated yet.</p>
          {testCases?.length > 0 && applicationCode && (
            <button 
              className="generate-button" 
              onClick={generateScenarios}
            >
              Generate Test Scenarios
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TestScenarios;
