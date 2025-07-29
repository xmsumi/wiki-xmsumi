import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, Typography } from 'antd';
import { AppLayout, Breadcrumb, SearchBox, SearchResults, SearchHistory } from '@/components';

const { Title } = Typography;

/**
 * 搜索页面
 * 提供全文搜索功能，显示搜索结果和搜索历史
 */
const SearchPage: NextPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // 从URL参数获取搜索查询
  useEffect(() => {
    const query = router.query.q as string;
    if (query) {
      setSearchQuery(query);
      setShowHistory(false);
    } else {
      setShowHistory(true);
    }
  }, [router.query.q]);

  // 处理搜索
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setShowHistory(false);
    
    // 更新URL
    router.push(`/search?q=${encodeURIComponent(query)}`, undefined, { shallow: true });
    
    try {
      // TODO: 调用搜索API
      // const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      // setSearchResults(response.data);
      
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSearchQuery(query);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成页面标题
  const getPageTitle = () => {
    if (searchQuery) {
      return `搜索 "${searchQuery}" - Wiki知识库`;
    }
    return '搜索 - Wiki知识库';
  };

  // 生成面包屑项目
  const breadcrumbItems = [
    { title: '首页', path: '/' },
    { title: '搜索', path: '/search' },
    ...(searchQuery ? [{ title: `"${searchQuery}"` }] : []),
  ];

  return (
    <>
      <Head>
        <title>{getPageTitle()}</title>
        <meta name="description" content="在Wiki知识库中搜索文档内容" />
      </Head>

      <AppLayout>
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <Title level={2}>搜索</Title>
          </div>

          {/* 搜索框 */}
          <div className="mb-8">
            <SearchBox
              onSearch={handleSearch}
              showFilters={true}
              showHistory={true}
              autoFocus={!searchQuery}
              size="large"
            />
          </div>

          <Row gutter={24}>
            {/* 主要内容区域 */}
            <Col xs={24} lg={showHistory ? 24 : 18}>
              {showHistory ? (
                /* 搜索历史和热门搜索 */
                <SearchHistory 
                  onSearch={handleSearch}
                  showPopular={true}
                />
              ) : (
                /* 搜索结果 */
                <SearchResults
                  query={searchQuery}
                  loading={loading}
                  onPageChange={(page, pageSize) => {
                    // 处理分页
                    const newQuery = { 
                      ...router.query, 
                      page: page.toString(),
                      pageSize: pageSize.toString()
                    };
                    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
                  }}
                />
              )}
            </Col>

            {/* 侧边栏 - 仅在有搜索结果时显示 */}
            {!showHistory && (
              <Col xs={24} lg={6}>
                <div className="sticky top-20">
                  <SearchHistory 
                    onSearch={handleSearch}
                    showPopular={true}
                    maxItems={10}
                  />
                </div>
              </Col>
            )}
          </Row>
        </div>
      </AppLayout>
    </>
  );
};

export default SearchPage;