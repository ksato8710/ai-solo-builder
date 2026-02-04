#!/usr/bin/env python3
"""
待機中X投稿の実行スクリプト

機能:
- 待機中のタスク一覧表示
- 選択的投稿実行
- 一括投稿実行
- 完了タスクの整理

使用方法:
python3 execute_pending_posts.py --list
python3 execute_pending_posts.py --execute 1
python3 execute_pending_posts.py --execute-all
python3 execute_pending_posts.py --cleanup-completed
"""

import os
import sys
import re
import json
import subprocess
from datetime import datetime

# ファイルパス設定
BASE_DIR = "/Users/satokeita/dev/ai-navigator"
PENDING_FILE = os.path.join(BASE_DIR, "X_PENDING_POSTS.md")
COMPLETED_FILE = os.path.join(BASE_DIR, "X_COMPLETED_POSTS.md")

def parse_pending_tasks():
    """待機中タスクをパースして構造化データを返す"""
    
    if not os.path.exists(PENDING_FILE):
        return []
    
    with open(PENDING_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    tasks = []
    
    # タスクエントリを正規表現で抽出
    task_pattern = r'### ([0-9-: ]+) - (.+?)\n(.*?)(?=### |$)'
    matches = re.findall(task_pattern, content, re.DOTALL)
    
    for i, (timestamp, category, task_content) in enumerate(matches):
        
        # 記事タイトルとURL抽出
        title_match = re.search(r'\*\*記事:\*\* \[(.+?)\]\((.+?)\)', task_content)
        title = title_match.group(1) if title_match else "タイトル不明"
        url = title_match.group(2) if title_match else ""
        
        # 投稿内容抽出
        content_match = re.search(r'\*\*投稿内容:\*\*\s*```\s*(.*?)\s*```', task_content, re.DOTALL)
        post_content = content_match.group(1).strip() if content_match else ""
        
        # 理由抽出
        reason_match = re.search(r'\*\*理由:\*\* (.+)', task_content)
        reason = reason_match.group(1).strip() if reason_match else "不明"
        
        # 優先度抽出
        priority_match = re.search(r'\*\*優先度:\*\* (.+)', task_content)
        priority = priority_match.group(1).strip() if priority_match else "中"
        
        # 期限抽出
        deadline_match = re.search(r'\*\*期限:\*\* (.+)', task_content)
        deadline = deadline_match.group(1).strip() if deadline_match else "未設定"
        
        tasks.append({
            'index': i + 1,
            'timestamp': timestamp.strip(),
            'category': category.strip(),
            'title': title,
            'url': url,
            'post_content': post_content,
            'reason': reason,
            'priority': priority,
            'deadline': deadline,
            'raw_content': task_content
        })
    
    return tasks

def display_tasks(tasks):
    """タスク一覧を見やすく表示"""
    
    if not tasks:
        print("未投稿タスクはありません。")
        return
    
    print("=== 未投稿タスク一覧 ===\n")
    
    for task in tasks:
        priority_color = ""
        if "高" in task['priority']:
            priority_color = "🔴"
        elif "中" in task['priority']:
            priority_color = "🟡"
        else:
            priority_color = "🟢"
        
        print(f"{priority_color} **{task['index']}.** {task['title']}")
        print(f"   📅 {task['timestamp']} | ⏰ 期限: {task['deadline']}")
        print(f"   📝 カテゴリ: {task['category']}")
        print(f"   ⚠️ 理由: {task['reason']}")
        print(f"   📎 URL: {task['url']}")
        print(f"   💬 投稿内容: {task['post_content'][:60]}...")
        print()

def is_browser_relay_available():
    """Browser Relayの利用可能性チェック"""
    try:
        result = subprocess.run(['browser', 'status', 'profile=chrome'], 
                              capture_output=True, text=True, timeout=10)
        return 'running: true' in result.stdout
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
        subprocess.run([
            'browser', 'navigate', 'profile=chrome',
            'targetUrl=https://x.com/compose/post'
        ], check=True, timeout=30)
        
        # タブ情報取得
        tabs_result = subprocess.run([
            'browser', 'tabs', 'profile=chrome'
        ], capture_output=True, text=True, timeout=10)
        
        # 簡易的にタブID抽出（改善の余地あり）
        target_id = None
        for line in tabs_result.stdout.split('\n'):
            if 'x.com' in line and 'targetId' in line:
                # targetIdを抽出
                if '"targetId":' in line:
                    start = line.find('"targetId":') + len('"targetId":"')
                    end = line.find('"', start)
                    target_id = line[start:end]
                    break
        
        if not target_id:
            raise Exception("Could not find X.com tab")
        
        # 少し待機
        import time
        time.sleep(2)
        
        # テキスト入力
        js_input = f'const textarea = document.querySelector(\'[data-testid="tweetTextarea_0"]\'); if(textarea) {{ textarea.textContent = \'{content_js}\'; textarea.dispatchEvent(new Event(\'input\', {{bubbles: true}})); return \'text_entered\'; }}'
        
        subprocess.run([
            'browser', 'act', f'targetId={target_id}',
            f'request={{"kind": "evaluate", "fn": "{js_input}"}}'
        ], check=True, timeout=20)
        
        # 1秒待機
        time.sleep(1)
        
        # 投稿実行
        js_click = 'const btn = document.querySelector(\'[data-testid="tweetButton"]\'); if(btn && !btn.disabled) { btn.click(); return \'posted\'; } else { return \'button_disabled\'; }'
        
        result = subprocess.run([
            'browser', 'act', f'targetId={target_id}',
            f'request={{"kind": "evaluate", "fn": "{js_click}"}}'
        ], capture_output=True, text=True, timeout=20)
        
        if 'posted' in result.stdout:
            return True
        else:
            raise Exception("Post button was disabled or click failed")
    
    except Exception as e:
        raise Exception(f"Browser Relay execution failed: {e}")

def execute_task(task):
    """個別タスクを実行"""
    
    print(f"投稿実行中: {task['title']}")
    
    try:
        execute_x_post_with_browser_relay(task['post_content'])
        print(f"✅ 投稿成功: {task['title']}")
        
        # 完了ログに記録
        log_completed_task(task)
        
        return True
    
    except Exception as e:
        print(f"❌ 投稿失敗: {e}")
        return False

def log_completed_task(task):
    """完了タスクをログに記録"""
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    log_entry = f"""
### {timestamp} - 投稿完了
- **記事:** [{task['title']}]({task['url']})
- **投稿内容:** {task['post_content'][:100]}...
- **元のタスク:** {task['timestamp']} - {task['category']}
- **投稿実行時刻:** {timestamp}
"""
    
    os.makedirs(os.path.dirname(COMPLETED_FILE), exist_ok=True)
    
    if not os.path.exists(COMPLETED_FILE):
        with open(COMPLETED_FILE, 'w', encoding='utf-8') as f:
            f.write("# X投稿完了ログ\n\n")
    
    with open(COMPLETED_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry)

def remove_task_from_pending(task_index):
    """完了したタスクを待機リストから削除"""
    
    if not os.path.exists(PENDING_FILE):
        return
    
    with open(PENDING_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # タスクエントリをパース
    task_pattern = r'(### [0-9-: ]+ - .+?\n.*?)(?=### |$)'
    matches = list(re.finditer(task_pattern, content, re.DOTALL))
    
    if 1 <= task_index <= len(matches):
        # 指定されたタスクを削除
        task_to_remove = matches[task_index - 1]
        new_content = content[:task_to_remove.start()] + content[task_to_remove.end():]
        
        with open(PENDING_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ タスク {task_index} を待機リストから削除")

def execute_all_tasks(tasks):
    """全タスクを実行"""
    
    if not tasks:
        print("実行するタスクがありません。")
        return
    
    print(f"全 {len(tasks)} タスクを実行開始...")
    
    executed = 0
    failed = 0
    
    for task in tasks:
        print(f"\n[{task['index']}/{len(tasks)}] {task['title']}")
        
        if execute_task(task):
            executed += 1
            remove_task_from_pending(task['index'])
        else:
            failed += 1
        
        # 連続実行時は少し待機
        if task['index'] < len(tasks):
            import time
            time.sleep(3)
    
    print(f"\n=== 実行結果 ===")
    print(f"成功: {executed}件")
    print(f"失敗: {failed}件")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='待機中X投稿の実行スクリプト')
    parser.add_argument('--list', action='store_true', help='待機タスク一覧表示')
    parser.add_argument('--execute', type=int, help='指定番号のタスクを実行')
    parser.add_argument('--execute-all', action='store_true', help='全タスクを実行')
    parser.add_argument('--check-browser', action='store_true', help='Browser Relay状態確認')
    parser.add_argument('--preview', type=int, help='指定タスクの詳細プレビュー')
    
    args = parser.parse_args()
    
    if args.check_browser:
        if is_browser_relay_available():
            print("✅ Browser Relay 利用可能")
        else:
            print("❌ Browser Relay 利用不可")
        return
    
    # タスク読み込み
    tasks = parse_pending_tasks()
    
    if args.list or not any([args.execute, args.execute_all, args.preview]):
        display_tasks(tasks)
        return
    
    if args.preview:
        if 1 <= args.preview <= len(tasks):
            task = tasks[args.preview - 1]
            print(f"=== タスク {args.preview} 詳細 ===")
            print(f"タイトル: {task['title']}")
            print(f"URL: {task['url']}")
            print(f"投稿内容:\n{task['post_content']}")
            print(f"理由: {task['reason']}")
            print(f"優先度: {task['priority']}")
            print(f"期限: {task['deadline']}")
        else:
            print(f"タスク {args.preview} は存在しません")
        return
    
    if args.execute:
        if not is_browser_relay_available():
            print("❌ Browser Relay が利用できません")
            return
        
        if 1 <= args.execute <= len(tasks):
            task = tasks[args.execute - 1]
            if execute_task(task):
                remove_task_from_pending(args.execute)
        else:
            print(f"タスク {args.execute} は存在しません")
    
    if args.execute_all:
        if not is_browser_relay_available():
            print("❌ Browser Relay が利用できません")
            return
        
        execute_all_tasks(tasks)

if __name__ == '__main__':
    main()