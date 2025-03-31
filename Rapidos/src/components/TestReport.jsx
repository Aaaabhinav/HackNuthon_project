import { useState, useEffect } from 'react';
import './TestReport.css'; 

const TestReport = ({ testResults, generatedCode, figmaFileKey }) => {
  const [reportCopied, setReportCopied] = useState(false);
  const [githubResults, setGithubResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('local'); // 'local' or 'github'

  // Normalize test results structure to ensure consistent access
  const normalizeTestResults = () => {
    if (!testResults) return null;
    
    // Check if results are already in the expected format
    if (testResults.total !== undefined && testResults.passed !== undefined) {
      return testResults;
    }
    
    // Handle the structure from AutomatedTesting component
    if (testResults.summary) {
      const failureDetails = [];
      
      // Extract failure details from scenario results
      if (testResults.scenarioResults) {
        testResults.scenarioResults.forEach(scenario => {
          if (scenario.status === 'failed') {
            failureDetails.push({
              testId: scenario.id,
              testName: scenario.name,
              error: scenario.error || 'Unknown error',
              stackTrace: scenario.stackTrace,
              duration: (scenario.duration / 1000).toFixed(2)
            });
          }
        });
      }
      
      // Calculate average duration of all tests
      let totalDuration = 0;
      if (testResults.scenarioResults && testResults.scenarioResults.length > 0) {
        totalDuration = testResults.scenarioResults.reduce((sum, scenario) => sum + (scenario.duration || 0), 0);
        totalDuration = (totalDuration / 1000).toFixed(2);
      }
      
      // Return normalized structure
      return {
        total: testResults.summary.total,
        passed: testResults.summary.passed,
        failed: testResults.summary.failed,
        duration: totalDuration,
        failureDetails: failureDetails,
        originalResults: testResults
      };
    }
    
    // Last resort fallback with reasonable defaults
    return {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      failureDetails: []
    };
  };

  const getCertificationStatus = () => {
    const normalized = normalizeTestResults();
    if (!normalized) return null;
    
    const passRate = normalized.passed / normalized.total;
    
    if (passRate === 1) {
      return { status: 'certified', message: 'Ready for deployment!', color: '#28a745' };
    } else if (passRate >= 0.9) {
      return { status: 'conditionally-certified', message: 'Ready for limited deployment with minor fixes', color: '#4caf50' };
    } else if (passRate >= 0.7) {
      return { status: 'needs-improvement', message: 'Needs fixes before deploying', color: '#ff9800' };
    } else {
      return { status: 'not-certified', message: 'Significant issues must be addressed', color: '#dc3545' };
    }
  };

  const generatePieChartData = () => {
    const normalized = normalizeTestResults();
    if (!normalized) return null;
    
    const passPercent = Math.round((normalized.passed / normalized.total) * 100) || 0;
    const failPercent = 100 - passPercent;
    
    return {
      passPercent,
      failPercent
    };
  };
  
  const generatePieChart = () => {
    const data = generatePieChartData();
    if (!data) return null;
    
    const { passPercent, failPercent } = data;
    
    const calculateCoordinates = (percent, startAngle) => {
      const angle = startAngle + (percent / 100 * 360);
      const angleRad = (angle * Math.PI) / 180;
      const x = 50 + 45 * Math.sin(angleRad);
      const y = 50 - 45 * Math.cos(angleRad);
      return { x, y, angle };
    };
    
    const failureCoord = calculateCoordinates(failPercent, 0);
    const largeArcFlag = failPercent > 50 ? 1 : 0;
    
    return (
      <svg width="200" height="200" viewBox="0 0 100 100">
        {failPercent > 0 && (
          <path 
            d={`M 50 5 A 45 45 0 ${largeArcFlag} 1 ${failureCoord.x} ${failureCoord.y} L 50 50 Z`}
            fill="#dc3545"
          />
        )}
        
        {passPercent > 0 && (
          <path 
            d={`M ${failureCoord.x} ${failureCoord.y} A 45 45 0 ${passPercent > 50 ? 1 : 0} 1 50 5 L 50 50 Z`}
            fill="#28a745"
          />
        )}
        
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="bold" fill="#333">
          {passPercent}%
        </text>
        <text x="50" y="65" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#666">
          Pass Rate
        </text>
      </svg>
    );
  };

  const generateLocalReport = () => {
    const normalized = normalizeTestResults();
    if (!normalized) return '';
    
    const certStatus = getCertificationStatus();
    const date = new Date().toLocaleString();
    
    return `
      <div class="test-report-container">
        <div class="report-header">
          <h2>Test Results Summary</h2>
          <p class="report-time">Generated on: ${date}</p>
        </div>
        
        <div class="report-summary">
          <div class="summary-card total">
            <h3>${normalized.total}</h3>
            <p>Total Tests</p>
          </div>
          <div class="summary-card passed">
            <h3>${normalized.passed}</h3>
            <p>Passed Tests</p>
          </div>
          <div class="summary-card failed">
            <h3>${normalized.failed}</h3>
            <p>Failed Tests</p>
          </div>
          <div class="summary-card duration">
            <h3>${normalized.duration}s</h3>
            <p>Duration</p>
          </div>
        </div>
        
        <div class="certification-block" style="background-color: ${certStatus.color}20; border-left: 4px solid ${certStatus.color};">
          <h3>Status: <span style="color: ${certStatus.color};">${certStatus.status.replace(/-/g, ' ').toUpperCase()}</span></h3>
          <p>${certStatus.message}</p>
        </div>

        ${normalized.failed > 0 ? `
          <div class="failures-section">
            <h3>Failed Tests Analysis</h3>
            <table class="failures-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Test Name</th>
                  <th>Error</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${normalized.failureDetails.map(detail => `
                  <tr>
                    <td>${detail.testId || '-'}</td>
                    <td>${detail.testName}</td>
                    <td>${detail.error}</td>
                    <td>${detail.duration}s</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="recommendations-section">
            <h3>Recommendations</h3>
            <ul>
              ${normalized.failureDetails.map(detail => {
                let recommendation = '';
                if (detail.error.includes('Element not found')) {
                  recommendation = `Check if the selector <code>${detail.error.split(': ')[1]}</code> exists in the HTML. The element might be missing or have a different ID/class.`;
                } else if (detail.error.includes('Assertion failed')) {
                  recommendation = `Verify expected behavior for the '${detail.testName}' test. The condition being tested is not being met.`;
                } else if (detail.error.includes('Timed out')) {
                  recommendation = `Check if the tested functionality has proper loading states or if there are performance issues causing timeout in '${detail.testName}'.`;
                } else {
                  recommendation = `Investigate the error in '${detail.testName}' by reviewing both the test implementation and application code.`;
                }
                return `<li>${recommendation}</li>`;
              }).join('')}
            </ul>
          </div>
        ` : `
          <div class="success-section">
            <h3>All Tests Passed Successfully!</h3>
            <p>Great job! Your application meets all the requirements specified in the test scenarios.</p>
          </div>
        `}
        
        <div class="next-steps-section">
          <h3>Next Steps</h3>
          <ul>
            <li>Deploy the application to the ${normalized.passed === normalized.total ? 'production' : 'testing'} environment</li>
            <li>Consider adding more test coverage for edge cases</li>
            <li>Run performance tests to ensure optimal user experience</li>
            ${normalized.failed > 0 ? `<li>Fix the ${normalized.failed} failing tests before proceeding to production</li>` : ''}
          </ul>
        </div>
      </div>
    `;
  };

  const copyReport = () => {
    const reportHtml = generateLocalReport();
    navigator.clipboard.writeText(reportHtml);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  };

  useEffect(() => {
    console.log("TestReport component mounted");
    // Uncomment the next line to start in GitHub tab for debugging
    // setActiveTab('github');
  }, []);

  // Trigger GitHub Actions workflow when a new code is generated
  useEffect(() => {
    if (generatedCode && figmaFileKey) {
      console.log("Auto-triggering GitHub test with:", { generatedCode: generatedCode?.substring(0, 50) + "...", figmaFileKey });
      triggerGitHubTest();
    }
  }, [generatedCode, figmaFileKey]);

  // Function to trigger GitHub Actions workflow - improved with better debugging
  const triggerGitHubTest = async () => {
    console.log("triggerGitHubTest called", { 
      hasGeneratedCode: !!generatedCode,
      hasFigmaFileKey: !!figmaFileKey,
      currentTab: activeTab
    });
    
    // For testing, remove the check to allow running even without code/key
    // if (!generatedCode || !figmaFileKey) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, you would send this to your backend
      // which would then trigger the GitHub workflow via GitHub API
      console.log('Triggering GitHub Actions to test generated code');
      
      // Simulate API call to GitHub Actions
      // In a real implementation, you would call:
      // await fetch('your-backend-url/trigger-github-action', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ htmlContent: generatedCode, designId: figmaFileKey })
      // });

      // For demo purposes, we'll simulate a response after a delay
      setTimeout(() => {
        const mockGithubResults = {
          designId: figmaFileKey,
          timestamp: new Date().toISOString(),
          summary: {
            accessibility: {
              passed: 12,
              failed: 3,
              score: 85
            },
            lighthouse: {
              performance: 87,
              accessibility: 90,
              bestPractices: 93,
              seo: 95
            },
            responsiveness: {
              desktop: true,
              mobile: true
            }
          },
          details: {
            accessibilityIssues: [
              { id: 'color-contrast', impact: 'serious', description: 'Elements must have sufficient color contrast', nodes: 2 },
              { id: 'aria-hidden-focus', impact: 'serious', description: 'ARIA hidden element must not be focusable', nodes: 1 },
              { id: 'document-title', impact: 'serious', description: 'Documents must have a title', nodes: 1 }
            ],
            performanceMetrics: {
              firstContentfulPaint: '0.8 s',
              largestContentfulPaint: '1.2 s',
              totalBlockingTime: '0 ms',
              cumulativeLayoutShift: '0.001'
            }
          },
          passed: true
        };
        
        setGithubResults(mockGithubResults);
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Error triggering GitHub Actions:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Test Report</h2>
        
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'local' ? 'active' : ''}`} 
            onClick={() => setActiveTab('local')}
          >
            Local Test Results
          </button>
          <button 
            className={`tab-button ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            GitHub Test Results
            {isLoading && <span className="loading-indicator"></span>}
          </button>
        </div>
      </div>

      {activeTab === 'local' ? (
        <div className="test-report-section">
          <h2>
            Test Report
            <div className="button-group">
              {generateLocalReport() && (
                <button 
                  className="copy-button" 
                  onClick={copyReport}
                >
                  {reportCopied ? 'Copied!' : 'Copy Report'}
                </button>
              )}
            </div>
          </h2>
          
          {testResults ? (
            <div className="report-dashboard">
              <div className="report-header-section">
                <div className="status-card">
                  <h3>Test Status</h3>
                  {getCertificationStatus() && (
                    <div className="certification-badge" style={{ backgroundColor: `${getCertificationStatus().color}20`, borderColor: getCertificationStatus().color }}>
                      <span className="status-icon" style={{ backgroundColor: getCertificationStatus().color }}></span>
                      <div className="status-details">
                        <span className="status-name" style={{ color: getCertificationStatus().color }}>
                          {getCertificationStatus().status.replace(/-/g, ' ').toUpperCase()}
                        </span>
                        <span className="status-message">{getCertificationStatus().message}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="chart-section">
                  {generatePieChart()}
                </div>
                
                <div className="metrics-section">
                  {(() => {
                    const normalized = normalizeTestResults();
                    if (!normalized) return null;
                    
                    return (
                      <>
                        <div className="metric-box">
                          <div className="metric-value">{normalized.total}</div>
                          <div className="metric-label">Total Tests</div>
                        </div>
                        <div className="metric-box success">
                          <div className="metric-value">{normalized.passed}</div>
                          <div className="metric-label">Passed</div>
                        </div>
                        <div className="metric-box error">
                          <div className="metric-value">{normalized.failed}</div>
                          <div className="metric-label">Failed</div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-value">{normalized.duration}s</div>
                          <div className="metric-label">Duration</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {(() => {
                const normalized = normalizeTestResults();
                if (!normalized) return null;
                
                return normalized.failed > 0 ? (
                  <div className="failures-container">
                    <h3>Failed Tests</h3>
                    <div className="scrollable-table-container">
                      <table className="failures-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Test Name</th>
                            <th>Error</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {normalized.failureDetails.map((detail, index) => (
                            <tr key={index}>
                              <td>{detail.testId || `TC-${index + 1}`}</td>
                              <td>{detail.testName}</td>
                              <td>
                                <div className="error-message-cell">
                                  <div className="error-text">{detail.error}</div>
                                  {detail.stackTrace && (
                                    <div className="stack-trace-toggle">
                                      <details>
                                        <summary>Stack Trace</summary>
                                        <pre>{detail.stackTrace}</pre>
                                      </details>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>{detail.duration}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="recommendations-box">
                      <h3>Recommendations</h3>
                      <ul className="recommendations-list">
                        {normalized.failureDetails.map((detail, index) => {
                          let recommendation = '';
                          if (detail.error.includes('Element not found')) {
                            recommendation = `Check if the selector '${detail.error.split(': ')[1]}' exists in the HTML. The element might be missing or have a different ID/class.`;
                          } else if (detail.error.includes('Assertion failed')) {
                            recommendation = `Verify expected behavior for the '${detail.testName}' test. The condition being tested is not being met.`;
                          } else if (detail.error.includes('Timed out')) {
                            recommendation = `Check if the tested functionality has proper loading states or if there are performance issues causing timeout in '${detail.testName}'.`;
                          } else {
                            recommendation = `Investigate the error in '${detail.testName}' by reviewing both the test implementation and application code.`;
                          }
                          return (
                            <li key={index}>{recommendation}</li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="success-container">
                    <div className="success-icon">✓</div>
                    <h3>All Tests Passed!</h3>
                    <p>Congratulations! Your application has passed all automated tests with flying colors. The application meets all the specified requirements and is ready for deployment.</p>
                  </div>
                );
              })()}
              
              <div className="next-steps-container">
                <h3>Next Steps</h3>
                <div className="steps-cards">
                  {(() => {
                    const normalized = normalizeTestResults();
                    if (!normalized) return null;
                    
                    return (
                      <>
                        <div className="step-card">
                          <div className="step-icon">1</div>
                          <div className="step-content">
                            <h4>Deploy Application</h4>
                            <p>Deploy the application to the {normalized.passed === normalized.total ? 'production' : 'testing'} environment.</p>
                          </div>
                        </div>
                        <div className="step-card">
                          <div className="step-icon">2</div>
                          <div className="step-content">
                            <h4>Improve Test Coverage</h4>
                            <p>Add more test scenarios to cover edge cases and improve reliability.</p>
                          </div>
                        </div>
                        <div className="step-card">
                          <div className="step-icon">3</div>
                          <div className="step-content">
                            <h4>Performance Testing</h4>
                            <p>Run performance tests to ensure optimal user experience under load.</p>
                          </div>
                        </div>
                        {normalized.failed > 0 && (
                          <div className="step-card">
                            <div className="step-icon">!</div>
                            <div className="step-content">
                              <h4>Fix Failing Tests</h4>
                              <p>Address the {normalized.failed} failing tests before proceeding to production.</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No test results available yet. Run the automated tests to generate a detailed report.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="github-results-container">
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Running tests on GitHub Actions...</p>
              <p className="loading-note">This may take a few minutes.</p>
            </div>
          ) : githubResults ? (
            <div className="github-report">
              <div className="github-summary">
                <div className="summary-header">
                  <h3>GitHub Test Results</h3>
                  <div className={`status-badge ${githubResults.passed ? 'passed' : 'failed'}`}>
                    {githubResults.passed ? 'PASSED' : 'FAILED'}
                  </div>
                </div>
                
                <div className="metric-cards">
                  <div className="metric-category">
                    <h4>Performance</h4>
                    <div className="metric-score" style={{ color: getScoreColor(githubResults.summary.lighthouse.performance) }}>
                      {githubResults.summary.lighthouse.performance}
                    </div>
                  </div>
                  <div className="metric-category">
                    <h4>Accessibility</h4>
                    <div className="metric-score" style={{ color: getScoreColor(githubResults.summary.lighthouse.accessibility) }}>
                      {githubResults.summary.lighthouse.accessibility}
                    </div>
                  </div>
                  <div className="metric-category">
                    <h4>Best Practices</h4>
                    <div className="metric-score" style={{ color: getScoreColor(githubResults.summary.lighthouse.bestPractices) }}>
                      {githubResults.summary.lighthouse.bestPractices}
                    </div>
                  </div>
                  <div className="metric-category">
                    <h4>SEO</h4>
                    <div className="metric-score" style={{ color: getScoreColor(githubResults.summary.lighthouse.seo) }}>
                      {githubResults.summary.lighthouse.seo}
                    </div>
                  </div>
                </div>

                {githubResults.details.accessibilityIssues.length > 0 && (
                  <div className="issues-section">
                    <h4>Accessibility Issues</h4>
                    <div className="issues-list">
                      {githubResults.details.accessibilityIssues.map((issue, index) => (
                        <div key={index} className={`issue-item ${issue.impact}`}>
                          <div className="issue-impact">{issue.impact}</div>
                          <div className="issue-info">
                            <div className="issue-id">{issue.id}</div>
                            <div className="issue-description">{issue.description}</div>
                          </div>
                          <div className="issue-count">{issue.nodes} {issue.nodes === 1 ? 'instance' : 'instances'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="performance-metrics">
                  <h4>Performance Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-name">First Contentful Paint</div>
                      <div className="metric-value">{githubResults.details.performanceMetrics.firstContentfulPaint}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-name">Largest Contentful Paint</div>
                      <div className="metric-value">{githubResults.details.performanceMetrics.largestContentfulPaint}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-name">Total Blocking Time</div>
                      <div className="metric-value">{githubResults.details.performanceMetrics.totalBlockingTime}</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-name">Cumulative Layout Shift</div>
                      <div className="metric-value">{githubResults.details.performanceMetrics.cumulativeLayoutShift}</div>
                    </div>
                  </div>
                </div>
                
                <div className="responsiveness-section">
                  <h4>Responsive Design</h4>
                  <div className="responsive-results">
                    <div className="responsive-item">
                      <div className="responsive-label">Desktop:</div>
                      <div className={`responsive-status ${githubResults.summary.responsiveness.desktop ? 'passed' : 'failed'}`}>
                        {githubResults.summary.responsiveness.desktop ? 'Passed' : 'Issues Detected'}
                      </div>
                    </div>
                    <div className="responsive-item">
                      <div className="responsive-label">Mobile:</div>
                      <div className={`responsive-status ${githubResults.summary.responsiveness.mobile ? 'passed' : 'failed'}`}>
                        {githubResults.summary.responsiveness.mobile ? 'Passed' : 'Issues Detected'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No GitHub test results available yet.</p>
              <button 
                className="button trigger-github-test" 
                onClick={() => {
                  console.log("GitHub Test button clicked");
                  triggerGitHubTest();
                }}
              >
                Run GitHub Tests
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on score
const getScoreColor = (score) => {
  if (score >= 90) return '#0cce6b'; // Good
  if (score >= 70) return '#ffa400'; // Needs improvement
  return '#ff4e42'; // Poor
};

export default TestReport;
