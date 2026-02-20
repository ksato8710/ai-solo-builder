#!/usr/bin/env python3
"""
Discover high-signal X posts for AI solo builders.

This script is optimized for daily discovery:
- Pulls fresh posts from X Recent Search (optionally mixed recency/relevancy)
- Scores each post with a "multi-agent" style evaluator
- Produces ranked JSON + Markdown reports
- Persists seen post IDs to prioritize new discoveries each day

Examples:
  python3 scripts/discover-x-ai-signals.py --sample-file scripts/fixtures/x_recent_search_sample.json
  python3 scripts/discover-x-ai-signals.py --top-k 25 --lookback-hours 18
  python3 scripts/discover-x-ai-signals.py --sort-order mixed --with-usage --output-dir research/x-discovery
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


API_BASE_URL = "https://api.x.com/2"
DEFAULT_BEARER_ENV = "X_API_BEARER_TOKEN"

DEFAULT_TWEET_FIELDS = [
    "id",
    "author_id",
    "created_at",
    "text",
    "lang",
    "conversation_id",
    "public_metrics",
    "entities",
    "context_annotations",
]

DEFAULT_USER_FIELDS = [
    "id",
    "name",
    "username",
    "description",
    "created_at",
    "verified",
    "verified_type",
    "public_metrics",
]


@dataclass(frozen=True)
class QueryPack:
    pack_id: str
    name: str
    query: str
    weight: float = 1.0


DEFAULT_QUERY_PACKS: list[QueryPack] = [
    QueryPack(
        pack_id="launch-signals",
        name="Launch and shipping signals",
        query='("launched" OR "shipping" OR "released" OR "beta" OR "open source" OR "公開") (AI OR LLM OR agent OR "生成AI") (solo OR indie OR founder OR "個人開発" OR "ソロ開発")',
        weight=1.15,
    ),
    QueryPack(
        pack_id="playbooks",
        name="Practical playbooks",
        query='(tutorial OR guide OR thread OR workflow OR repo OR template OR "解説" OR "手順") (AI OR "AIエージェント" OR LLM OR agent) (SaaS OR app OR automation OR product OR "開発")',
        weight=1.1,
    ),
    QueryPack(
        pack_id="revenue-proof",
        name="Revenue and case-study proof",
        query='("MRR" OR revenue OR "case study" OR growth OR 収益 OR 事例) (AI OR agent OR LLM OR "生成AI") (solo OR indie OR "個人開発" OR "ソロ開発")',
        weight=1.0,
    ),
    QueryPack(
        pack_id="ecosystem-watch",
        name="Model/API ecosystem watch",
        query='(MCP OR "model context protocol" OR API OR SDK OR "Agents") (OpenAI OR Anthropic OR xAI OR Claude OR Cursor OR GitHub)',
        weight=0.95,
    ),
]


AI_TERMS = [
    "ai",
    "llm",
    "agent",
    "agents",
    "gpt",
    "claude",
    "cursor",
    "copilot",
    "openai",
    "anthropic",
    "xai",
    "mcp",
    "model context protocol",
    "生成ai",
    "aiエージェント",
]

SOLO_BUILDER_TERMS = [
    "solo",
    "indie",
    "solopreneur",
    "bootstrap",
    "one-person",
    "micro saas",
    "side project",
    "個人開発",
    "ソロ開発",
    "ひとり開発",
    "一人開発",
    "副業開発",
]

ACTIONABLE_TERMS = [
    "tutorial",
    "guide",
    "thread",
    "workflow",
    "template",
    "repo",
    "github",
    "case study",
    "benchmark",
    "pricing",
    "api",
    "sdk",
    "open source",
    "oss",
    "解説",
    "手順",
    "比較",
    "事例",
    "テンプレ",
]

SPAM_OR_HYPE_TERMS = [
    "giveaway",
    "airdrop",
    "100x",
    "dm me",
    "referral",
    "pump",
    "signals",
    "follow for follow",
    "稼げる",
    "簡単に",
]

TOPIC_PATTERNS: dict[str, list[str]] = {
    "launch": ["launch", "launched", "released", "shipping", "beta", "公開", "リリース"],
    "how-to": ["tutorial", "guide", "thread", "how to", "workflow", "手順", "解説"],
    "api": ["api", "sdk", "mcp", "model context protocol"],
    "business": ["mrr", "revenue", "growth", "収益", "売上", "事例"],
    "open-source": ["open source", "oss", "github", "repo"],
}

URL_RE = re.compile(r"https?://\S+")
HASHTAG_RE = re.compile(r"#\w+")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Discover high-signal X posts for AI solo builders")
    parser.add_argument(
        "--bearer-token",
        default=os.getenv(DEFAULT_BEARER_ENV, ""),
        help=f"X API Bearer token. Default env: {DEFAULT_BEARER_ENV}",
    )
    parser.add_argument(
        "--lookback-hours",
        type=int,
        default=24,
        help="Search window in hours (recent search is capped to last 7 days).",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=100,
        help="Per-request result size (X API allows 10-100 for recent search).",
    )
    parser.add_argument(
        "--pages-per-query",
        type=int,
        default=2,
        help="Max pages to fetch per query pack and sort order.",
    )
    parser.add_argument(
        "--sort-order",
        choices=["recency", "relevancy", "mixed"],
        default="mixed",
        help="Use mixed to combine recency and relevancy.",
    )
    parser.add_argument(
        "--langs",
        default="ja,en",
        help="Comma-separated language filters. Example: ja,en or en",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=20,
        help="Top results to include in the final report.",
    )
    parser.add_argument(
        "--min-score",
        type=float,
        default=30.0,
        help="Drop results below this final score (0-100).",
    )
    parser.add_argument(
        "--output-dir",
        default="research/x-discovery",
        help="Output directory for markdown/json reports.",
    )
    parser.add_argument(
        "--state-file",
        default=".cache/x_discovery_state.json",
        help="Path for seen-post state persistence.",
    )
    parser.add_argument(
        "--no-state",
        action="store_true",
        help="Do not read/write state file.",
    )
    parser.add_argument(
        "--include-seen",
        action="store_true",
        help="Include already-seen posts in ranking output.",
    )
    parser.add_argument(
        "--with-usage",
        action="store_true",
        help="Call /2/usage/tweets and embed usage snapshot in report.",
    )
    parser.add_argument(
        "--sample-file",
        help="Optional local JSON file to run offline (skips X API calls).",
    )
    parser.add_argument(
        "--query-pack",
        action="append",
        default=[],
        help="Optional query pack IDs to run. Repeatable. Defaults to all packs.",
    )
    parser.add_argument(
        "--focus",
        action="append",
        default=[],
        help="Optional focus keyword(s), e.g. --focus OpenClaw --focus Grok",
    )
    return parser.parse_args()


def now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_utc(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def text_compact(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def to_lower(value: str) -> str:
    return value.casefold()


def contains_term_count(text_lower: str, terms: list[str]) -> int:
    count = 0
    for term in terms:
        if term.casefold() in text_lower:
            count += 1
    return count


def topic_tags(text_lower: str) -> list[str]:
    tags: list[str] = []
    for tag, keywords in TOPIC_PATTERNS.items():
        if any(keyword.casefold() in text_lower for keyword in keywords):
            tags.append(tag)
    return tags


def build_query(base_query: str, langs: list[str], exclude_replies: bool = True) -> str:
    query = f"({base_query}) -is:retweet"
    if exclude_replies:
        query += " -is:reply"

    lang_terms = [f"lang:{lang.strip()}" for lang in langs if lang.strip()]
    if lang_terms:
        query += f" ({' OR '.join(lang_terms)})"
    return query


def build_focus_query_pack(keyword: str) -> QueryPack:
    safe = keyword.replace('"', "").strip()
    if not safe:
        raise ValueError("focus keyword is empty")
    return QueryPack(
        pack_id=f"focus-{re.sub(r'[^a-z0-9]+', '-', safe.casefold()).strip('-') or 'topic'}",
        name=f"Focus: {safe}",
        query=f'("{safe}") (AI OR LLM OR agent OR Agents OR "生成AI" OR "AIエージェント" OR startup OR founder OR solo OR "個人開発")',
        weight=1.25,
    )


def json_request(
    endpoint: str,
    params: dict[str, Any],
    bearer_token: str,
    retry_limit: int = 3,
) -> dict[str, Any]:
    query = urllib.parse.urlencode(params, doseq=True, safe=":,()\"")
    url = f"{API_BASE_URL}{endpoint}?{query}"

    for attempt in range(1, retry_limit + 1):
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {bearer_token}",
                "User-Agent": "ai-navigator-x-discovery/1.0",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload)
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            if error.code == 429 and attempt < retry_limit:
                reset_header = error.headers.get("x-rate-limit-reset", "")
                wait_seconds = 8
                if reset_header.isdigit():
                    wait_seconds = max(1, int(reset_header) - int(time.time()) + 1)
                print(f"[WARN] 429 rate limit. Waiting {wait_seconds}s before retry {attempt}/{retry_limit}...", file=sys.stderr)
                time.sleep(wait_seconds)
                continue

            raise RuntimeError(f"HTTP {error.code} for {url}\n{body}") from error
        except urllib.error.URLError as error:
            if attempt < retry_limit:
                time.sleep(2 * attempt)
                continue
            raise RuntimeError(f"Network error for {url}: {error}") from error

    raise RuntimeError(f"Failed request after retries: {url}")


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"seen_ids": [], "last_run_at": None}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"seen_ids": [], "last_run_at": None}


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_datetime(value: str) -> dt.datetime:
    # X API uses RFC3339 timestamps like 2026-02-20T08:01:00.000Z or without milliseconds.
    normalized = value.replace("Z", "+00:00")
    return dt.datetime.fromisoformat(normalized)


def parse_public_metrics(tweet: dict[str, Any]) -> dict[str, float]:
    metrics = tweet.get("public_metrics") or {}
    repost_count = metrics.get("repost_count", metrics.get("retweet_count", 0))
    return {
        "like_count": float(metrics.get("like_count", 0)),
        "repost_count": float(repost_count),
        "reply_count": float(metrics.get("reply_count", 0)),
        "quote_count": float(metrics.get("quote_count", 0)),
        "bookmark_count": float(metrics.get("bookmark_count", 0)),
        "impression_count": float(metrics.get("impression_count", 0)),
    }


def score_candidate(candidate: dict[str, Any], current_time: dt.datetime) -> dict[str, Any]:
    tweet = candidate["tweet"]
    user = candidate.get("user", {})
    text = text_compact(tweet.get("text", ""))
    text_lower = to_lower(text)

    created_at = parse_datetime(tweet["created_at"])
    age_hours = max((current_time - created_at).total_seconds() / 3600.0, 0.25)
    metrics = parse_public_metrics(tweet)

    ai_hits = contains_term_count(text_lower, AI_TERMS)
    solo_hits = contains_term_count(text_lower, SOLO_BUILDER_TERMS)
    actionable_hits = contains_term_count(text_lower, ACTIONABLE_TERMS)
    spam_hits = contains_term_count(text_lower, SPAM_OR_HYPE_TERMS)
    tags = topic_tags(text_lower)

    # Agent 1: Scout (topic relevance)
    relevance = (
        0.36 * clamp(ai_hits / 3.0)
        + 0.32 * clamp(solo_hits / 2.0)
        + 0.24 * clamp(actionable_hits / 3.0)
        + 0.08 * clamp(len(candidate["matched_packs"]) / 3.0)
    )

    # Agent 2: Signal (engagement velocity and author context)
    weighted_engagement = (
        metrics["like_count"]
        + 2.0 * metrics["repost_count"]
        + 1.6 * metrics["reply_count"]
        + 2.2 * metrics["quote_count"]
        + 0.5 * metrics["bookmark_count"]
    )
    velocity = weighted_engagement / age_hours

    user_metrics = (user or {}).get("public_metrics", {})
    followers = float(user_metrics.get("followers_count", 0))
    follower_adjusted_velocity = velocity / max(followers / 1000.0, 1.0)

    engagement = (
        0.72 * clamp(math.log1p(velocity) / 6.0)
        + 0.28 * clamp(math.log1p(follower_adjusted_velocity) / 4.0)
    )

    follower_score = clamp(math.log10(followers + 1.0) / 6.0)
    verified_bonus = 0.08 if user.get("verified") else 0.0
    account_age_score = 0.0
    if user.get("created_at"):
        account_age_days = max((current_time - parse_datetime(user["created_at"])).days, 0)
        account_age_score = clamp(account_age_days / 3650.0)  # saturates around 10y
    author_score = clamp(0.74 * follower_score + 0.18 * account_age_score + verified_bonus)

    # Agent 3: Critic (noise and hype penalty)
    hashtag_count = len(HASHTAG_RE.findall(text))
    url_count = len(URL_RE.findall(text))
    low_signal_flag = followers < 40 and weighted_engagement < 4

    penalty = 0.0
    penalty += min(0.30, spam_hits * 0.10)
    penalty += 0.10 if hashtag_count >= 6 else 0.0
    penalty += 0.08 if (url_count == 0 and actionable_hits == 0) else 0.0
    penalty += 0.06 if low_signal_flag else 0.0
    penalty = clamp(penalty, 0.0, 0.45)

    freshness = clamp(math.exp(-age_hours / 28.0))
    final_score_01 = clamp(
        0.38 * relevance + 0.30 * engagement + 0.17 * freshness + 0.15 * author_score - penalty
    )
    final_score = round(final_score_01 * 100.0, 2)

    tier = "low"
    if final_score >= 70:
        tier = "strong"
    elif final_score >= 55:
        tier = "good"
    elif final_score >= 40:
        tier = "watch"

    summary = text if len(text) <= 220 else f"{text[:217]}..."

    discussion_points = []
    if tags:
        discussion_points.append(f"Topic tags: {', '.join(tags)}")
    if weighted_engagement > 0:
        discussion_points.append(
            "Engagement signal: "
            f"{int(metrics['like_count'])} likes / {int(metrics['repost_count'])} reposts / {int(metrics['reply_count'])} replies"
        )
    if follower_adjusted_velocity > 2.5:
        discussion_points.append("Velocity is strong relative to author follower base.")
    if url_count > 0:
        discussion_points.append("Includes external link(s), likely actionable.")
    if not discussion_points:
        discussion_points.append("Monitor manually; context signal is still limited.")

    return {
        "score": final_score,
        "tier": tier,
        "summary": summary,
        "age_hours": round(age_hours, 2),
        "tags": tags,
        "components": {
            "scout_relevance": round(relevance * 100.0, 2),
            "signal_engagement": round(engagement * 100.0, 2),
            "signal_author": round(author_score * 100.0, 2),
            "freshness": round(freshness * 100.0, 2),
            "critic_penalty": round(penalty * 100.0, 2),
            "ai_hits": ai_hits,
            "solo_hits": solo_hits,
            "actionable_hits": actionable_hits,
            "spam_hits": spam_hits,
        },
        "discussion_points": discussion_points,
        "metrics": {
            **metrics,
            "weighted_engagement": round(weighted_engagement, 2),
            "velocity": round(velocity, 2),
            "follower_adjusted_velocity": round(follower_adjusted_velocity, 2),
        },
    }


def fetch_recent_for_query(
    query_pack: QueryPack,
    sort_order: str,
    args: argparse.Namespace,
    bearer_token: str,
    start_time: dt.datetime,
    end_time: dt.datetime,
) -> list[dict[str, Any]]:
    query = build_query(query_pack.query, langs=[part.strip() for part in args.langs.split(",") if part.strip()])

    results: list[dict[str, Any]] = []
    next_token = None
    for _page in range(args.pages_per_query):
        params: dict[str, Any] = {
            "query": query,
            "start_time": iso_utc(start_time),
            "end_time": iso_utc(end_time),
            "max_results": max(10, min(args.max_results, 100)),
            "sort_order": sort_order,
            "tweet.fields": ",".join(DEFAULT_TWEET_FIELDS),
            "expansions": "author_id",
            "user.fields": ",".join(DEFAULT_USER_FIELDS),
        }
        if next_token:
            params["next_token"] = next_token

        response = json_request("/tweets/search/recent", params=params, bearer_token=bearer_token)
        results.append(response)

        meta = response.get("meta", {})
        next_token = meta.get("next_token")
        if not next_token:
            break

    return results


def merge_search_responses(
    responses: list[dict[str, Any]],
    query_pack: QueryPack,
    sort_order: str,
    by_id: dict[str, dict[str, Any]],
) -> int:
    added = 0
    for response in responses:
        users = {
            user["id"]: user
            for user in (response.get("includes", {}).get("users") or [])
            if isinstance(user, dict) and user.get("id")
        }
        for tweet in response.get("data") or []:
            tweet_id = tweet.get("id")
            if not tweet_id:
                continue
            item = by_id.get(tweet_id)
            if not item:
                by_id[tweet_id] = {
                    "tweet": tweet,
                    "user": users.get(tweet.get("author_id")),
                    "matched_packs": [query_pack.pack_id],
                    "sort_orders": [sort_order],
                    "query_weight": query_pack.weight,
                }
                added += 1
            else:
                if query_pack.pack_id not in item["matched_packs"]:
                    item["matched_packs"].append(query_pack.pack_id)
                    item["query_weight"] += query_pack.weight
                if sort_order not in item["sort_orders"]:
                    item["sort_orders"].append(sort_order)
                if not item.get("user") and users.get(tweet.get("author_id")):
                    item["user"] = users.get(tweet.get("author_id"))
    return added


def extract_usage_snapshot(bearer_token: str, days: int = 7) -> dict[str, Any] | None:
    try:
        response = json_request(
            "/usage/tweets",
            params={"days": max(1, min(days, 90)), "usage.fields": "project_usage,project_cap,cap_reset_day"},
            bearer_token=bearer_token,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[WARN] Could not fetch usage snapshot: {exc}", file=sys.stderr)
        return None

    data = response.get("data", {})
    if not isinstance(data, dict):
        return None
    return {
        "project_usage": data.get("project_usage"),
        "project_cap": data.get("project_cap"),
        "cap_reset_day": data.get("cap_reset_day"),
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# X Discovery Report (AI Solo Builder)")
    lines.append("")
    lines.append(f"- Generated at (UTC): `{report['generated_at']}`")
    lines.append(f"- Lookback: `{report['config']['lookback_hours']}h`")
    lines.append(f"- Sort mode: `{report['config']['sort_order']}`")
    lines.append(f"- Languages: `{', '.join(report['config']['langs'])}`")
    lines.append(f"- Query packs: `{', '.join(report['config']['query_packs'])}`")
    lines.append(f"- Candidates scored: `{report['meta']['scored_candidates']}`")
    lines.append(f"- Returned top items: `{len(report['results'])}`")
    lines.append("")

    usage = report.get("usage_snapshot")
    if usage:
        lines.append("## API Usage Snapshot")
        lines.append("")
        lines.append(
            f"- project_usage: `{usage.get('project_usage')}` / project_cap: `{usage.get('project_cap')}` (cap_reset_day: `{usage.get('cap_reset_day')}`)"
        )
        lines.append("")

    lines.append("## Top Ranked Posts")
    lines.append("")
    lines.append("| Rank | Score | Tier | Author | Age(h) | Metrics (L/R/Rp/Q) | URL |")
    lines.append("|---|---:|---|---|---:|---|---|")

    for item in report["results"]:
        metrics = item["metrics"]
        lines.append(
            "| "
            f"{item['rank']} | "
            f"{item['score']:.2f} | "
            f"{item['tier']} | "
            f"@{item['author']['username']} | "
            f"{item['age_hours']:.1f} | "
            f"{int(metrics['like_count'])}/{int(metrics['repost_count'])}/{int(metrics['reply_count'])}/{int(metrics['quote_count'])} | "
            f"{item['url']} |"
        )

    lines.append("")
    lines.append("## Notes")
    lines.append("")

    for item in report["results"]:
        lines.append(f"### #{item['rank']} @{item['author']['username']} ({item['score']:.2f})")
        lines.append("")
        lines.append(f"- Text: {item['summary']}")
        lines.append(f"- Matched packs: `{', '.join(item['matched_packs'])}`")
        lines.append(
            "- Component scores: "
            f"Scout={item['components']['scout_relevance']} "
            f"Signal(engagement)={item['components']['signal_engagement']} "
            f"Signal(author)={item['components']['signal_author']} "
            f"Freshness={item['components']['freshness']} "
            f"CriticPenalty={item['components']['critic_penalty']}"
        )
        for point in item["discussion_points"]:
            lines.append(f"- {point}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def main() -> int:
    args = parse_args()
    started_at = now_utc()

    selected_packs = list(DEFAULT_QUERY_PACKS)
    if args.query_pack:
        selected = set(args.query_pack)
        selected_packs = [pack for pack in DEFAULT_QUERY_PACKS if pack.pack_id in selected]
        if not selected_packs:
            print(f"[ERROR] No query packs matched --query-pack {args.query_pack}", file=sys.stderr)
            return 1

    if args.focus:
        for focus_keyword in args.focus:
            try:
                selected_packs.append(build_focus_query_pack(focus_keyword))
            except ValueError:
                print(f"[WARN] focus keyword ignored: '{focus_keyword}'", file=sys.stderr)

    if not args.sample_file and not args.bearer_token:
        print(
            f"[ERROR] bearer token is required unless --sample-file is used. Set --bearer-token or {DEFAULT_BEARER_ENV}.",
            file=sys.stderr,
        )
        return 1

    state_file = Path(args.state_file)
    state = {"seen_ids": [], "last_run_at": None}
    if not args.no_state:
        state = load_state(state_file)

    seen_ids: set[str] = set(state.get("seen_ids", []))
    by_id: dict[str, dict[str, Any]] = {}

    lookback_hours = max(1, min(args.lookback_hours, 24 * 7))
    window_start = started_at - dt.timedelta(hours=lookback_hours)

    if args.sample_file:
        sample_path = Path(args.sample_file)
        if not sample_path.exists():
            print(f"[ERROR] sample file not found: {sample_path}", file=sys.stderr)
            return 1
        sample_payload = json.loads(sample_path.read_text(encoding="utf-8"))
        # Allowed forms:
        # 1) single response object with data/includes
        # 2) array of response objects
        responses = sample_payload if isinstance(sample_payload, list) else [sample_payload]
        sample_pack = selected_packs[-1] if args.focus else selected_packs[0]
        merge_search_responses(responses, sample_pack, "sample", by_id)
    else:
        sort_orders = ["recency", "relevancy"] if args.sort_order == "mixed" else [args.sort_order]
        for pack in selected_packs:
            for sort_order in sort_orders:
                try:
                    responses = fetch_recent_for_query(
                        query_pack=pack,
                        sort_order=sort_order,
                        args=args,
                        bearer_token=args.bearer_token,
                        start_time=window_start,
                        end_time=started_at,
                    )
                    merge_search_responses(responses, pack, sort_order, by_id)
                except Exception as exc:  # noqa: BLE001
                    print(f"[WARN] Query pack '{pack.pack_id}' ({sort_order}) failed: {exc}", file=sys.stderr)

    scored_items: list[dict[str, Any]] = []
    for candidate in by_id.values():
        tweet_id = candidate["tweet"]["id"]
        if (tweet_id in seen_ids) and (not args.include_seen):
            continue

        scored = score_candidate(candidate, current_time=started_at)
        if scored["score"] < args.min_score:
            continue

        tweet = candidate["tweet"]
        user = candidate.get("user") or {}
        tweet_id = tweet.get("id")
        username = user.get("username", "unknown")
        item = {
            "tweet_id": tweet_id,
            "url": f"https://x.com/{username}/status/{tweet_id}" if username != "unknown" else f"https://x.com/i/web/status/{tweet_id}",
            "created_at": tweet.get("created_at"),
            "summary": scored["summary"],
            "age_hours": scored["age_hours"],
            "score": scored["score"],
            "tier": scored["tier"],
            "tags": scored["tags"],
            "matched_packs": sorted(candidate["matched_packs"]),
            "sort_orders": sorted(candidate["sort_orders"]),
            "author": {
                "id": user.get("id"),
                "name": user.get("name", ""),
                "username": username,
                "verified": bool(user.get("verified", False)),
                "verified_type": user.get("verified_type"),
                "followers_count": (user.get("public_metrics") or {}).get("followers_count", 0),
            },
            "metrics": scored["metrics"],
            "components": scored["components"],
            "discussion_points": scored["discussion_points"],
            "raw_text": text_compact(tweet.get("text", "")),
        }
        scored_items.append(item)

    scored_items.sort(key=lambda item: item["score"], reverse=True)

    top_items = scored_items[: max(1, args.top_k)]
    for idx, item in enumerate(top_items, start=1):
        item["rank"] = idx

    usage_snapshot = None
    if args.with_usage and args.bearer_token and not args.sample_file:
        usage_snapshot = extract_usage_snapshot(args.bearer_token, days=7)

    report = {
        "generated_at": iso_utc(started_at),
        "config": {
            "lookback_hours": lookback_hours,
            "sort_order": args.sort_order,
            "langs": [part.strip() for part in args.langs.split(",") if part.strip()],
            "query_packs": [pack.pack_id for pack in selected_packs],
            "max_results": args.max_results,
            "pages_per_query": args.pages_per_query,
            "min_score": args.min_score,
            "include_seen": args.include_seen,
            "sample_file": args.sample_file or None,
        },
        "meta": {
            "fetched_candidates": len(by_id),
            "scored_candidates": len(scored_items),
            "seen_state_size": len(seen_ids),
        },
        "usage_snapshot": usage_snapshot,
        "results": top_items,
    }

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = started_at.strftime("%Y%m%d-%H%M%S")
    json_path = output_dir / f"x-discovery-{stamp}.json"
    md_path = output_dir / f"x-discovery-{stamp}.md"

    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(report), encoding="utf-8")

    print(f"[OK] Report generated")
    print(f"  JSON: {json_path}")
    print(f"  Markdown: {md_path}")
    print(f"  Candidates fetched: {report['meta']['fetched_candidates']}")
    print(f"  Candidates scored: {report['meta']['scored_candidates']}")
    print(f"  Top results: {len(report['results'])}")

    for item in top_items[: min(5, len(top_items))]:
        print(
            f"  #{item['rank']:02d} {item['score']:>6.2f} @{item['author']['username']}"
            f" ({int(item['metrics']['like_count'])}L/{int(item['metrics']['repost_count'])}RP)"
        )

    if not args.no_state:
        new_seen_ids = sorted(seen_ids.union(by_id.keys()))
        # Keep state bounded.
        if len(new_seen_ids) > 50000:
            new_seen_ids = new_seen_ids[-50000:]
        save_state(
            state_file,
            {
                "seen_ids": new_seen_ids,
                "last_run_at": iso_utc(started_at),
                "last_fetched_candidates": len(by_id),
            },
        )
        print(f"[OK] State updated: {state_file}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
