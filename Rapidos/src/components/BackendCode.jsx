import { useState, useEffect } from 'react';

const BackendCode = ({ functionalRequirements, structureData, htmlData }) => {
  const [backendCode, setBackendCode] = useState('');
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateBackendCode(functionalRequirements);
    }
  }, [functionalRequirements]);

  const generateBackendCode = (requirements) => {
    // Parse the structure data if it's a string
    const parsedStructure = typeof structureData === 'string' 
      ? JSON.parse(structureData) 
      : structureData || {};

    // Generate appropriate backend code based on requirements
    const code = `// Backend API for the website
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data storage (in-memory for demonstration)
let pageData = ${JSON.stringify(parsedStructure, null, 2)};
let functionalRequirements = ${JSON.stringify(requirements, null, 2)};

// Routes
app.get('/api/page-data', (req, res) => {
  res.json(pageData);
});

app.get('/api/requirements', (req, res) => {
  res.json(functionalRequirements);
});

app.post('/api/requirements', (req, res) => {
  const { requirement } = req.body;
  if (!requirement) {
    return res.status(400).json({ error: 'Requirement is required' });
  }
  
  functionalRequirements.push(requirement);
  res.status(201).json({ message: 'Requirement added', requirements: functionalRequirements });
});

app.put('/api/requirements/:id', (req, res) => {
  const { id } = req.params;
  const { requirement } = req.body;
  
  if (!requirement) {
    return res.status(400).json({ error: 'Requirement is required' });
  }
  
  const index = parseInt(id, 10);
  if (isNaN(index) || index < 0 || index >= functionalRequirements.length) {
    return res.status(404).json({ error: 'Requirement not found' });
  }
  
  functionalRequirements[index] = requirement;
  res.json({ message: 'Requirement updated', requirements: functionalRequirements });
});

app.delete('/api/requirements/:id', (req, res) => {
  const { id } = req.params;
  const index = parseInt(id, 10);
  
  if (isNaN(index) || index < 0 || index >= functionalRequirements.length) {
    return res.status(404).json({ error: 'Requirement not found' });
  }
  
  functionalRequirements.splice(index, 1);
  res.json({ message: 'Requirement deleted', requirements: functionalRequirements });
});

// Validate page against requirements
app.post('/api/validate', (req, res) => {
  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }
  
  // Perform validation logic here
  const validationResults = functionalRequirements.map(req => {
    // Simple validation example - a real implementation would be more sophisticated
    return {
      requirement: req,
      passed: Math.random() > 0.2, // Randomly pass 80% of the time for demo
      details: 'Validation details would be provided here'
    };
  });
  
  res.json({
    validationResults,
    summary: {
      total: validationResults.length,
      passed: validationResults.filter(r => r.passed).length,
      failed: validationResults.filter(r => !r.passed).length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// Export app for testing
module.exports = app;`;

    setBackendCode(code);
  };

  return (
    <div className="card backend-card">
      <div className="card-header">
        <h5>Backend Code</h5>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>
      {showCode && (
        <div className="card-body">
          <div className="output-container">
            {!backendCode ? (
              <div className="placeholder-text">Backend code will be generated after requirements are defined</div>
            ) : (
              <pre className="language-javascript">{backendCode}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendCode;
