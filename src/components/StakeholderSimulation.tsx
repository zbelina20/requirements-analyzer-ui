import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  List,
  Tag,
  Typography,
  Modal,
  Alert,
  Tabs,
  Badge,
  Tooltip,
  Collapse,
  Empty
} from 'antd';
import {
  UserOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  HistoryOutlined,
  DeleteOutlined,
  EyeOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Types
interface GeneratedQuestion {
  text: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  isAddressed: boolean;
}

interface StakeholderSimulationResponse {
  questions: GeneratedQuestion[];
  stakeholderRole: string;
  requirementText: string;
  generatedAt: string;
  categorySummary: { [key: string]: number };
}

interface SimulationHistoryItem {
  id: number;
  projectId: number;
  requirementSummary: string;
  stakeholderRole: string;
  questionCount: number;
  createdAt: string;
}

interface StakeholderRole {
  value: string;
  label: string;
  description: string;
}

interface StakeholderSimulationProps {
  projectId: number;
}

const StakeholderSimulation: React.FC<StakeholderSimulationProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [requirementText, setRequirementText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [currentSimulation, setCurrentSimulation] = useState<StakeholderSimulationResponse | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>([]);
  const [stakeholderRoles, setStakeholderRoles] = useState<StakeholderRole[]>([]);
  const [activeTab, setActiveTab] = useState('simulate');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<StakeholderSimulationResponse | null>(null);

  useEffect(() => {
    fetchStakeholderRoles();
    fetchSimulationHistory();
  }, [projectId]); // projectId is sufficient as a dependency

  const fetchStakeholderRoles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stakeholder-simulation/roles`);
      if (response.ok) {
        const roles = await response.json();
        setStakeholderRoles(roles);
      }
    } catch (error) {
      console.error('Error fetching stakeholder roles:', error);
    }
  };

  const fetchSimulationHistory = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stakeholder-simulation/history`);
      if (response.ok) {
        const history = await response.json();
        setSimulationHistory(history);
      }
    } catch (error) {
      console.error('Error fetching simulation history:', error);
    }
  };

  const handleSimulateQuestions = async () => {
    if (!requirementText.trim() || !selectedRole) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stakeholder-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirementText,
          stakeholderRole: selectedRole,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentSimulation(result);
        setActiveTab('results');
        await fetchSimulationHistory(); // Refresh history
      } else {
        console.error('Error simulating questions:', await response.text());
      }
    } catch (error) {
      console.error('Error simulating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSimulation = async (simulationId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stakeholder-simulation/${simulationId}`);
      if (response.ok) {
        const simulation = await response.json();
        setSelectedSimulation(simulation);
        setViewModalVisible(true);
      }
    } catch (error) {
      console.error('Error viewing simulation:', error);
    }
  };

  const handleDeleteSimulation = async (simulationId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/stakeholder-simulation/${simulationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchSimulationHistory();
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      workflow: <TeamOutlined />,
      'edge-case': <ExclamationCircleOutlined />,
      implementation: <BulbOutlined />,
      measurement: <ClockCircleOutlined />,
      performance: <ClockCircleOutlined />,
      integration: <TeamOutlined />,
      security: <ExclamationCircleOutlined />,
      'error-handling': <ExclamationCircleOutlined />,
      dependencies: <TeamOutlined />,
      strategy: <BulbOutlined />,
      adoption: <UserOutlined />,
      'competitive-advantage': <BulbOutlined />,
      scope: <BulbOutlined />,
      compliance: <CheckCircleOutlined />,
      audit: <CheckCircleOutlined />,
      privacy: <ExclamationCircleOutlined />,
      'data-retention': <ClockCircleOutlined />,
      usability: <UserOutlined />,
      'error-recovery': <ExclamationCircleOutlined />,
      accessibility: <UserOutlined />,
      customization: <UserOutlined />,
      assumptions: <QuestionCircleOutlined />,
      'acceptance-criteria': <CheckCircleOutlined />
    };
    return iconMap[category] || <QuestionCircleOutlined />;
  };

  const renderQuestionsList = (questions: GeneratedQuestion[], showCategories = false) => (
    <List
      dataSource={questions}
      renderItem={(question, index) => (
        <List.Item key={index}>
          <Card size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {getCategoryIcon(question.category)}
                <Tag color={getPriorityColor(question.priority)}>
                  {question.priority.toUpperCase()}
                </Tag>
                {showCategories && (
                  <Tag color="blue">{question.category.replace('-', ' ').toUpperCase()}</Tag>
                )}
              </div>
            </div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {question.text}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {question.rationale}
            </Text>
          </Card>
        </List.Item>
      )}
    />
  );

  const renderSimulationResults = () => {
    if (!currentSimulation) return null;

    const questionsByCategory = currentSimulation.questions.reduce((acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = [];
      }
      acc[question.category].push(question);
      return acc;
    }, {} as { [key: string]: GeneratedQuestion[] });

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message={`Generated ${currentSimulation.questions.length} questions for ${currentSimulation.stakeholderRole}`}
          description={`Based on your requirement: "${currentSimulation.requirementText.substring(0, 100)}${currentSimulation.requirementText.length > 100 ? '...' : ''}"`}
          type="success"
          showIcon
        />
        
        <Card title="Question Categories Summary" size="small">
          <Space wrap>
            {Object.entries(currentSimulation.categorySummary).map(([category, count]) => (
              <Badge key={category} count={count} color="blue">
                <Tag style={{ margin: 0 }}>
                  {getCategoryIcon(category)}
                  <span style={{ marginLeft: 4 }}>
                    {category.replace('-', ' ').toUpperCase()}
                  </span>
                </Tag>
              </Badge>
            ))}
          </Space>
        </Card>

        <Collapse defaultActiveKey={Object.keys(questionsByCategory)}>
          {Object.entries(questionsByCategory).map(([category, questions]) => (
            <Panel
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getCategoryIcon(category)}
                  <span>{category.replace('-', ' ').toUpperCase()}</span>
                  <Badge count={questions.length} color="blue" />
                </div>
              }
              key={category}
            >
              {renderQuestionsList(questions)}
            </Panel>
          ))}
        </Collapse>
      </Space>
    );
  };

  const renderHistory = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {simulationHistory.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No simulation history yet"
        />
      ) : (
        <List
          dataSource={simulationHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tooltip title="View Details">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewSimulation(item.id)}
                  />
                </Tooltip>,
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSimulation(item.id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={<UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{item.stakeholderRole.toUpperCase()}</Text>
                    <Badge count={item.questionCount} color="blue" />
                  </div>
                }
                description={
                  <div>
                    <Text>{item.requirementSummary}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Space>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TeamOutlined />
            <span>AI Stakeholder Interview Simulator</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QuestionCircleOutlined style={{ fontSize: '14px' }} />
                Simulate Questions
              </span>
            }
            key="simulate"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="Simulate Stakeholder Questions"
                description="Enter a requirement and select a stakeholder role to generate potential questions they might ask. This helps identify communication gaps and ensures comprehensive requirement coverage."
                type="info"
                showIcon
              />

              <Card size="small" title="Requirement Input">
                <TextArea
                  rows={6}
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  placeholder="Enter your software requirement here...

Example: The system shall provide a shopping cart where users can add, remove, and modify items before checkout."
                />
              </Card>

              <Card size="small" title="Stakeholder Role">
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select a stakeholder role to simulate"
                  value={selectedRole}
                  onChange={setSelectedRole}
                  dropdownStyle={{ zIndex: 1050 }}
                  optionLabelProp="label"
                >
                  {stakeholderRoles.map((role) => (
                    <Option key={role.value} value={role.value} label={role.label}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#262626' }}>{role.label}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {role.description}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Card>

              <Button
                type="primary"
                size="large"
                loading={loading}
                disabled={!requirementText.trim() || !selectedRole}
                onClick={handleSimulateQuestions}
                style={{ width: '100%' }}
              >
                <QuestionCircleOutlined />
                Generate Stakeholder Questions
              </Button>
            </Space>
          </TabPane>

          <TabPane 
            tab={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BulbOutlined style={{ fontSize: '14px' }} />
                Results
                {currentSimulation && (
                  <Badge count={currentSimulation.questions.length} color="blue" style={{ marginLeft: 4 }} />
                )}
              </span>
            }
            key="results"
          >
            {currentSimulation ? renderSimulationResults() : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No simulation results yet. Generate questions in the Simulate tab."
              />
            )}
          </TabPane>

          <TabPane
            tab={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HistoryOutlined style={{ fontSize: '14px' }} />
                History
                {simulationHistory.length > 0 && (
                  <Badge count={simulationHistory.length} color="blue" style={{ marginLeft: 4 }} />
                )}
              </span>
            }
            key="history"
          >
            {renderHistory()}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          selectedSimulation && (
            <div>
              <UserOutlined style={{ marginRight: 8 }} />
              {selectedSimulation.stakeholderRole.toUpperCase()} Questions
            </div>
          )
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedSimulation && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Text strong>Original Requirement:</Text>
              <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                {selectedSimulation.requirementText}
              </div>
            </Card>
            {renderQuestionsList(selectedSimulation.questions, true)}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default StakeholderSimulation;