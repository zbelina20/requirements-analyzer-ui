// src/components/BatchAnalyzer.tsx
import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  Progress,
  Tag,
  Space,
  Typography,
  Alert,
  Divider,
  Input,
  List,
  Spin,
  Modal,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExperimentOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { requirementsApi } from '../services/api';
import type { BatchRequirement, RequirementAnalysis } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BatchAnalyzer: React.FC = () => {
  const [requirements, setRequirements] = useState<BatchRequirement[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Batch analysis mutation
  const batchAnalysisMutation = useMutation({
    mutationFn: requirementsApi.batchAnalyze,
    onSuccess: (results) => {
      const updatedRequirements = requirements.map((req, index) => ({
        ...req,
        analysis: results[index],
        status: 'completed' as const
      }));
      setRequirements(updatedRequirements);
      setIsAnalyzing(false);
      message.success(`Successfully analyzed ${results.length} requirements!`);
    },
    onError: (error) => {
      console.error('Batch analysis failed:', error);
      // Update all requirements to error status
      setRequirements(prev => prev.map(req => ({ ...req, status: 'error' as const })));
      setIsAnalyzing(false);
      message.error('Batch analysis failed. Please try again.');
    }
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let newReqs: BatchRequirement[] = [];

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = content.split('\n').filter(line => line.trim());
        newReqs = lines.map((line, index) => ({
          key: `req-${Date.now()}-${index}`,
          id: requirements.length + index + 1,
          text: line.replace(/^"(.*)"$/, '$1').trim(), // Remove quotes if present
          status: 'pending' as const
        }));
      } else if (file.name.endsWith('.txt')) {
        // Parse text file (one requirement per line)
        const lines = content.split('\n').filter(line => line.trim());
        newReqs = lines.map((line, index) => ({
          key: `req-${Date.now()}-${index}`,
          id: requirements.length + index + 1,
          text: line.trim(),
          status: 'pending' as const
        }));
      }

      setRequirements(prev => [...prev, ...newReqs]);
      message.success(`Added ${newReqs.length} requirements from ${file.name}`);
    };

    reader.readAsText(file);
    return false; // Prevent default upload
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) {
      message.warning('Please enter a requirement');
      return;
    }

    const newReq: BatchRequirement = {
      key: `req-${Date.now()}`,
      id: requirements.length + 1,
      text: newRequirement.trim(),
      status: 'pending'
    };

    setRequirements(prev => [...prev, newReq]);
    setNewRequirement('');
    setShowAddModal(false);
    message.success('Requirement added successfully!');
  };

  const handleBatchAnalyze = async () => {
    if (requirements.length === 0) {
      message.warning('Please add some requirements first');
      return;
    }

    setIsAnalyzing(true);
    setRequirements(prev => prev.map(req => ({ ...req, status: 'analyzing' as const })));
    
    const requirementTexts = requirements.map(req => req.text);
    batchAnalysisMutation.mutate(requirementTexts);
  };

  const handleDeleteRequirement = (key: string) => {
    setRequirements(prev => prev.filter(req => req.key !== key));
    message.success('Requirement removed');
  };

  const handleExportResults = () => {
    const exportData = {
      requirements: requirements.map(req => ({
        id: req.id,
        text: req.text,
        analysis: req.analysis
      })),
      summary: calculateSummaryStats(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-analysis-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Results exported successfully!');
  };

  const calculateSummaryStats = () => {
    const analyzed = requirements.filter(req => req.analysis);
    if (analyzed.length === 0) return null;

    const totalScore = analyzed.reduce((sum, req) => sum + (req.analysis?.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / analyzed.length);
    
    const issueTypes = analyzed.flatMap(req => req.analysis?.issues.map(issue => issue.type) || []);
    const issueTypeCount = issueTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCount = analyzed.flatMap(req => req.analysis?.issues.map(issue => issue.severity) || [])
      .reduce((acc, severity) => {
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalRequirements: analyzed.length,
      averageScore,
      totalIssues: analyzed.reduce((sum, req) => sum + (req.analysis?.issues.length || 0), 0),
      issueTypeBreakdown: issueTypeCount,
      severityBreakdown: severityCount
    };
  };

  const getScoreColor = (score: number): 'success' | 'normal' | 'exception' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const columns: ColumnsType<BatchRequirement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Requirement',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: '14px' }}>{text}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: 'pending' | 'analyzing' | 'completed' | 'error') => {
        const statusConfig: Record<typeof status, { color: string; text: string }> = {
          pending: { color: 'default', text: 'Pending' },
          analyzing: { color: 'processing', text: 'Analyzing' },
          completed: { color: 'success', text: 'Completed' },
          error: { color: 'error', text: 'Error' }
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Quality Score',
      key: 'score',
      width: 150,
      render: (_: any, record: BatchRequirement) => {
        if (record.status === 'analyzing') {
          return <Spin size="small" />;
        }
        if (record.analysis) {
          return (
            <Progress
              percent={record.analysis.overallScore}
              size="small"
              status={getScoreColor(record.analysis.overallScore)}
              format={(percent) => `${percent}/100`}
            />
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: 'Issues',
      key: 'issues',
      width: 100,
      render: (_: any, record: BatchRequirement) => {
        if (record.analysis) {
          const issueCount = record.analysis.issues.length;
          return (
            <Tag color={issueCount === 0 ? 'success' : issueCount <= 2 ? 'warning' : 'error'}>
              {issueCount} issues
            </Tag>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: BatchRequirement) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRequirement(record.key)}
          disabled={isAnalyzing}
        />
      )
    }
  ];

  const summaryStats = calculateSummaryStats();

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartOutlined />
            <span>Batch Requirements Analysis</span>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Upload and Add Section */}
          <Card size="small" title="Add Requirements" type="inner">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Upload
                  accept=".csv,.txt"
                  showUploadList={false}
                  beforeUpload={handleFileUpload}
                  disabled={isAnalyzing}
                >
                  <Button icon={<UploadOutlined />} block>
                    Upload CSV/TXT File
                  </Button>
                </Upload>
              </Col>
              <Col xs={24} md={8}>
                <Button 
                  icon={<PlusOutlined />} 
                  onClick={() => setShowAddModal(true)}
                  disabled={isAnalyzing}
                  block
                >
                  Add Single Requirement
                </Button>
              </Col>
              <Col xs={24} md={8}>
                <Button 
                  type="primary"
                  icon={<ExperimentOutlined />}
                  onClick={handleBatchAnalyze}
                  loading={isAnalyzing}
                  disabled={requirements.length === 0}
                  block
                  size="large"
                >
                  Analyze All ({requirements.length})
                </Button>
              </Col>
            </Row>
            
            {requirements.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Space>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={handleExportResults}
                    disabled={!summaryStats}
                  >
                    Export Results
                  </Button>
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setRequirements([]);
                      message.success('All requirements cleared');
                    }}
                    disabled={isAnalyzing}
                  >
                    Clear All
                  </Button>
                </Space>
              </div>
            )}
          </Card>

          {/* Summary Statistics */}
          {summaryStats && (
            <Card size="small" title="Analysis Summary" type="inner">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="Total Requirements" 
                    value={summaryStats.totalRequirements}
                    prefix={<FileTextOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="Average Score" 
                    value={summaryStats.averageScore}
                    suffix="/100"
                    valueStyle={{ color: summaryStats.averageScore >= 70 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="Total Issues" 
                    value={summaryStats.totalIssues}
                    valueStyle={{ color: summaryStats.totalIssues === 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="Completion Rate" 
                    value={Math.round((summaryStats.totalRequirements / requirements.length) * 100)}
                    suffix="%"
                  />
                </Col>
              </Row>

              {/* Issue Breakdown */}
              <Divider />
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Title level={5}>Issue Types</Title>
                  <List
                    size="small"
                    dataSource={Object.entries(summaryStats.issueTypeBreakdown)}
                    renderItem={([type, count]) => (
                      <List.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Tag color="blue">{type.toUpperCase()}</Tag>
                          <Text strong>{count}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Title level={5}>Severity Levels</Title>
                  <List
                    size="small"
                    dataSource={Object.entries(summaryStats.severityBreakdown)}
                    renderItem={([severity, count]) => (
                      <List.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Tag color={severity === 'critical' ? 'red' : severity === 'major' ? 'orange' : 'blue'}>
                            {severity.toUpperCase()}
                          </Tag>
                          <Text strong>{count}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Requirements Table */}
          <Card size="small" title={`Requirements (${requirements.length})`} type="inner">
            {requirements.length > 0 ? (
              <Table
                columns={columns}
                dataSource={requirements}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: true }}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} type="secondary">No Requirements Added</Title>
                <Text type="secondary">Upload a CSV/TXT file or add requirements manually to get started</Text>
              </div>
            )}
          </Card>

          {/* Progress Indicator */}
          {isAnalyzing && (
            <Alert
              message="Analyzing Requirements"
              description="Please wait while we analyze all requirements. This may take a few moments..."
              type="info"
              icon={<Spin />}
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* Add Requirement Modal */}
      <Modal
        title="Add New Requirement"
        open={showAddModal}
        onOk={handleAddRequirement}
        onCancel={() => {
          setShowAddModal(false);
          setNewRequirement('');
        }}
        okText="Add Requirement"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: '16px' }}>
          <Text>Enter your software requirement:</Text>
        </div>
        <TextArea
          rows={4}
          value={newRequirement}
          onChange={(e) => setNewRequirement(e.target.value)}
          placeholder="Example: The system shall respond to user requests within 2 seconds..."
          showCount
          maxLength={1000}
        />
      </Modal>
    </div>
  );
};

export default BatchAnalyzer;