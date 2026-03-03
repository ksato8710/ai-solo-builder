import { z } from 'zod';

export const ArticleTypeSchema = z.enum([
  'digest_morning',
  'digest_evening',
  'news',
  'product',
  'dev-knowledge',
  'case-study',
]);

export const ArticleStatusSchema = z.enum([
  'draft',
  'review',
  'published',
  'archived',
]);

export const ListArticlesSchema = z.object({
  type: ArticleTypeSchema.optional().describe('記事タイプでフィルタ'),
  status: ArticleStatusSchema.optional().describe('ステータスでフィルタ'),
  limit: z.number().int().min(1).max(50).default(20).describe('取得件数上限'),
});

export const GetArticleSchema = z
  .object({
    id: z.string().min(1).optional().describe('記事ID'),
    slug: z.string().min(1).optional().describe('記事スラッグ'),
  })
  .refine((value) => Boolean(value.id || value.slug), {
    message: 'id または slug のいずれかは必須です',
  });

export const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200).describe('記事タイトル'),
  body: z.string().min(1).describe('本文（Markdown）'),
  type: ArticleTypeSchema.describe('記事タイプ'),
  tags: z.array(z.string().min(1)).optional().default([]).describe('タグ配列'),
  slug: z.string().min(1).optional().describe('カスタムスラッグ（省略時はタイトルから自動生成）'),
  description: z.string().max(200).optional().describe('記事の要約（省略時は本文から自動生成）'),
  featured: z.boolean().optional().default(false).describe('フィーチャー記事フラグ'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('公開日（YYYY-MM-DD、省略時は今日）'),
  readTime: z.number().int().min(1).optional().describe('読了時間（分、省略時は自動計算）'),
  heroImageUrl: z.string().optional().describe('サムネイル画像URL（例: /thumbnails/slug.png）'),
});

export const PublishArticleSchema = z.object({
  title: z.string().min(1).max(200).describe('記事タイトル'),
  slug: z.string().min(1).describe('URLスラッグ（英数字+ハイフン）'),
  body: z.string().min(1).describe('本文（Markdown）'),
  type: ArticleTypeSchema.describe('記事タイプ'),
  tags: z.array(z.string().min(1)).optional().default([]).describe('タグ配列（例: ["dev-knowledge"]）'),
  description: z.string().max(200).optional().describe('記事の要約（省略時は本文から自動生成、120文字以内推奨）'),
  featured: z.boolean().optional().default(false).describe('フィーチャー記事フラグ'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('公開日（YYYY-MM-DD、省略時は今日）'),
  readTime: z.number().int().min(1).optional().describe('読了時間（分、省略時は自動計算）'),
});

export const UpdateArticleSchema = z.object({
  id: z.string().min(1).optional().describe('記事ID（id または slug のいずれか必須）'),
  slug: z.string().min(1).optional().describe('記事スラッグ（id または slug のいずれか必須）'),
  title: z.string().min(1).max(200).optional().describe('タイトル更新'),
  body: z.string().min(1).optional().describe('本文更新（Markdown）'),
  description: z.string().max(200).optional().describe('要約更新'),
  featured: z.boolean().optional().describe('フィーチャーフラグ更新'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('日付更新'),
  tags: z.array(z.string().min(1)).optional().describe('タグ更新（指定時は全置換）'),
  readTime: z.number().int().min(1).optional().describe('読了時間更新（分）'),
  heroImageUrl: z.string().optional().describe('サムネイル画像URL更新'),
}).refine((value) => Boolean(value.id || value.slug), {
  message: 'id または slug のいずれかは必須です',
});

export const UpdateArticleStatusSchema = z.object({
  id: z.string().min(1).describe('記事ID'),
  status: ArticleStatusSchema.describe('新しいステータス'),
});

export const SearchArticlesSchema = z.object({
  keyword: z.string().min(1).describe('検索キーワード（タイトル・本文にマッチ）'),
  limit: z.number().int().min(1).max(50).default(20).describe('取得件数上限'),
});

export type ArticleType = z.infer<typeof ArticleTypeSchema>;
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;
export type ListArticlesInput = z.infer<typeof ListArticlesSchema>;
export type GetArticleInput = z.infer<typeof GetArticleSchema>;
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type PublishArticleInput = z.infer<typeof PublishArticleSchema>;
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;
export type UpdateArticleStatusInput = z.infer<typeof UpdateArticleStatusSchema>;
export type SearchArticlesInput = z.infer<typeof SearchArticlesSchema>;
