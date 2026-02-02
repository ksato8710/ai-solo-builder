import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const contentDirectory = path.join(process.cwd(), 'content/news');

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
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-news': { label: '朝のAIニュース', color: '#3B82F6', emoji: '🌅' },
  'featured-tools': { label: '注目ツール', color: '#8B5CF6', emoji: '🛠️' },
  'deep-dive': { label: '深掘り・ハウツー', color: '#10b981', emoji: '🔬' },
  'case-study': { label: '事例分析', color: '#f59e0b', emoji: '📊' },
};

export function getAllPosts(): Post[] {
  if (!fs.existsSync(contentDirectory)) return [];
  
  const filenames = fs.readdirSync(contentDirectory).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  const posts = filenames.map((filename) => {
    const filePath = path.join(contentDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    
    return {
      slug: data.slug || filename.replace(/\.mdx?$/, ''),
      title: data.title || '',
      date: data.date || '',
      category: data.category || 'morning-news',
      description: data.description || '',
      readTime: data.readTime || 5,
      featured: data.featured || false,
      image: data.image,
    };
  });
  
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(p => p.category === category);
}

export function getFeaturedPosts(): Post[] {
  return getAllPosts().filter(p => p.featured);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!fs.existsSync(contentDirectory)) return null;
  
  const filenames = fs.readdirSync(contentDirectory).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
  
  for (const filename of filenames) {
    const filePath = path.join(contentDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const postSlug = data.slug || filename.replace(/\.mdx?$/, '');
    if (postSlug === slug) {
      const processedContent = await remark().use(html).process(content);
      
      return {
        slug: postSlug,
        title: data.title || '',
        date: data.date || '',
        category: data.category || 'morning-news',
        description: data.description || '',
        readTime: data.readTime || 5,
        featured: data.featured || false,
        image: data.image,
        content,
        htmlContent: processedContent.toString(),
      };
    }
  }
  return null;
}
