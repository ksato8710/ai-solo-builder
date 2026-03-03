#!/usr/bin/env npx tsx

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  CreateArticleSchema,
  PublishArticleSchema,
  UpdateArticleSchema,
  type ArticleType,
  GetArticleSchema,
  ListArticlesSchema,
  SearchArticlesSchema,
  UpdateArticleStatusSchema,
} from './schemas/index.js';
import { getDb } from './utils/db.js';
import type { Database } from '../src/types/database';

type ContentRow = Database['public']['Tables']['contents']['Row'];
type ContentInsert = Database['public']['Tables']['contents']['Insert'];
type ContentUpdate = Database['public']['Tables']['contents']['Update'];
type ContentType = Database['public']['Enums']['content_type'];
type ContentStatus = Database['public']['Enums']['content_status'];
type DigestEdition = Database['public']['Enums']['digest_edition'];

const STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review', 'archived'],
  review: ['draft', 'published', 'archived'],
  published: ['review', 'archived'],
  archived: ['draft'],
};

const server = new McpServer({
  name: 'ai-solo-craft-mcp',
  version: '1.0.0',
});

interface TypeMapping {
  contentType: ContentType;
  digestEdition?: DigestEdition;
  forcedTag?: string;
}

interface ContentMetadata {
  digestEditionByContentId: Map<string, DigestEdition>;
  tagsByContentId: Map<string, string[]>;
}

function success(payload: Record<string, unknown>) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, ...payload }, null, 2),
      },
    ],
  };
}

