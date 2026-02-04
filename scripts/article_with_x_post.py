#!/usr/bin/env python3
"""
記事作成 + X投稿 統合スクリプト

既存の記事作成cronにX投稿機能を統合する例
記事作成完了後、自動的に対応するX投稿を実行

使用方法:
python3 article_with_x_post.py --create-and-post
python3 article_with_x_post.py --article-id 123 --post-only
"""

import os
import sys
import json
import subprocess
from datetime import datetime

# パス設定
BASE_DIR = "/Users/satokeita/dev/ai-navigator"
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")

# x_post_manager.pyをインポートするためのパス追加
sys.path.append(SCRIPTS_DIR)

try:
    from x_post_manager import execute_article_post, generate_post_from_article
except ImportError:
    print("❌ x_post_manager.py をインポートできません")
    sys.exit(1)

def simulate_article_creation():
    """記事作成のシミュレーション（実際の実装に置き換える）"""
    
    # 実際のAI Navigator記事作成ロジックをここに実装
    # 現在は例として固定データを返す
    
    sample_articles = [
        {
            "title": "Claude 3.5 Sonnetの新機能徹底解説",
            "category": "deep-dive",
            "url": "https://ai.essential-navigator.com/claude-3-5-sonnet-new-features",
            "description": "Anthropic の最新モデル Claude 3.5 Sonnet の新機能を詳細に解析。従来版との性能比較と実用的な活用方法を紹介します。",
            "created_at": datetime.now().isoformat()
        },
        {
            "title": "新しいAI画像生成ツール「ImageForge」レビュー",
            "category": "tools",
            "url": "https://ai.essential-navigator.com/imageforge-review",
            "description": "商用利用可能な新しいAI画像生成サービス ImageForge を実際に使用してレビュー。料金プランと競合サービスとの比較分析。",
            "created_at": datetime.now().isoformat()
        },
        {
            "title": "OpenAI DevDay 2024 重要発表まとめ",
            "category": "news",
            "url": "https://ai.essential-navigator.com/openai-devday-2024-summary",
            "description": "OpenAI DevDay 2024 で発表された新機能と API 更新情報を整理。開発者向けの重要なアップデートを解説します。",
            "created_at": datetime.now().isoformat()
        }
    ]
    
    # ランダムに1つ選択（実際の実装では記事作成ロジック）
    import random
    return random.choice(sample_articles)

def get_existing_article(article_id):
    """既存記事のデータを取得（実際の実装に置き換える）"""
    
    # 実際の実装では、データベースやファイルから記事データを取得
    # 現在は例として固定データを返す
    
    return {
        "id": article_id,
        "title": f"記事ID {article_id} のタイトル",
        "category": "tools",
        "url": f"https://ai.essential-navigator.com/article-{article_id}",
        "description": f"記事ID {article_id} の説明文です。",
        "created_at": datetime.now().isoformat()
    }

def log_workflow_result(article_data, post_success, error_message=None):
    """ワークフロー実行結果をログに記録"""
    
    log_file = os.path.join(BASE_DIR, "workflow_log.json")
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "article": {
            "title": article_data.get("title", ""),
            "url": article_data.get("url", ""),
            "category": article_data.get("category", "")
        },
        "x_post": {
            "success": post_success,
            "error": error_message
        }
    }
    
    # ログファイルに追記
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except:
            logs = []
    
    logs.append(log_entry)
    
    # 最新100件のみ保持
    if len(logs) > 100:
        logs = logs[-100:]
    
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)

