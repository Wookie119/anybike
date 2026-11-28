"""Audit existing country sections and generate reviewable master template records."""

import argparse
from collections import Counter
import json
from pathlib import Path
import re
from urllib.parse import urlencode, urljoin, urlsplit

from lxml import etree, html

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://www.anybike.co.uk"
TAGS = set("""
section div header article aside nav h1 h2 h3 h4 h5 p strong em b i small span a img
figure figcaption ul ol li dl dt dd details summary br hr blockquote table caption
thead tbody tr th td
""".split())
ATTRIBUTES = {"class", "id", "title", "alt", "width", "height", "loading", "decoding",
              "aria-label", "aria-labelledby", "aria-hidden", "role", "open", "hidden",
              "scope", "colspan", "rowspan"}
DISCARD = {"script", "style", "form", "input", "iframe", "object", "embed", "svg"}


def safe_url(value, page):
    if value.startswith("#"):
        return value
    target = urlsplit(urljoin(ORIGIN + page, value))
    if target.scheme != "https" or not target.hostname or target.username or target.password:
        return None
    if target.netloc == "www.anybike.co.uk":
        return target._replace(scheme="", netloc="").geturl()
    return target.geturl()


def encode(node, page):
    if not isinstance(node.tag, str) or node.tag in DISCARD:
        return []
    children = [node.text] if node.text else []
    for child in node:
        children.extend(encode(child, page))
        if child.tail:
            children.append(child.tail)
    if node.tag not in TAGS:
        return children
    attrs = {key: value for key, value in node.attrib.items() if key in ATTRIBUTES}
    if node.tag in {"a", "img"}:
        key = "href" if node.tag == "a" else "src"
        value = safe_url(node.get(key), page) if node.get(key) else None
        if value:
            attrs[key] = value
    return [{"tag": node.tag, "attrs": attrs, "children": children}]


def kind(node):
    classes = set(node.get("class", "").split())
    marker = node.get("id", "")
    if "hero" in classes:
        return "hero"
    if marker in {"market-interest", "marketSelectionSection", "countryBuyerInterestSection"}:
        return "local_interest"
    if marker == "handover" or "anybike-market-local-standard" in classes:
        return "transport_and_local_information"
    if marker == "brands-models":
        return "manufacturer_and_model_guides"
    if node.get("data-anybike-market-links") is not None:
        return "related_guides_and_markets"
    for key, names in {
        "manufacturer_guides": {"brand-grid"},
        "model_guides": {"model-grid"},
        "buying_process": {"process-grid"},
        "faq": {"faq", "faq-grid"},
        "available_stock": {"stock-grid"},
        "enquiry": {"cta"},
        "transport_and_local_information": {"shipping-grid", "port-list", "city-list"},
        "why_anybike": {"value-grid", "trust-grid"},
    }.items():
        if any(names.intersection(el.get("class", "").split()) for el in node.iter() if isinstance(el.tag, str)):
            return key
    return "local_content"


UK_PORT_GROUPS = {
    "Channel & South Coast": ("Dover", "Newhaven", "Portsmouth", "Southampton", "Poole", "Plymouth", "Falmouth"),
    "Thames, Medway & East Anglia": ("Felixstowe", "Harwich", "Ipswich", "London Gateway", "Purfleet", "Sheerness", "Thamesport", "Tilbury"),
    "Humber & North East": ("Hull", "Immingham", "Grimsby", "Teesport", "Port of Tyne", "Sunderland"),
    "West Coast & Wales": ("Bristol", "Portbury", "Liverpool", "Heysham", "Holyhead", "Fishguard", "Pembroke Dock", "Cardiff", "Newport", "Swansea"),
    "Scotland": ("Aberdeen", "Cairnryan", "Dundee", "Grangemouth", "Leith", "Rosyth"),
    "Northern Ireland": ("Belfast", "Larne", "Warrenpoint"),
}


def uk_port_directory(page, locale):
    """Shared reference ports. This directory does not establish an AnyBike route."""
    french = locale == "fr"
    section = html.Element("section", {"class": "country-port-directory"})
    etree.SubElement(section, "h4").text = "Ports du Royaume-Uni" if french else "Explore UK ports"
    etree.SubElement(section, "p").text = (
        "Confirmez le port et la prise en charge de la moto avec votre transitaire avant de réserver."
        if french else "Ask your freight forwarder to confirm the handover port and motorcycle acceptance before booking."
    )
    regions = etree.SubElement(section, "div", {"class": "country-port-regions"})
    for region, names in UK_PORT_GROUPS.items():
        group = etree.SubElement(regions, "div")
        etree.SubElement(group, "h5").text = region
        nav = etree.SubElement(group, "nav", {"class": "country-pills", "aria-label": region})
        for name in names:
            query = urlencode({"api": 1, "query": name + " port, United Kingdom"})
            etree.SubElement(nav, "a", href="https://www.google.com/maps/search/?" + query).text = name + " ↗"
    etree.SubElement(section, "a", href="https://www.britishports.org.uk/content/uploads/2024/09/UK-Ports-Directory-2024_25-with-covers-72dpi.pdf").text = (
        "Annuaire des ports britanniques" if french else "UK Ports Directory"
    )
    return {"kind": "uk_ports", "content": encode(section, page)[0]}


