"""Expose the sitemap's market routes as links in the directory HTML."""

from collections import defaultdict
from html import escape
import json
from pathlib import Path
import re
from runpy import run_path
from urllib.parse import urlencode
from xml.etree import ElementTree

ORIGIN = "https://www.anybike.co.uk"
ROUTE = re.compile(r"(/(?:[a-z]{2}/)?markets/([a-z0-9-]+)\.html)")


def language_label(tag):
    return {"en": "English", "fr": "Français", "sv": "Svenska"}.get(tag.split("-")[0], tag)


def refresh_directory(folder, sitemap_text):
    directory = folder / "international-markets.html"
    source = directory.read_text(encoding="utf-8")
    markets = json.loads(re.search(r"^const markets = (\[.*\]);$", source, re.M)[1])
    regions = json.loads(re.search(r"^const regionOrder = (\[.*\]);$", source, re.M)[1])
    routes = defaultdict(list)
    for node in ElementTree.fromstring(sitemap_text).findall(".//{*}loc"):
        if node.text and node.text.startswith(ORIGIN):
            match = ROUTE.fullmatch(node.text.removeprefix(ORIGIN))
            if match:
                path, slug = match.groups()
                routes[slug].append(path)

    groups = defaultdict(list)
    translations = []
    linked = set()
    for market in markets:
        path = market.get("url") or ""
        route = ROUTE.fullmatch(path)
        if market["status"] != "available" or not route or path not in routes[route[2]]:
            continue
        name = escape(market["name"])
        groups[market["region"]].append(f'<a class="port-chip" href="{path}">{name}</a>')
        linked.add(path)
        if len(routes[route[2]]) > 1:
            links = []
            for url in sorted(routes[route[2]]):
                page = (folder / url.lstrip("/")).read_text(encoding="utf-8")
                tag = re.search(r'<html lang="([a-z]{2}(?:-[A-Z]{2})?)"', page)[1]
                label = language_label(tag)
                links.append(f'<a href="{url}" hreflang="{tag}" lang="{tag}">{label}</a>')
                linked.add(url)
            market_name = "La Réunion" if route[2] == "reunion" else name
            translations.append(
                f'<li data-primary-market="{path}"><h4>{market_name}</h4>'
                f'<nav aria-label="{market_name} languages">{" ".join(links)}</nav></li>'
            )

    missing = {path for paths in routes.values() for path in paths} - linked
    if missing:
        raise ValueError("Add sitemap-listed markets to the directory: " + ", ".join(sorted(missing)))

    fallback = "\n".join(
        f'<section><h3>{escape(region)}</h3><div class="port-list">{" ".join(groups[region])}</div></section>'
        for region in regions if groups[region]
    )
    language_links = (
        '<section class="market-languages" aria-labelledby="marketLanguageTitle">'
        '<h3 id="marketLanguageTitle">Market guides in two languages</h3>'
        '<p>Choose English or the local language to open your guide.</p><ul>'
        + "".join(translations) + "</ul></section>"
        if translations else ""
    )
    port_groups = run_path(str(Path(__file__).with_name("export-country-master.py")))["UK_PORT_GROUPS"]
    port_links = []
    for region, ports in port_groups.items():
        links = []
        for port in ports:
            query = escape(urlencode({"api": 1, "query": f"Port of {port}, UK"}), quote=True)
            links.append(f'<a class="port-chip" href="https://www.google.com/maps/search/?{query}">{escape(port)}</a>')
        port_links.append(f'<section class="handover-port-region"><h4>{escape(region)}</h4><div class="port-list">{" ".join(links)}</div></section>')
    port_markup = (
        f'<h3>{sum(map(len, port_groups.values()))} UK ports to consider</h3>'
        '<p>Confirm the handover point and motorcycle acceptance with your shipping agent before booking.</p>'
        '<div class="handover-port-regions">' + "\n".join(port_links) + '</div>'
    )
    for key, markup in (("market-links", fallback), ("market-languages", language_links), ("market-ports", port_markup)):
        start, end = f"<!-- {key}:start -->", f"<!-- {key}:end -->"
        source, count = re.subn(re.escape(start) + r".*?" + re.escape(end),
                               lambda _: f"{start}\n{markup}\n{end}", source, flags=re.S)
        if count != 1:
            raise ValueError(f"Expected one {key} section in {directory}")
    temporary = directory.with_suffix(".tmp")
    temporary.write_text(source, encoding="utf-8")
    temporary.replace(directory)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    refresh_directory(root, (root / "sitemap.xml").read_text(encoding="utf-8"))
