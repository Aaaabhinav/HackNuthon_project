import { useState, useEffect } from 'react';

const TestCases = ({ functionalRequirements, onTestCasesUpdate }) => {
  const [testCases, setTestCases] = useState([]);
  const [showTestCases, setShowTestCases] = useState(true);

  useEffect(() => {
    if (functionalRequirements && functionalRequirements.length > 0) {
      generateTestCases(functionalRequirements);
    }
  }, [functionalRequirements]);

  const generateTestCases = (requirements) => {
    // Generate test cases based on functional requirements
    const generatedTestCases = requirements.map((req, index) => {
      return {
        id: `TC-${index + 1}`,
        name: `Test: ${req.substring(0, 40)}${req.length > 40 ? '...' : ''}`,
        description: req,
        steps: generateStepsForRequirement(req),
        expectedResult: generateExpectedResult(req),
        priority: getPriority(index, requirements.length)
      };
    });

    setTestCases(generatedTestCases);
    
    // Call the callback to notify parent component
    if (onTestCasesUpdate) {
      onTestCasesUpdate(generatedTestCases);
    }
  };

  const generateStepsForRequirement = (requirement) => {
    // Generate test steps based on the requirement text
    const lowerReq = requirement.toLowerCase();
    let steps = [];

    if (lowerReq.includes('display')) {
      steps.push('Navigate to the web page');
      steps.push('Verify the element is visible on the page');
      steps.push('Check if the element displays correct content');
    } else if (lowerReq.includes('navigation') || lowerReq.includes('link')) {
      steps.push('Navigate to the web page');
      steps.push('Locate the navigation menu/link');
      steps.push('Click on the navigation item');
      steps.push('Verify correct page loads');
    } else if (lowerReq.includes('responsive') || lowerReq.includes('device')) {
      steps.push('Resize browser window to mobile dimensions');
      steps.push('Verify layout adjusts correctly');
      steps.push('Resize browser window to tablet dimensions');
      steps.push('Verify layout adjusts correctly');
      steps.push('Resize browser window to desktop dimensions');
      steps.push('Verify layout adjusts correctly');
    } else if (lowerReq.includes('image') || lowerReq.includes('alt text')) {
      steps.push('Navigate to the web page');
      steps.push('Inspect image elements');
      steps.push('Verify all images have alt attributes');
    } else if (lowerReq.includes('form') || lowerReq.includes('validation')) {
      steps.push('Navigate to the form');
      steps.push('Try submitting the form without entering data');
      steps.push('Enter invalid data and submit the form');
      steps.push('Enter valid data and submit the form');
      steps.push('Verify appropriate validation messages appear');
    } else {
      // Generic steps for other types of requirements
      steps.push('Navigate to the relevant page section');
      steps.push('Verify the requirement is implemented correctly');
      steps.push('Test the functionality with various inputs');
    }

    return steps;
  };

  const generateExpectedResult = (requirement) => {
    const lowerReq = requirement.toLowerCase();
    
    if (lowerReq.includes('display')) {
      return 'Element is visible and displays the correct content';
    } else if (lowerReq.includes('navigation') || lowerReq.includes('link')) {
      return 'Clicking the navigation item loads the correct page';
    } else if (lowerReq.includes('responsive') || lowerReq.includes('device')) {
      return 'Website layout adjusts properly to different screen sizes';
    } else if (lowerReq.includes('image') || lowerReq.includes('alt text')) {
      return 'All images have appropriate alt text for accessibility';
    } else if (lowerReq.includes('form') || lowerReq.includes('validation')) {
      return 'Form validation works correctly for all input states';
    } else {
      return 'The feature works as specified in the requirement';
    }
  };

  const getPriority = (index, total) => {
    // Assign priorities based on the index and total number of requirements
    if (index < total * 0.3) return 'High';
    if (index < total * 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div className="card test-cases-card">
      <div className="card-header">
        <h5>Test Cases</h5>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => setShowTestCases(!showTestCases)}
        >
          {showTestCases ? 'Hide Test Cases' : 'Show Test Cases'}
        </button>
      </div>
      {showTestCases && (
        <div className="card-body">
          {testCases.length === 0 ? (
            <div className="placeholder-text">Test cases will be generated based on functional requirements</div>
          ) : (
            <div className="test-cases-list">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="test-case-item">
                  <div className="test-case-header">
                    <h6>{testCase.id}: {testCase.name}</h6>
                    <span className={`priority-badge priority-${testCase.priority.toLowerCase()}`}>
                      {testCase.priority}
                    </span>
                  </div>
                  <div className="test-case-description">
                    <p><strong>Requirement:</strong> {testCase.description}</p>
                  </div>
                  <div className="test-case-steps">
                    <p><strong>Steps:</strong></p>
                    <ol>
                      {testCase.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="test-case-expected">
                    <p><strong>Expected Result:</strong> {testCase.expectedResult}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCases;
