import type { Post } from '@/lib/types';

interface RelatedArticleCardProps {
  post: Post;
}

export default function RelatedArticleCard({ post }: RelatedArticleCardProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <a 
      href={`/news/${post.slug}`}
      className="group block rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 hover:border-[var(--accent-blue)]/30"
    >
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{formatDate(post.date)}</span>
          {post.readTime && (
            <>
              <span>・</span>
              <span>{post.readTime}分で読める</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
