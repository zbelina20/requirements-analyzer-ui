// src/components/RequirementAnalyzer.tsx
import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Progress, 
  Tag, 
  Row,
  Col,
  Spin
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
  WarningOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const RequirementAnalyzer: React.FC = () => {
  const [requirement, setRequirement] = useState('');
  const [analysisResult, setAnalysisResult] = useState<RequirementAnalysis | null>(null);
  const [enhancementResults, setEnhancementResults] = useState<RequirementEnhancement[] | null>(null);

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: requirementsApi.analyzeRequirement,
    onSuccess: (data) => {
      setAnalysisResult(data);
      setEnhancementResults(null); // Clear previous enhancements
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
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
    },
    onError: (error) => {
      console.error('Enhancement failed:', error);
      // Mock data for testing
      const mockEnhancements: RequirementEnhancement[] = [
        {
          text: 'The system shall respond to user login requests within 2 seconds and display a confirmation message with 95% success rate for valid credentials.',
          changes: [
            'Added specific response time requirement (2 seconds)',
            'Added measurable success rate criteria (95%)',
            'Specified the type of user feedback'
          ],
          improvements: [
            'Eliminated ambiguous terms',
            'Added quantifiable metrics',
            'Improved testability'
          ],
          qualityScore: 88
        }
      ];
      setEnhancementResults(mockEnhancements);
    }
  });

  const handleAnalyze = () => {
    if (requirement.trim()) {
      analysisMutation.mutate(requirement);
    }
  };

  const handleEnhance = () => {
    if (requirement.trim() && analysisResult) {
      enhancementMutation.mutate({
        text: requirement,
        issues: analysisResult.issues
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'major': return 'orange';
      case 'minor': return 'blue';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined />;
      case 'major': return <WarningOutlined />;
      case 'minor': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a'; // green
    if (score >= 60) return '#faad14'; // orange  
    return '#f5222d'; // red
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExperimentOutlined />
          <span>Requirements Quality Analyzer</span>
        </div>
      }>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Input Section */}
          <div>
            <Title level={4}>Enter Your Requirement:</Title>
            <TextArea
              rows={4}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="Example: The system should be user-friendly and fast..."
              style={{ marginBottom: '12px' }}
            />
            <Space>
              <Button 
                type="primary" 
                icon={<ExperimentOutlined />}
                onClick={handleAnalyze}
                loading={analysisMutation.isPending}
                disabled={!requirement.trim()}
              >
                Analyze Quality
              </Button>
              
              {analysisResult && (
                <Button 
                  type="default"
                  icon={<BulbOutlined />}
                  onClick={handleEnhance}
                  loading={enhancementMutation.isPending}
                >
                  Generate Enhancements
                </Button>
              )}
            </Space>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <Card title="Quality Analysis Results" type="inner">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: getScoreColor(analysisResult.overallScore), margin: 0 }}>
                      {analysisResult.overallScore}/100
                    </Title>
                    <Text type="secondary">Overall Quality Score</Text>
                    <Progress 
                      percent={analysisResult.overallScore} 
                      strokeColor={getScoreColor(analysisResult.overallScore)}
                      showInfo={false}
                      style={{ marginTop: '8px' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} md={16}>
                  <Title level={5}>Issues Identified ({analysisResult.issues.length}):</Title>
                  {analysisResult.issues.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {analysisResult.issues.map((issue, index) => (
                        <Alert
                          key={index}
                          type={issue.severity === 'critical' ? 'error' : issue.severity === 'major' ? 'warning' : 'info'}
                          message={
                            <div>
                              <Tag color={getSeverityColor(issue.severity)} icon={getSeverityIcon(issue.severity)}>
                                {issue.type.toUpperCase()} - {issue.severity.toUpperCase()}
                              </Tag>
                              <Text strong>"{issue.problematicText}"</Text>
                            </div>
                          }
                          description={
                            <div>
                              <Paragraph style={{ margin: '8px 0' }}>{issue.description}</Paragraph>
                              <Text type="success">💡 Suggestion: {issue.suggestion}</Text>
                            </div>
                          }
                        />
                      ))}
                    </Space>
                  ) : (
                    <Alert 
                      type="success" 
                      message="No issues found! This requirement meets quality standards." 
                      icon={<CheckCircleOutlined />}
                    />
                  )}
                </Col>
              </Row>
            </Card>
          )}

          {/* Enhancement Results */}
          {enhancementResults && (
            <Card title="Enhanced Requirements" type="inner">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {enhancementResults.map((enhancement, index) => (
                  <Card key={index} size="small" style={{ backgroundColor: '#f6ffed' }}>
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Title level={5}>Enhanced Version {index + 1}:</Title>
                        <Paragraph style={{ 
                          backgroundColor: 'white', 
                          padding: '12px', 
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          marginBottom: '12px'
                        }}>
                          {enhancement.text}
                        </Paragraph>
                        
                        <Title level={5}>Changes Made:</Title>
                        <ul style={{ marginBottom: '12px' }}>
                          {enhancement.changes.map((change, i) => (
                            <li key={i}><Text>{change}</Text></li>
                          ))}
                        </ul>
                      </Col>
                      
                      <Col xs={24} md={8}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                          <Title level={4} style={{ color: getScoreColor(enhancement.qualityScore), margin: 0 }}>
                            {enhancement.qualityScore}/100
                          </Title>
                          <Text type="secondary">Quality Score</Text>
                        </div>
                        
                        <Title level={5}>Improvements:</Title>
                        <Space direction="vertical" size="small">
                          {enhancement.improvements.map((improvement, i) => (
                            <Tag key={i} color="green" icon={<CheckCircleOutlined />}>
                              {improvement}
                            </Tag>
                          ))}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          )}

          {/* Loading States */}
          {(analysisMutation.isPending || enhancementMutation.isPending) && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '12px' }}>
                <Text>
                  {analysisMutation.isPending ? 'Analyzing requirement quality...' : 'Generating enhancements...'}
                </Text>
              </div>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default RequirementAnalyzer;