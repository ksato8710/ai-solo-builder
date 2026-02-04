#!/usr/bin/env python3
"""
X投稿管理スクリプト - 記事作成cronとの連携用

機能:
- 記事データからX投稿内容を自動生成
- Browser Relayでの投稿実行
- 失敗時のTaskリスト管理
- 待機タスクの手動実行支援

使用方法:
python3 x_post_manager.py --article-data article.json --execute
python3 x_post_manager.py --list-pending
python3 x_post_manager.py --execute-pending
"""

import os
import sys
import json
import subprocess
from datetime import datetime
import re

# ファイルパス設定
BASE_DIR = "/Users/satokeita/dev/ai-navigator"
PENDING_FILE = os.path.join(BASE_DIR, "X_PENDING_POSTS.md")
COMPLETED_FILE = os.path.join(BASE_DIR, "X_COMPLETED_POSTS.md")
FAILED_FILE = os.path.join(BASE_DIR, "X_FAILED_POSTS.md")

# トーン改善パターン（痛々しい表現の除去）
TONE_FIXES = [
    (r'([！!]){2,}', '。'),
    (r'始動[！!]*', 'です'),
    (r'お待たせしました[。！!]*', ''),
    (r'革新的[なの]*', '新しい'),
    (r'差別化', '特徴'),
    (r'戦略[的に]*', ''),
    (r'すごい[です！!]*', '優秀です'),
    (r'やばい[です！!]*', '注目すべきです'),
    (r'神ツール', '優秀なツール'),
    (r'\n{3,}', '\n\n'),
]

def improve_tone(text):
    """投稿テキストのトーンを改善"""
    result = text
    for pattern, replacement in TONE_FIXES:
        result = re.sub(pattern, replacement, result)
    return result.strip()

def generate_post_from_article(article_data):
    """記事データからX投稿内容を自動生成"""
    
    title = article_data.get('title', '')
    category = article_data.get('category', 'unknown')
    url = article_data.get('url', '')
    description = article_data.get('description', '')
    
    # URLの調整（ai.essential-navigator.com形式に）
    if url.startswith('https://'):
        url_display = url.replace('https://', '').replace('http://', '')
    else:
        url_display = f"ai.essential-navigator.com/{url}"
    
    # カテゴリ別投稿テンプレート
    if category in ['tools', 'tool-review']:
        # 新ツール紹介
        post_content = f"""【発見】{title}

詳細記事で解説📝

{description[:50]}...

{url_display}

#AIツール #新ツール"""
    
    elif category in ['deep-dive', 'technical']:
        # 技術解説
        post_content = f"""🔬【技術解析】{title}

詳細分析を記事で公開📊

{description[:50]}...

記事: {url_display}

#AIツール #技術解説"""
    
    elif category in ['morning-news', 'evening-news', 'news']:
        # ニュース
        post_content = f"""📰【AI速報】{title}

詳細をまとめました🗞️

{description[:50]}...

{url_display}

#AI最新情報"""
    
    elif category in ['case-study', 'comparison']:
        # 事例・比較
        post_content = f"""📊【分析】{title}

記事で詳しく解説📝

{description[:50]}...

{url_display}

#AIツール #事例分析"""
    
    else:
        # デフォルト
        post_content = f"""{title}

記事を公開しました📝

{description[:50]}...

{url_display}

#AIツール"""
    
    # トーン改善
    return improve_tone(post_content)

def is_browser_relay_available():
    """Browser Relayの利用可能性チェック"""
    try:
        result = subprocess.run(['browser', 'status', 'profile=chrome'], 
                              capture_output=True, text=True, timeout=10)
        return 'running: true' in result.stdout and 'cdpReady: true' in result.stdout
    except:
        return False