def create_article_and_post():
    """記事作成 + X投稿の統合ワークフロー"""
    
    print("=== 記事作成 + X投稿 統合ワークフロー開始 ===")
    
    # Step 1: 記事作成
    print("\n📝 記事作成中...")
    try:
        article_data = simulate_article_creation()
        if not article_data:
            print("記事作成なし - 処理終了")
            return False
        
        print(f"✅ 記事作成完了: {article_data['title']}")
        print(f"   URL: {article_data['url']}")
        print(f"   カテゴリ: {article_data['category']}")
        
    except Exception as e:
        print(f"❌ 記事作成失敗: {e}")
        return False
    
    # Step 2: X投稿実行
    print(f"\n📱 X投稿準備中...")
    try:
        # 投稿内容プレビュー
        post_content = generate_post_from_article(article_data)
        print(f"投稿内容:\n{post_content}\n")
        
        # 投稿実行
        post_success = execute_article_post(article_data)
        
        # 結果ログ記録
        log_workflow_result(article_data, post_success)
        
        if post_success:
            print("✅ ワークフロー完了: 記事作成 + X投稿成功")
        else:
            print("⚠️ ワークフロー部分完了: 記事作成成功、X投稿は待機リストに追加")
        
        return True
        
    except Exception as e:
        print(f"❌ X投稿処理失敗: {e}")
        log_workflow_result(article_data, False, str(e))
        return False

def post_existing_article(article_id):
    """既存記事のX投稿のみを実行"""
    
    print(f"=== 記事ID {article_id} のX投稿実行 ===")
    
    try:
        # 記事データ取得
        article_data = get_existing_article(article_id)
        print(f"記事: {article_data['title']}")
        
        # X投稿実行
        post_success = execute_article_post(article_data)
        
        if post_success:
            print(f"✅ X投稿完了: {article_data['title']}")
        else:
            print(f"⚠️ X投稿は待機リストに追加: {article_data['title']}")
        
        return post_success
        
    except Exception as e:
        print(f"❌ 処理失敗: {e}")
        return False

def check_system_status():
    """システム状態確認"""
    
    print("=== システム状態確認 ===")
    
    # Browser Relay状態
    try:
        result = subprocess.run(['browser', 'status', 'profile=chrome'], 
                              capture_output=True, text=True, timeout=10)
        if 'running: true' in result.stdout:
            print("✅ Browser Relay: 利用可能")
        else:
            print("❌ Browser Relay: 利用不可")
    except:
        print("❌ Browser Relay: 接続エラー")
    
    # ファイル確認
    pending_file = os.path.join(BASE_DIR, "X_PENDING_POSTS.md")
    if os.path.exists(pending_file):
        with open(pending_file, 'r') as f:
            content = f.read()
            pending_count = content.count('### ') - 1 if '###' in content else 0
        print(f"📋 待機タスク: {pending_count}件")
    else:
        print("📋 待機タスク: ファイルなし")
    
    # ログファイル確認
    log_file = os.path.join(BASE_DIR, "workflow_log.json")
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r') as f:
                logs = json.load(f)
            recent_logs = [log for log in logs if log['timestamp'].startswith(datetime.now().strftime('%Y-%m-%d'))]
            print(f"📊 本日の実行ログ: {len(recent_logs)}件")
        except:
            print("📊 ログファイル: 読み込みエラー")
    else:
        print("📊 ログファイル: なし")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='記事作成 + X投稿 統合スクリプト')
    parser.add_argument('--create-and-post', action='store_true', help='記事作成 + X投稿実行')
    parser.add_argument('--article-id', help='既存記事のID')
    parser.add_argument('--post-only', action='store_true', help='X投稿のみ実行（--article-idと併用）')
    parser.add_argument('--status', action='store_true', help='システム状態確認')
    parser.add_argument('--preview', help='記事データJSON文字列の投稿内容プレビュー')
    
    args = parser.parse_args()
    
    if args.status:
        check_system_status()
        return
    
    if args.preview:
        try:
            article_data = json.loads(args.preview)
            post_content = generate_post_from_article(article_data)
            print("=== 投稿内容プレビュー ===")
            print(post_content)
        except Exception as e:
            print(f"❌ プレビュー失敗: {e}")
        return
    
    if args.create_and_post:
        success = create_article_and_post()
        sys.exit(0 if success else 1)
    
    if args.post_only and args.article_id:
        success = post_existing_article(args.article_id)
        sys.exit(0 if success else 1)
    
    # デフォルト: 使用法表示
    parser.print_help()

if __name__ == '__main__':
    main()