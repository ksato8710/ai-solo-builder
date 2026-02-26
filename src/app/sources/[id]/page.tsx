import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface SourceDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ApiSource {
  id: string;
  name: string;
  domain: string | null;
  url: string;
  source_type: 'primary' | 'secondary' | 'tertiary' | 'official' | 'media' | 'community' | 'social' | 'other';
  credibility_score: number | null;
  verification_level: 'official' | 'editorial' | 'community' | null;
  description: string | null;
  badge: string;
  article_count?: number;
  avg_nva_score?: number | null;
  created_at?: string;
  updated_at?: string;
}

async function getSource(id: string): Promise<ApiSource | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/sources/${id}`, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch source: ${res.status}`);
    }

    const data = await res.json();
    return data.source || null;
  } catch (error) {
    console.error('Error fetching source:', error);
    return null;
  }
}

export async function generateMetadata({ params }: SourceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const source = await getSource(id);

  if (!source) {
    return {
      title: 'ソースが見つかりません | AI Solo Craft',
    };
  }

  return {
    title: `${source.name} | AI Solo Craft`,
    description: source.description || `${source.name}からの記事一覧と信頼性情報`,
  };
}

export default async function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = await params;
  const source = await getSource(id);

  if (!source) {
    notFound();
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return '#6B8F71';
      case 'secondary': return '#C4926B';
      case 'tertiary': return '#8A9E8C';
      case 'official': return '#6B8F71';
      case 'media': return '#C4926B';
      default: return '#5C7260';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'primary': return '一次情報源';
      case 'secondary': return '二次情報源（メディア）';
      case 'tertiary': return '三次情報源（コミュニティ）';
      case 'official': return '公式';
      case 'media': return 'メディア';
      case 'editorial': return '編集部';
      case 'community': return 'コミュニティ';
      default: return 'その他';
    }
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 9) return '非常に高い';
    if (score >= 7) return '高い';
    if (score >= 5) return '中程度';
    if (score >= 3) return '低い';
    return '非常に低い';
  };

  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/"
              className="text-text-light hover:text-text-deep transition-colors text-sm"
            >
              ← ホームに戻る
            </a>
          </div>

          <div className="bg-bg-card rounded-[var(--radius-card)] p-8 border border-border">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold font-heading text-text-deep">{source.name}</h1>
                  <span className="text-2xl">{source.badge.split(' ')[0]}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: getTypeColor(source.source_type) + '22',
                      color: getTypeColor(source.source_type)
                    }}
                  >
                    {getTypeLabel(source.source_type)}
                  </span>

                  {source.domain && (
                    <span className="text-sm text-text-light font-mono">
                      {source.domain}
                    </span>
                  )}
                </div>

                {source.description && (
                  <p className="text-text-muted text-lg leading-relaxed mb-6">
                    {source.description}
                  </p>
                )}

                <div className="flex items-center gap-6">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent-leaf hover:bg-accent-moss text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    🔗 ソースサイトを見る
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Credibility Score */}
          <div className="bg-bg-card rounded-xl p-6 border border-border">
            <h3 className="text-text-light text-sm font-semibold mb-2">信頼度スコア</h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-text-deep">
                {source.credibility_score || '—'}
              </span>
              <span className="text-sm text-text-light">/ 10</span>
            </div>
            {source.credibility_score && (
              <div className="mt-3">
                <div className="w-full bg-bg-warm rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${source.credibility_score * 10}%`,
                      backgroundColor: getTypeColor(source.source_type)
                    }}
                  />
                </div>
                <p className="text-xs text-text-light mt-2">
                  {source.credibility_score ? getCredibilityLabel(source.credibility_score) : '未評価'}
                </p>
              </div>
            )}
          </div>

          {/* Article Count */}
          <div className="bg-bg-card rounded-xl p-6 border border-border">
            <h3 className="text-text-light text-sm font-semibold mb-2">記事数</h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-text-deep">
                {source.article_count || 0}
              </span>
              <span className="text-sm text-text-light">記事</span>
            </div>
            <p className="text-xs text-text-light mt-2">
              AI Solo Craftに掲載
            </p>
          </div>

          {/* Verification Level */}
          <div className="bg-bg-card rounded-xl p-6 border border-border">
            <h3 className="text-text-light text-sm font-semibold mb-2">検証レベル</h3>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-text-deep">
                {source.verification_level ? getTypeLabel(source.verification_level) : '未分類'}
              </span>
            </div>
            <p className="text-xs text-text-light mt-2">
              情報の検証方法
            </p>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold font-heading text-text-deep mb-4">信頼性について</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">評価基準</h3>
              <ul className="text-sm text-text-light space-y-1">
                <li>• 透明性: 著者・組織の明示 (25%)</li>
                <li>• 専門性: 分野での実績・専門知識 (25%)</li>
                <li>• 検証性: 一次ソースへの言及・引用 (25%)</li>
                <li>• 一貫性: 過去の記事品質・訂正履歴 (25%)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">分類説明</h3>
              <div className="text-sm text-text-light space-y-1">
                <p><strong className="text-accent-leaf">🥇 一次情報:</strong> 公式発表・原典</p>
                <p><strong className="text-accent-bloom">🥈 二次情報:</strong> 専門編集部による分析</p>
                <p><strong className="text-text-light">🥉 三次情報:</strong> コミュニティ・個人の議論</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
