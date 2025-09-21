import React, { useCallback, useEffect, useState } from 'react';
import { Layout, Row, Col, Button, Table } from 'antd';
import { useAuthenticator } from '@aws-amplify/ui-react';
import useRepositories from '../hooks/useRepositories';
import { Repo } from '../types/Repo';
// @ts-ignore
import github from '../github.svg';

const { Header, Footer, Content } = Layout;
const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingInline: 48,
  lineHeight: '64px',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  flexGrow: 1,
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#3b3636',
};

const layoutStyle = {
  minHeight: '100vh',
  overflow: 'hidden',
  borderRadius: 8,
  width: '100%',
  margin: 'auto',
};

const AppContent = ({
  signOut,
  user,
}: {
  signOut: ReturnType<typeof useAuthenticator>['signOut'];
  user: any;
}) => {
  const {
    repos,
    savedRepos,
    isGithubLoading,
    isSavingLoading,
    isDeletingLoading,
    fetchRepos,
    loadSavedRepos,
    saveSelectedRepos,
    deleteSelectedRepos,
  } = useRepositories();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSavedRowKeys, setSelectedSavedRowKeys] = useState<React.Key[]>([]);

  const handleSaveSelectedRows = useCallback(() => {
    saveSelectedRepos(selectedRowKeys);
    setSelectedRowKeys([]);
  }, [saveSelectedRepos, selectedRowKeys]);

  const handleDeleteSelectedRows = useCallback(() => {
    deleteSelectedRepos(selectedSavedRowKeys);
    setSelectedSavedRowKeys([]);
  }, [deleteSelectedRepos, selectedSavedRowKeys]);

  const onLoadMoreClicked = useCallback(() => {
    fetchRepos();
  }, [fetchRepos]);

  useEffect(() => {
    fetchRepos(100);
    loadSavedRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      title: 'Logo',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      render: (text: string, record: Repo) => (
        <img src={record.avatarUrl} alt={record.name} width={32} height={32} />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Repo) => (
        <a href={record.repositoryUrl} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: 'Stars ⭐',
      dataIndex: 'stars',
      key: 'stars',
      sorter: (a: Repo, b: Repo) => a.stars - b.stars,
      render: (text: string, record: Repo) => `${(record.stars / 1000).toFixed(1)}K ⭐`,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const rowSavedSelection = {
    selectedRowKeys: selectedSavedRowKeys,
    onChange: setSelectedSavedRowKeys,
  };

  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}>
        <Row>
          <Col span={4}>
            <Button onClick={signOut}>Sign Out</Button>
          </Col>
          <Col offset={19} span={1}>
            <img src={github} width={60} height={60} alt={'Github'} />
          </Col>
        </Row>
      </Header>
      <Content style={contentStyle}>
        {user && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button
                  loading={isSavingLoading}
                  type="primary"
                  onClick={handleSaveSelectedRows}
                  disabled={selectedRowKeys.length === 0}
                >
                  Save Selected Repos
                </Button>
                <Button loading={isGithubLoading} onClick={onLoadMoreClicked}>
                  Load More Repos
                </Button>
                <Table
                  size={'small'}
                  rowSelection={rowSelection}
                  dataSource={Array.from(repos.values())}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                />
              </Col>
              <Col span={12}>
                <Button
                  loading={isDeletingLoading}
                  onClick={handleDeleteSelectedRows}
                  disabled={selectedSavedRowKeys.length === 0}
                >
                  Delete Selected Repos
                </Button>
                <Table
                  size={'small'}
                  rowSelection={rowSavedSelection}
                  dataSource={Array.from(savedRepos.values())}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: true }}
                />
              </Col>
            </Row>
          </>
        )}
      </Content>
      <Footer style={footerStyle}>The Best Git Stars Ranking View In The Universe</Footer>
    </Layout>
  );
};

export default React.memo(AppContent);
