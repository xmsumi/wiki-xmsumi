import { NextPage } from 'next';
import Head from 'next/head';
import { Result, Button } from 'antd';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components';

/**
 * 403权限不足页面
 */
const ForbiddenPage: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>权限不足 - Wiki知识库</title>
        <meta name="description" content="您没有权限访问此页面" />
      </Head>

      <AppLayout showSidebar={false}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Result
            status="403"
            title="403"
            subTitle="抱歉，您没有权限访问此页面。"
            extra={
              <div className="space-x-4">
                <Button type="primary" onClick={() => router.push('/')}>
                  返回首页
                </Button>
                <Button onClick={() => router.back()}>
                  返回上页
                </Button>
              </div>
            }
          />
        </div>
      </AppLayout>
    </>
  );
};

export default ForbiddenPage;