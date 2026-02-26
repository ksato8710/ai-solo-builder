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

  const getSourceBadgeColor = (credibilityScore?: number) => {
    if (!credibilityScore) return '#8A9E8C';
    if (credibilityScore >= 9) return '#6B8F71';
    if (credibilityScore >= 7) return '#C4926B';
    return '#8A9E8C';
  };

  const postUrl = post.url || `/news/${post.slug}`;

  if (size === 'large') {
    return (
      <a href={postUrl} className="group block">
        <div className="rounded-[var(--radius-card)] overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-border bg-bg-card">
          <div className="aspect-video bg-gradient-to-br from-bg-warm to-bg-card relative overflow-hidden">
            {post.image ? (
              <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                {cat.emoji}
              </div>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: badge.color + '22', color: badge.color }}>
                {badge.label}
              </span>
              {post.source && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-text-deep/40 text-white">
                    {post.source.type === 'primary' && '🥇'}
                    {post.source.type === 'secondary' && '🥈'}
                    {post.source.type === 'tertiary' && '🥉'}
                    {post.source.name}
                  </span>
                  {post.source.credibility_score && (
                    <span className="text-xs font-bold px-2 py-1 rounded-md text-white"
                          style={{ backgroundColor: getSourceBadgeColor(post.source.credibility_score) }}>
                      {post.source.credibility_score}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
              <span>{formatDate(post.date)}</span>
              <span>・</span>
              <span>{post.readTime}分で読める</span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-deep group-hover:text-accent-leaf transition-colors leading-tight">
              {post.title}
            </h2>
            <p className="mt-3 text-sm text-text-muted line-clamp-1">
              {post.description}
            </p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a href={postUrl} className="group block">
      <div className="rounded-xl overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-border h-full flex flex-col bg-bg-card">
        <div className="aspect-[16/9] bg-gradient-to-br from-bg-warm to-bg-card relative flex-shrink-0 overflow-hidden">
          {post.image ? (
            <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">
              {cat.emoji}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: badge.color + '22', color: badge.color }}>
              {badge.label}
            </span>
            {post.source && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: getSourceBadgeColor(post.source.credibility_score) + '22',
                      color: getSourceBadgeColor(post.source.credibility_score)
                    }}>
                {post.source.type === 'primary' && '🥇'}
                {post.source.type === 'secondary' && '🥈'}
                {post.source.type === 'tertiary' && '🥉'}
                {post.source.name}
              </span>
            )}
            <span className="text-[10px] text-text-light">{formatDate(post.date)}</span>
          </div>
          <h3 className="font-heading text-sm font-bold text-text-deep group-hover:text-accent-leaf transition-colors leading-snug line-clamp-2 flex-1">
            {post.title}
          </h3>
          <p className="mt-2 text-xs text-text-muted line-clamp-1">
            {post.description}
          </p>
          <div className="mt-3 text-[10px] text-text-light">
            {post.readTime}分で読める
          </div>
        </div>
      </div>
    </a>
  );
}
