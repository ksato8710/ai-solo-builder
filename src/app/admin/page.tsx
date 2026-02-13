'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '🏠 概要', icon: '🏠' },
    { id: 'workflow', label: '🔄 ワークフロー', icon: '🔄' },
    { id: 'skills', label: '🛠️ スキル', icon: '🛠️' },
    { id: 'content', label: '📄 コンテンツ分類', icon: '📄' },
    { id: 'architecture', label: '🏗️ アーキテクチャ', icon: '🏗️' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">AI Solo Builder 管理画面</h1>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-600 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'workflow' && <WorkflowTab />}
      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'content' && <ContentTab />}
      {activeTab === 'architecture' && <ArchitectureTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 border border-slate-600 rounded-lg bg-slate-800/50 backdrop-blur-sm shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
          ⚡ 利用可能な管理機能
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <a 
              href="/admin/sources" 
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
            >
              📊 情報源管理
            </a>
            <span className="text-slate-400 text-sm">
              - 5段階レーティング、カテゴリ管理、アクティブ制御
            </span>
          </li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-600/50 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
            📊 システム統計
          </h3>
          <div className="text-sm space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span>配信タイプ:</span>
              <span className="text-emerald-400">3種類 (news/product/digest)</span>
            </div>
            <div className="flex justify-between">
              <span>Digestスケジュール:</span>
              <span className="text-amber-400">朝刊08:00 / 夕刊18:00</span>
            </div>
            <div className="flex justify-between">
              <span>ワークフロー段階:</span>
              <span className="text-blue-400">5 Phase Pipeline</span>
            </div>
            <div className="flex justify-between">
              <span>関連スキル:</span>
              <span className="text-violet-400">4つのコアスキル</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/40 border border-slate-600/50 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
            🎯 現在のフェーズ
          </h3>
          <div className="text-sm space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>運用モード: <span className="text-emerald-400">完全自動化</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>朝刊配信: <span className="text-blue-400">アクティブ</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>夕刊配信: <span className="text-blue-400">アクティブ</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <span>編集枠: <span className="text-amber-400">平日のみ</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-400">💡</span>
          <h4 className="text-sm font-medium text-blue-300">管理画面について</h4>
        </div>
        <p className="text-sm text-blue-200/80">
          AI Solo Builderの運用を可視化・管理するためのダッシュボードです。ワークフロー、スキル、コンテンツ分類、システムアーキテクチャを一元的に確認できます。
        </p>
      </div>
    </div>
  );
}

function WorkflowTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">🔄 ワークフロー概要</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-emerald-400 mb-3">Digestワークフロー（朝刊・夕刊）</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• 目的: 速報性・全体像把握</li>
              <li>• 頻度: 毎日2回（朝刊08:00、夕刊18:00）</li>
              <li>• 自動化度: 高い（5 Phase自動化）</li>
              <li>• 記事長: 3,000〜5,000字</li>
              <li>• 読了時間: 5〜8分</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-400 mb-3">個別記事ワークフロー</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• 目的: 深さ・独自価値</li>
              <li>• 頻度: 週2〜3本</li>
              <li>• 自動化度: 中程度（リサーチは手動要素多い）</li>
              <li>• 記事長: 8,000〜20,000字</li>
              <li>• 読了時間: 10〜20分</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">📊 5 Phase Pipeline</h2>
        <div className="space-y-4">
          {[
            { phase: 'Phase 1', title: '調査', desc: '一次ソース特定・日付確認・自動ソース検出', skill: 'news-research', color: 'bg-red-500' },
            { phase: 'Phase 2', title: '評価・選定', desc: '期間フィルタ・ソース信頼度考慮NVA・事実確認', skill: 'news-evaluation', color: 'bg-amber-500' },
            { phase: 'Phase 3', title: '記事作成', desc: 'Digest + Top3個別記事執筆・ソース情報自動登録', skill: 'digest-writer', color: 'bg-green-500' },
            { phase: 'Phase 4', title: 'UI最適化', desc: '表組み・構造・視覚的メリハリの改善', skill: 'content-optimizer', color: 'bg-blue-500' },
            { phase: 'Phase 5', title: '公開', desc: 'チェックリスト照合・ソース整合性チェック・デプロイ', skill: 'publish-gate', color: 'bg-violet-500' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-200">{item.phase}: {item.title}</span>
                  <span className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">{item.skill}</span>
                </div>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
              {index < 4 && <span className="text-slate-500">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">⏰ 日次スケジュール</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-amber-400 mb-3">🌅 朝刊 (07:30〜08:00)</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>07:30</span><span>ニュース調査開始</span></div>
              <div className="flex justify-between"><span>07:40</span><span>NVA評価・Top10選定</span></div>
              <div className="flex justify-between"><span>07:48</span><span>Digest + Top3記事作成</span></div>
              <div className="flex justify-between"><span>07:55</span><span>UI最適化・公開チェック</span></div>
              <div className="flex justify-between"><span>08:00</span><span className="text-emerald-400">🎯 公開目標</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-blue-400 mb-3">🌆 夕刊 (17:30〜18:00)</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>17:30</span><span>当日日中の調査開始</span></div>
              <div className="flex justify-between"><span>17:40</span><span>朝刊重複回避でTop10選定</span></div>
              <div className="flex justify-between"><span>17:48</span><span>Evening Summary作成</span></div>
              <div className="flex justify-between"><span>17:55</span><span>プロダクト連動・公開チェック</span></div>
              <div className="flex justify-between"><span>18:00</span><span className="text-emerald-400">🎯 公開目標</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillsTab() {
  const skills = [
    {
      name: 'news-research',
      category: 'Core Pipeline',
      description: 'ニュース収集・一次ソース確認・DB保存',
      phase: 'Phase 1',
      automation: '高い',
      features: ['ソース巡回', '一次ソース特定', '日付確認', '自動ソース検出', 'DB保存'],
      color: 'bg-red-500'
    },
    {
      name: 'news-evaluation',
      category: 'Core Pipeline',
      description: '期間フィルタ・NVA・Top10選定',
      phase: 'Phase 2',
      automation: '高い',
      features: ['期間フィルタ', 'ソース信頼度考慮NVA', '事実確認', 'Top10/Top3選定'],
      color: 'bg-amber-500'
    },
    {
      name: 'digest-writer',
      category: 'Core Pipeline',
      description: 'Digest + Top3記事作成',
      phase: 'Phase 3',
      automation: '高い',
      features: ['Digest記事執筆', 'Top3個別記事作成', 'ソース情報自動登録'],
      color: 'bg-green-500'
    },
    {
      name: 'publish-gate',
      category: 'Core Pipeline',
      description: 'チェックリスト照合・デプロイ・報告',
      phase: 'Phase 5',
      automation: '高い',
      features: ['チェックリスト照合', 'ソース整合性チェック', 'デプロイ', 'Slack報告'],
      color: 'bg-violet-500'
    },
    {
      name: 'content-optimizer',
      category: 'Support',
      description: '記事の見せ方を最適化',
      phase: 'Phase 4',
      automation: '中程度',
      features: ['表形式への変換', '構造の改善', '視覚的リズムの調整'],
      color: 'bg-blue-500'
    },
    {
      name: 'article-writer',
      category: 'Individual Articles',
      description: 'SEO最適化された記事をWordPressに投稿',
      phase: 'Individual',
      automation: '中程度',
      features: ['商品比較記事', '口コミ原文掲載', 'マルチソースリサーチ', 'WordPress投稿'],
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">🛠️ スキル一覧</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {skills.map((skill, index) => (
            <div key={index} className="p-4 bg-slate-700/40 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${skill.color}`}></div>
                <h3 className="font-mono font-semibold text-slate-200">{skill.name}</h3>
                <span className="text-xs bg-slate-600 px-2 py-1 rounded text-slate-300">{skill.phase}</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{skill.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">カテゴリ:</span>
                  <span className="text-blue-400">{skill.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">自動化度:</span>
                  <span className={skill.automation === '高い' ? 'text-green-400' : 'text-amber-400'}>
                    {skill.automation}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">機能:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    {skill.features.map((feature, fIndex) => (
                      <li key={fIndex} className="text-slate-300 text-xs">• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">📈 スキル依存関係</h2>
        <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm">
          <div className="text-slate-300">
            <div className="mb-2 text-emerald-400">Digestワークフロー:</div>
            <div className="ml-4 space-y-1">
              <div>news-research → news-evaluation → digest-writer → content-optimizer → publish-gate</div>
            </div>
            <div className="mt-4 mb-2 text-blue-400">個別記事ワークフロー:</div>
            <div className="ml-4 space-y-1">
              <div>article-writer → content-optimizer → publish-gate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentTab() {
  const contentTypes = [
    {
      type: 'news',
      description: '個別ニュース記事',
      tags: ['dev-knowledge', 'case-study', 'product-update'],
      frequency: '週2-3本',
      length: '8,000-20,000字',
      automation: '中程度'
    },
    {
      type: 'digest',
      description: 'まとめ記事（朝刊・夕刊）',
      tags: ['morning-summary', 'evening-summary'],
      frequency: '毎日2回',
      length: '3,000-5,000字',
      automation: '高い'
    },
    {
      type: 'product',
      description: 'プロダクト辞書エントリ',
      tags: ['ai-tool', 'dev-tool', 'platform', 'framework'],
      frequency: '随時更新',
      length: '2,000-5,000字',
      automation: '低い（手動中心）'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">📄 コンテンツ分類体系</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {contentTypes.map((content, index) => (
            <div key={index} className="p-4 bg-slate-700/40 rounded-lg border border-slate-600">
              <h3 className="font-mono font-semibold text-lg mb-3 text-slate-100">{content.type}</h3>
              <p className="text-sm text-slate-400 mb-4">{content.description}</p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">タグ:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {content.tags.map((tag, tIndex) => (
                      <span key={tIndex} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">頻度:</span>
                  <span className="text-slate-300">{content.frequency}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">文字数:</span>
                  <span className="text-slate-300">{content.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-500">自動化:</span>
                  <span className={
                    content.automation.includes('高い') ? 'text-green-400' :
                    content.automation.includes('中程度') ? 'text-amber-400' : 'text-red-400'
                  }>
                    {content.automation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">🔗 コンテンツ関連性</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-emerald-400 mb-2">プロダクト連動原則</h3>
            <p className="text-sm text-slate-300 mb-2">
              任意のコンテンツで製品に言及する場合、必ず安定したプロダクト辞書ページ（<code className="bg-slate-700 px-2 py-1 rounded">/products/[slug]</code>）にリンクする
            </p>
            <div className="text-xs text-slate-400">
              例: AI開発ツールを紹介する記事 → <code>/products/cursor</code> にリンク
            </div>
          </div>
          
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">Digest構成ルール</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Top10ランキング形式でニュース一覧</li>
              <li>• Top3は個別記事として詳細化</li>
              <li>• NVAスコアによる客観的評価</li>
              <li>• 朝刊・夕刊で重複回避</li>
            </ul>
          </div>
          
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <h3 className="font-semibold text-violet-400 mb-2">品質基準</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• 一次ソースの確認必須</li>
              <li>• 正確性・実用性・リンク整合性の担保</li>
              <li>• 404やリンク欠落禁止</li>
              <li>• 未検証情報の断定的記述禁止</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">🏗️ システムアーキテクチャ</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-400">技術スタック</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">フロントエンド:</span>
                <span className="text-slate-300">Next.js</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">データベース:</span>
                <span className="text-slate-300">Supabase (PostgreSQL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">配信API:</span>
                <span className="text-slate-300">Next.js Route Handlers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ホスティング:</span>
                <span className="text-slate-300">Vercel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">自動化:</span>
                <span className="text-slate-300">Clawdbot + スキルシステム</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-emerald-400">配信エンドポイント</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-green-400">GET</span> /api/v1/feed
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-green-400">GET</span> /api/v1/contents
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <span className="text-green-400">GET</span> /api/v1/contents/[slug]
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">🔄 データフロー</h2>
        <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm">
          <div className="space-y-2 text-slate-300">
            <div className="text-blue-400">1. コンテンツ生成</div>
            <div className="ml-4">Clawdbotスキル → Markdownファイル → Git管理</div>
            
            <div className="text-emerald-400 mt-4">2. データベース同期</div>
            <div className="ml-4">npm run sync:content:db → Supabase PostgreSQL</div>
            
            <div className="text-amber-400 mt-4">3. フロントエンド配信</div>
            <div className="ml-4">Next.js → API Routes → Web/Flutter</div>
            
            <div className="text-violet-400 mt-4">4. デプロイメント</div>
            <div className="ml-4">git push → Vercel → 本番公開</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">📂 プロジェクト構成</h2>
        <div className="bg-slate-900/50 p-4 rounded-lg">
          <pre className="text-sm text-slate-300 overflow-x-auto">
{`/Users/satokeita/Dev/ai-navigator/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/           # 管理画面 (このページ)
│   │   ├── api/             # API Routes
│   │   └── ...              # その他ページ
│   ├── components/          # Reactコンポーネント
│   └── lib/                 # ユーティリティ
├── content/                 # コンテンツファイル
│   ├── news/               # ニュース記事 (Markdown)
│   └── products/           # プロダクト辞書 (Markdown)
├── docs/                   # ドキュメント
│   ├── WORKFLOW-ARCHITECTURE.md
│   ├── CHECKLIST.md
│   └── ...
├── scripts/                # 自動化スクリプト
├── supabase/               # Database管理
└── ...`}
          </pre>
        </div>
      </div>

      <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">⚙️ 運用フロー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-green-400 mb-3">自動化フロー</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>cron: 定時実行 (朝刊/夕刊)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>スキル: 5 Phase Pipeline実行</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span>チェック: 品質検証・整合性確認</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                <span>デプロイ: git push → Vercel</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-red-400 mb-3">監視・保守</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>エラー監視: Slack通知</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>品質チェック: pre-commit hooks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>データ同期: DB-Markdownファイル</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                <span>パフォーマンス: セッションクリーンアップ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}