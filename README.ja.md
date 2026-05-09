# Hill Blog

[中文](./README.md) | [English](./README.en.md) | 日本語

<img align="right" src="logo.png" width="160" alt="Blog logo">

これは Hill の個人ブログサイト用リポジトリです。Astro と Mizuki テーマ体系をベースにしており、現在のブログサイトの投稿、特別ページ、検索、アーカイブ、友リンク、日記、アニメ記録、コメント、パフォーマンス関連ツールを管理します。

記事コンテンツだけを見たい場合は、独立したコンテンツリポジトリ [BlogContent](https://github.com/Hill-1024/BlogContent) を参照してください。このリポジトリはサイトコード、テーマ設定、ビルドワークフロー、デプロイ成果物を担当します。

## サイト機能

- Astro による静的サイト生成。
- Mizuki 風ブログテーマとカスタムビジュアル設定。
- Markdown / MDX レンダリングと拡張構文。
- Pagefind によるサイト内検索。
- RSS、サイトマップ、SEO メタデータ。
- アーカイブ、カテゴリ、タグ、固定投稿、下書き。
- 友リンク、About、日記、アニメ記録などの特別ページ。
- Twikoo コメント統合。
- Lighthouse / performance baseline 関連スクリプト。
- コンテンツリポジトリ同期ワークフロー。

## 技術スタック

- Astro 5
- TypeScript
- Svelte
- Tailwind CSS
- Expressive Code
- Pagefind
- Swup
- pnpm workspace

## クイックスタート

```bash
pnpm install
pnpm dev
```

既定の開発 URL：

```text
http://localhost:4321
```

## ビルドとプレビュー

```bash
pnpm build
pnpm preview
```

コミット前の確認として推奨：

```bash
pnpm check
pnpm lint
```

## スクリプト

| Command | 説明 |
| --- | --- |
| `pnpm dev` | Astro 開発サーバーを起動 |
| `pnpm build` | 本番サイトをビルド |
| `pnpm preview` | ビルド成果物をプレビュー |
| `pnpm check` | Astro/TypeScript チェックを実行 |
| `pnpm new-post` | 新しい記事を作成 |
| `pnpm sync-content` | 外部コンテンツリポジトリを同期 |
| `pnpm init-content` | コンテンツソースを初期化 |
| `pnpm format` | コードをフォーマット |
| `pnpm lint` | lint を実行 |
| `pnpm performance:check` | パフォーマンスチェックを実行 |

## プロジェクト構成

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

| Path | 説明 |
| --- | --- |
| `src/` | Astro ページ、コンポーネント、コンテンツコレクション、テーマロジック |
| `public/` | 静的アセット |
| `scripts/` | コンテンツ同期、記事作成、フォント圧縮、パフォーマンススクリプト |
| `docs/` | テーマ関連メモと画像 |
| `astro.config.mjs` | Astro とプラグイン設定 |
| `pagefind.yml` | 検索インデックス設定 |
| `performance-baseline.json` | パフォーマンス基準 |

## コンテンツワークフロー

ブログ内容は [BlogContent](https://github.com/Hill-1024/BlogContent) から同期することも、サイト内のコンテンツディレクトリで直接管理することもできます。記事は frontmatter でタイトル、公開日、概要、タグ、カテゴリ、カバー画像、固定状態、下書き状態を記述します。

長期的に維持する内容はコンテンツリポジトリに置き、テーマ、スタイル、コンポーネント、デプロイ設定はこのリポジトリに置くのが基本方針です。

## デプロイ

このプロジェクトは静的サイトを出力するため、Vercel、Netlify、Cloudflare Pages、GitHub Pages、任意の静的ホスティングへデプロイできます。デプロイ前に次を確認してください。

- `src/config.ts` のサイト URL、タイトル、ソーシャルリンク、コメント設定。
- `.env.example` に記載された任意の環境変数。
- コンテンツ同期が完了していること。
- 検索インデックスと RSS 出力。

実際の `.env`、秘密 token、未マスクの機密内容をコミットしないでください。

## 上流

このサイトは Mizuki テーマ体系をベースにカスタマイズされています。Astro、Mizuki、および関連するオープンソースエコシステムに感謝します。

## ライセンス

コードはこのリポジトリの Apache License 2.0 に従います。記事、画像、個人コンテンツの利用条件は、それぞれの内容に従ってください。
