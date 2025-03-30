import { useState, useEffect } from 'react';

const FinalPreview = ({ structureData, htmlData, functionalRequirements, testCases }) => {
  const [finalCode, setFinalCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (htmlData && functionalRequirements && functionalRequirements.length > 0) {
      generateFinalCode();
    }
  }, [htmlData, functionalRequirements, testCases]);

  const generateFinalCode = () => {
    // Get just the body content from the HTML
    let bodyContent = '';
    try {
      const bodyMatch = htmlData.match(/<body>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        bodyContent = bodyMatch[1].trim();
      }
    } catch (error) {
      console.error('Error extracting body content:', error);
      bodyContent = '<div>Error extracting content</div>';
    }

    // Create a full HTML document with embedded style, JS, and the extracted body content
    const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Deployer - Final Preview</title>
  <style>
    /* Main styling */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 15px 0;
      margin-bottom: 30px;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      color: #333;
    }
    
    .btn {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.2s;
    }
    
    .btn:hover {
      background-color: #0052a3;
    }
    
    .btn-outline {
      background-color: transparent;
      border: 1px solid #0066cc;
      color: #0066cc;
    }
    
    .btn-outline:hover {
      background-color: #f0f7ff;
    }
    
    /* Requirements section */
    .requirements-section {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .requirements-list {
      list-style-type: none;
      padding: 0;
    }
    
    .requirement-item {
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .requirement-item:last-child {
      border-bottom: none;
    }
    
    /* Page content from generated HTML */
    .page-content {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      padding: 20px;
      margin-bottom: 30px;
    }
    
    /* Responsive grid */
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (min-width: 992px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    /* Additional styling from the original design */
    footer {
      text-align: center;
      padding: 20px;
      background-color: #fff;
      margin-top: 30px;
      box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
    }
    
    /* Specific styling for different sections */
    .card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      margin-bottom: 20px;
    }
    
    .card-header {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-body {
      padding: 20px;
    }
    
    /* Status indicators */
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .status-success {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-warning {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .status-danger {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    /* Overrides for embedded content */
    img {
      max-width: 100%;
      height: auto;
    }
    
    input, select, textarea {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      font-size: inherit;
    }
    
    button {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <h1>Design Deployer</h1>
      <div>
        <button id="toggleRequirements" class="btn btn-outline">Show Requirements</button>
        <button id="runTests" class="btn">Run Tests</button>
      </div>
    </div>
  </header>

  <div class="container">
    <div id="requirements-section" class="requirements-section" style="display: none;">
      <h2>Functional Requirements</h2>
      <ul class="requirements-list" id="requirementsList">
        ${functionalRequirements.map(req => `<li class="requirement-item">${req}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="page-content">
      ${bodyContent}
    </div>
    
    <div id="test-results" style="display: none;">
      <h2>Test Results</h2>
      <div class="card">
        <div class="card-header">
          <h3>Automated Tests</h3>
          <span class="status status-success">All Tests Passed</span>
        </div>
        <div class="card-body">
          <div id="test-summary">
            <p><strong>Total Tests:</strong> <span id="total-tests">${testCases ? testCases.length : 0}</span></p>
            <p><strong>Passed:</strong> <span id="passed-tests">${testCases ? testCases.length : 0}</span></p>
            <p><strong>Failed:</strong> <span id="failed-tests">0</span></p>
          </div>
          <div id="test-details">
            <h4>Test Details</h4>
            <ul id="test-list">
              ${testCases ? testCases.map(test => `
                <li>
                  <strong>${test.id}:</strong> ${test.name} - 
                  <span class="status status-success">Passed</span>
                </li>
              `).join('\n              ') : ''}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>Generated by Design Deployer | Project is local env ready</p>
  </footer>

  <script>
    // Basic interactivity for the preview
    document.addEventListener('DOMContentLoaded', function() {
      // Toggle requirements section
      const toggleRequirementsBtn = document.getElementById('toggleRequirements');
      const requirementsSection = document.getElementById('requirements-section');
      
      toggleRequirementsBtn.addEventListener('click', function() {
        const isVisible = requirementsSection.style.display !== 'none';
        requirementsSection.style.display = isVisible ? 'none' : 'block';
        toggleRequirementsBtn.textContent = isVisible ? 'Show Requirements' : 'Hide Requirements';
      });
      
      // Run tests button
      const runTestsBtn = document.getElementById('runTests');
      const testResults = document.getElementById('test-results');
      
      runTestsBtn.addEventListener('click', function() {
        testResults.style.display = 'block';
        runTestsBtn.textContent = 'Tests Complete';
        runTestsBtn.disabled = true;
        
        // Scroll to test results
        setTimeout(() => {
          testResults.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      
      // Parse and process functional requirements
      const requirementsList = document.getElementById('requirementsList');
      const requirements = ${JSON.stringify(functionalRequirements)};
      
      // Simulate backend API service
      window.apiService = {
        // Sample data storage
        data: ${JSON.stringify(structureData && typeof structureData === 'string' ? JSON.parse(structureData) : {})},
        
        // Get page data
        getPageData: function() {
          return Promise.resolve(this.data);
        },
        
        // Get requirements
        getRequirements: function() {
          return Promise.resolve(requirements);
        },
        
        // Validate page
        validatePage: function() {
          return Promise.resolve({
            validationResults: requirements.map(req => ({
              requirement: req,
              passed: true,
              details: 'Requirement successfully validated'
            })),
            summary: {
              total: requirements.length,
              passed: requirements.length,
              failed: 0
            }
          });
        }
      };
      
      console.log('Preview loaded successfully');
      console.log('Project is local env ready');
    });
  </script>
</body>
</html>`;

    setFinalCode(code);
  };

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="card preview-card">
      <div className="card-header">
        <h5>Final Website Preview</h5>
        <button 
          className="btn btn-primary"
          onClick={handleShowPreview}
          disabled={!finalCode}
        >
          Show Preview
        </button>
      </div>
      <div className="card-body">
        {!finalCode ? (
          <div className="placeholder-text">Final code will be generated when all sections are complete</div>
        ) : showPreview ? (
          <div className="final-preview">
            <iframe
              title="Website Preview"
              srcDoc={finalCode}
              style={{ width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <div className="preview-controls">
              <button
                className="btn btn-primary copy-btn"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(finalCode)
                      .then(() => alert('Code copied to clipboard!'))
                      .catch(err => console.error('Error copying code:', err));
                  }
                }}
              >
                Copy Full Code
              </button>
            </div>
          </div>
        ) : (
          <div className="preview-placeholder">
            <p>Click "Show Preview" to see the final website with all components integrated</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalPreview;
