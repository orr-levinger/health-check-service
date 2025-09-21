import React, { useEffect, useMemo } from 'react';
import {
  Layout,
  Row,
  Col,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { useAuthenticator } from '@aws-amplify/ui-react';
import useEndpoints from '../hooks/useEndpoints';
import { Endpoint, EndpointPayload, EndpointStatus } from '../types/Endpoint';

const { Header, Footer, Content } = Layout;
const { Title, Text } = Typography;

const headerStyle: React.CSSProperties = {
  paddingInline: 32,
};

const contentStyle: React.CSSProperties = {
  padding: '24px 32px',
  flexGrow: 1,
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
};

const STATUS_COLORS: Record<EndpointStatus, string> = {
  healthy: 'green',
  unhealthy: 'red',
  unknown: 'default',
};

const statusLabel = (status: EndpointStatus) => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'unhealthy':
      return 'Unhealthy';
    default:
      return 'Unknown';
  }
};

const formatDuration = (isoString?: string) => {
  if (!isoString) {
    return 'unknown duration';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'unknown duration';
  }

  let diff = Date.now() - date.getTime();
  if (diff < 0) {
    diff = 0;
  }

  const units = [
    { label: 'd', value: 1000 * 60 * 60 * 24 },
    { label: 'h', value: 1000 * 60 * 60 },
    { label: 'm', value: 1000 * 60 },
    { label: 's', value: 1000 },
  ];

  const parts: string[] = [];

  for (const unit of units) {
    const amount = Math.floor(diff / unit.value);
    if (amount > 0 || (parts.length === 0 && unit.label === 's')) {
      parts.push(`${amount}${unit.label}`);
    }
    diff -= amount * unit.value;
    if (parts.length === 2) {
      break;
    }
  }

  return parts.join(' ');
};

const formatRelativeTime = (isoString?: string) => {
  if (!isoString) {
    return 'never';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  const diff = Date.now() - date.getTime();

  if (diff < 5_000) {
    return 'just now';
  }

  if (diff < 60_000) {
    return `${Math.floor(diff / 1000)}s ago`;
  }

  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)}m ago`;
  }

  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)}h ago`;
  }

  return `${Math.floor(diff / 86_400_000)}d ago`;
};

const buildStatusDescription = (endpoint: Endpoint) => {
  if (endpoint.status === 'unknown') {
    return endpoint.lastCheckedAt
      ? `Status pending. Last checked ${formatRelativeTime(endpoint.lastCheckedAt)}.`
      : 'Status pending. Waiting for first check.';
  }

  const duration = formatDuration(endpoint.statusSince);
  const responseTime =
    endpoint.responseTimeMs !== undefined ? `${endpoint.responseTimeMs} ms response` : 'No latency data yet';
  const lastCheck = endpoint.lastCheckedAt
    ? `Last checked ${formatRelativeTime(endpoint.lastCheckedAt)}`
    : 'Awaiting first check';
  const statusCode = endpoint.statusCode ? ` (HTTP ${endpoint.statusCode})` : '';

  return `${statusLabel(endpoint.status)}${statusCode} for ${duration}. ${responseTime}. ${lastCheck}.`;
};

const groupByTenantAndCategory = (endpoints: Endpoint[]) => {
  const tenants = new Map<string, Map<string, Endpoint[]>>();

  endpoints.forEach((endpoint) => {
    if (!tenants.has(endpoint.tenantId)) {
      tenants.set(endpoint.tenantId, new Map());
    }
    const categories = tenants.get(endpoint.tenantId)!;
    if (!categories.has(endpoint.category)) {
      categories.set(endpoint.category, []);
    }
    categories.get(endpoint.category)!.push(endpoint);
  });

  return tenants;
};

