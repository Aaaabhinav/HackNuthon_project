import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const ApplicationGenerator = ({ figmaBlueprint, requirements, onApplicationGenerated }) => {
  const [applicationCode, setApplicationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (figmaBlueprint && requirements?.length > 0) {
      generateApplication();
    }
  }, [figmaBlueprint, requirements]);

  const generateApplication = async () => {
    if (!figmaBlueprint || !requirements || requirements.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate application code
      const generatedCode = await ApiService.generateApplication(figmaBlueprint, requirements);
      setApplicationCode(generatedCode);
      
      // Notify parent component
      if (onApplicationGenerated) {
        onApplicationGenerated(generatedCode);
      }
    } catch (err) {
      console.error('Error generating application:', err);
      setError(`Failed to generate application code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (applicationCode && navigator.clipboard) {
      navigator.clipboard.writeText(applicationCode)
        .then(() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy code:', err);
        });
    }
  };

  const toggleCodeVisibility = () => {
    setShowCode(!showCode);
  };

  return (
    <div className="section">
      <h2>
        Application Code
        <div className="button-group">
          <button className="toggle-button" onClick={toggleCodeVisibility}>
            {showCode ? 'Hide' : 'Show'}
          </button>
          {applicationCode && (
            <button className="copy-button" onClick={copyCode}>
              {codeCopied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {applicationCode && (
            <button className="regenerate-button" onClick={generateApplication}>
              Regenerate
            </button>
          )}
        </div>
      </h2>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating application code...</p>
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
            onClick={generateApplication}
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && showCode && applicationCode && (
        <div className="code-container">
          <pre className="application-code">{applicationCode}</pre>
        </div>
      )}
      
      {!loading && !error && !applicationCode && (
        <div className="empty-state">
          <p>No application code generated yet.</p>
          {figmaBlueprint && requirements?.length > 0 && (
            <button className="generate-button" onClick={generateApplication}>
              Generate Application
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationGenerator;
