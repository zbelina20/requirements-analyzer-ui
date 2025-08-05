// src/components/RequirementAnalyzer.tsx
import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Progress, 
  Tag, 
  Row,
  Col,
  List,
  Collapse,
  Empty,
  message
} from 'antd';
import { useMutation } from '@tanstack/react-query';
import { 
  requirementsApi, 
  RequirementAnalysis, 
  QualityIssue,
  RequirementEnhancement,
  EnhancementResponse 
} from '../services/api';
import { 
  ExperimentOutlined, 
  BulbOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const RequirementAnalyzer: React.FC = () => {
  const [requirement, setRequirement] = useState('');
  const [analysisResult, setAnalysisResult] = useState<RequirementAnalysis | null>(null);
  const [enhancementResults, setEnhancementResults] = useState<RequirementEnhancement[] | null>(null);
  const [selectedEnhancement, setSelectedEnhancement] = useState<RequirementEnhancement | null>(null);

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: requirementsApi.analyzeRequirement,
    onSuccess: (data) => {
      setAnalysisResult(data);
      setEnhancementResults(null); // Clear previous enhancements
      setSelectedEnhancement(null);
      message.success('Analysis completed successfully!');
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      message.error('Analysis failed. Using mock data for demonstration.');
      // Mock data for testing UI when backend is not ready
      const mockResult: RequirementAnalysis = {
        overallScore: 65,
        analyzedAt: new Date().toISOString(),
        issues: [
          {
            type: 'ambiguity',
            severity: 'major',
            description: 'The term "user-friendly" is ambiguous and not measurable',
            problematicText: 'user-friendly',
            suggestion: 'Replace with specific, measurable criteria like "95% of users can complete the task within 2 minutes"'
          },
          {
            type: 'completeness',
            severity: 'minor',
            description: 'Missing error handling specification',
            problematicText: 'system should process',
            suggestion: 'Add specifications for error conditions and system response'
          },
          {
            type: 'verifiability',
            severity: 'major',
            description: 'Contains non-testable criteria',
            problematicText: 'fast',
            suggestion: 'Specify measurable performance criteria like "response time < 2 seconds"'
          }
        ]
      };
      setAnalysisResult(mockResult);
    }
  });

  // Enhancement mutation
  const enhancementMutation = useMutation({
    mutationFn: ({ text, issues }: { text: string; issues?: QualityIssue[] }) => 
      requirementsApi.enhanceRequirement(text, issues),
    onSuccess: (data: EnhancementResponse) => {
      setEnhancementResults(data.enhancements);
      setSelectedEnhancement(data.enhancements[0]); // Select first enhancement by default
      message.success(`Generated ${data.enhancements.length} enhanced versions!`);
    },
    onError: (error) => {
      console.error('Enhancement failed:', error);
      message.error('Enhancement failed. Using mock data for demonstration.');
      // Mock data for testing
      const mockEnhancements: RequirementEnhancement[] = [
        {
          text: 'The system shall respond to user login requests within 2 seconds and display a confirmation message with 99.9% availability during peak hours (8AM-6PM).',
          changes: ['Added specific timing requirement', 'Specified availability metric', 'Defined peak hours'],
          improvements: ['Measurable performance criteria', 'Clear success conditions', 'Testable availability requirement'],
          qualityScore: 88
        },
        {
          text: 'The authentication system must process user credentials within 2 seconds, display appropriate success/error messages, and maintain 99.5% uptime during business hours.',
          changes: ['Used definitive language (must)', 'Added error handling', 'Specified uptime requirement'],
          improvements: ['Definitive requirements language', 'Error condition handling', 'Measurable uptime criteria'],
          qualityScore: 85
        },
        {
          text: 'The user authentication module shall validate credentials and return results within 2 seconds, with success rate of 99.9% for valid inputs and appropriate error messages for invalid inputs.',
          changes: ['Specified module scope', 'Added success rate metric', 'Defined input validation'],
          improvements: ['Clear module identification', 'Success rate measurement', 'Input validation specification'],
          qualityScore: 82
        }
      ];
      setEnhancementResults(mockEnhancements);
      setSelectedEnhancement(mockEnhancements[0]);
    }
  });

  const handleAnalyze = () => {
    if (!requirement.trim()) {
      message.warning('Please enter a requirement to analyze');
      return;
    }
    analysisMutation.mutate(requirement);
  };

  const handleEnhance = () => {
    if (!analysisResult) return;
    enhancementMutation.mutate({ 
      text: requirement, 
      issues: analysisResult.issues 
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  const handleExportResults = () => {
    const exportData = {
      originalRequirement: requirement,
      analysis: analysisResult,
      enhancements: enhancementResults,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirement-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Results exported successfully!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a'; // green
    if (score >= 60) return '#faad14'; // orange  
    return '#f5222d'; // red
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'major': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'minor': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'processing';
      default: return 'default';
    }
  };

  const getIssueTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      ambiguity: 'volcano',
      completeness: 'orange',
      consistency: 'gold',
      verifiability: 'lime',
      traceability: 'cyan'
    };
    return colors[type] || 'default';
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      <Card title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExperimentOutlined />
          <span>Requirements Quality Analyzer & Enhancer</span>
        </div>
      }>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Input Section */}
          <Card size="small" title="Requirement Input" type="inner">
            <div>
              <TextArea
                rows={6}
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Enter your software requirement here...

