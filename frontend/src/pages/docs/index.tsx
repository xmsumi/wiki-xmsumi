import { NextPage } from 'next';
import Head from 'next/head';
import { Typography, Card, List, Tag, Row, Col } from 'antd';
import { FileTextOutlined, FolderOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout, Breadcrumb, DirectoryTree } from '@/components';

const { Title, Paragraph } = Typography;

interface DocumentItem {
  id: number;
  title: string;
  path: string;
  type: 'document' | 'directory';
  description?: string;
  tags?: string[];
  updatedAt: string;
}

/**
 * 文档浏览页面
 */
const DocsPage: NextPage = () => {
  // 模拟文档数据
  const documents: DocumentItem[] = [
    {
      id: 1,
      title: '快速开始',
      path: '/docs/quick-start',
      type: 'directory',
      description: '快速上手指南和基础配置',
      updatedAt: '2024-01-15',
    },
    {
      id: 2,
      title: 'API文档',
      path: '/docs/api',
      type: 'directory',
      description: '完整的API接口文档',
      updatedAt: '2024-01-14',
    },
    {
      id: 3,
      title: '系统架构',
      path: '/docs/architecture',
      type: 'document',
      description: '系统整体架构设计说明',
      tags: ['架构', '设计'],
      updatedAt: '2024-01-13',
    },
    {
      id: 4,
      title: '部署指南',
      path: '/docs/deployment',
      type: 'document',
      description: '生产环境部署配置指南',
      tags: ['部署', '运维'],
      updatedAt: '2024-01-12',
    },
  ];

  return (
    <>
      <Head>
        <title>文档浏览 - Wiki知识库</title>
        <meta name="description" content="浏览Wiki知识库中的所有文档和目录" />
      </Head>

      <AppLayout>
        <Breadcrumb />
        
        <div className="mb-8">
          <Title level={2}>文档浏览</Title>
          <Paragraph className="text-gray-600">
            浏览和搜索知识库中的所有文档内容
          </Paragraph>
        </div>

        <Row gutter={24}>
          {/* 左侧目录树 */}
          <Col xs={24} lg={8}>
            <Card title="文档目录" className="mb-6">
              <DirectoryTree 
                showSearch={true}
                className="h-96 overflow-auto"
              />
            </Card>
          </Col>

          {/* 右侧文档列表 */}
          <Col xs={24} lg={16}>
            <Card title="最近更新">
              <List
                itemLayout="vertical"
                dataSource={documents}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <span key="updated" className="text-gray-500 flex items-center">
                        <ClockCircleOutlined className="mr-1" />
                        更新于 {item.updatedAt}
                      </span>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        item.type === 'directory' ? (
                          <FolderOutlined className="text-xl text-blue-500" />
                        ) : (
                          <FileTextOutlined className="text-xl text-green-500" />
                        )
                      }
                      title={
                        <Link 
                          href={item.path} 
                          className="text-lg font-medium hover:text-blue-600 no-underline"
                        >
                          {item.title}
                        </Link>
                      }
                      description={
                        <div>
                          <Paragraph className="!mb-2 text-gray-600">
                            {item.description}
                          </Paragraph>
                          {item.tags && (
                            <div>
                              {item.tags.map(tag => (
                                <Tag key={tag} color="blue" className="mb-1">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </AppLayout>
    </>
  );
};

export default DocsPage;