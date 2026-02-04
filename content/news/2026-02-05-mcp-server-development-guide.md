---
title: "MCP Server開発で始める次世代AI Agent構築"
slug: "mcp-server-development-guide"
date: "2026-02-05"
category: "dev"
description: "Anthropic発のModel Context Protocol（MCP）でAI AgentとデータソースをシームレスにつなぐMCP Server開発の実践ガイド"
image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=420&fit=crop"
readTime: 8
featured: false
---

AI Agentがより強力になるためには、外部データソースとの連携が不可欠です。Anthropicが2024年11月に発表した**Model Context Protocol（MCP）**は、この課題を解決する画期的な標準プロトコルです。

## MCPとは何か？

MCPは、AI AgentとデータソースやAPIを標準化された方法で接続するためのオープンプロトコル。従来はClaude、ChatGPT、Cursor などそれぞれ異なるプラグイン仕様だったものが、**一つのMCP Serverで全AIツールに対応**できるようになりました。

### 主要な数値データ
- **リリース**: 2024年11月（Anthropic）
- **対応AI**: Claude Desktop、VS Code、Cursor IDE、Gemini CLI等
- **GitHub Star**: TypeScript SDK 1,200+ stars（2026年2月時点）
- **公式サーバー例**: 20+ サーバー実装（GitHub、Slack、PostgreSQL等）

## なぜソロビルダーにMCPが重要なのか

**1. 開発効率の劇的向上**
```typescript
// 従来: AIツールごとに個別実装が必要
- Claude Plugin
- ChatGPT Plugin  
- Cursor Extension
- VS Code Extension

// MCP: 一つのサーバーで全対応
- MCP Server → 全AIツールで利用可能
```

**2. ビジネスデータの直接活用**
```javascript
// 例: 顧客データベースを直接AI Agentが参照
const customerQuery = await mcp.useResource("customer:12345");
// AI AgentがCRMデータを理解した状態で回答
```

## TypeScript MCP Server 実装例

### 基本セットアップ

```bash
# プロジェクト作成
npm init -y
npm install @modelcontextprotocol/sdk zod

# TypeScript設定
npm install -D typescript @types/node
npx tsc --init
```

### シンプルなファイル検索MCP Server

```typescript
// src/file-search-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

// ツール定義
const FileSearchArgsSchema = z.object({
  directory: z.string(),
  pattern: z.string(),
});

const server = new Server(
  { name: 'file-search-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ツール一覧を登録
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'search_files',
      description: 'ディレクトリ内のファイルを検索',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: '検索対象ディレクトリ' },
          pattern: { type: 'string', description: '検索パターン（glob形式）' },
        },
        required: ['directory', 'pattern'],
      },
    },
  ],
}));

// ツール実行ハンドラー
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = CallToolRequestSchema.parse(request);
  
  if (name === 'search_files') {
    const { directory, pattern } = FileSearchArgsSchema.parse(args);
    
    try {
      const files = await fs.readdir(directory);
      const matchedFiles = files.filter(file => 
        file.includes(pattern) // 簡易マッチング
      );
      
      return {
        content: [
          {
            type: 'text',
            text: `検索結果: ${matchedFiles.length}件\n${matchedFiles.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `エラー: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  throw new Error(`未知のツール: ${name}`);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('File Search MCP Server 起動完了');
}

main().catch(console.error);
```

### データリソース提供の例

```typescript
// リソースハンドラー（データ提供）
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'project://stats',
      name: 'プロジェクト統計',
      description: '現在のプロジェクトの統計情報',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;
  
  if (uri === 'project://stats') {
    const stats = {
      totalFiles: 150,
      totalLines: 12500,
      languages: ['TypeScript', 'JavaScript', 'CSS'],
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
  
  throw new Error(`未知のリソース: ${uri}`);
});
```

## Claude Desktop での利用設定

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "file-search": {
      "command": "node",
      "args": ["dist/file-search-server.js"],
      "cwd": "/path/to/your/mcp-server"
    }
  }
}
```

## 実践的な応用例

### 1. プロジェクト管理MCP Server
```typescript
// GitHubプロジェクトとTodo管理の統合
- GitHub Issues取得
- ローカルTodoファイル管理  
- 進捗レポート生成
```

### 2. ビジネスデータMCP Server
```typescript
// 売上データベースとの連携
- 月次売上レポート
- 顧客分析データ
- KPI自動計算
```

### 3. API統合MCP Server
```typescript
// 外部APIの統一アクセス
- Slack、Discord通知
- 画像生成API
- 翻訳API呼び出し
```

## パフォーマンス考慮事項

**メモリ効率**
```typescript
// ストリーミング対応で大容量データも安全
server.setRequestHandler('resources/read', async (request) => {
  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'text/plain',
        text: await streamLargeFile(filePath), // チャンク処理
      },
    ],
  };
});
```

**エラーハンドリング**
```typescript
// 堅牢なエラー処理でAI Agentの体験向上
try {
  const result = await externalAPI.call(params);
  return { content: [{ type: 'text', text: result }] };
} catch (error) {
  return {
    content: [{ type: 'text', text: `API呼び出しエラー: ${error.message}` }],
    isError: true,
  };
}
```

## 今後の展望

MCP Serverエコシステムは急速に成長中。**2026年中にはMCP対応AIツールが主流**になると予測されています。

**投資対効果**
- **開発コスト**: 従来の1/5（複数AI対応を考慮）
- **保守コスト**: 標準化により大幅削減
- **拡張性**: 新しいAIツールに即座に対応

ソロビルダーにとって、MCP Server開発は**必須スキル**になりつつあります。一つのサーバーで複数のAIツールを強化できる効率性は、リソース限られた個人開発者には特に価値の高い技術です。

---

*参考: [Anthropic MCP公式ドキュメント](https://modelcontextprotocol.io/), [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)*