const AppContent = ({
  signOut,
  user,
}: {
  signOut: ReturnType<typeof useAuthenticator>['signOut'];
  user: any;
}) => {
  const { endpoints, isLoading, isCreating, loadEndpoints, addEndpoint } = useEndpoints();
  const [form] = Form.useForm<EndpointPayload & { timeoutMs?: number }>();

  useEffect(() => {
    loadEndpoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedEndpoints = useMemo(() => groupByTenantAndCategory(endpoints), [endpoints]);

  const onSubmit = async (values: EndpointPayload & { timeoutMs?: number }) => {
    try {
      await addEndpoint({
        tenantId: values.tenantId.trim(),
        category: values.category.trim(),
        name: values.name.trim(),
        url: values.url.trim(),
        timeoutMs: values.timeoutMs,
      });
      form.resetFields();
      message.success('Endpoint added');
    } catch (error) {
      message.error('Failed to add endpoint');
    }
  };

  const renderEndpoint = (endpoint: Endpoint) => (
    <List.Item key={endpoint.endpointId}>
      <List.Item.Meta
        title={
          <Space align="center" size="small">
            <Text strong>{endpoint.name}</Text>
            <Tag color={STATUS_COLORS[endpoint.status]}>{statusLabel(endpoint.status)}</Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{endpoint.url}</Text>
            <Text>{buildStatusDescription(endpoint)}</Text>
            {endpoint.errorMessage && (
              <Text type="danger">{endpoint.errorMessage}</Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Uptime Monitoring Console
            </Title>
          </Col>
          <Col>
            <Button onClick={signOut}>Sign Out</Button>
          </Col>
        </Row>
      </Header>
      <Content style={contentStyle}>
        {user && (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card title="Track a new endpoint">
                <Form form={form} layout="vertical" onFinish={onSubmit}>
                  <Form.Item
                    label="Tenant"
                    name="tenantId"
                    rules={[{ required: true, message: 'Tenant is required' }]}
                  >
                    <Input placeholder="e.g. customer-a" />
                  </Form.Item>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Category is required' }]}
                  >
                    <Input placeholder="e.g. billing" />
                  </Form.Item>
                  <Form.Item
                    label="Key"
                    name="name"
                    rules={[{ required: true, message: 'Key is required' }]}
                  >
                    <Input placeholder="Friendly identifier" />
                  </Form.Item>
                  <Form.Item
                    label="URL"
                    name="url"
                    rules={[{ required: true, type: 'url', message: 'Enter a valid URL' }]}
                  >
                    <Input placeholder="https://service.domain.com/health" />
                  </Form.Item>
                  <Form.Item label="Timeout (ms)" name="timeoutMs">
                    <InputNumber style={{ width: '100%' }} min={100} step={100} placeholder="5000" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isCreating} block>
                      Add endpoint
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row align="middle" justify="space-between">
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>
                      Monitored endpoints
                    </Title>
                  </Col>
                  <Col>
                    <Button onClick={() => loadEndpoints()} loading={isLoading}>
                      Refresh status
                    </Button>
                  </Col>
                </Row>
                {groupedEndpoints.size === 0 ? (
                  <Card>
                    <Text type="secondary">No endpoints yet. Add one to start monitoring availability.</Text>
                  </Card>
                ) : (
                  Array.from(groupedEndpoints.entries()).map(([tenantId, categories]) => (
                    <Card key={tenantId} title={`Tenant: ${tenantId}`}>
                      {Array.from(categories.entries()).map(([category, categoryEndpoints]) => (
                        <Card
                          key={`${tenantId}-${category}`}
                          type="inner"
                          title={`Category: ${category}`}
                          style={{ marginBottom: 16 }}
                        >
                          <List
                            dataSource={categoryEndpoints}
                            renderItem={renderEndpoint}
                            loading={isLoading && categoryEndpoints.length === 0}
                          />
                        </Card>
                      ))}
                    </Card>
                  ))
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Content>
      <Footer style={footerStyle}>
        <Text type="secondary">Uptime monitoring demo console</Text>
      </Footer>
    </Layout>
  );
};

export default React.memo(AppContent);
