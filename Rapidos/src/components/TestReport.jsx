import { useState, useEffect } from 'react';
import ApiService from './ApiService';

const TestReport = ({ testResults }) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportCopied, setReportCopied] = useState(false);

  useEffect(() => {
    if (testResults) {
      generateReport();
    }
  }, [testResults]);

  const generateReport = async () => {
    if (!testResults) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call Gemini API to generate a detailed test report
      const generatedReport = await ApiService.generateTestReport(testResults);
      setReport(generatedReport);
    } catch (err) {
      console.error('Error generating test report:', err);
      setError(`Failed to generate test report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (report && navigator.clipboard) {
      navigator.clipboard.writeText(report)
        .then(() => {
          setReportCopied(true);
          setTimeout(() => setReportCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy report:', err);
        });
    }
  };

  // Function to determine overall certification status
  const getCertificationStatus = () => {
    if (!testResults) return null;
    
    const { passed, total } = testResults.summary;
    const passRate = passed / total;
    
    if (passRate === 1) {
      return { status: 'certified', message: 'Ready for deployment!' };
    } else if (passRate >= 0.9) {
      return { status: 'conditionally-certified', message: 'Ready for local deployment with minor fixes.' };
    } else if (passRate >= 0.7) {
      return { status: 'needs-improvement', message: 'Needs fixes before deploying to local environment.' };
    } else {
      return { status: 'not-certified', message: 'Significant issues must be addressed.' };
    }
  };

  return (
    <div className="section test-report-section">
      <h2>
        Test Report
        <div className="button-group">
          {report && (
            <button 
              className="copy-button" 
              onClick={copyReport}
            >
              {reportCopied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {testResults && (
            <button 
              className="regenerate-button" 
              onClick={generateReport}
              disabled={loading}
            >
              Regenerate Report
            </button>
          )}
        </div>
      </h2>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating test report...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('rate limit') && (
            <p className="rate-limit-note">Note: The API service has reached its rate limit. Please try again in a few minutes.</p>
          )}
          <button 
            className="retry-button" 
            onClick={generateReport}
          >
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && testResults && (
        <div className="certification-status">
          <h3>Certification Status</h3>
          {getCertificationStatus() && (
            <div className={`status ${getCertificationStatus().status}`}>
              <span className="status-indicator"></span>
              <span className="status-text">{getCertificationStatus().message}</span>
            </div>
          )}
          <div className="results-summary">
            <div className="summary-item">
              <span>Total Tests:</span> {testResults.summary.total}
            </div>
            <div className="summary-item passed">
              <span>Passed:</span> {testResults.summary.passed} ({Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%)
            </div>
            <div className="summary-item failed">
              <span>Failed:</span> {testResults.summary.failed} ({Math.round((testResults.summary.failed / testResults.summary.total) * 100)}%)
            </div>
          </div>
        </div>
      )}
      
      {!loading && !error && report && (
        <div className="report-content">
          <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
        </div>
      )}
      
      {!loading && !error && !report && testResults && (
        <div className="empty-state">
          <p>No detailed report generated yet.</p>
          <button className="generate-button" onClick={generateReport}>
            Generate Report
          </button>
        </div>
      )}
      
      {!testResults && (
        <div className="empty-state">
          <p>Run the automated tests to generate a report.</p>
        </div>
      )}
    </div>
  );
};

export default TestReport;
