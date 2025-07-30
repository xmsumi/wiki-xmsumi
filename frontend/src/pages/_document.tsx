import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* 字体预加载 */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* 网站图标 */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* SEO元标签 */}
        <meta name="description" content="Wiki知识库 - 专业的知识管理系统" />
        <meta name="keywords" content="wiki,知识库,文档管理,知识管理" />
        <meta name="author" content="Wiki知识库团队" />
        
        {/* 移动端优化 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        
        {/* 社交媒体元标签 */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Wiki知识库" />
        <meta property="og:description" content="专业的知识管理系统" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter卡片 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wiki知识库" />
        <meta name="twitter:description" content="专业的知识管理系统" />
        <meta name="twitter:image" content="/twitter-image.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}