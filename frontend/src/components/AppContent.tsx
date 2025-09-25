import React, { useEffect, useMemo, useState } from 'react';
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
  Modal,
  Popconfirm,
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
  signOut?: ReturnType<typeof useAuthenticator>['signOut'];
  user: any;
}) => {
  const {
    endpoints,
    isLoading,
    isCreating,
    loadEndpoints,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    deleteTenant,
  } = useEndpoints();
  const [form] = Form.useForm<EndpointPayload & { timeoutMs?: number }>();
  const [editForm] = Form.useForm<{ name: string; url: string }>();
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isUpdatingEndpoint, setIsUpdatingEndpoint] = useState(false);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);
  const [deletingEndpointId, setDeletingEndpointId] = useState<string | null>(null);

  useEffect(() => {
    void loadEndpoints(false);

    const intervalId = window.setInterval(() => {
      void loadEndpoints(false);
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadEndpoints]);

  const groupedEndpoints = useMemo(() => groupByTenantAndCategory(endpoints), [endpoints]);

  const startEditingEndpoint = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setIsEditModalVisible(true);
    editForm.setFieldsValue({
      name: endpoint.name,
      url: endpoint.url,
    });
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingEndpoint(null);
    editForm.resetFields();
  };

  const handleUpdateEndpoint = async () => {
    if (!editingEndpoint) {
      return;
    }

    try {
      const values = await editForm.validateFields();
      setIsUpdatingEndpoint(true);

      await updateEndpoint(editingEndpoint.endpointId, {
        name: values.name.trim(),
        url: values.url.trim(),
      });

      message.success('Endpoint updated');
      handleEditModalClose();
    } catch (error: any) {
      if (!error?.errorFields) {
        message.error('Failed to update endpoint');
      }
    } finally {
      setIsUpdatingEndpoint(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    setDeletingTenantId(tenantId);
    try {
      const deletedCount = await deleteTenant(tenantId);

      if (deletedCount === 0) {
        message.info('No endpoints found for this tenant');
      } else {
        const suffix = deletedCount === 1 ? '' : 's';
        message.success(`Deleted ${deletedCount} endpoint${suffix} for tenant ${tenantId}`);
      }
    } catch (error) {
      message.error('Failed to delete tenant');
    } finally {
      setDeletingTenantId(null);
    }
  };

  const handleDeleteEndpoint = async (endpoint: Endpoint) => {
    setDeletingEndpointId(endpoint.endpointId);
    try {
      await deleteEndpoint(endpoint.endpointId);
      message.success(`Deleted endpoint ${endpoint.name}`);

      if (editingEndpoint?.endpointId === endpoint.endpointId) {
        handleEditModalClose();
      }
    } catch (error) {
      message.error('Failed to delete endpoint');
    } finally {
      setDeletingEndpointId(null);
    }
  };

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
    <List.Item
      key={endpoint.endpointId}
      actions={[
        <Button
          key={`edit-${endpoint.endpointId}`}
          type="link"
          size="small"
          onClick={() => startEditingEndpoint(endpoint)}
        >
          Edit
        </Button>,
        <Popconfirm
          key={`delete-${endpoint.endpointId}`}
          title="Delete endpoint"
          description={`This will remove ${endpoint.name}.`}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{
            danger: true,
            loading: deletingEndpointId === endpoint.endpointId,
          }}
          onConfirm={() => handleDeleteEndpoint(endpoint)}
        >
          <Button
            type="link"
            danger
            size="small"
            loading={deletingEndpointId === endpoint.endpointId}
          >
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
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
            <Button onClick={signOut || undefined}>Sign Out</Button>
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
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: 'Name is required' }]}
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
                    <Card
                      key={tenantId}
                      title={`Tenant: ${tenantId}`}
                      extra={
                        <Popconfirm
                          title="Delete tenant"
                          description="This will remove all endpoints for this tenant."
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{
                            danger: true,
                            loading: deletingTenantId === tenantId,
                          }}
                          onConfirm={() => handleDeleteTenant(tenantId)}
                        >
                          <Button
                            danger
                            size="small"
                            loading={deletingTenantId === tenantId}
                          >
                            Delete tenant
                          </Button>
                        </Popconfirm>
                      }
                    >
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
      <Modal
        title={
          editingEndpoint ? `Edit endpoint: ${editingEndpoint.name}` : 'Edit endpoint'
        }
        open={isEditModalVisible}
        onCancel={handleEditModalClose}
        onOk={handleUpdateEndpoint}
        okText="Save"
        confirmLoading={isUpdatingEndpoint}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required', whitespace: true }]}
          >
            <Input placeholder="Friendly identifier" />
          </Form.Item>
          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: 'URL is required', whitespace: true },
              {
                type: 'url',
                message: 'Enter a valid URL',
                transform: (value) => (typeof value === 'string' ? value.trim() : value),
              },
            ]}
          >
            <Input placeholder="https://service.domain.com/health" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default React.memo(AppContent);
