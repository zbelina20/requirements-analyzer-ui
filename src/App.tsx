import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Layout, Menu, Button, Typography, Space, Drawer, message } from 'antd';
import {
  DashboardOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  GithubOutlined,
  BookOutlined
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import RequirementAnalyzer from './components/RequirementAnalyzer';
import BatchAnalyzer from './components/BatchAnalyzer';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
};

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    description: 'Overview and analytics'
  },
  {
    key: 'analyze',
    icon: <ExperimentOutlined />,
    label: 'Single Analysis',
    description: 'Analyze individual requirements'
  },
  {
    key: 'batch',
    icon: <BarChartOutlined />,
    label: 'Batch Analysis',
    description: 'Analyze multiple requirements'
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'analyze':
        return <RequirementAnalyzer />;
      case 'batch':
        return <BatchAnalyzer />;
      default:
        return <Dashboard />;
    }
  };

  const handleMenuClick = (key: string) => {
    setCurrentView(key);
    setMobileMenuOpen(false);
    
    // Show navigation feedback
    const selectedItem = menuItems.find(item => item.key === key);
    if (selectedItem) {
      message.success(`Switched to ${selectedItem.label}`);
    }
  };

  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Title */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        textAlign: collapsed ? 'center' : 'left'
      }}>
        {!collapsed ? (
          <div>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              <ExperimentOutlined /> ReqAnalyzer
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              AI-Powered Requirements Engineering
            </Text>
          </div>
        ) : (
          <ExperimentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        )}
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[currentView]}
        style={{ flex: 1, borderRight: 0 }}
        items={menuItems.map(item => ({
          key: item.key,
          icon: item.icon,
          label: (
            <div onClick={() => handleMenuClick(item.key)}>
              <div>{item.label}</div>
              {!collapsed && item.description && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {item.description}
                </Text>
              )}
            </div>
          )
        }))}
      />

      {/* Footer Links */}
      {!collapsed && (
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button 
              type="text" 
              icon={<BookOutlined />} 
              size="small"
              style={{ textAlign: 'left', padding: '4px 0' }}
            >
              Documentation
            </Button>
            <Button 
              type="text" 
              icon={<GithubOutlined />} 
              size="small"
              style={{ textAlign: 'left', padding: '4px 0' }}
              onClick={() => window.open('https://github.com', '_blank')}
            >
              Source Code
            </Button>
            <Button 
              type="text" 
              icon={<InfoCircleOutlined />} 
              size="small"
              style={{ textAlign: 'left', padding: '4px 0' }}
            >
              About
            </Button>
          </Space>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Master's Thesis Project<br />
              Requirements Engineering with GenAI
            </Text>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Layout style={{ minHeight: '100vh' }}>
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              width={250}
              style={{
                background: '#fff',
                borderRight: '1px solid #f0f0f0'
              }}
            >
              {sidebarContent}
            </Sider>
          )}

                      <Layout>
            {/* Header */}
            <Header style={{ 
              background: '#fff', 
              padding: '0 16px', 
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Mobile menu button */}
                {isMobile && (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileMenuOpen(true)}
                    style={{ fontSize: '18px' }}
                  />
                )}
                
                {/* Page title */}
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {menuItems.find(item => item.key === currentView)?.label || 'Dashboard'}
                  </Title>
                  {!isMobile && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {menuItems.find(item => item.key === currentView)?.description}
                    </Text>
                  )}
                </div>
              </div>

              {/* Header actions */}
              <Space>
                <Button 
                  type="text" 
                  icon={<SettingOutlined />}
                  style={{ display: isMobile ? 'none' : 'inline-flex' }}
                >
                  Settings
                </Button>
                <Button 
                  type="text" 
                  icon={<InfoCircleOutlined />}
                  onClick={() => {
                    message.info('Requirements Quality Analyzer - Master\'s Thesis Project');
                  }}
                >
                  {!isMobile && 'About'}
                </Button>
              </Space>
            </Header>

            {/* Main Content */}
            <Content style={{ 
              background: '#f5f5f5',
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto'
            }}>
              {renderContent()}
            </Content>
          </Layout>

          {/* Mobile Drawer */}
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExperimentOutlined style={{ color: '#1890ff' }} />
                <span>ReqAnalyzer</span>
              </div>
            }
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            width={280}
            styles={{ body: { padding: 0 } }}
          >
            {sidebarContent}
          </Drawer>
        </Layout>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;