Example: The system should be user-friendly and fast to ensure good user experience."
                style={{ marginBottom: '12px' }}
                showCount
                maxLength={5000}
              />
              <Space>
                <Button 
                  type="primary" 
                  icon={<ExperimentOutlined />}
                  onClick={handleAnalyze}
                  loading={analysisMutation.isPending}
                  disabled={!requirement.trim()}
                  size="large"
                >
                  Analyze Quality
                </Button>
                
                {analysisResult && (
                  <Button 
                    type="default"
                    icon={<BulbOutlined />}
                    onClick={handleEnhance}
                    loading={enhancementMutation.isPending}
                    size="large"
                  >
                    Generate Enhancements
                  </Button>
                )}

                {(analysisResult || enhancementResults) && (
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={handleExportResults}
                    size="large"
                  >
                    Export Results
                  </Button>
                )}

                <Button 
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setRequirement('');
                    setAnalysisResult(null);
                    setEnhancementResults(null);
                    setSelectedEnhancement(null);
                  }}
                  size="large"
                >
                  Clear All
                </Button>
              </Space>
            </div>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <Card title="Quality Analysis Results" type="inner">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                    <Title level={2} style={{ color: getScoreColor(analysisResult.overallScore), margin: 0 }}>
                      {analysisResult.overallScore}/100
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>Overall Quality Score</Text>
                    <Progress 
                      percent={analysisResult.overallScore} 
                      strokeColor={getScoreColor(analysisResult.overallScore)}
                      showInfo={false}
                      style={{ marginTop: '12px' }}
                      strokeWidth={8}
                    />
                    <div style={{ marginTop: '12px' }}>
                      {analysisResult.overallScore >= 80 && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>Excellent</Tag>
                      )}
                      {analysisResult.overallScore >= 60 && analysisResult.overallScore < 80 && (
                        <Tag color="warning" icon={<WarningOutlined />}>Good</Tag>
                      )}
                      {analysisResult.overallScore < 60 && (
                        <Tag color="error" icon={<ExclamationCircleOutlined />}>Needs Improvement</Tag>
                      )}
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} lg={16}>
                  <div style={{ height: '100%' }}>
                    <Title level={5} style={{ marginBottom: '16px' }}>
                      Issues Identified ({analysisResult.issues.length})
                    </Title>
                    {analysisResult.issues.length > 0 ? (
                      <List
                        dataSource={analysisResult.issues}
                        renderItem={(issue, index) => (
                          <List.Item key={index}>
                            <Card size="small" style={{ width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                {getSeverityIcon(issue.severity)}
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: '8px' }}>
                                    <Tag color={getIssueTypeColor(issue.type)} style={{ marginRight: '8px' }}>
                                      {issue.type.toUpperCase()}
                                    </Tag>
                                    <Tag color={getSeverityColor(issue.severity)}>
                                      {issue.severity.toUpperCase()}
                                    </Tag>
                                  </div>
                                  <Paragraph style={{ marginBottom: '8px', fontWeight: 500 }}>
                                    {issue.description}
                                  </Paragraph>
                                  {issue.problematicText && (
                                    <div style={{ marginBottom: '8px' }}>
                                      <Text type="secondary">Problematic text: </Text>
                                      <Text code style={{ backgroundColor: '#fff2e8', color: '#d46b08' }}>
                                        "{issue.problematicText}"
                                      </Text>
                                    </div>
                                  )}
                                  <div>
                                    <Text type="secondary">Suggestion: </Text>
                                    <Text style={{ color: '#52c41a' }}>{issue.suggestion}</Text>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty
                        image={<CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />}
                        description="No quality issues found! This requirement meets high quality standards."
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Enhancement Results */}
          {enhancementResults && (
            <Card title="Enhanced Requirements" type="inner">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Title level={5}>Enhancement Options</Title>
                  <List
                    dataSource={enhancementResults}
                    renderItem={(enhancement, index) => (
                      <List.Item key={index}>
                        <Card 
                          size="small" 
                          style={{ 
                            width: '100%',
                            cursor: 'pointer',
                            border: selectedEnhancement === enhancement ? '2px solid #1890ff' : '1px solid #d9d9d9'
                          }}
                          onClick={() => setSelectedEnhancement(enhancement)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text strong>Version {index + 1}</Text>
                              <div>
                                <Progress
                                  percent={enhancement.qualityScore}
                                  size="small"
                                  strokeColor={getScoreColor(enhancement.qualityScore)}
                                  format={() => `${enhancement.qualityScore}/100`}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Col>
                
                <Col xs={24} lg={16}>
                  {selectedEnhancement && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={5}>Selected Enhancement</Title>
                        <Button 
                          icon={<CopyOutlined />} 
                          onClick={() => handleCopyText(selectedEnhancement.text)}
                        >
                          Copy Text
                        </Button>
                      </div>
                      
                      <Card size="small" style={{ marginBottom: '16px' }}>
                        <Paragraph 
                          style={{ 
                            fontSize: '16px', 
                            lineHeight: '1.6',
                            margin: 0,
                            padding: '12px',
                            backgroundColor: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '6px'
                          }}
                        >
                          {selectedEnhancement.text}
                        </Paragraph>
                      </Card>

                      <Collapse style={{ marginTop: '16px' }}>
                        <Panel header="What Changed?" key="changes">
                          <List
                            dataSource={selectedEnhancement.changes}
                            renderItem={(change) => (
                              <List.Item>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                                {change}
                              </List.Item>
                            )}
                          />
                        </Panel>
                        
                        <Panel header="Quality Improvements" key="improvements">
                          <List
                            dataSource={selectedEnhancement.improvements}
                            renderItem={(improvement) => (
                              <List.Item>
                                <BulbOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                                {improvement}
                              </List.Item>
                            )}
                          />
                        </Panel>
                      </Collapse>
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Analysis timestamp */}
          {analysisResult && (
            <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
              Analysis completed at: {new Date(analysisResult.analyzedAt).toLocaleString()}
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default RequirementAnalyzer;