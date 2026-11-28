"""Generate crawlable country-language pages from reviewed Supabase records."""

import argparse
from collections import Counter
import html
import json
import posixpath
from pathlib import Path
import re
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from runpy import run_path

exporter = run_path(str(Path(__file__).with_name("export-country-master.py")))
ATTRIBUTES, TAGS, safe_url = (exporter[name] for name in ("ATTRIBUTES", "TAGS", "safe_url"))
directory_builder = run_path(str(Path(__file__).with_name("build-market-directory.py")))
refresh_directory, language_label = (directory_builder[name] for name in ("refresh_directory", "language_label"))

ORIGIN = "https://www.anybike.co.uk"
SUPABASE = "https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/public_anybike_country_master_v1"
PUBLIC_KEY = "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK"
VOID_TAGS = {"img", "br", "hr"}


def market_path(slug, primary, locale):
    prefix = "" if locale == primary else "/" + locale.split("-")[0]
    return f"{prefix}/markets/{slug}.html"


def fetch_market(slug, language):
    query = urlencode({"p_slug": slug, "p_locale": language})
    request = Request(f"{SUPABASE}?{query}", headers={"apikey": PUBLIC_KEY})
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def render_node(record, path, kind=None):
    if isinstance(record, str):
        return html.escape(record)
    tag = record.get("tag")
    if tag not in TAGS:
        raise ValueError(f"Unexpected content tag: {tag!r}")
    settings = {}
    if kind is not None:
        settings["data-country-section"] = kind
    for name, value in record.get("attrs", {}).items():
        if name in ATTRIBUTES or name == "lang":
            settings[name] = value
        elif (tag, name) in {("a", "href"), ("img", "src")}:
            url = safe_url(value, path)
            if url is not None:
                settings[name] = url
    attributes = "".join(f' {name}="{html.escape(str(value), quote=True)}"' for name, value in settings.items())
    start = f"<{tag}{attributes}>"
    if tag in VOID_TAGS:
        return start
    return start + "".join(render_node(child, path) for child in record.get("children", [])) + f"</{tag}>"


def global_cards(data, prefix):
    def published_cards(key):
        return [story for story in data.get(key, [])
                if story.get("locale") == data["locale"] and story.get("title")
                and re.fullmatch(r"/global/[a-z0-9-]+[.]html", story.get("url", ""))]

    regional = published_cards("localStories")
    stories = regional or published_cards("worldwideStories")
    cards = []
    for story in stories[:3]:
        title = html.escape(story["title"])
        summary = html.escape(story.get("summary") or "")
        article_locale = html.escape(story.get("articleLocale", "en"), quote=True)
        figure = ""
        image = safe_url(story.get("image") or "", story["url"]) if story.get("image") else None
        source = safe_url(story.get("source") or "", story["url"]) if story.get("source") else None
        licence_url = safe_url(story.get("licenceUrl") or "", story["url"]) if story.get("licenceUrl") else None
        if image and source and licence_url and story.get("credit") and story.get("licence"):
            if prefix and image.startswith("/"):
                image = prefix + image
            resized = {"sv": "skalad bild", "fr": "image redimensionnée"}.get(data["locale"], "resized image")
            note = " · " + resized if story.get("resized") else ""
            figure = f'''<figure><img src="{html.escape(image, quote=True)}" alt="{html.escape(story.get('alt') or '', quote=True)}" loading="lazy" decoding="async">
<figcaption><a href="{html.escape(source, quote=True)}">{html.escape(story['credit'])}</a> · <a href="{html.escape(licence_url, quote=True)}">{html.escape(story['licence'])}</a>{note}</figcaption></figure>'''
        cards.append(f'''<article class="country-global-story">{figure}<div class="country-global-story-copy">
<h3><a href="{prefix}{story['url']}" hreflang="{article_locale}">{title}</a></h3>
<p>{summary}</p></div></article>''')
    return f'<div class="country-global-stories">{"".join(cards)}</div>' if cards else ""


def country_page(slug, primary, tag, records, preview, staging=False):
    language = tag.split("-")[0]
    data = records[tag]
    def ui(label):
        return html.escape(data.get("ui", {}).get(label, label), quote=True)
    path = market_path(slug, primary, tag)
    switches = []
    alternates = []
    for alternate in records:
        url = market_path(slug, primary, alternate)
        alternates.append(f'<link rel="alternate" hreflang="{alternate}" href="{ORIGIN}{url}">')
        if alternate != tag:
            label = language_label(alternate)
            href = posixpath.relpath(url, posixpath.dirname(path)) if preview else url
            switches.append(f'<a class="btn" hreflang="{alternate}" lang="{alternate}" href="{href}">{label}</a>')
    body = "".join(render_node(section["content"], path, section["kind"]) for section in data["sections"])
    robots = "noindex,follow" if preview or staging else "index,follow"
    css = "../" * (path.count("/") - 1) if preview else "/"
    if preview:
        body = re.sub(r' src="/(assets/[^"]+)"', lambda match: f' src="{css}{match[1]}"', body)
        body = re.sub(r' href="/(?!/)', f' href="{ORIGIN}/', body)
    dynamic = ""
    if not preview:
        snapshot = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
        dynamic = f'''<script type="application/json" id="country-page-snapshot">{snapshot}</script>
<script type="module" src="/market-template/market-master.mjs"></script>'''
    translation = ' data-country-translation' if tag != primary else ''
    nav_prefix = ORIGIN if preview else ""
    global_block = f'''<section class="country-global" aria-labelledby="static-country-global" data-country-section="global">
<header class="country-global-masthead"><h2 id="static-country-global">AnyBike <span>Global</span></h2>
<a class="btn" href="{nav_prefix}/anybike-global.html">{ui("Explore AnyBike Global")}</a></header>
{global_cards(data, nav_prefix)}</section>'''
    if any(section["kind"] == "global" for section in data["sections"]):
        global_block = ""
    return f'''<!doctype html>
<html lang="{tag}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="{robots}">
<meta name="description" content="{html.escape(data['description'], quote=True)}">
<meta name="theme-color" content="#050505">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(data['title'], quote=True)}">
<meta property="og:description" content="{html.escape(data['description'], quote=True)}">
<meta property="og:url" content="{ORIGIN}{path}">
<title>{html.escape(data['title'])}</title>
<link rel="canonical" href="{ORIGIN}{path}">
{"\n".join(alternates)}
<link rel="stylesheet" href="{css}market-country.css">
<link rel="stylesheet" href="{css}market-template/market-master.css">
</head>
<body>
<main data-country-master="{slug}" data-country-locale="{language}"{translation}>
<header data-country-site-navigation class="country-pilot-navigation">
<nav class="country-pills" aria-label="{ui("Main navigation")}">
<a href="{nav_prefix}/">AnyBike</a>
<a href="{nav_prefix}/available-stock.html">{ui("Available Stock")}</a>
<a href="{nav_prefix}/international-markets.html">{ui("Markets")}</a>
<a href="{nav_prefix}/anybike-connect.html">{ui("Contact AnyBike")}</a>
</nav>
<nav class="country-pills" aria-label="{ui("Language")}">{"".join(switches)}</nav>
</header>
{body}
{global_block}
</main>
{dynamic}
</body>
</html>
'''


def build(slug, tags, folder, fixtures=None, staging=False):
    primary = tags[0]
    records = {tag: fixtures.get(tag) if fixtures is not None else fetch_market(slug, tag.split("-")[0]) for tag in tags}
    for tag, data in records.items():
        if not isinstance(data, dict) or data.get("slug") != slug or data.get("locale") != tag.split("-")[0]:
            raise ValueError(f"{slug}: exact locale {tag} unavailable (the database may have returned a fallback)")
        if not str(data.get("title") or "").strip() or not str(data.get("description") or "").strip() or not data.get("sections"):
            raise ValueError(f"{slug}: {tag} lacks reviewed title, description or main content")
        if tag != primary:
            if (fixtures is None or staging) and data.get("translationStatus") != "reviewed":
                raise ValueError(f"{slug}: {tag} has no reviewed translation status")
            if any(data[field] == records[primary][field] for field in ("title", "description", "sections")):
                raise ValueError(f"{slug}: {tag} duplicates primary-language content")
            language = tag.split("-")[0]
            if any(section["content"].get("attrs", {}).get("lang", "").split("-")[0] not in {"", language}
                   for section in data["sections"]):
                raise ValueError(f"{slug}: {tag} has untranslated sections")
            required = Counter(section["kind"] for section in records[primary]["sections"])
            translated = Counter(section["kind"] for section in data["sections"])
            if required - translated:
                raise ValueError(f"{slug}: {tag} lacks sections present in {primary}: {', '.join(required - translated)}")
    pages = {market_path(slug, primary, tag): country_page(slug, primary, tag, records, fixtures is not None and not staging, staging)
             for tag in tags}
    sitemap = folder / "sitemap.xml"
    if fixtures is None and not staging:
        sitemap_text = sitemap.read_text()
        if sitemap_text.count("</urlset>") != 1:
            raise ValueError("Expected one sitemap closing element")
        missing = [path for path in pages if f"<loc>{ORIGIN}{path}</loc>" not in sitemap_text]
        sitemap_text = sitemap_text.replace("</urlset>", "".join(f"  <url><loc>{ORIGIN}{path}</loc></url>\n" for path in missing) + "</urlset>")
    for path, markup in pages.items():
        target = folder / path.lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".tmp")
        temporary.write_text(markup)
        temporary.replace(target)
        print(target)
    if fixtures is None and not staging:
        if (folder / "international-markets.html").exists():
            refresh_directory(folder, sitemap_text)
        temporary = sitemap.with_suffix(".tmp")
        temporary.write_text(sitemap_text)
        temporary.replace(sitemap)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("market")
    parser.add_argument("locales", nargs="+", help="Primary locale first, for example en-SE sv-SE")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--fixtures", type=Path, help="Build noindex test pages from local JSON without changing the sitemap")
    parser.add_argument("--staging", action="store_true", help="Render noindex pages with normal asset and script URLs")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9-]+",args.market) or not all(re.fullmatch(r"[a-z]{2}(?:-[A-Z]{2})?",tag) for tag in args.locales):
        parser.error("Invalid slug or locale")
    if len({tag.split("-")[0] for tag in args.locales}) != len(args.locales):
        parser.error("Use one URL per language for this market")
    if args.fixtures and (args.output_dir / "sitemap.xml").exists():
        parser.error("Use a separate preview directory for fixture pages")
    build(args.market, args.locales, args.output_dir, json.loads(args.fixtures.read_text()) if args.fixtures else None, args.staging)


if __name__ == "__main__":
    main()