def execute_x_post_with_browser_relay(post_content):
    """Browser RelayでX投稿を実行"""
    
    if not is_browser_relay_available():
        raise Exception("Browser Relay not available")
    
    # JavaScript用エスケープ
    content_js = json.dumps(post_content)[1:-1]
    
    try:
        # 投稿画面に移動
        result1 = subprocess.run([
            'browser', 'navigate', 'profile=chrome', 
            'targetUrl=https://x.com/compose/post'
        ], capture_output=True, text=True, timeout=30)
        
        if result1.returncode != 0:
            raise Exception(f"Navigation failed: {result1.stderr}")
        
        # タブID取得
        tabs_result = subprocess.run([
            'browser', 'tabs', 'profile=chrome'
        ], capture_output=True, text=True, timeout=10)
        
        if tabs_result.returncode != 0:
            raise Exception("Failed to get tabs")
        
        # 簡易的にタブIDを抽出（実際の実装では JSON parsing推奨）
        tab_lines = tabs_result.stdout.split('\n')
        target_id = None
        for line in tab_lines:
            if 'x.com' in line and 'targetId' in line:
                # targetId を抽出
                parts = line.split('"')
                for i, part in enumerate(parts):
                    if part == 'targetId':
                        target_id = parts[i+2]
                        break
                break
        
        if not target_id:
            raise Exception("Could not find X.com tab")
        
        # テキスト入力
        js_command = f'const textarea = document.querySelector(\'[data-testid="tweetTextarea_0"]\'); if(textarea) {{ textarea.textContent = \'{content_js}\'; textarea.dispatchEvent(new Event(\'input\', {{bubbles: true}})); return \'text_entered\'; }} else {{ return \'textarea_not_found\'; }}'
        
        result2 = subprocess.run([
            'browser', 'act', f'targetId={target_id}',
            f'request={{"kind": "evaluate", "fn": "{js_command}"}}'
        ], capture_output=True, text=True, timeout=20)
        
        if 'text_entered' not in result2.stdout:
            raise Exception("Text input failed")
        
        # 投稿実行
        click_command = 'const btn = document.querySelector(\'[data-testid="tweetButton"]\'); if(btn && !btn.disabled) { btn.click(); return \'posted\'; } else { return \'button_disabled\'; }'
        
        result3 = subprocess.run([
            'browser', 'act', f'targetId={target_id}',
            f'request={{"kind": "evaluate", "fn": "{click_command}"}}'
        ], capture_output=True, text=True, timeout=20)
        
        if 'posted' in result3.stdout:
            return True
        else:
            raise Exception("Post button was disabled or click failed")
    
    except Exception as e:
        raise Exception(f"Browser Relay execution failed: {e}")

