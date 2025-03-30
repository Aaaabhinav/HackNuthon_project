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
      setError('Failed to generate requirements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h2>Functional Requirements</h2>
      
      {loading && <div className="loading">Generating requirements...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && !error && requirements.length > 0 && (
        <div className="requirements-list">
          <ol>
            {requirements.map((req, index) => (
              <li key={index}>{req}</li>
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
