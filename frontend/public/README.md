# Public 静态资源目录

这个目录包含了网站的静态资源文件。

## 文件说明

- `site.webmanifest` - PWA 应用清单文件
- `favicon.svg` - SVG 格式的网站图标
- `favicon.ico` - ICO 格式的网站图标（需要手动添加）
- `robots.txt` - 搜索引擎爬虫规则

## 缺失的图标文件

为了完全解决 404 错误，你还需要添加以下图标文件：

1. `favicon.ico` - 16x16, 32x32 ICO 格式图标
2. `android-chrome-192x192.png` - 192x192 PNG 图标
3. `android-chrome-512x512.png` - 512x512 PNG 图标
4. `apple-touch-icon.png` - 180x180 PNG 图标

## 如何生成图标

你可以使用以下工具生成完整的图标集：
- https://favicon.io/
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

只需上传一个高质量的 PNG 图片（建议 512x512），这些工具会自动生成所有需要的格式。