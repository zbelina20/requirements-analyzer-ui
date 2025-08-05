// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Progress,
  Alert,
  List,
  Tooltip
} from 'antd';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DashboardOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { requirementsApi } from '../services/api';

const { Text } = Typography;

interface DashboardData {
  recentAnalyses: Array<{
    id: string;
    text: string;
    score: number;
    issues: number;
    analyzedAt: string;
  }>;
  qualityTrends: Array<{
    date: string;
    averageScore: number;
    totalAnalyses: number;
  }>;
  issueDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: Array<{
    severity: string;
    count: number;
    color: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');

  useEffect(() => {
    loadDashboardData();
    checkApiHealth();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Since we don't have historical data endpoints yet, we'll generate mock data
      // In a real implementation, this would fetch from your analytics endpoints
      const mockData: DashboardData = {
        recentAnalyses: [
          {
            id: '1',
            text: 'The system should be user-friendly and fast',
            score: 65,
            issues: 3,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
          },
          {
            id: '2',
            text: 'The application shall authenticate users within 2 seconds',
            score: 88,
            issues: 1,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            id: '3',
            text: 'Users must be able to login efficiently',
            score: 45,
            issues: 4,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
          },
          {
            id: '4',
            text: 'The system shall process payment transactions with 99.9% accuracy',
            score: 92,
            issues: 0,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
          },
          {
            id: '5',
            text: 'The interface should look good and work well',
            score: 35,
            issues: 5,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
          }
        ],
        qualityTrends: [
          { date: '2024-01-01', averageScore: 65, totalAnalyses: 12 },
          { date: '2024-01-02', averageScore: 68, totalAnalyses: 15 },
          { date: '2024-01-03', averageScore: 72, totalAnalyses: 18 },
          { date: '2024-01-04', averageScore: 69, totalAnalyses: 22 },
          { date: '2024-01-05', averageScore: 74, totalAnalyses: 28 },
          { date: '2024-01-06', averageScore: 76, totalAnalyses: 25 },
          { date: '2024-01-07', averageScore: 78, totalAnalyses: 30 }
        ],
        issueDistribution: [
          { type: 'Ambiguity', count: 45, percentage: 35 },
          { type: 'Completeness', count: 32, percentage: 25 },
          { type: 'Verifiability', count: 28, percentage: 22 },
          { type: 'Consistency', count: 15, percentage: 12 },
          { type: 'Traceability', count: 8, percentage: 6 }
        ],
        severityBreakdown: [
          { severity: 'Critical', count: 15, color: '#ff4d4f' },
          { severity: 'Major', count: 45, color: '#faad14' },
          { severity: 'Minor', count: 68, color: '#1890ff' }
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiHealth = async () => {
    try {
      await requirementsApi.testConnection();
      setApiStatus('healthy');
    } catch (error) {
      setApiStatus('degraded');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const recentAnalysesColumns = [
    {
      title: 'Requirement',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text.length > 50 ? `${text.substring(0, 50)}...` : text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Quality Score',
      dataIndex: 'score',
      key: 'score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={getScoreStatus(score)}
          format={(percent) => `${percent}/100`}
        />
      )
    },
    {
      title: 'Issues',
      dataIndex: 'issues',
      key: 'issues',
      width: 80,
      render: (issues: number) => (
        <Tag color={issues === 0 ? 'success' : issues <= 2 ? 'warning' : 'error'}>
          {issues}
        </Tag>
      )
    },
    {
      title: 'Analyzed',
      dataIndex: 'analyzedAt',
      key: 'analyzedAt',
      width: 120,
      render: (date: string) => (
        <Text type="secondary">
          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
        <Card loading={loading} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
        <Alert
          message="Dashboard Unavailable"
          description="Unable to load dashboard data. Please try again later."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const totalAnalyses = dashboardData.recentAnalyses.length;
  const averageScore = Math.round(
    dashboardData.recentAnalyses.reduce((sum, item) => sum + item.score, 0) / totalAnalyses
  );
  const totalIssues = dashboardData.recentAnalyses.reduce((sum, item) => sum + item.issues, 0);
  const highQualityCount = dashboardData.recentAnalyses.filter(item => item.score >= 80).length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DashboardOutlined />
            <span>Requirements Quality Dashboard</span>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* API Status Alert */}
          {apiStatus !== 'healthy' && (
            <Alert
              message={`API Status: ${apiStatus === 'degraded' ? 'Degraded' : 'Unhealthy'}`}
              description={
                apiStatus === 'degraded' 
                  ? 'The analysis service is running on fallback mode. Some features may be limited.'
                  : 'The analysis service is currently unavailable. Please check your configuration.'
              }
              type={apiStatus === 'degraded' ? 'warning' : 'error'}
              showIcon
              closable
            />
          )}

          {/* Key Metrics */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Analyses"
                  value={totalAnalyses}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Average Quality"
                  value={averageScore}
                  suffix="/100"
                  valueStyle={{ color: getScoreColor(averageScore) }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="High Quality"
                  value={highQualityCount}
                  suffix={`/ ${totalAnalyses}`}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Issues"
                  value={totalIssues}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: totalIssues > 10 ? '#ff4d4f' : '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" title="Quality Trends" extra={<LineChartOutlined />}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, _name) => [
                        _name === 'averageScore' ? `${value}/100` : value,
                        _name === 'averageScore' ? 'Average Score' : 'Total Analyses'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="#1890ff" 
                      strokeWidth={3}
                      name="Average Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalAnalyses" 
                      stroke="#52c41a" 
                      strokeWidth={2}
                      name="Total Analyses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title="Issue Distribution" extra={<BarChartOutlined />}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.issueDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData.issueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[
                          '#ff4d4f', '#faad14', '#1890ff', '#52c41a', '#722ed1'
                        ][index % 5]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value, name) => [`${value} issues`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Recent Analyses and Issue Breakdown */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card size="small" title="Recent Analyses" extra={<ClockCircleOutlined />}>
                <Table
                  columns={recentAnalysesColumns}
                  dataSource={dashboardData.recentAnalyses}
                  rowKey="id"
                  pagination={{ pageSize: 5, size: 'small' }}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Card size="small" title="Severity Breakdown">
                  <List
                    dataSource={dashboardData.severityBreakdown}
                    renderItem={(item) => (
                      <List.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: item.color, 
                                borderRadius: '50%' 
                              }} 
                            />
                            <Text>{item.severity}</Text>
                          </div>
                          <Text strong>{item.count}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
                
                <Card size="small" title="Quick Actions">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button type="primary" block onClick={() => window.location.href = '#/analyze'}>
                      Analyze New Requirement
                    </Button>
                    <Button block onClick={() => window.location.href = '#/batch'}>
                      Batch Analysis
                    </Button>
                    <Button block onClick={loadDashboardData}>
                      Refresh Dashboard
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard;