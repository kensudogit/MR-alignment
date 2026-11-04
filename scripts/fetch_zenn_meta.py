"""One-off: fetch Zenn article metadata for zennArticles.js (run locally)."""
import json
import re
import urllib.request

SLUGS = [
    "9248efd636350b",
    "2968d602e166a0",
    "d3d5e2e9c4e439",
    "488ac74d576ff1",
    "1a64bbe88e024d",
    "2d925e7c978e32",
    "14b536888ff813",
    "3710ac5d264bd1",
    "20ad564086699b",
    "f75cd00f4017de",
    "bba6e30a5afd7c",
    "871dfc236e1fa0",
    "84466292c932a2",
    "e2d01da13552d5",
    "9dbb8ee016e44c",
    "1988b9999d48b1",
    "37c7ffd31f22ac",
]


def fetch_api(slug: str) -> dict | None:
    url = f"https://zenn.dev/api/articles/{slug}"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.load(resp)
        return data.get("article", data)
    except Exception as exc:
        print(f"API skip {slug}: {exc}")
        return None


def fetch_description(public_url: str) -> str | None:
    req = urllib.request.Request(public_url, headers={"User-Agent": "MR-alignment/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            html_text = resp.read().decode("utf-8", "replace")
    except Exception:
        return None
    m = re.search(r'<meta name="description" content="([^"]*)"', html_text)
    if not m:
        return None
    return m.group(1).replace("&amp;", "&").strip()


def main() -> None:
    articles = []
    seen_slugs: set[str] = set()
    for slug in SLUGS:
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        raw = fetch_api(slug)
        if not raw:
            continue
        if raw.get("is_suspending_private"):
            continue
        path = raw.get("path") or ""
        if not path.startswith("/"):
            continue
        public_url = f"https://zenn.dev{path}"
        topics = [t.get("name") for t in (raw.get("topics") or []) if t.get("name")]
        desc = fetch_description(public_url) or (
            " / ".join(topics[:5]) if topics else "Zenn 公開記事"
        )
        articles.append(
            {
                "slug": slug,
                "title": (raw.get("title") or "").strip(),
                "summary": desc[:280],
                "publishedAt": raw.get("published_at"),
                "topics": topics,
                "emoji": raw.get("emoji") or "📝",
                "url": public_url,
            }
        )
    articles.sort(key=lambda a: a.get("publishedAt") or "", reverse=True)
    print(json.dumps(articles, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
