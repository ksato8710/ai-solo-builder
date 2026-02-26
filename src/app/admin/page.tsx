'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillContent, setSkillContent] = useState<string>('');

  const tabs = [
    { id: 'overview', label: '🏠 概要', icon: '🏠' },
    { id: 'workflow', label: '🔄 ワークフロー', icon: '🔄' },
    { id: 'skills', label: '🛠️ スキル', icon: '🛠️' },
    { id: 'content', label: '📄 コンテンツ分類', icon: '📄' },
    { id: 'architecture', label: '🏗️ アーキテクチャ', icon: '🏗️' },
  ];

  const loadSkillContent = async (skillName: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${skillName}`);
      if (response.ok) {
        const content = await response.text();
        setSkillContent(content);
        setSelectedSkill(skillName);
      } else {
        setSkillContent('スキルファイルの読み込みに失敗しました。');
        setSelectedSkill(skillName);
      }
    } catch {
      setSkillContent('スキルファイルの読み込み中にエラーが発生しました。');
      setSelectedSkill(skillName);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold font-heading mb-6 text-text-deep">AI Solo Craft 管理画面</h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-accent-leaf text-white'
                : 'bg-bg-card text-text-muted hover:bg-bg-warm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'workflow' && <WorkflowTab />}
      {activeTab === 'skills' && (
        selectedSkill ? (
          <SkillDetailTab
            skillName={selectedSkill}
            content={skillContent}
            onBack={() => setSelectedSkill(null)}
          />
        ) : (
          <SkillsTab onSkillSelect={loadSkillContent} />
        )
      )}
      {activeTab === 'content' && <ContentTab />}
      {activeTab === 'architecture' && <ArchitectureTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 border border-border rounded-[var(--radius-card)] bg-bg-card">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep flex items-center gap-2">
          ⚡ 利用可能な管理機能
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <a
              href="/admin/sources"
              className="text-accent-leaf hover:text-accent-moss transition-colors font-medium hover:underline"
            >
              📊 Legacy情報源管理
            </a>
            <span className="text-text-light text-sm">
              - 旧 `content_sources` テーブル用（互換運用）
            </span>
          </li>
          <li className="flex items-start gap-3">
            <a
              href="/admin/source-intelligence"
              className="text-accent-bark hover:text-accent-bark/80 transition-colors font-medium hover:underline"
            >
              🧭 Source Intelligence
            </a>
            <span className="text-text-light text-sm">
              - ニュースレター / 一次情報 / 日本メディアを統合管理
            </span>
          </li>
          <li className="flex items-start gap-3">
            <a
              href="/admin/workflows"
              className="text-accent-moss hover:text-accent-leaf transition-colors font-medium hover:underline"
            >
              🔗 記事作成ワークフロー管理
            </a>
            <span className="text-text-light text-sm">
              - 記事種別 × ソースの役割（detect / verify / localize）を可視化
            </span>
          </li>
          <li className="flex items-start gap-3">
            <a
              href="/admin/schedules"
              className="text-accent-bloom hover:text-accent-bloom/80 transition-colors font-medium hover:underline"
            >
              ⏱️ 配信スケジュール管理
            </a>
            <span className="text-text-light text-sm">
              - 参照ニュースレターの配信時刻と統合遅延（fetch delay）を管理
            </span>
          </li>
          <li className="flex items-start gap-3">
            <a
              href="/admin/collection"
              className="text-cat-tool hover:text-cat-tool/80 transition-colors font-medium hover:underline"
            >
              📬 競合ニュースレター受信管理
            </a>
            <span className="text-text-light text-sm">
              - `ktlabworks@gmail.com` への受信実績を記録し、未受信を監視
            </span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
          <h3 className="font-semibold font-heading mb-4 text-text-deep flex items-center gap-2">
            📊 システム統計
          </h3>
          <div className="text-sm space-y-2 text-text-muted">
            <div className="flex justify-between">
              <span>配信タイプ:</span>
              <span className="text-accent-moss">3種類 (news/product/digest)</span>
            </div>
            <div className="flex justify-between">
              <span>Digestスケジュール:</span>
              <span className="text-accent-bloom">朝刊08:00 / 夕刊18:00</span>
            </div>
            <div className="flex justify-between">
              <span>ワークフロー段階:</span>
              <span className="text-accent-leaf">5 Phase Pipeline</span>
            </div>
            <div className="flex justify-between">
              <span>管理対象エンティティ:</span>
              <span className="text-accent-bark">source/workflow/schedule/collection</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
          <h3 className="font-semibold font-heading mb-4 text-text-deep flex items-center gap-2">
            🎯 現在のフェーズ
          </h3>
          <div className="text-sm space-y-2 text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-moss rounded-full"></span>
              <span>運用モード: <span className="text-accent-moss">完全自動化</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-leaf rounded-full"></span>
              <span>朝刊配信: <span className="text-accent-leaf">アクティブ</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-leaf rounded-full"></span>
              <span>夕刊配信: <span className="text-accent-leaf">アクティブ</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-bloom rounded-full"></span>
              <span>編集枠: <span className="text-accent-bloom">平日のみ</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-accent-leaf/10 border border-accent-leaf/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-leaf">💡</span>
          <h4 className="text-sm font-medium text-accent-leaf">管理画面について</h4>
        </div>
        <p className="text-sm text-text-muted">
          AI Solo Craftの運用を可視化・管理するためのダッシュボードです。ワークフロー、スキル、コンテンツ分類、システムアーキテクチャを一元的に確認できます。
        </p>
      </div>
    </div>
  );
}

function WorkflowTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">🔄 ワークフロー概要</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold font-heading text-accent-moss mb-3">Digestワークフロー（朝刊・夕刊）</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>• 目的: 速報性・全体像把握</li>
              <li>• 頻度: 毎日2回（朝刊08:00、夕刊18:00）</li>
              <li>• 自動化度: 高い（5 Phase自動化）</li>
              <li>• 記事長: 3,000〜5,000字</li>
              <li>• 読了時間: 5〜8分</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold font-heading text-accent-leaf mb-3">個別記事ワークフロー</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>• 目的: 深さ・独自価値</li>
              <li>• 頻度: 週2〜3本</li>
              <li>• 自動化度: 中程度（リサーチは手動要素多い）</li>
              <li>• 記事長: 8,000〜20,000字</li>
              <li>• 読了時間: 10〜20分</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 個別記事ワークフロー詳細 */}
      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">📝 個別記事ワークフロー詳細</h2>

        <div className="mb-6">
          <h3 className="font-semibold font-heading text-accent-leaf mb-3">3つの記事タイプ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-bg-warm rounded-lg border border-accent-moss/30">
              <h4 className="font-semibold font-heading text-accent-moss mb-2">1. キュレーション型（★推奨）</h4>
              <p className="text-xs text-text-muted mb-2">既存リソースを評価・比較し、最適な学習パスを案内</p>
              <ul className="text-xs text-text-light space-y-1">
                <li>• 一次ソースへの敬意</li>
                <li>• 独自の評価軸で整理</li>
                <li>• 「どれを読むべきか」を提示</li>
              </ul>
            </div>

            <div className="p-4 bg-bg-warm rounded-lg border border-accent-bloom/30">
              <h4 className="font-semibold font-heading text-accent-bloom mb-2">2. 事例分析型</h4>
              <p className="text-xs text-text-muted mb-2">成功/失敗事例を深掘り分析し、再現可能な教訓を抽出</p>
              <ul className="text-xs text-text-light space-y-1">
                <li>• 具体的な数字（売上、ユーザー数）</li>
                <li>• 時系列での軌跡</li>
                <li>• 成功/失敗要因の分析</li>
              </ul>
            </div>

            <div className="p-4 bg-bg-warm rounded-lg border border-accent-bark/30">
              <h4 className="font-semibold font-heading text-accent-bark mb-2">3. 実践ガイド型</h4>
              <p className="text-xs text-text-muted mb-2">手を動かして学べる実践的なチュートリアル</p>
              <ul className="text-xs text-text-light space-y-1">
                <li>• ステップバイステップ手順</li>
                <li>• 実際のコード例</li>
                <li>• トラブルシューティング</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold font-heading text-accent-moss mb-3">作成プロセス</h3>
          <div className="space-y-3">
            {[
              { step: 'Step 1', title: 'テーマ選定', desc: 'トレンド分析・読者ニーズ・専門性のバランス', color: 'bg-danger' },
              { step: 'Step 2', title: 'リサーチ', desc: '一次ソース収集・既存記事調査・専門家意見', color: 'bg-accent-bloom' },
              { step: 'Step 3', title: '構造設計', desc: '記事構成・読者の学習パス・独自価値の設定', color: 'bg-accent-moss' },
              { step: 'Step 4', title: '執筆', desc: '8,000-20,000字での詳細記述・実例・図表', color: 'bg-accent-leaf' },
              { step: 'Step 5', title: 'レビュー', desc: '事実確認・リンク検証・読みやすさ調整', color: 'bg-accent-bark' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-bg-warm rounded-lg">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-deep text-sm">{item.step}: {item.title}</span>
                  </div>
                  <p className="text-xs text-text-light">{item.desc}</p>
                </div>
                {index < 4 && <span className="text-text-light text-sm">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold font-heading text-accent-leaf mb-3">スケジュール（平日12:30編集枠）</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            {[
              { day: '月', focus: 'dev-knowledge', desc: '開発技術・ツール解説' },
              { day: '火', focus: 'case-study', desc: '成功事例・失敗分析' },
              { day: '水', focus: 'product辞書更新', desc: 'プロダクト情報整備' },
              { day: '木', focus: 'dev-knowledge', desc: 'フレームワーク・手法' },
              { day: '金', focus: 'case-study', desc: 'ビジネス事例・戦略' },
            ].map((item, index) => (
              <div key={index} className="p-3 bg-bg-warm rounded border border-border">
                <div className="font-semibold text-text-deep mb-1">{item.day}曜日</div>
                <div className="text-xs text-accent-leaf mb-1">{item.focus}</div>
                <div className="text-xs text-text-light">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">📊 5 Phase Pipeline</h2>
        <div className="space-y-4">
          {[
            { phase: 'Phase 1', title: '調査', desc: '一次ソース特定・日付確認・自動ソース検出', skill: 'news-research', color: 'bg-danger' },
            { phase: 'Phase 2', title: '評価・選定', desc: '期間フィルタ・ソース信頼度スコア・事実確認', skill: 'news-evaluation', color: 'bg-accent-bloom' },
            { phase: 'Phase 3', title: '記事作成', desc: 'Digest + Top3個別記事執筆・ソース情報自動登録', skill: 'digest-writer', color: 'bg-accent-moss' },
            { phase: 'Phase 4', title: 'UI最適化', desc: '表組み・構造・視覚的メリハリの改善', skill: 'content-optimizer', color: 'bg-accent-leaf' },
            { phase: 'Phase 5', title: '公開', desc: 'チェックリスト照合・ソース整合性チェック・デプロイ', skill: 'publish-gate', color: 'bg-accent-bark' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-bg-warm rounded-lg">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-deep">{item.phase}: {item.title}</span>
                  <span className="text-xs bg-bg-card px-2 py-1 rounded text-text-muted">{item.skill}</span>
                </div>
                <p className="text-sm text-text-light">{item.desc}</p>
              </div>
              {index < 4 && <span className="text-text-light">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">⏰ 日次スケジュール</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold font-heading text-accent-bloom mb-3">🌅 朝刊 (07:30〜08:00)</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex justify-between"><span>07:30</span><span>ニュース調査開始</span></div>
              <div className="flex justify-between"><span>07:40</span><span>スコア評価・Top10選定</span></div>
              <div className="flex justify-between"><span>07:48</span><span>Digest + Top3記事作成</span></div>
              <div className="flex justify-between"><span>07:55</span><span>UI最適化・公開チェック</span></div>
              <div className="flex justify-between"><span>08:00</span><span className="text-accent-moss">🎯 公開目標</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold font-heading text-accent-leaf mb-3">🌆 夕刊 (17:30〜18:00)</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex justify-between"><span>17:30</span><span>当日日中の調査開始</span></div>
              <div className="flex justify-between"><span>17:40</span><span>朝刊重複回避でTop10選定</span></div>
              <div className="flex justify-between"><span>17:48</span><span>Evening Summary作成</span></div>
              <div className="flex justify-between"><span>17:55</span><span>プロダクト連動・公開チェック</span></div>
              <div className="flex justify-between"><span>18:00</span><span className="text-accent-moss">🎯 公開目標</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillsTab({ onSkillSelect }: { onSkillSelect: (skillName: string) => void }) {
  const skills = [
    {
      name: 'news-research',
      category: 'Core Pipeline',
      description: 'ニュース収集・一次ソース確認・DB保存',
      phase: 'Phase 1',
      automation: '高い',
      features: ['ソース巡回', '一次ソース特定', '日付確認', '自動ソース検出', 'DB保存'],
      color: 'bg-danger'
    },
    {
      name: 'news-evaluation',
      category: 'Core Pipeline',
      description: '期間フィルタ・スコア評価・Top10選定',
      phase: 'Phase 2',
      automation: '高い',
      features: ['期間フィルタ', 'ソース信頼度スコア', '事実確認', 'Top10/Top3選定'],
      color: 'bg-accent-bloom'
    },
    {
      name: 'digest-writer',
      category: 'Core Pipeline',
      description: 'Digest + Top3記事作成',
      phase: 'Phase 3',
      automation: '高い',
      features: ['Digest記事執筆', 'Top3個別記事作成', 'ソース情報自動登録'],
      color: 'bg-accent-moss'
    },
    {
      name: 'publish-gate',
      category: 'Core Pipeline',
      description: 'チェックリスト照合・デプロイ・報告',
      phase: 'Phase 5',
      automation: '高い',
      features: ['チェックリスト照合', 'ソース整合性チェック', 'デプロイ', 'Slack報告'],
      color: 'bg-accent-bark'
    },
    {
      name: 'content-optimizer',
      category: 'Support',
      description: '記事の見せ方を最適化',
      phase: 'Phase 4',
      automation: '中程度',
      features: ['表形式への変換', '構造の改善', '視覚的リズムの調整'],
      color: 'bg-accent-leaf'
    },
    {
      name: 'article-writer',
      category: 'Individual Articles',
      description: 'SEO最適化された記事をWordPressに投稿',
      phase: 'Individual',
      automation: '中程度',
      features: ['商品比較記事', '口コミ原文掲載', 'マルチソースリサーチ', 'WordPress投稿'],
      color: 'bg-accent-moss'
    },
    {
      name: 'newsletter-curation-workflow',
      category: 'Newsletter Operations',
      description: '複数ニュースレター検知→一次情報検証→日本語ローカライズの運用スキル',
      phase: 'Cross Workflow',
      automation: '高い',
      features: ['検知レイヤー運用', 'EN/JPリンク併記', '法務・配信ガードレール', '配信前チェック'],
      color: 'bg-cat-content'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">🛠️ スキル一覧</h2>
        <p className="text-sm text-text-light mb-4">スキル名をクリックすると詳細（SKILL.md）を確認できます。</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="p-4 bg-bg-warm rounded-lg border border-border cursor-pointer hover:bg-bg-card transition-colors"
              onClick={() => onSkillSelect(skill.name)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${skill.color}`}></div>
                <h3 className="font-mono font-semibold text-text-deep hover:text-accent-leaf">{skill.name}</h3>
                <span className="text-xs bg-bg-card px-2 py-1 rounded text-text-muted">{skill.phase}</span>
                <span className="text-xs text-accent-leaf ml-auto">詳細 →</span>
              </div>
              <p className="text-sm text-text-light mb-3">{skill.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-light">カテゴリ:</span>
                  <span className="text-accent-leaf">{skill.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-light">自動化度:</span>
                  <span className={skill.automation === '高い' ? 'text-accent-moss' : 'text-accent-bloom'}>
                    {skill.automation}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-text-light">機能:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    {skill.features.map((feature, fIndex) => (
                      <li key={fIndex} className="text-text-muted text-xs">• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">📈 スキル依存関係</h2>
        <div className="bg-bg-cream p-4 rounded-lg font-mono text-sm">
          <div className="text-text-muted">
            <div className="mb-2 text-accent-moss">Digestワークフロー:</div>
            <div className="ml-4 space-y-1">
              <div>news-research → news-evaluation → digest-writer → content-optimizer → publish-gate</div>
            </div>
            <div className="mt-4 mb-2 text-accent-leaf">個別記事ワークフロー:</div>
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
      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">📄 コンテンツ分類体系</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {contentTypes.map((content, index) => (
            <div key={index} className="p-4 bg-bg-warm rounded-lg border border-border">
              <h3 className="font-mono font-semibold font-heading text-lg mb-3 text-text-deep">{content.type}</h3>
              <p className="text-sm text-text-light mb-4">{content.description}</p>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-text-light">タグ:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {content.tags.map((tag, tIndex) => (
                      <span key={tIndex} className="bg-accent-leaf/20 text-accent-leaf px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-light">頻度:</span>
                  <span className="text-text-muted">{content.frequency}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-light">文字数:</span>
                  <span className="text-text-muted">{content.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-light">自動化:</span>
                  <span className={
                    content.automation.includes('高い') ? 'text-accent-moss' :
                    content.automation.includes('中程度') ? 'text-accent-bloom' : 'text-danger'
                  }>
                    {content.automation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">🔗 コンテンツ関連性</h2>
        <div className="space-y-4">
          <div className="p-4 bg-bg-cream rounded-lg">
            <h3 className="font-semibold font-heading text-accent-moss mb-2">プロダクト連動原則</h3>
            <p className="text-sm text-text-muted mb-2">
              任意のコンテンツで製品に言及する場合、必ず安定したプロダクト辞書ページ（<code className="bg-bg-warm px-2 py-1 rounded">/products/[slug]</code>）にリンクする
            </p>
            <div className="text-xs text-text-light">
              例: AI開発ツールを紹介する記事 → <code>/products/cursor</code> にリンク
            </div>
          </div>

          <div className="p-4 bg-bg-cream rounded-lg">
            <h3 className="font-semibold font-heading text-accent-leaf mb-2">Digest構成ルール</h3>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Top10ランキング形式でニュース一覧</li>
              <li>• Top3は個別記事として詳細化</li>
              <li>• スコアによる客観的評価</li>
              <li>• 朝刊・夕刊で重複回避</li>
            </ul>
          </div>

          <div className="p-4 bg-bg-cream rounded-lg">
            <h3 className="font-semibold font-heading text-accent-bark mb-2">品質基準</h3>
            <ul className="text-sm text-text-muted space-y-1">
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

function SkillDetailTab({ skillName, content, onBack }: { skillName: string, content: string, onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-bg-warm hover:bg-bg-card text-text-deep rounded-lg transition-colors flex items-center gap-2"
        >
          ← スキル一覧に戻る
        </button>
        <h1 className="text-2xl font-bold font-heading text-text-deep">📄 {skillName}</h1>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep flex items-center gap-2">
          📋 SKILL.md 内容
        </h2>
        <div className="bg-bg-cream rounded-lg p-4 max-h-96 overflow-y-auto">
          <pre className="text-sm text-text-muted whitespace-pre-wrap font-mono leading-relaxed">
            {content || 'ローディング中...'}
          </pre>
        </div>
      </div>

      <div className="p-4 bg-accent-leaf/10 border border-accent-leaf/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-leaf">💡</span>
          <h4 className="text-sm font-medium text-accent-leaf">スキルファイルについて</h4>
        </div>
        <p className="text-sm text-text-muted">
          このスキルファイルは <code className="bg-bg-warm px-2 py-1 rounded">.claude/skills</code> / <code className="bg-bg-warm px-2 py-1 rounded">~/.claude/skills</code> / <code className="bg-bg-warm px-2 py-1 rounded">~/.clawdbot/skills</code> / <code className="bg-bg-warm px-2 py-1 rounded">~/.codex/skills</code> を順に探索して読み込まれます。
          実際の実行手順、使用方法、設定例、運用ガードレールなどが記載されています。
        </p>
      </div>
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">🏗️ システムアーキテクチャ</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold font-heading text-accent-leaf">技術スタック</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">フロントエンド:</span>
                <span className="text-text-muted">Next.js</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">データベース:</span>
                <span className="text-text-muted">Supabase (PostgreSQL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">配信API:</span>
                <span className="text-text-muted">Next.js Route Handlers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">ホスティング:</span>
                <span className="text-text-muted">Vercel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">自動化:</span>
                <span className="text-text-muted">Clawdbot + スキルシステム</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold font-heading text-accent-moss">配信エンドポイント</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-bg-cream p-2 rounded">
                <span className="text-accent-moss">GET</span> /api/v1/feed
              </div>
              <div className="bg-bg-cream p-2 rounded">
                <span className="text-accent-moss">GET</span> /api/v1/contents
              </div>
              <div className="bg-bg-cream p-2 rounded">
                <span className="text-accent-moss">GET</span> /api/v1/contents/[slug]
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">🔄 データフロー</h2>
        <div className="bg-bg-cream p-4 rounded-lg font-mono text-sm">
          <div className="space-y-2 text-text-muted">
            <div className="text-accent-leaf">1. コンテンツ生成</div>
            <div className="ml-4">Clawdbotスキル → Markdownファイル → Git管理</div>

            <div className="text-accent-moss mt-4">2. データベース同期</div>
            <div className="ml-4">npm run sync:content:db → Supabase PostgreSQL</div>

            <div className="text-accent-bloom mt-4">3. フロントエンド配信</div>
            <div className="ml-4">Next.js → API Routes → Web/Flutter</div>

            <div className="text-accent-bark mt-4">4. デプロイメント</div>
            <div className="ml-4">git push → Vercel → 本番公開</div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">📂 プロジェクト構成</h2>
        <div className="bg-bg-cream p-4 rounded-lg">
          <pre className="text-sm text-text-muted overflow-x-auto">
{`/Users/satokeita/Dev/ai-solo-craft/
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

      <div className="p-6 bg-bg-card border border-border rounded-[var(--radius-card)]">
        <h2 className="text-xl font-semibold font-heading mb-4 text-text-deep">⚙️ 運用フロー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold font-heading text-accent-moss mb-3">自動化フロー</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-moss rounded-full"></span>
                <span>cron: 定時実行 (朝刊/夕刊)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-leaf rounded-full"></span>
                <span>スキル: 5 Phase Pipeline実行</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-bloom rounded-full"></span>
                <span>チェック: 品質検証・整合性確認</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-bark rounded-full"></span>
                <span>デプロイ: git push → Vercel</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold font-heading text-danger mb-3">監視・保守</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-danger rounded-full"></span>
                <span>エラー監視: Slack通知</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-bloom rounded-full"></span>
                <span>品質チェック: pre-commit hooks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-bloom rounded-full"></span>
                <span>データ同期: DB-Markdownファイル</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cat-content rounded-full"></span>
                <span>パフォーマンス: セッションクリーンアップ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
