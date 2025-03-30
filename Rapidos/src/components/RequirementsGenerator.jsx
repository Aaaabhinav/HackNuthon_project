import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const RequirementsGenerator = ({ figmaBlueprint, onRequirementsGenerated }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (figmaBlueprint) {
      generateRequirements();
    }
  }, [figmaBlueprint]);

  const generateRequirements = async () => {
    if (!figmaBlueprint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate requirements based on Figma blueprint
      const generatedRequirements = await ApiService.generateRequirements(figmaBlueprint);
      setRequirements(generatedRequirements);
      
      // Notify parent component about new requirements
      if (onRequirementsGenerated) {
        onRequirementsGenerated(generatedRequirements);
      }
    } catch (err) {
      console.error('Error generating requirements:', err);
      setError(`Failed to generate requirements: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h2>Functional Requirements</h2>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating requirements...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('rate limit') && (
            <p className="rate-limit-note">The API service has reached its rate limit. Please try again in a few minutes.</p>
          )}
          <button 
            className="retry-button" 
            onClick={generateRequirements}
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && requirements.length > 0 && (
        <div className="requirements-list">
          <ol>
            {requirements.map((req, index) => (
              <li key={index} className="requirement-item">
                <div className="requirement-checkbox">
                  <input type="checkbox" id={`req-${index}`} checked={true} readOnly />
                  <label htmlFor={`req-${index}`}>{req}</label>
                </div>
              </li>
            ))}
          </ol>
          <button 
            className="regenerate-button" 
            onClick={generateRequirements}
          >
            Regenerate Requirements
          </button>
        </div>
      )}
      
      {!loading && !error && requirements.length === 0 && (
        <div className="empty-state">
          <p>No requirements generated yet.</p>
          <button 
            className="generate-button" 
            onClick={generateRequirements}
          >
            Generate Requirements
          </button>
        </div>
      )}
    </div>
  );
};

export default RequirementsGenerator;
