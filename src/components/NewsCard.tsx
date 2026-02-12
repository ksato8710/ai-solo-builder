import type { Post } from '@/lib/types';
import { CATEGORIES, getPostBadge } from '@/lib/types';

interface NewsCardProps {
  post: Post;
  size?: 'large' | 'medium' | 'small';
}

export default function NewsCard({ post, size = 'medium' }: NewsCardProps) {
  const cat = CATEGORIES[post.category] || CATEGORIES['morning-summary'];
  const badge = getPostBadge(post);
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const postUrl = post.url || `/news/${post.slug}`;

  if (size === 'large') {
    return (
      <a href={postUrl} className="group block">
        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-white/10" 
             style={{ backgroundColor: '#1e293b' }}>
          <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
            {post.image ? (
              <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                {cat.emoji}
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: badge.color + '22', color: badge.color }}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
              <span>{formatDate(post.date)}</span>
              <span>・</span>
              <span>{post.readTime}分で読める</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
              {post.title}
            </h2>
            <p className="mt-3 text-sm text-slate-400 line-clamp-1">
              {post.description}
            </p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a href={postUrl} className="group block">
      <div className="rounded-xl overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-white/10 h-full flex flex-col"
           style={{ backgroundColor: '#1e293b' }}>
        <div className="aspect-[16/9] bg-gradient-to-br from-slate-700 to-slate-800 relative flex-shrink-0 overflow-hidden">
          {post.image ? (
            <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
              {cat.emoji}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: badge.color + '22', color: badge.color }}>
              {badge.label}
            </span>
            <span className="text-[10px] text-slate-500">{formatDate(post.date)}</span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 flex-1">
            {post.title}
          </h3>
          <p className="mt-2 text-xs text-slate-400 line-clamp-1">
            {post.description}
          </p>
          <div className="mt-3 text-[10px] text-slate-500">
            {post.readTime}分で読める
          </div>
        </div>
      </div>
    </a>
  );
}
