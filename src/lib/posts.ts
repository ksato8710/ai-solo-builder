import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';

const newsDirectory = path.join(process.cwd(), 'content/news');
const productsDirectory = path.join(process.cwd(), 'content/products');

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  description: string;
  readTime: number;
  featured: boolean;
  image?: string;
  content?: string;
  htmlContent?: string;
  type: 'news' | 'product';
  url: string;
  relatedProduct?: string;
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-news': { label: '朝のAIニュース', color: '#3B82F6', emoji: '🌅' },
  'evening-news': { label: '夕刊AIニュース', color: '#F97316', emoji: '🌆' },
  'products': { label: 'プロダクトディレクトリ', color: '#8B5CF6', emoji: '🏷️' },
  'deep-dive': { label: '深掘り・ハウツー', color: '#10b981', emoji: '🔬' },
  'case-study': { label: '事例分析', color: '#f59e0b', emoji: '📊' },
};

function readPostsFromDirectory(directory: string, type: 'news' | 'product'): Post[] {
  if (!fs.existsSync(directory)) return [];
  
  const filenames = fs.readdirSync(directory).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  return filenames.map((filename) => {
    const filePath = path.join(directory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    const slug = data.slug || filename.replace(/\.mdx?$/, '');
    
    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      category: data.category || (type === 'product' ? 'products' : 'morning-news'),
      description: data.description || '',
      readTime: data.readTime || 5,
      featured: data.featured || false,
      image: data.image,
      type,
      url: type === 'product' ? `/products/${slug}` : `/news/${slug}`,
      relatedProduct: data.relatedProduct,
    };
  });
}

/** News articles only (backward compatible) */
export function getAllPosts(): Post[] {
  const posts = readPostsFromDirectory(newsDirectory, 'news');
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Product articles only */
export function getAllProducts(): Post[] {
  const products = readPostsFromDirectory(productsDirectory, 'product');
  return products.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** All content (news + products) */
export function getAllContent(): Post[] {
  const all = [
    ...readPostsFromDirectory(newsDirectory, 'news'),
    ...readPostsFromDirectory(productsDirectory, 'product'),
  ];
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByCategory(category: string): Post[] {
  if (category === 'products') {
    return getAllProducts();
  }
  return getAllPosts().filter(p => p.category === category);
}

export function getFeaturedPosts(): Post[] {
  return getAllContent().filter(p => p.featured);
}

async function findPostInDirectory(directory: string, slug: string, type: 'news' | 'product'): Promise<Post | null> {
  if (!fs.existsSync(directory)) return null;
  
  const filenames = fs.readdirSync(directory).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  for (const filename of filenames) {
    const filePath = path.join(directory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const postSlug = data.slug || filename.replace(/\.mdx?$/, '');
    if (postSlug === slug) {
      const processedContent = await remark().use(remarkGfm).use(html).process(content);
      
      return {
        slug: postSlug,
        title: data.title || '',
        date: data.date || '',
        category: data.category || (type === 'product' ? 'products' : 'morning-news'),
        description: data.description || '',
        readTime: data.readTime || 5,
        featured: data.featured || false,
        image: data.image,
        content,
        htmlContent: processedContent.toString(),
        type,
        url: type === 'product' ? `/products/${postSlug}` : `/news/${postSlug}`,
        relatedProduct: data.relatedProduct,
      };
    }
  }
  return null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return findPostInDirectory(newsDirectory, slug, 'news');
}

export async function getProductBySlug(slug: string): Promise<Post | null> {
  return findPostInDirectory(productsDirectory, slug, 'product');
}