def rendered_supplements(file, page):
    """Recover public sections mounted by the legacy country scripts."""
    doc = html.parse(str(file), parser=html.HTMLParser(encoding="utf-8"))
    selectors = (
        ("destination_planning", "//*[@data-anybike-local-standard or contains(@class,'anybike-market-local-standard')]"),
        ("buying_services", "//*[@data-anybike-internal-links]"),
        ("uk_handover", "//*[@data-anybike-handover-standardised and self::section]"),
        ("manufacturer_heritage", "//*[@data-anybike-manufacturer-heritage]"),
    )
    for key, selector in selectors:
        node = next(iter(doc.xpath(selector)), None)
        if node is not None:
            if key == "uk_handover":
                for old_list in node.xpath(".//*[contains(concat(' ',normalize-space(@class),' '),' ab-local-card ')]"):
                    old_list.drop_tree()
            yield {"kind": key, "content": encode(node, page)[0]}


def export(file, rendered_dir=None):
    doc = html.parse(str(file), parser=html.HTMLParser(encoding="utf-8"))
    path = "/markets/" + file.name
    market = doc.xpath("string((//html/@data-country|//main//section[contains(@class,'hero')]//strong/text())[1])").strip()
    if not market:
        market = doc.xpath("string((//main//section[contains(@class,'hero')]//img[contains(@src,'flagcdn')]/@alt)[1])")
        market = re.sub(r"^(?:Flag of |Drapeau de )| flag$", "", market).strip()
    if not market:
        market = file.stem.replace("-", " ").title()
    main_sections = doc.xpath("//main/section")
    if not main_sections:
        raise ValueError(f"Country page has no direct sections: {file}")
    sections = []
    for section in main_sections:
        if file.stem == "sweden":
            questions = {
                "Can Sweden motorcycle dealers buy through AnyBike?": "Can Swedish motorcycle dealers buy through AnyBike?",
                "Can private buyers in the Sweden purchase through AnyBike?": "Can private buyers in Sweden purchase through AnyBike?",
                "Which Sweden ports can be considered?": "Which Swedish ports can be considered?",
                "Can every UK motorcycle be registered in the Sweden?": "Can every UK motorcycle be registered in Sweden?",
            }
            for question in section.xpath(".//summary"):
                if question.text and question.text.strip() in questions:
                    question.text = questions[question.text.strip()]
        tree = encode(section, path)
        if len(tree) != 1:
            raise ValueError(f"Section did not export: {file}")
        sections.append({"kind": kind(section), "content": tree[0]})
    if rendered_dir:
        rendered = rendered_dir / file.name
        if not rendered.is_file():
            raise FileNotFoundError(f"Missing rendered legacy snapshot: {rendered}")
        sections.extend(rendered_supplements(rendered, path))
    locale = doc.xpath("string(//html/@lang)").split("-")[0] or "en"
    sections.append(uk_port_directory(path, locale))
    return {
        "slug": file.stem, "path": path, "market": market, "locale": locale,
        "title": doc.xpath("string(//title)").strip(),
        "description": doc.xpath("string(//meta[@name='description']/@content)").strip(),
        "sections": sections,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("markets", nargs="*")
    parser.add_argument("--rendered-dir", type=Path, help="Directory with rendered legacy HTML snapshots for these markets")
    parser.add_argument("--audit", action="store_true")
    parser.add_argument("--sql", action="store_true", help="Output an unpublished SQL import for review")
    args = parser.parse_args()
    if args.audit:
        pages = [export(f) for f in sorted((ROOT / "markets").glob("*.html")) if f.stem != "index"]
        counts = Counter(section["kind"] for page in pages for section in page["sections"])
        print(json.dumps({"pages": len(pages), "sections": sum(counts.values()), "kinds": counts}, indent=2))
    elif args.markets:
        for market in args.markets:
            if not re.fullmatch(r"[a-z0-9-]+", market) or market == "index":
                parser.error("Invalid market slug")
        pages = [export(ROOT / "markets" / f"{market}.html", args.rendered_dir) for market in args.markets]
        if args.sql:
            print("begin;")
            for page in pages:
                payload = json.dumps(page, ensure_ascii=False).replace("'", "''")
                slug, locale = page["slug"], page["locale"]
                if not re.fullmatch(r"[a-z]{2}", locale):
                    raise ValueError(f"Unsupported locale: {locale}")
                print("insert into anybike_publishing.country_master_pages (slug,locale,content,is_primary) "
                      f"values ('{slug}','{locale}','{payload}'::jsonb,true) on conflict do nothing;")
            print("commit;")
        else:
            print(json.dumps(pages, ensure_ascii=False))
    else:
        parser.error("Supply market slugs or --audit")


if __name__ == "__main__":
    main()
