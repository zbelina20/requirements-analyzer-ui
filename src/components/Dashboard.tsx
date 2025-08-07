import React, { useState, useEffect } from 'react';

// Type definitions
interface QualityIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  problematicText: string;
  suggestion: string;
}

interface AnalysisResponse {
  overallScore: number;
  issues: QualityIssue[];
  analyzedAt: string;
}

interface Enhancement {
  text: string;
  changes: string[];
  improvements: string[];
  qualityScore: number;
  rationale?: string;
}

interface EnhancementResponse {
  enhancements: Enhancement[];
  recommendedIndex?: number;
}

interface ApiStatus {
  status: string;
  loading: boolean;
  perplexityConnected?: boolean;
  message?: string;
}

interface BatchAnalysisResult extends AnalysisResponse {
  batchResults?: AnalysisResponse[];
}

// API service
const requirementsApi = {
  testConnection: async (): Promise<{ status: string; message: string; perplexityConnected: boolean }> => {
    try {
      const response = await fetch('http://localhost:5074/api/requirements/health');
      if (!response.ok) throw new Error('API not responding');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Connection test failed:', error);
      return { status: 'error', message: 'Failed to connect to API', perplexityConnected: false };
    }
  },
  
  analyzeRequirement: async (requirement: string): Promise<AnalysisResponse> => {
    try {
      const response = await fetch('http://localhost:5074/api/requirements/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: requirement })
      });
      if (!response.ok) throw new Error('Analysis failed');
      return await response.json();
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  },
  
  enhanceRequirement: async (requirement: string, issues: QualityIssue[]): Promise<EnhancementResponse> => {
    try {
      const response = await fetch('http://localhost:5074/api/requirements/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: requirement, issues })
      });
      if (!response.ok) throw new Error('Enhancement failed');
      return await response.json();
    } catch (error) {
      console.error('Enhancement failed:', error);
      throw error;
    }
  },
  
  batchAnalyze: async (requirements: string[]): Promise<AnalysisResponse[]> => {
    try {
      const response = await fetch('http://localhost:5074/api/requirements/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements })
      });
      if (!response.ok) throw new Error('Batch analysis failed');
      return await response.json();
    } catch (error) {
      console.error('Batch analysis failed:', error);
      throw error;
    }
  }
};

const Dashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: 'unknown', loading: true });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [requirement, setRequirement] = useState<string>('');
  const [batchRequirements, setBatchRequirements] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<BatchAnalysisResult | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const showMessage = (text: string, type: string = 'info') => {
    setMessage(`${type}: ${text}`);
    setTimeout(() => setMessage(''), 5000);
  };

  const checkApiStatus = async () => {
    setApiStatus({ status: 'unknown', loading: true });
    try {
      const result = await requirementsApi.testConnection();
      setApiStatus({
        status: result.status === 'healthy' ? 'healthy' : 'degraded',
        loading: false,
        perplexityConnected: result.perplexityConnected,
        message: result.message
      });
    } catch (error) {
      setApiStatus({
        status: 'error',
        loading: false,
        perplexityConnected: false,
        message: 'Failed to connect to API'
      });
    }
  };

  const handleAnalyze = async () => {
    if (!requirement.trim()) {
      showMessage('Please enter a requirement to analyze', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await requirementsApi.analyzeRequirement(requirement);
      setAnalysisResult(result);
      showMessage('Analysis completed successfully', 'success');
    } catch (error) {
      showMessage('Failed to analyze requirement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!analysisResult || analysisResult.batchResults) {
      showMessage('Please analyze the requirement first', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await requirementsApi.enhanceRequirement(requirement, analysisResult.issues);
      setEnhancementResult(result);
      showMessage('Enhancement completed successfully', 'success');
    } catch (error) {
      showMessage('Failed to enhance requirement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAnalyze = async () => {
    const requirements = batchRequirements
      .split('\n')
      .filter(req => req.trim())
      .map(req => req.trim());

    if (requirements.length === 0) {
      showMessage('Please enter at least one requirement', 'error');
      return;
    }

    setLoading(true);
    try {
      const results = await requirementsApi.batchAnalyze(requirements);
      setAnalysisResult({ batchResults: results } as BatchAnalysisResult);
      showMessage(`Batch analysis completed for ${results.length} requirements`, 'success');
    } catch (error) {
      showMessage('Failed to perform batch analysis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#ff4d4f';
      case 'major': return '#faad14';
      case 'minor': return '#52c41a';
      default: return '#666';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#001529',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ☰
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>
              Requirements Quality Analyzer
            </h1>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              AI-Powered Requirements Analysis Dashboard
            </div>
          </div>
        </div>

        {/* API Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>API Status:</span>
            {apiStatus.loading ? (
              <div style={{ 
                display: 'inline-block', 
                width: '16px', 
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: apiStatus.status === 'healthy' ? '#52c41a' : 
                              apiStatus.status === 'degraded' ? '#faad14' : '#ff4d4f',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <span>
                  {apiStatus.status === 'healthy' ? 'ONLINE' : 
                   apiStatus.status === 'degraded' ? 'DEGRADED' : 'OFFLINE'}
                </span>
                {apiStatus.status === 'healthy' ? 'Healthy' :
                 apiStatus.status === 'degraded' ? 'Degraded' : 'Error'}
              </div>
            )}
          </div>
          <button
            onClick={checkApiStatus}
            disabled={apiStatus.loading}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: apiStatus.loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 1000,
          padding: '12px 16px',
          backgroundColor: message.startsWith('error') ? '#ff4d4f' :
                         message.startsWith('success') ? '#52c41a' : '#1890ff',
          color: 'white',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {message.split(': ')[1]}
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setActiveTab('single');
                setDrawerOpen(true);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Analyze New Requirement
            </button>
            <button
              onClick={() => {
                setActiveTab('batch');
                setDrawerOpen(true);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Batch Analysis
            </button>
            <button
              onClick={checkApiStatus}
              disabled={apiStatus.loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#faad14',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: apiStatus.loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Refresh Dashboard
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ marginTop: 0 }}>Analysis Results</h2>
            
            {analysisResult.batchResults ? (
              <div>
                <h3>Batch Analysis Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {analysisResult.batchResults.map((result: AnalysisResponse, index: number) => (
                    <div key={index} style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      padding: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong>Requirement {index + 1}</strong>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: getScoreColor(result.overallScore),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {result.overallScore}/100
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                        Issues: {result.issues.length}
                      </div>
                      {result.issues.length > 0 && (
                        <div style={{ fontSize: '12px' }}>
                          {result.issues.map((issue: QualityIssue, i: number) => (
                            <div key={i} style={{ 
                              padding: '4px 8px',
                              margin: '2px 0',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              borderLeft: `3px solid ${getSeverityColor(issue.severity)}`
                            }}>
                              <strong>{issue.type}</strong> ({issue.severity})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: getScoreColor(analysisResult.overallScore),
                    marginBottom: '8px'
                  }}>
                    {analysisResult.overallScore}
                  </div>
                  <div style={{ fontSize: '18px', color: '#666' }}>Overall Quality Score</div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e5e5',
                    borderRadius: '4px',
                    marginTop: '16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${analysisResult.overallScore}%`,
                      height: '100%',
                      backgroundColor: getScoreColor(analysisResult.overallScore),
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>

                <div>
                  <h3>Issues Identified ({analysisResult.issues.length})</h3>
                  {analysisResult.issues.length > 0 ? (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {analysisResult.issues.map((issue: QualityIssue, index: number) => (
                        <div key={index} style={{
                          padding: '16px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ textTransform: 'capitalize' }}>{issue.type}</strong>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: getSeverityColor(issue.severity),
                              color: 'white',
                              fontSize: '12px',
                              textTransform: 'uppercase'
                            }}>
                              {issue.severity}
                            </span>
                          </div>
                          <p style={{ margin: '8px 0', fontSize: '14px' }}>{issue.description}</p>
                          {issue.problematicText && (
                            <div style={{ 
                              backgroundColor: '#fff2f0', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              marginBottom: '8px'
                            }}>
                              <strong>Problematic text:</strong> "{issue.problematicText}"
                            </div>
                          )}
                          {issue.suggestion && (
                            <div style={{ 
                              backgroundColor: '#f6ffed', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              <strong>Suggestion:</strong> {issue.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#52c41a'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>No issues found!</div>
                      <div style={{ fontSize: '14px' }}>This requirement meets quality standards.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhancement Results */}
        {enhancementResult && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Enhancement Suggestions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
              {enhancementResult.enhancements.map((enhancement: Enhancement, index: number) => (
                <div key={index} style={{
                  border: index === enhancementResult.recommendedIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: '8px',
                  padding: '20px',
                  position: 'relative'
                }}>
                  {index === enhancementResult.recommendedIndex && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      backgroundColor: '#1890ff',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Version {index + 1}</h3>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: getScoreColor(enhancement.qualityScore),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {enhancement.qualityScore}/100
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {enhancement.text}
                  </div>

                  {enhancement.changes && enhancement.changes.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '12px', color: '#666' }}>CHANGES MADE:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        {enhancement.changes.map((change: string, i: number) => (
                          <li key={i}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {enhancement.improvements && enhancement.improvements.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '12px', color: '#666' }}>IMPROVEMENTS:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px' }}>
                        {enhancement.improvements.map((improvement: string, i: number) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {enhancement.rationale && (
                    <div style={{
                      backgroundColor: '#e6f7ff',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>Rationale:</strong> {enhancement.rationale}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer */}
      {drawerOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '400px',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 1001,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #d9d9d9',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Analysis Tools</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #d9d9d9' }}>
                <button
                  onClick={() => setActiveTab('single')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: activeTab === 'single' ? '#1890ff' : 'transparent',
                    color: activeTab === 'single' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeTab === 'single' ? 'bold' : 'normal'
                  }}
                >
                  Single Analysis
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: activeTab === 'batch' ? '#1890ff' : 'transparent',
                    color: activeTab === 'batch' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeTab === 'batch' ? 'bold' : 'normal'
                  }}
                >
                  Batch Analysis
                </button>
              </div>

              {activeTab === 'single' ? (
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Single Requirement Analysis</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Enter Your Requirement:
                    </label>
                    <textarea
                      rows={4}
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      placeholder="Example: The system should be user-friendly and fast..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !requirement.trim()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: loading || !requirement.trim() ? '#d9d9d9' : '#1890ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading || !requirement.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? 'Analyzing...' : 'Analyze Quality'}
                    </button>
                    
                    {analysisResult && !analysisResult.batchResults && (
                      <button
                        onClick={handleEnhance}
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: loading ? '#d9d9d9' : '#52c41a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        {loading ? 'Enhancing...' : 'Generate Enhancements'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Batch Analysis</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Enter Requirements (one per line):
                    </label>
                    <textarea
                      rows={6}
                      value={batchRequirements}
                      onChange={(e) => setBatchRequirements(e.target.value)}
                      placeholder={`The system shall respond within 2 seconds
The user interface should be intuitive
Data must be backed up daily
The application should handle 1000 concurrent users`}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleBatchAnalyze}
                    disabled={loading || !batchRequirements.trim()}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: loading || !batchRequirements.trim() ? '#d9d9d9' : '#52c41a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading || !batchRequirements.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Batch'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;