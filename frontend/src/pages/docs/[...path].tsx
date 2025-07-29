import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppLayout, Breadcrumb, DocumentViewer } from '@/components';

/**
 * 动态文档页面
 * 根据路径参数显示对应的文档内容
 */
const DocumentPage: NextPage = () => {
  const router = useRouter();
  const { path } = router.query;
  
  // 构建文档路径
  const documentPath = Array.isArray(path) ? `/${path.join('/')}` : `/${path || ''}`;
  
  // 生成页面标题
  const getPageTitle = (path: string): string => {
    const titleMap: Record<string, string> = {
      '/quick-start/installation': '安装指南',
      '/quick-start/configuration': '基础配置',
      '/quick-start/faq': '常见问题',
      '/api/auth': '认证接口',
      '/api/documents': '文档接口',
      '/api/users/management': '用户管理',
      '/api/users/permissions': '权限控制',
      '/deployment': '部署指南',
      '/architecture': '系统架构',
    };
    return titleMap[path] || '文档详情';
  };

  const pageTitle = getPageTitle(documentPath);

  return (
    <>
      <Head>
        <title>{pageTitle} - Wiki知识库</title>
        <meta name="description" content={`${pageTitle}的详细说明文档`} />
      </Head>

      <AppLayout>
        <Breadcrumb />
        <DocumentViewer 
          documentPath={documentPath}
          showToc={true}
          showActions={true}
        />
      </AppLayout>
    </>
  );
};

export default DocumentPage;