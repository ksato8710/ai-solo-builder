#!/usr/bin/env python3
"""
Experiment: Detect potentially exaggerated X posts.

This script runs a lightweight, explainable detector over:
- A target post (default: the user's provided post ID)
- A small probe set of related posts
- Optional sample fixture posts
- Optional additional posts from X Recent Search

Output:
- JSON report with per-post features/scores
- Markdown report with ranked results and evaluation metrics

Notes:
- Uses rule-based scoring for transparency and reproducibility.
- This is not a final fact-check verdict engine.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


API_BASE_URL = "https://api.x.com/2"
DEFAULT_BEARER_ENV = "X_BEARER_TOKEN"

DEFAULT_TARGET_IDS = ["2024680501370323256"]
DEFAULT_PROBE_IDS = [
    "2024787934394941633",
    "2024865606835507266",
    "2024729096882966724",
    "2024666862219313163",
    "2024638110441885700",
]
DEFAULT_SEARCH_QUERY = "\"more of the world's intellectual capacity\" -is:retweet"

DEFAULT_LABELS: dict[str, int] = {
    # user target and related posts (1 = exaggerated/high-drift risk, 0 = relatively neutral)
    "2024680501370323256": 1,
    "2024787934394941633": 1,
    "2024666862219313163": 1,
    "2024638110441885700": 1,
    "2024865606835507266": 0,
    "2024729096882966724": 0,
    # local sample fixture labels
    "1899901000000000001": 0,
    "1899901000000000002": 0,
    "1899901000000000003": 0,
    "1899901000000000004": 1,
    "1899901000000000005": 0,
}

URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)

SENSATIONAL_PATTERNS = [
    r"衝撃",
    r"terrifying",
    r"breaking",
    r"expires? your career",
    r"終わり",
    r"やばい",
    r"100x",
]

URGENCY_PATTERNS = [
    r"あと\d+年",
    r"あと\d+年しかない",
    r"手遅れ",
    r"clock is ticking",
    r"before it'?s too late",
    r"now or never",
]

CERTAINTY_PATTERNS = [
    r"必ず",
    r"絶対",
    r"確実",
    r"勝てない",
    r"will\b",
    r"isn'?t a joke anymore",
]

HEDGE_PATTERNS = [
    r"if true",
    r"if we are right",
    r"could\b",
    r"may\b",
    r"might\b",
    r"可能性",
    r"かもしれ",
]

PROMO_PATTERNS = [
    r"dm me",
    r"early access",
    r"限定",
    r"収益化",
    r"フォロー",
    r"giveaway",
    r"airdrop",
]

AUTHORITY_MENTION_PATTERNS = [
    r"サムアルトマン",
    r"sam altman",
    r"\bceo\b",
    r"研究者",
    r"scientists?",
]

TRUSTED_SOURCE_DOMAINS = {
    "openai.com",
    "youtube.com",
    "youtu.be",
    "reuters.com",
    "arxiv.org",
    "nature.com",
    "science.org",
    "who.int",
    "un.org",
    "whitehouse.gov",
    "europa.eu",
}

SOCIAL_DOMAINS = {
    "x.com",
    "twitter.com",
    "t.co",
    "pic.x.com",
}


@dataclass
class Post:
    post_id: str
    text: str
    created_at: str | None
    author_id: str | None
    author_username: str
    urls: list[str]
    public_metrics: dict[str, Any]
    source: str  # "api:get", "api:search", "sample"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run an exaggeration-detection experiment on X posts.")
    parser.add_argument(
        "--bearer-token",
        default=os.getenv(DEFAULT_BEARER_ENV, ""),
        help=f"X API bearer token (default env: {DEFAULT_BEARER_ENV}).",
    )
    parser.add_argument(
        "--target-id",
        action="append",
        default=[],
        help="Target post ID (repeatable). If omitted, uses built-in default target.",
    )
    parser.add_argument(
        "--probe-id",
        action="append",
        default=[],
        help="Additional probe post IDs (repeatable).",
    )
    parser.add_argument(
        "--search-query",
        default=DEFAULT_SEARCH_QUERY,
        help="Recent search query for extra candidates.",
    )
    parser.add_argument(
        "--search-max-results",
        type=int,
        default=10,
        help="Recent search max results (10-100).",
    )
    parser.add_argument(
        "--skip-search",
        action="store_true",
        help="Skip recent-search candidate collection.",
    )
    parser.add_argument(
        "--sample-file",
        default="scripts/fixtures/x_recent_search_sample.json",
        help="Optional local sample fixture with X-style JSON schema.",
    )
    parser.add_argument(
        "--skip-sample",
        action="store_true",
        help="Skip loading local sample fixture.",
    )
    parser.add_argument(
        "--positive-threshold",
        type=float,
        default=50.0,
        help="Score threshold for positive (exaggeration risk) prediction.",
    )
    parser.add_argument(
        "--output-dir",
        default="research/x-exaggeration",
        help="Directory for markdown/json output.",
    )
    return parser.parse_args()


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_utc(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def text_compact(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def canonical_domain(url: str) -> str:
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.casefold()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def is_trusted_domain(domain: str) -> bool:
    return any(domain == trusted or domain.endswith(f".{trusted}") for trusted in TRUSTED_SOURCE_DOMAINS)


def json_request(endpoint: str, params: dict[str, Any], bearer_token: str, retry_limit: int = 3) -> dict[str, Any]:
    query = urllib.parse.urlencode(params, doseq=True, safe=":,()\"'")
    url = f"{API_BASE_URL}{endpoint}?{query}"
    for attempt in range(1, retry_limit + 1):
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {bearer_token}",
                "User-Agent": "ai-navigator-exaggeration-experiment/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            if error.code == 429 and attempt < retry_limit:
                reset_header = error.headers.get("x-rate-limit-reset", "")
                wait_seconds = 6
                if reset_header.isdigit():
                    wait_seconds = max(1, int(reset_header) - int(time.time()) + 1)
                time.sleep(wait_seconds)
                continue
            raise RuntimeError(f"HTTP {error.code} for {url}\n{body}") from error
        except urllib.error.URLError as error:
            if attempt < retry_limit:
                time.sleep(attempt * 2)
                continue
            raise RuntimeError(f"Network error for {url}: {error}") from error
    raise RuntimeError(f"Failed request after retries: {url}")


def extract_text(tweet: dict[str, Any]) -> str:
    note = tweet.get("note_tweet")
    if isinstance(note, dict):
        note_text = note.get("text")
        if isinstance(note_text, str) and note_text.strip():
            return note_text
    return tweet.get("text", "")


def extract_urls(tweet: dict[str, Any]) -> list[str]:
    urls: list[str] = []
    for raw in (tweet.get("entities", {}) or {}).get("urls", []) or []:
        if not isinstance(raw, dict):
            continue
        resolved = raw.get("unwound_url") or raw.get("expanded_url") or raw.get("url")
        if isinstance(resolved, str) and resolved:
            urls.append(resolved)

    # fallback: parse plain URLs in text if entities are absent
    if not urls:
        for match in URL_RE.findall(extract_text(tweet)):
            urls.append(match)

    # keep order, remove duplicates
    seen: set[str] = set()
    deduped: list[str] = []
    for url in urls:
        if url not in seen:
            deduped.append(url)
            seen.add(url)
    return deduped


def build_post(tweet: dict[str, Any], users_by_id: dict[str, dict[str, Any]], source: str) -> Post | None:
    post_id = tweet.get("id")
    if not post_id:
        return None
    author_id = tweet.get("author_id")
    user = users_by_id.get(author_id, {}) if author_id else {}
    username = user.get("username", "unknown")
    return Post(
        post_id=post_id,
        text=extract_text(tweet),
        created_at=tweet.get("created_at"),
        author_id=author_id,
        author_username=username,
        urls=extract_urls(tweet),
        public_metrics=tweet.get("public_metrics", {}) or {},
        source=source,
    )


def fetch_posts_by_ids(post_ids: list[str], bearer_token: str) -> list[Post]:
    if not post_ids:
        return []
    normalized = sorted({post_id.strip() for post_id in post_ids if post_id.strip()})
    result: list[Post] = []
    for start in range(0, len(normalized), 100):
        chunk = normalized[start : start + 100]
        response = json_request(
            "/tweets",
            params={
                "ids": ",".join(chunk),
                "tweet.fields": "id,created_at,lang,public_metrics,entities,note_tweet,author_id,conversation_id",
                "expansions": "author_id",
                "user.fields": "id,username,name,verified,verified_type,created_at,public_metrics",
            },
            bearer_token=bearer_token,
        )
        users_by_id = {
            user.get("id"): user
            for user in (response.get("includes", {}).get("users") or [])
            if isinstance(user, dict) and user.get("id")
        }
        for tweet in response.get("data", []) or []:
            post = build_post(tweet, users_by_id, source="api:get")
            if post:
                result.append(post)
    return result


def search_recent_posts(query: str, max_results: int, bearer_token: str) -> list[Post]:
    response = json_request(
        "/tweets/search/recent",
        params={
            "query": query,
            "max_results": max(10, min(max_results, 100)),
            "tweet.fields": "id,created_at,lang,public_metrics,entities,note_tweet,author_id,conversation_id",
            "expansions": "author_id",
            "user.fields": "id,username,name,verified,verified_type,created_at,public_metrics",
        },
        bearer_token=bearer_token,
    )
    users_by_id = {
        user.get("id"): user
        for user in (response.get("includes", {}).get("users") or [])
        if isinstance(user, dict) and user.get("id")
    }
    posts: list[Post] = []
    for tweet in response.get("data", []) or []:
        post = build_post(tweet, users_by_id, source="api:search")
        if post:
            posts.append(post)
    return posts


def load_sample_posts(sample_file: Path) -> list[Post]:
    if not sample_file.exists():
        return []
    payload = json.loads(sample_file.read_text(encoding="utf-8"))
    responses = payload if isinstance(payload, list) else [payload]
    posts: list[Post] = []
    for response in responses:
        users_by_id = {
            user.get("id"): user
            for user in (response.get("includes", {}).get("users") or [])
            if isinstance(user, dict) and user.get("id")
        }
        for tweet in response.get("data", []) or []:
            post = build_post(tweet, users_by_id, source="sample")
            if post:
                posts.append(post)
    return posts


def count_regex_hits(text_lower: str, patterns: list[str]) -> int:
    hits = 0
    for pattern in patterns:
        hits += len(re.findall(pattern, text_lower, flags=re.IGNORECASE))
    return hits


def detect_self_reference_links(urls: list[str], username: str) -> int:
    if not username or username == "unknown":
        return 0
    hits = 0
    user_token = f"/{username.casefold()}/status/"
    for url in urls:
        parsed = urllib.parse.urlparse(url)
        domain = canonical_domain(url)
        if domain in {"x.com", "twitter.com"} and user_token in parsed.path.casefold():
            hits += 1
    return hits


def evaluate_post(post: Post, positive_threshold: float) -> dict[str, Any]:
    raw_text = post.text or ""
    text = text_compact(raw_text)
    text_lower = text.casefold()
    domains = [canonical_domain(url) for url in post.urls if canonical_domain(url)]

    sensational_hits = count_regex_hits(text_lower, SENSATIONAL_PATTERNS)
    urgency_hits = count_regex_hits(text_lower, URGENCY_PATTERNS)
    certainty_hits = count_regex_hits(text_lower, CERTAINTY_PATTERNS)
    hedge_hits = count_regex_hits(text_lower, HEDGE_PATTERNS)
    promo_hits = count_regex_hits(text_lower, PROMO_PATTERNS)
    authority_hits = count_regex_hits(text_lower, AUTHORITY_MENTION_PATTERNS)

    exclamation_hits = raw_text.count("!") + raw_text.count("！")
    ellipsis_hits = raw_text.count("...") + raw_text.count("…")

    trusted_domain_count = sum(1 for domain in domains if is_trusted_domain(domain))
    social_domain_count = sum(1 for domain in domains if domain in SOCIAL_DOMAINS)
    no_primary_source = trusted_domain_count == 0
    social_only_links = bool(domains) and social_domain_count == len(domains)
    self_reference_links = detect_self_reference_links(post.urls, post.author_username)
    authority_without_source = authority_hits > 0 and no_primary_source
    quote_markers = ('"' in raw_text) or ("「" in raw_text) or ("『" in raw_text)

    score = 10.0
    score += 10.0 * sensational_hits
    score += 11.0 * urgency_hits
    score += 6.0 * certainty_hits
    score += 7.0 * promo_hits
    score += min(8.0, exclamation_hits * 2.0)
    score += min(8.0, ellipsis_hits * 3.0)

    if no_primary_source:
        score += 14.0
    if social_only_links:
        score += 8.0
    if self_reference_links > 0:
        score += 10.0
    if authority_without_source:
        score += 10.0

    score -= 8.0 * hedge_hits
    score -= min(18.0, trusted_domain_count * 10.0)
    if quote_markers and trusted_domain_count > 0:
        score -= 5.0

    score = round(clamp(score), 2)

    if score >= 70:
        risk_level = "high"
    elif score >= 45:
        risk_level = "medium"
    else:
        risk_level = "low"

    reasons: list[str] = []
    if sensational_hits:
        reasons.append(f"sensational_terms={sensational_hits}")
    if urgency_hits:
        reasons.append(f"urgency_terms={urgency_hits}")
    if certainty_hits:
        reasons.append(f"certainty_terms={certainty_hits}")
    if promo_hits:
        reasons.append(f"promo_terms={promo_hits}")
    if authority_without_source:
        reasons.append("authority_claim_without_primary_source")
    if no_primary_source:
        reasons.append("no_primary_source_link")
    if social_only_links:
        reasons.append("social_links_only")
    if self_reference_links:
        reasons.append(f"self_reference_links={self_reference_links}")
    if hedge_hits:
        reasons.append(f"hedging_terms={hedge_hits}(risk_down)")
    if trusted_domain_count:
        reasons.append(f"trusted_source_links={trusted_domain_count}(risk_down)")

    predicted_positive = int(score >= positive_threshold)
    return {
        "post_id": post.post_id,
        "author_username": post.author_username,
        "created_at": post.created_at,
        "source": post.source,
        "score": score,
        "risk_level": risk_level,
        "predicted_exaggerated": predicted_positive,
        "reasons": reasons,
        "features": {
            "sensational_hits": sensational_hits,
            "urgency_hits": urgency_hits,
            "certainty_hits": certainty_hits,
            "hedge_hits": hedge_hits,
            "promo_hits": promo_hits,
            "authority_hits": authority_hits,
            "exclamation_hits": exclamation_hits,
            "ellipsis_hits": ellipsis_hits,
            "trusted_domain_count": trusted_domain_count,
            "social_domain_count": social_domain_count,
            "self_reference_links": self_reference_links,
            "no_primary_source": no_primary_source,
            "social_only_links": social_only_links,
            "authority_without_source": authority_without_source,
        },
        "urls": post.urls,
        "domains": domains,
        "metrics": post.public_metrics,
        "text": text,
    }


def compute_eval_metrics(scored: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    labelled = [item for item in scored if item["post_id"] in DEFAULT_LABELS]
    tp = fp = tn = fn = 0
    for item in labelled:
        actual = DEFAULT_LABELS[item["post_id"]]
        pred = int(item["score"] >= threshold)
        if pred == 1 and actual == 1:
            tp += 1
        elif pred == 1 and actual == 0:
            fp += 1
        elif pred == 0 and actual == 0:
            tn += 1
        else:
            fn += 1

    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    accuracy = (tp + tn) / len(labelled) if labelled else None
    f1 = None
    if precision is not None and recall is not None and (precision + recall) > 0:
        f1 = 2 * precision * recall / (precision + recall)

    return {
        "labelled_count": len(labelled),
        "threshold": threshold,
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        "precision": round(precision, 4) if precision is not None else None,
        "recall": round(recall, 4) if recall is not None else None,
        "f1": round(f1, 4) if f1 is not None else None,
        "accuracy": round(accuracy, 4) if accuracy is not None else None,
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# X Exaggeration Detection Experiment")
    lines.append("")
    lines.append(f"- Generated at (UTC): `{report['generated_at']}`")
    lines.append(f"- Total scored posts: `{report['meta']['scored_posts']}`")
    lines.append(f"- Threshold (positive): `{report['config']['positive_threshold']}`")
    lines.append(f"- Target IDs: `{', '.join(report['config']['target_ids'])}`")
    lines.append("")

    metrics = report["evaluation"]
    lines.append("## Evaluation (manual labels)")
    lines.append("")
    lines.append(f"- Labelled posts: `{metrics['labelled_count']}`")
    lines.append(
        f"- Confusion matrix: `TP={metrics['confusion_matrix']['tp']}, FP={metrics['confusion_matrix']['fp']}, "
        f"TN={metrics['confusion_matrix']['tn']}, FN={metrics['confusion_matrix']['fn']}`"
    )
    lines.append(
        f"- Precision: `{metrics['precision']}` / Recall: `{metrics['recall']}` / F1: `{metrics['f1']}` / Accuracy: `{metrics['accuracy']}`"
    )
    lines.append("")

    lines.append("## Ranked Results")
    lines.append("")
    lines.append("| Rank | Score | Pred | Label | ID | Author | Source |")
    lines.append("|---|---:|---:|---:|---|---|---|")

    for index, item in enumerate(report["results"], start=1):
        label = DEFAULT_LABELS.get(item["post_id"])
        label_text = "-" if label is None else str(label)
        lines.append(
            f"| {index} | {item['score']:.2f} | {item['predicted_exaggerated']} | {label_text} | "
            f"{item['post_id']} | @{item['author_username']} | {item['source']} |"
        )

    lines.append("")
    lines.append("## Target Post Diagnosis")
    lines.append("")
    target_set = set(report["config"]["target_ids"])
    target_items = [item for item in report["results"] if item["post_id"] in target_set]
    if not target_items:
        lines.append("- No target post found in scored results.")
    else:
        for item in target_items:
            lines.append(f"### {item['post_id']} (@{item['author_username']})")
            lines.append("")
            lines.append(f"- Score: `{item['score']}` ({item['risk_level']})")
            lines.append(f"- Predicted exaggerated: `{item['predicted_exaggerated']}`")
            lines.append(f"- Reasons: `{', '.join(item['reasons']) if item['reasons'] else 'n/a'}`")
            lines.append(f"- Text: {item['text'][:280]}{'...' if len(item['text']) > 280 else ''}")
            lines.append("")

    return "\n".join(lines).strip() + "\n"


def main() -> int:
    args = parse_args()
    started_at = now_utc()

    target_ids = args.target_id if args.target_id else list(DEFAULT_TARGET_IDS)
    probe_ids = args.probe_id if args.probe_id else list(DEFAULT_PROBE_IDS)

    posts_by_id: dict[str, Post] = {}
    errors: list[str] = []

    if not args.skip_sample:
        try:
            for post in load_sample_posts(Path(args.sample_file)):
                posts_by_id[post.post_id] = post
        except Exception as exc:  # noqa: BLE001
            errors.append(f"sample_load_failed: {exc}")

    ids_to_fetch = sorted(set(target_ids + probe_ids))
    if ids_to_fetch:
        if not args.bearer_token:
            errors.append("api_fetch_skipped: bearer token missing")
        else:
            try:
                fetched = fetch_posts_by_ids(ids_to_fetch, args.bearer_token)
                for post in fetched:
                    posts_by_id[post.post_id] = post
            except Exception as exc:  # noqa: BLE001
                errors.append(f"api_get_failed: {exc}")

    if not args.skip_search:
        if not args.bearer_token:
            errors.append("search_skipped: bearer token missing")
        else:
            try:
                searched = search_recent_posts(args.search_query, args.search_max_results, args.bearer_token)
                for post in searched:
                    posts_by_id[post.post_id] = post
            except Exception as exc:  # noqa: BLE001
                errors.append(f"api_search_failed: {exc}")

    scored = [evaluate_post(post, args.positive_threshold) for post in posts_by_id.values()]
    scored.sort(key=lambda item: item["score"], reverse=True)

    evaluation = compute_eval_metrics(scored, args.positive_threshold)

    report = {
        "generated_at": iso_utc(started_at),
        "config": {
            "positive_threshold": args.positive_threshold,
            "target_ids": target_ids,
            "probe_ids": probe_ids,
            "search_query": None if args.skip_search else args.search_query,
            "search_max_results": args.search_max_results,
            "sample_file": None if args.skip_sample else args.sample_file,
        },
        "meta": {
            "scored_posts": len(scored),
            "errors": errors,
        },
        "evaluation": evaluation,
        "results": scored,
    }

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = started_at.strftime("%Y%m%d-%H%M%S")
    json_path = output_dir / f"x-exaggeration-experiment-{stamp}.json"
    md_path = output_dir / f"x-exaggeration-experiment-{stamp}.md"

    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(report), encoding="utf-8")

    print("[OK] Exaggeration experiment completed")
    print(f"  JSON: {json_path}")
    print(f"  Markdown: {md_path}")
    print(f"  Scored posts: {len(scored)}")
    print(f"  Labelled posts: {evaluation['labelled_count']}")
    if evaluation["labelled_count"] > 0:
        cm = evaluation["confusion_matrix"]
        print(f"  Confusion matrix: TP={cm['tp']} FP={cm['fp']} TN={cm['tn']} FN={cm['fn']}")
        print(
            f"  Metrics: precision={evaluation['precision']} recall={evaluation['recall']} "
            f"f1={evaluation['f1']} accuracy={evaluation['accuracy']}"
        )
    if errors:
        print("  Warnings:")
        for err in errors:
            print(f"  - {err}")

    top_n = min(8, len(scored))
    if top_n:
        print("  Top risk posts:")
        for item in scored[:top_n]:
            print(
                f"    {item['score']:>6.2f}  id={item['post_id']} @{item['author_username']} "
                f"pred={item['predicted_exaggerated']} source={item['source']}"
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
