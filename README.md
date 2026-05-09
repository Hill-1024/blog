# Hill Blog

中文 | [English](./README.en.md) | [日本語](./README.ja.md)

<img align="right" src="logo.png" width="160" alt="Blog logo">

这是 Hill 的个人博客站点仓库，基于 Astro 与 Mizuki 主题体系构建。它承载文章发布、专题页面、搜索、归档、友链、日记、追番、评论和性能优化等功能，是当前博客站点的主仓库。

如果只想查看文章内容，请看独立内容仓库：[BlogContent](https://github.com/Hill-1024/BlogContent)。本仓库负责站点代码、主题配置、构建流程和部署产物。

## 站点能力

- 基于 Astro 的静态站点生成。
- Mizuki 风格博客主题与自定义视觉配置。
- Markdown / MDX 内容渲染和扩展语法。
- Pagefind 站内搜索。
- RSS、站点地图和 SEO 元信息。
- 文章归档、分类、标签、置顶和草稿。
- 友链、关于、日记、追番等特色页面。
- Twikoo 评论集成。
- Lighthouse / performance baseline 相关脚本。
- 内容仓库同步工作流。

## 技术栈

- Astro 5
- TypeScript
- Svelte
- Tailwind CSS
- Expressive Code
- Pagefind
- Swup
- pnpm workspace

## 快速开始

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://localhost:4321
```

## 构建与预览

```bash
pnpm build
pnpm preview
```

提交前建议运行：

```bash
pnpm check
pnpm lint
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Astro 开发服务 |
| `pnpm build` | 构建生产站点 |
| `pnpm preview` | 预览构建产物 |
| `pnpm check` | Astro/TypeScript 检查 |
| `pnpm new-post` | 创建新文章 |
| `pnpm sync-content` | 同步外部内容仓库 |
| `pnpm init-content` | 初始化内容源 |
| `pnpm format` | 格式化代码 |
| `pnpm lint` | 运行 lint |
| `pnpm performance:check` | 运行性能检查 |

## 项目结构

```text
.
├── src/
├── public/
├── docs/
├── scripts/
├── astro.config.mjs
├── pagefind.yml
├── performance-baseline.json
├── package.json
└── pnpm-lock.yaml
```

| 路径 | 说明 |
| --- | --- |
| `src/` | Astro 页面、组件、内容集合和主题逻辑 |
| `public/` | 静态资源 |
| `scripts/` | 内容同步、文章创建、字体压缩和性能脚本 |
| `docs/` | 主题相关说明与图片 |
| `astro.config.mjs` | Astro 与插件配置 |
| `pagefind.yml` | 搜索索引配置 |
| `performance-baseline.json` | 性能基线 |

## 内容工作流

博客内容可以从 [BlogContent](https://github.com/Hill-1024/BlogContent) 同步，也可以直接在站点内容目录中维护。文章通过 frontmatter 描述标题、发布时间、摘要、标签、分类、封面、置顶和草稿状态。

建议把长期维护的内容放在内容仓库，把主题、样式、组件和部署配置留在本仓库。

## 部署

本项目输出静态站点，可部署到 Vercel、Netlify、Cloudflare Pages、GitHub Pages 或任意静态托管服务。部署前请检查：

- `src/config.ts` 中的站点 URL、标题、社交链接和评论配置。
- `.env.example` 中列出的可选环境变量。
- 内容同步是否已经完成。
- 搜索索引和 RSS 是否符合预期。

不要提交真实 `.env`、私密 token 或未脱敏内容。

## 上游

站点基于 Mizuki 主题体系定制。感谢上游 Astro、Mizuki 与相关开源生态提供的基础能力。

## 许可证

代码继承/遵循仓库中的 Apache License 2.0。文章、图片和个人内容的授权请以具体内容说明为准。
