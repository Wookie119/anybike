# Isolated Chromium layout regression. Requires Python Playwright and Chromium.
# Uses the real repository stylesheet and synthetic content; never contacts live services.
from playwright.sync_api import sync_playwright
from pathlib import Path
import os
css = (Path(__file__).resolve().parent.parent / "motorcycle-listing-master.css").read_text()
image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="300"%3E%3Crect width="900" height="300" fill="%23222222"/%3E%3C/svg%3E'
html = f'''<style>body{{margin:8px}}{css}</style><main class="ab-listing-master"><div class="ab-listing-columns"><div class="ab-listing-gallery"><img src='{image}'></div><div><dl class="ab-listing-facts"><div><dt>Model</dt><dd>Honda VFR400R</dd></div><div><dt>Condition</dt><dd>Unknown</dd></div></dl></div></div><div data-listing-placement="listing_after_gallery" hidden></div><h3>Description</h3><div data-listing-placement="listing_after_description"><article><a href="#"><picture><img src='{image}'></picture></a><small>Advertisement</small></article></div><h3>History and checks</h3><h3>Bidding</h3><h3>Seller-declared paperwork</h3><div data-listing-placement="listing_bottom"></div></main>'''
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH", "/usr/bin/chromium"), args=["--no-sandbox"])
    passed = 0
    for width in [320,360,390,768,1024,1440]:
        page = browser.new_page(viewport={"width":width,"height":900})
        page.set_content(html)
        page.wait_for_load_state("load")
        checks = page.evaluate('''()=>{let q=s=>document.querySelector(s), rect=e=>e.getBoundingClientRect(), css=e=>getComputedStyle(e),root=q('main'),slot=q('[data-listing-placement="listing_after_description"]'),img=slot.querySelector('img');return {noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth,rootBackground:css(root).backgroundColor==='rgb(5, 4, 4)',hiddenSlot:css(q('[data-listing-placement="listing_after_gallery"]')).display==='none',emptySlot:css(q('[data-listing-placement="listing_bottom"]')).display==='none',fullWidthArtwork:Math.abs(rect(img).width-rect(slot).width)<1,proportionalArtwork:Math.abs(rect(img).width/rect(img).height-3)<.02,columns:css(q('.ab-listing-columns')).gridTemplateColumns.split(' ').length===(innerWidth<=790?1:2),factsColumns:css(q('.ab-listing-facts')).gridTemplateColumns.split(' ').length===(innerWidth<=360?1:2)}}''')
        for label, result in checks.items():
            assert result, f"{width}px: {label}"
            passed += 1
        print(f"{width}px: {len(checks)} checks passed")
        page.close()
    browser.close()
    print(f"{passed} browser layout checks passed")