function failure(error: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            success: false,
            error: toErrorMessage(error),
          },
          null,
          2
        ),
      },
    ],
    isError: true as const,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${path}: ${issue.message}`;
      })
      .join(', ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '予期しないエラーが発生しました';
}

function mapInputType(type: ArticleType): TypeMapping {
  switch (type) {
    case 'digest_morning':
      return { contentType: 'digest', digestEdition: 'morning' };
    case 'digest_evening':
      return { contentType: 'digest', digestEdition: 'evening' };
    case 'product':
      return { contentType: 'product' };
    case 'dev-knowledge':
      return { contentType: 'news', forcedTag: 'dev-knowledge' };
    case 'case-study':
      return { contentType: 'news', forcedTag: 'case-study' };
    case 'news':
    default:
      return { contentType: 'news' };
  }
}

function deriveArticleType(
  contentType: ContentType,
  digestEdition: DigestEdition | null,
  tags: string[]
): ArticleType {
  if (contentType === 'digest') {
    return digestEdition === 'evening' ? 'digest_evening' : 'digest_morning';
  }

  if (contentType === 'product') {
    return 'product';
  }

  if (tags.includes('dev-knowledge')) {
    return 'dev-knowledge';
  }

  if (tags.includes('case-study')) {
    return 'case-study';
  }

  return 'news';
}

function normalizeTagCode(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTagCode).filter(Boolean);
  return [...new Set(normalized)];
}

function toTagLabel(code: string): string {
  const parts = code.split(/[-_]/).filter(Boolean);
  if (parts.length === 0) return code;
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function generateSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || `article-${Date.now()}`;
}

function extractPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[>#*_~|]/g, ' ')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDescription(markdown: string): string {
  const plain = extractPlainText(markdown);
  if (!plain) {
    return 'MCPで作成された記事下書きです。';
  }
  return plain.length <= 140 ? plain : `${plain.slice(0, 140)}...`;
}

function estimateReadTime(markdown: string): number {
  const plain = extractPlainText(markdown);
  if (!plain) return 1;

  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const japaneseCharacterCount = (plain.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  const effectiveWordCount = wordCount + japaneseCharacterCount / 2;

  return Math.max(1, Math.ceil(effectiveWordCount / 200));
}

async function fetchContentMetadata(contentIds: string[]): Promise<ContentMetadata> {
  const metadata: ContentMetadata = {
    digestEditionByContentId: new Map<string, DigestEdition>(),
    tagsByContentId: new Map<string, string[]>(),
  };

  if (contentIds.length === 0) {
    return metadata;
  }

  const db = getDb();

  const { data: digestRows, error: digestError } = await db
    .from('digest_details')
    .select('content_id, edition')
    .in('content_id', contentIds);

  if (digestError) {
    throw new Error(`digest_details 取得失敗: ${digestError.message}`);
  }

  for (const row of digestRows ?? []) {
    metadata.digestEditionByContentId.set(row.content_id, row.edition);
  }

  const { data: contentTagRows, error: contentTagError } = await db
    .from('content_tags')
    .select('content_id, tag_id')
    .in('content_id', contentIds);

  if (contentTagError) {
    throw new Error(`content_tags 取得失敗: ${contentTagError.message}`);
  }

  const tagIds = [...new Set((contentTagRows ?? []).map((row) => row.tag_id))];
  if (tagIds.length === 0) {
    return metadata;
  }

  const { data: tagRows, error: tagError } = await db
    .from('tags')
    .select('id, code')
    .in('id', tagIds);

  if (tagError) {
    throw new Error(`tags 取得失敗: ${tagError.message}`);
  }

  const codeByTagId = new Map((tagRows ?? []).map((row) => [row.id, row.code]));
  for (const row of contentTagRows ?? []) {
    const tagCode = codeByTagId.get(row.tag_id);
    if (!tagCode) continue;

    const existing = metadata.tagsByContentId.get(row.content_id) ?? [];
    existing.push(tagCode);
    metadata.tagsByContentId.set(row.content_id, existing);
  }

  return metadata;
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const db = getDb();
  let candidate = baseSlug;
  let index = 2;

  while (true) {
    const { data, error } = await db
      .from('contents')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error) {
      throw new Error(`slug重複チェック失敗: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${index}`;
    index += 1;
  }
}

async function ensureTagIds(tagCodes: string[]): Promise<string[]> {
  if (tagCodes.length === 0) {
    return [];
  }

  const db = getDb();

  const { data: existingRows, error: existingError } = await db
    .from('tags')
    .select('id, code')
    .in('code', tagCodes);

  if (existingError) {
    throw new Error(`既存タグ取得失敗: ${existingError.message}`);
  }

  const existingCodes = new Set((existingRows ?? []).map((row) => row.code));
  const missingCodes = tagCodes.filter((code) => !existingCodes.has(code));

  if (missingCodes.length > 0) {
    const { error: upsertError } = await db.from('tags').upsert(
      missingCodes.map((code) => ({
        code,
        label: toTagLabel(code),
      })),
      { onConflict: 'code' }
    );

    if (upsertError) {
      throw new Error(`タグ作成失敗: ${upsertError.message}`);
    }
  }

  const { data: allRows, error: allRowsError } = await db
    .from('tags')
    .select('id, code')
    .in('code', tagCodes);

  if (allRowsError) {
    throw new Error(`タグ再取得失敗: ${allRowsError.message}`);
  }

  const idByCode = new Map((allRows ?? []).map((row) => [row.code, row.id]));
  return tagCodes.map((code) => idByCode.get(code)).filter((id): id is string => Boolean(id));
}

function toArticleSummary(
  row: ContentRow,
  digestEdition: DigestEdition | null,
  tags: string[]
) {
  return {
    id: row.id,
    title: row.title,
    type: deriveArticleType(row.content_type, digestEdition, tags),
    status: row.status,
    publishedAt: row.published_at,
    tags,
  };
}

function toArticleDetail(
  row: ContentRow,
  digestEdition: DigestEdition | null,
  tags: string[]
) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body_markdown,
    bodyHtml: row.body_html,
    type: deriveArticleType(row.content_type, digestEdition, tags),
    contentType: row.content_type,
    digestEdition,
    status: row.status,
    tags,
    thumbnailUrl: row.hero_image_url,
    date: row.date,
    readTime: row.read_time,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    legacyCategory: row.legacy_category,
    authoringSource: row.authoring_source,
    sourcePath: row.source_path,
    checksum: row.checksum,
  };
}

async function listContents(params: {
  status?: ContentStatus;
  contentType?: ContentType;
  limit: number;
}): Promise<ContentRow[]> {
  const db = getDb();
  const fetchLimit = Math.min(500, Math.max(100, params.limit * 10));

  let query = db
    .from('contents')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.contentType) {
    query = query.eq('content_type', params.contentType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`contents 取得失敗: ${error.message}`);
  }

  return data ?? [];
}

async function validateConnection() {
  const db = getDb();
  const { error } = await db.from('contents').select('id').limit(1);
  if (error) {
    throw new Error(`Supabase接続確認に失敗しました: ${error.message}`);
  }
}

server.registerTool(
  'list_articles',
  {
    description: '記事一覧を取得する',
    inputSchema: ListArticlesSchema,
  },
  async (params) => {
    try {
      const input = ListArticlesSchema.parse(params);
      const typeMapping = input.type ? mapInputType(input.type) : undefined;

      const rows = await listContents({
        status: input.status,
        contentType: typeMapping?.contentType,
        limit: input.limit,
      });

      const metadata = await fetchContentMetadata(rows.map((row) => row.id));
      const articles = rows
        .map((row) =>
          toArticleSummary(
            row,
            metadata.digestEditionByContentId.get(row.id) ?? null,
            metadata.tagsByContentId.get(row.id) ?? []
          )
        )
        .filter((article) => (input.type ? article.type === input.type : true))
        .slice(0, input.limit);

      return success({
        count: articles.length,
        articles,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'get_article',
  {
    description: '特定記事の詳細を取得する',
    inputSchema: GetArticleSchema,
  },
  async (params) => {
    try {
      const input = GetArticleSchema.parse(params);
      const db = getDb();

      let query = db
        .from('contents')
        .select('*')
        .limit(1);

      query = input.id ? query.eq('id', input.id) : query.eq('slug', input.slug!);
      const { data: row, error } = await query.maybeSingle();

      if (error) {
        throw new Error(`記事取得失敗: ${error.message}`);
      }

      if (!row) {
        throw new Error('指定された記事が見つかりません');
      }

      const metadata = await fetchContentMetadata([row.id]);
      const digestEdition = metadata.digestEditionByContentId.get(row.id) ?? null;
      const tags = metadata.tagsByContentId.get(row.id) ?? [];

      return success({
        article: toArticleDetail(row, digestEdition, tags),
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'create_article',
  {
    description: '記事ドラフトを作成する',
    inputSchema: CreateArticleSchema,
  },
  async (params) => {
    try {
      const input = CreateArticleSchema.parse(params);
      const db = getDb();
      const typeMapping = mapInputType(input.type);

      const baseSlug = input.slug ?? generateSlug(input.title);
      const slug = await ensureUniqueSlug(baseSlug);
      const today = new Date().toISOString().slice(0, 10);

      const tagCodes = normalizeTags([
        ...input.tags,
        ...(typeMapping.forcedTag ? [typeMapping.forcedTag] : []),
      ]);

      const insertPayload: ContentInsert = {
        slug,
        title: input.title,
        description: input.description ?? buildDescription(input.body),
        body_markdown: input.body,
        content_type: typeMapping.contentType,
        status: 'draft',
        date: input.date ?? today,
        read_time: input.readTime ?? estimateReadTime(input.body),
        featured: input.featured ?? false,
        hero_image_url: input.heroImageUrl ?? null,
        authoring_source: 'db',
      };

      const { data: created, error: createError } = await db
        .from('contents')
        .insert(insertPayload)
        .select('*')
        .single();

      if (createError) {
        throw new Error(`記事作成失敗: ${createError.message}`);
      }

      if (typeMapping.digestEdition) {
        const { error: digestError } = await db.from('digest_details').upsert(
          {
            content_id: created.id,
            edition: typeMapping.digestEdition,
            digest_date: today,
          },
          { onConflict: 'content_id' }
        );

        if (digestError) {
          throw new Error(`digest_details 作成失敗: ${digestError.message}`);
        }
      }

      if (tagCodes.length > 0) {
        const tagIds = await ensureTagIds(tagCodes);
        if (tagIds.length > 0) {
          const { error: linkError } = await db.from('content_tags').upsert(
            tagIds.map((tagId) => ({
              content_id: created.id,
              tag_id: tagId,
            })),
            { onConflict: 'content_id,tag_id' }
          );

          if (linkError) {
            throw new Error(`content_tags 作成失敗: ${linkError.message}`);
          }
        }
      }

      return success({
        id: created.id,
        slug: created.slug,
        message: `記事ドラフトを作成しました (${created.slug})`,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'update_article_status',
  {
    description: '記事ステータスを更新する',
    inputSchema: UpdateArticleStatusSchema,
  },
  async (params) => {
    try {
      const input = UpdateArticleStatusSchema.parse(params);
      const db = getDb();

      const { data: existing, error: existingError } = await db
        .from('contents')
        .select('id, status')
        .eq('id', input.id)
        .maybeSingle();

      if (existingError) {
        throw new Error(`対象記事確認失敗: ${existingError.message}`);
      }

      if (!existing) {
        throw new Error('指定された記事が見つかりません');
      }

      const currentStatus = existing.status as ContentStatus;
      const nextStatus = input.status as ContentStatus;

      if (currentStatus !== nextStatus && !STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
        throw new Error(
          `不正なステータス遷移です: ${currentStatus} -> ${nextStatus}。許可: ${STATUS_TRANSITIONS[
            currentStatus
          ].join(', ')}`
        );
      }

      const updatePayload: ContentUpdate = { status: nextStatus };
      if (nextStatus === 'published') {
        updatePayload.published_at = new Date().toISOString();
      }

      const { error: updateError } = await db.from('contents').update(updatePayload).eq('id', input.id);
      if (updateError) {
        throw new Error(`ステータス更新失敗: ${updateError.message}`);
      }

      return success({
        message: `記事ステータスを ${currentStatus} から ${nextStatus} に更新しました`,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'publish_article',
  {
    description:
      '記事を作成して即座に公開する（ワンステップ公開）。slug必須。hero_image_urlは自動で /thumbnails/{slug}.png に設定される。',
    inputSchema: PublishArticleSchema,
  },
  async (params) => {
    try {
      const input = PublishArticleSchema.parse(params);
      const db = getDb();
      const typeMapping = mapInputType(input.type);
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();

      // slug重複チェック
      const { data: existingSlug } = await db
        .from('contents')
        .select('id')
        .eq('slug', input.slug)
        .maybeSingle();

      if (existingSlug) {
        throw new Error(
          `slug "${input.slug}" は既に使用されています。別のslugを指定してください。`
        );
      }

      const tagCodes = normalizeTags([
        ...input.tags,
        ...(typeMapping.forcedTag ? [typeMapping.forcedTag] : []),
      ]);

      const insertPayload: ContentInsert = {
        slug: input.slug,
        title: input.title,
        description: input.description ?? buildDescription(input.body),
        body_markdown: input.body,
        content_type: typeMapping.contentType,
        status: 'published',
        date: input.date ?? today,
        read_time: input.readTime ?? estimateReadTime(input.body),
        featured: input.featured ?? false,
        hero_image_url: `/thumbnails/${input.slug}.png`,
        published_at: now,
        authoring_source: 'db',
      };

      const { data: created, error: createError } = await db
        .from('contents')
        .insert(insertPayload)
        .select('*')
        .single();

      if (createError) {
        throw new Error(`記事作成失敗: ${createError.message}`);
      }

      // digest_details
      if (typeMapping.digestEdition) {
        const { error: digestError } = await db.from('digest_details').upsert(
          {
            content_id: created.id,
            edition: typeMapping.digestEdition,
            digest_date: input.date ?? today,
          },
          { onConflict: 'content_id' }
        );

        if (digestError) {
          throw new Error(`digest_details 作成失敗: ${digestError.message}`);
        }
      }

      // タグリンク
      if (tagCodes.length > 0) {
        const tagIds = await ensureTagIds(tagCodes);
        if (tagIds.length > 0) {
          const { error: linkError } = await db.from('content_tags').upsert(
            tagIds.map((tagId) => ({
              content_id: created.id,
              tag_id: tagId,
            })),
            { onConflict: 'content_id,tag_id' }
          );

          if (linkError) {
            throw new Error(`content_tags 作成失敗: ${linkError.message}`);
          }
        }
      }

      const publicUrl = `https://ai-solo-craft.craftgarden.studio/news/${created.slug}`;

      return success({
        id: created.id,
        slug: created.slug,
        status: 'published',
        publicUrl,
        heroImageUrl: created.hero_image_url,
        message: `記事を公開しました: ${publicUrl}`,
        note: 'サムネイル画像は /thumbnails/{slug}.png を想定しています。サムネイル生成が必要な場合は ai-solo-craft プロジェクトで npm run generate:thumbnail -- --slug "${created.slug}" --no-ai を実行してください。Vercel再デプロイ後にホーム画面に反映されます。',
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'update_article',
  {
    description:
      '既存記事の内容・メタデータを更新する。id または slug で対象を指定し、更新したいフィールドのみを渡す。',
    inputSchema: UpdateArticleSchema,
  },
  async (params) => {
    try {
      const input = UpdateArticleSchema.parse(params);
      const db = getDb();

      // 対象記事を取得
      let query = db.from('contents').select('*').limit(1);
      query = input.id ? query.eq('id', input.id) : query.eq('slug', input.slug!);
      const { data: existing, error: findError } = await query.maybeSingle();

      if (findError) {
        throw new Error(`記事検索失敗: ${findError.message}`);
      }

      if (!existing) {
        throw new Error('指定された記事が見つかりません');
      }

      // 更新ペイロード構築
      const updatePayload: ContentUpdate = {};

      if (input.title !== undefined) updatePayload.title = input.title;
      if (input.body !== undefined) updatePayload.body_markdown = input.body;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.featured !== undefined) updatePayload.featured = input.featured;
      if (input.date !== undefined) updatePayload.date = input.date;
      if (input.heroImageUrl !== undefined) updatePayload.hero_image_url = input.heroImageUrl;

      if (input.body !== undefined && input.readTime === undefined) {
        updatePayload.read_time = estimateReadTime(input.body);
      }

      if (input.readTime !== undefined) {
        updatePayload.read_time = input.readTime;
      }

      // コンテンツ更新
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await db
          .from('contents')
          .update(updatePayload)
          .eq('id', existing.id);

        if (updateError) {
          throw new Error(`記事更新失敗: ${updateError.message}`);
        }
      }

      // タグ更新（指定時は全置換）
      if (input.tags !== undefined) {
        // 既存タグリンクを削除
        await db.from('content_tags').delete().eq('content_id', existing.id);

        const tagCodes = normalizeTags(input.tags);
        if (tagCodes.length > 0) {
          const tagIds = await ensureTagIds(tagCodes);
          if (tagIds.length > 0) {
            const { error: linkError } = await db.from('content_tags').upsert(
              tagIds.map((tagId) => ({
                content_id: existing.id,
                tag_id: tagId,
              })),
              { onConflict: 'content_id,tag_id' }
            );

            if (linkError) {
              throw new Error(`content_tags 更新失敗: ${linkError.message}`);
            }
          }
        }
      }

      return success({
        id: existing.id,
        slug: existing.slug,
        message: `記事を更新しました (${existing.slug})`,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

server.registerTool(
  'search_articles',
  {
    description: '記事をキーワード検索する',
    inputSchema: SearchArticlesSchema,
  },
  async (params) => {
    try {
      const input = SearchArticlesSchema.parse(params);
      const keyword = input.keyword.toLowerCase().trim();
      const rows = await listContents({ limit: Math.max(input.limit, 50) });

      const matchedRows = rows.filter((row) => {
        const haystack = `${row.title}\n${row.body_markdown}\n${row.description}`.toLowerCase();
        return haystack.includes(keyword);
      });

      const metadata = await fetchContentMetadata(matchedRows.map((row) => row.id));
      const articles = matchedRows
        .map((row) =>
          toArticleSummary(
            row,
            metadata.digestEditionByContentId.get(row.id) ?? null,
            metadata.tagsByContentId.get(row.id) ?? []
          )
        )
        .slice(0, input.limit);

      return success({
        count: articles.length,
        articles,
      });
    } catch (error) {
      return failure(error);
    }
  }
);

async function main() {
  await validateConnection();
  console.error('ai-solo-craft MCP: Supabase connection validated');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ai-solo-craft MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