def add_to_pending_tasks(article_data, post_content, reason="unknown"):
    """未投稿タスクをリストに追加"""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    title = article_data.get('title', '無題')
    url = article_data.get('url', '')
    category = article_data.get('category', 'unknown')
    
    # 優先度設定
    priority_map = {
        'tools': '高（新ツール系）',
        'tool-review': '高（新ツール系）',
        'morning-news': '高（速報性）',
        'evening-news': '高（速報性）',
        'news': '高（速報性）',
        'deep-dive': '中（解説系）',
        'technical': '中（解説系）',
        'case-study': '低（事例系）',
        'comparison': '中（比較系）'
    }
    priority = priority_map.get(category, '中')
    
    # 期限設定
    deadline_map = {
        'tools': '当日中',
        'tool-review': '当日中',
        'morning-news': '6時間以内',
        'evening-news': '6時間以内',
        'news': '6時間以内',
        'deep-dive': '2日以内',
        'technical': '2日以内',
        'case-study': '1週間以内',
        'comparison': '2日以内'
    }
    deadline = deadline_map.get(category, '2日以内')
    
    task_entry = f"""
### {timestamp} - {category}記事
- **記事:** [{title}]({url})
- **投稿内容:**
  ```
  {post_content}
  ```
- **理由:** {reason}
- **優先度:** {priority}
- **期限:** {deadline}
"""
    
    # ファイル更新
    os.makedirs(os.path.dirname(PENDING_FILE), exist_ok=True)
    
    if not os.path.exists(PENDING_FILE):
        with open(PENDING_FILE, 'w', encoding='utf-8') as f:
            f.write("# X投稿待機リスト\n\n## 未投稿（要手動実行）\n")
    
    # 未投稿セクションに追記
    with open(PENDING_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # "## 未投稿（要手動実行）" の後に挿入
    if "## 未投稿（要手動実行）" in content:
        parts = content.split("## 未投稿（要手動実行）")
        if len(parts) > 1:
            # 次のセクションを探す
            next_section = parts[1].split("## ")[0] if "## " in parts[1] else parts[1]
            remaining = parts[1][len(next_section):] if "## " in parts[1] else ""
            
            new_content = parts[0] + "## 未投稿（要手動実行）" + next_section + task_entry
            if remaining:
                new_content += "## " + remaining
        else:
            new_content = content + task_entry
    else:
        new_content = content + "\n## 未投稿（要手動実行）\n" + task_entry
    
    with open(PENDING_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 投稿タスクをリストに追加: {title}")

def log_successful_post(article_data, post_content):
    """投稿成功をログに記録"""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    title = article_data.get('title', '無題')
    url = article_data.get('url', '')
    
    log_entry = f"""
### {timestamp} - 投稿成功
- **記事:** [{title}]({url})
- **投稿内容:** {post_content[:50]}...
- **投稿時刻:** {timestamp}
"""
    
    os.makedirs(os.path.dirname(COMPLETED_FILE), exist_ok=True)
    
    if not os.path.exists(COMPLETED_FILE):
        with open(COMPLETED_FILE, 'w', encoding='utf-8') as f:
            f.write("# X投稿完了ログ\n\n")
    
    with open(COMPLETED_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry)
    
    print(f"✅ 投稿完了ログに記録: {title}")

def execute_article_post(article_data):
    """記事データからX投稿を実行（メイン関数）"""
    
    if not article_data:
        print("記事データがありません")
        return False
    
    # 投稿内容生成
    post_content = generate_post_from_article(article_data)
    print(f"生成された投稿内容:\n{post_content}\n")
    
    # Browser Relay での投稿実行を試行
    try:
        if is_browser_relay_available():
            print("Browser Relay での投稿を実行中...")
            execute_x_post_with_browser_relay(post_content)
            log_successful_post(article_data, post_content)
            print(f"✅ X投稿完了: {article_data.get('title', '無題')}")
            return True
        else:
            print("⚠️ Browser Relay利用不可 - Taskリストに追加")
            add_to_pending_tasks(article_data, post_content, reason="browser_relay_unavailable")
            return False
    except Exception as e:
        print(f"⚠️ 投稿実行失敗: {e}")
        add_to_pending_tasks(article_data, post_content, reason=f"error: {e}")
        return False

def list_pending_tasks():
    """待機中のタスク一覧表示"""
    
    if not os.path.exists(PENDING_FILE):
        print("未投稿タスクはありません")
        return
    
    with open(PENDING_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("=== 未投稿タスク一覧 ===")
    print(content)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='X投稿管理スクリプト')
    parser.add_argument('--article-data', help='記事データJSONファイル')
    parser.add_argument('--article-json', help='記事データJSON文字列')
    parser.add_argument('--execute', action='store_true', help='投稿を実行')
    parser.add_argument('--list-pending', action='store_true', help='待機タスクを一覧表示')
    parser.add_argument('--test-content', help='投稿内容テスト')
    
    args = parser.parse_args()
    
    if args.list_pending:
        list_pending_tasks()
        return
    
    if args.test_content:
        improved = improve_tone(args.test_content)
        print("=== トーン改善結果 ===")
        print(improved)
        return
    
    # 記事データ取得
    article_data = None
    
    if args.article_data and os.path.exists(args.article_data):
        with open(args.article_data, 'r', encoding='utf-8') as f:
            article_data = json.load(f)
    elif args.article_json:
        article_data = json.loads(args.article_json)
    else:
        print("記事データを指定してください (--article-data または --article-json)")
        return
    
    if args.execute:
        execute_article_post(article_data)
    else:
        # プレビューのみ
        post_content = generate_post_from_article(article_data)
        print("=== 生成される投稿内容 ===")
        print(post_content)

if __name__ == '__main__':
    main()