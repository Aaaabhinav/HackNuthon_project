import { useState, useEffect } from 'react';
import './GeminiWorkflow.css';
import RequirementsGenerator from './RequirementsGenerator';
import ApplicationGenerator from './ApplicationGenerator';
import TestCases from './TestCases';
import TestScenarios from './TestScenarios';
import AutomatedTesting from './AutomatedTesting';
import TestReport from './TestReport';

const GeminiWorkflow = ({ figmaBlueprint }) => {
  const [requirements, setRequirements] = useState([]);
  const [applicationCode, setApplicationCode] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [testScenarios, setTestScenarios] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowComplete, setWorkflowComplete] = useState(false);

  // Handle requirements being generated
  const handleRequirementsGenerated = (newRequirements) => {
    setRequirements(newRequirements);
    setCurrentStep(2); // Move to application code generation
  };

  // Handle application code being generated
  const handleApplicationGenerated = (newCode) => {
    setApplicationCode(newCode);
    setCurrentStep(3); // Move to test case generation
  };

  // Handle test cases being generated
  const handleTestCasesUpdate = (newTestCases) => {
    setTestCases(newTestCases);
    setCurrentStep(4); // Move to test scenario generation
  };

  // Handle test scenarios being generated
  const handleScenariosGenerated = (newScenarios) => {
    setTestScenarios(newScenarios);
    setCurrentStep(5); // Move to automated testing
  };

  // Handle automated testing completion
  const handleTestingComplete = (results) => {
    setTestResults(results);
    setCurrentStep(6); // Move to test report
    setWorkflowComplete(true);
  };

  return (
    <div className="gemini-workflow">
      <div className="workflow-steps">
        <div className={`workflow-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-name">Requirements</span>
        </div>
        <div className={`workflow-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-name">Application</span>
        </div>
        <div className={`workflow-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-name">Test Cases</span>
        </div>
        <div className={`workflow-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-name">Test Scenarios</span>
        </div>
        <div className={`workflow-step ${currentStep >= 5 ? 'active' : ''} ${currentStep > 5 ? 'completed' : ''}`}>
          <span className="step-number">5</span>
          <span className="step-name">Automated Tests</span>
        </div>
        <div className={`workflow-step ${currentStep >= 6 ? 'active' : ''} ${currentStep > 6 ? 'completed' : ''}`}>
          <span className="step-number">6</span>
          <span className="step-name">Test Report</span>
        </div>
      </div>

      {figmaBlueprint ? (
        <div className="workflow-content">
          {currentStep >= 1 && (
            <RequirementsGenerator 
              figmaBlueprint={figmaBlueprint} 
              onRequirementsGenerated={handleRequirementsGenerated} 
            />
          )}
          
          {currentStep >= 2 && requirements.length > 0 && (
            <ApplicationGenerator 
              figmaBlueprint={figmaBlueprint}
              requirements={requirements}
              onApplicationGenerated={handleApplicationGenerated}
            />
          )}
          
          {currentStep >= 3 && requirements.length > 0 && (
            <TestCases 
              functionalRequirements={requirements}
              onTestCasesUpdate={handleTestCasesUpdate}
            />
          )}
          
          {currentStep >= 4 && testCases.length > 0 && applicationCode && (
            <TestScenarios 
              testCases={testCases}
              applicationCode={applicationCode}
              onScenariosGenerated={handleScenariosGenerated}
            />
          )}
          
          {currentStep >= 5 && testScenarios.length > 0 && applicationCode && (
            <AutomatedTesting 
              testScenarios={testScenarios}
              applicationCode={applicationCode}
              onTestingComplete={handleTestingComplete}
            />
          )}
          
          {currentStep >= 6 && testResults && (
            <TestReport 
              testResults={testResults} 
            />
          )}
          
          {workflowComplete && (
            <div className="workflow-completion">
              <h3>Workflow Complete</h3>
              <p>The entire AI-powered development workflow has completed successfully!</p>
              <p>Check the test report for readiness assessment and next steps.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>Enter a Figma URL above to start the AI-powered development workflow.</p>
        </div>
      )}
    </div>
  );
};

export default GeminiWorkflow;
