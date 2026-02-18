#!/usr/bin/env python3
"""
AI Solo Builder 記事公開後のX投稿スクリプト

使い方:
  python scripts/post-to-x.py --title "記事タイトル" --url "https://..." --tags "AI,Claude"
  python scripts/post-to-x.py --digest --date "2026-02-19"  # Digest用
"""

import os
import sys
import argparse
import json
from requests_oauthlib import OAuth1Session

# 環境変数から認証情報を取得
API_KEY = os.environ.get("X_API_KEY")
API_SECRET = os.environ.get("X_API_SECRET")
ACCESS_TOKEN = os.environ.get("X_ACCESS_TOKEN")
ACCESS_TOKEN_SECRET = os.environ.get("X_ACCESS_TOKEN_SECRET")

# 定数
BASE_URL = "https://ai.essential-navigator.com"
TWEET_ENDPOINT = "https://api.twitter.com/2/tweets"


def create_oauth_session():
    """OAuth1Session を作成"""
    if not all([API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET]):
        print("❌ 環境変数が設定されていません")
        print("必要: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET")
        sys.exit(1)
    
    return OAuth1Session(
        API_KEY,
        client_secret=API_SECRET,
        resource_owner_key=ACCESS_TOKEN,
        resource_owner_secret=ACCESS_TOKEN_SECRET,
    )


def post_tweet(text: str, dry_run: bool = False) -> dict:
    """ツイートを投稿"""
    if dry_run:
        print(f"🧪 [DRY RUN] 投稿内容:")
        print("-" * 40)
        print(text)
        print("-" * 40)
        print(f"文字数: {len(text)}/280")
        return {"dry_run": True, "text": text}
    
    oauth = create_oauth_session()
    response = oauth.post(TWEET_ENDPOINT, json={"text": text})
    
    if response.status_code == 201:
        data = response.json()
        tweet_id = data["data"]["id"]
        print(f"✅ 投稿成功!")
        print(f"   URL: https://x.com/kt_labs/status/{tweet_id}")
        return data
    else:
        print(f"❌ 投稿失敗: {response.status_code}")
        print(response.json())
        sys.exit(1)


def format_news_tweet(title: str, url: str, tags: list = None, summary: str = None) -> str:
    """ニュース記事用のツイートをフォーマット"""
    parts = []
    
    # メイン部分
    parts.append(f"📰 {title}")
    
    if summary:
        parts.append(f"\n{summary}")
    
    parts.append(f"\n{url}")
    
    # タグ
    if tags:
        tag_str = " ".join([f"#{t}" for t in tags[:5]])  # 最大5個
        parts.append(f"\n{tag_str}")
    else:
        parts.append("\n#AI #ソロ開発 #AIソロビルダー")
    
    text = "".join(parts)
    
    # 280文字制限チェック
    if len(text) > 280:
        # タイトルを短縮
        max_title_len = 280 - len(text) + len(title) - 3
        title_short = title[:max_title_len] + "..."
        parts[0] = f"📰 {title_short}"
        text = "".join(parts)
    
    return text


def format_digest_tweet(date: str, edition: str = "morning") -> str:
    """Digest用のツイートをフォーマット"""
    emoji = "🌅" if edition == "morning" else "🌆"
    edition_ja = "朝刊" if edition == "morning" else "夕刊"
    slug = f"morning-news-{date}" if edition == "morning" else f"evening-news-{date}"
    
    text = f"""{emoji} AI Solo Builder {edition_ja}Digest

AIソロ開発者のための今日のトップニュースをまとめました。

👉 {BASE_URL}/news/{slug}

#AI #ソロ開発 #AIニュース #AIソロビルダー"""
    
    return text


def main():
    parser = argparse.ArgumentParser(description="AI Solo Builder X投稿スクリプト")
    parser.add_argument("--title", help="記事タイトル")
    parser.add_argument("--url", help="記事URL")
    parser.add_argument("--slug", help="記事スラグ（URLを自動生成）")
    parser.add_argument("--tags", help="タグ（カンマ区切り）")
    parser.add_argument("--summary", help="要約（オプション）")
    parser.add_argument("--digest", action="store_true", help="Digestモード")
    parser.add_argument("--date", help="Digestの日付（YYYY-MM-DD）")
    parser.add_argument("--edition", choices=["morning", "evening"], default="morning", help="Digestの版")
    parser.add_argument("--dry-run", action="store_true", help="投稿せずにプレビューのみ")
    parser.add_argument("--text", help="カスタムテキスト（直接指定）")
    
    args = parser.parse_args()
    
    # カスタムテキストモード
    if args.text:
        text = args.text
    # Digestモード
    elif args.digest:
        if not args.date:
            print("❌ --digest には --date が必要です")
            sys.exit(1)
        text = format_digest_tweet(args.date, args.edition)
    # ニュース記事モード
    elif args.title:
        url = args.url
        if not url and args.slug:
            url = f"{BASE_URL}/news/{args.slug}"
        if not url:
            print("❌ --url または --slug が必要です")
            sys.exit(1)
        
        tags = args.tags.split(",") if args.tags else None
        text = format_news_tweet(args.title, url, tags, args.summary)
    else:
        parser.print_help()
        sys.exit(1)
    
    # 投稿
    result = post_tweet(text, dry_run=args.dry_run)
    
    # 結果をJSONで出力（パイプライン用）
    if not args.dry_run:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
