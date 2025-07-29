import { NextPage } from 'next';
import Head from 'next/head';
import { Typography, Card, Row, Col, Button, Space } from 'antd';
import { BookOutlined, SearchOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { AppLayout } from '@/components';

const { Title, Paragraph } = Typography;

/**
 * 首页组件
 */
const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Wiki知识库 - 专业的知识管理系统</title>
        <meta name="description" content="Wiki知识库是一个专业的知识管理系统，提供文档管理、搜索、协作等功能" />
      </Head>

      <AppLayout showSidebar={false}>
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <Title level={1} className="!text-5xl !mb-6">
            专业的知识管理系统
          </Title>
          <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Wiki知识库帮助团队高效地创建、组织和分享知识，
            提供强大的搜索功能和直观的用户界面。
          </Paragraph>
          <Space size="large">
            <Link href="/docs">
              <Button type="primary" size="large" icon={<BookOutlined />}>
                开始浏览
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="large">
                管理后台
              </Button>
            </Link>
          </Space>
        </div>

        {/* 功能特性 */}
        <div className="max-w-6xl mx-auto">
          <Title level={2} className="text-center mb-12">
            核心功能
          </Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                className="text-center h-full"
                cover={
                  <div className="p-8">
                    <BookOutlined className="text-4xl text-blue-500" />
                  </div>
                }
              >
                <Card.Meta
                  title="文档管理"
                  description="支持Markdown格式，版本控制，层级目录组织"
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                className="text-center h-full"
                cover={
                  <div className="p-8">
                    <SearchOutlined className="text-4xl text-green-500" />
                  </div>
                }
              >
                <Card.Meta
                  title="全文搜索"
                  description="基于Elasticsearch的强大搜索，支持关键词高亮"
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                className="text-center h-full"
                cover={
                  <div className="p-8">
                    <TeamOutlined className="text-4xl text-purple-500" />
                  </div>
                }
              >
                <Card.Meta
                  title="团队协作"
                  description="多用户权限管理，支持协作编辑和评论"
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card
                hoverable
                className="text-center h-full"
                cover={
                  <div className="p-8">
                    <SafetyOutlined className="text-4xl text-red-500" />
                  </div>
                }
              >
                <Card.Meta
                  title="安全可靠"
                  description="数据加密存储，定期备份，访问权限控制"
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* 使用统计 */}
        <div className="text-center mt-16 p-8 bg-gray-50 rounded-lg">
          <Title level={3} className="mb-8">
            使用统计
          </Title>
          <Row gutter={32}>
            <Col xs={24} sm={8}>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">1,234</div>
                <div className="text-gray-600">文档数量</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">56</div>
                <div className="text-gray-600">活跃用户</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <div className="text-3xl font-bold text-purple-500 mb-2">789</div>
                <div className="text-gray-600">搜索次数</div>
              </div>
            </Col>
          </Row>
        </div>
      </AppLayout>
    </>
  );
};

export default HomePage;