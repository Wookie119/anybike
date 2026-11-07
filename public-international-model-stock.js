/* AnyBike international model stock: approved public gallery only, no protected tables.
   Does not modify model content, templates, photography or sales forms. */
(function () {
  "use strict";
  if (window.__anybikeIntlModelStockInstalled) return;
  window.__anybikeIntlModelStockInstalled = true;
  const brands = [
    ["Harley-Davidson", "harley-davidson"], ["Royal Enfield", "royal-enfield"],
    ["Moto Guzzi", "moto-guzzi"], ["Indian Motorcycle", "indian"],
    ["BMW", "bmw"], ["Honda", "honda"], ["Yamaha", "yamaha"],
    ["Ducati", "ducati"], ["Triumph", "triumph"], ["Kawasaki", "kawasaki"],
    ["Suzuki", "suzuki"], ["KTM", "ktm"], ["Aprilia", "aprilia"],
    ["Husqvarna", "husqvarna"], ["Benelli", "benelli"], ["CFMOTO", "cfmoto"],
    ["Zero", "zero"], ["VMoto", "vmoto"]
  ];
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = location.pathname.toLowerCase();
  if (/-v2\.html$|-backup[^/]*\.html$|-preview\.html$/.test(path)) return;
  const brand = brands.find(([, slug]) => path.startsWith("/" + slug + "-") && path.endsWith(".html"));
  if (!brand || path === "/" + brand[1] + "-motorcycles.html") return;
  const name = brand[0];
  function makeCard(item) {
    const card = document.createElement("a");
    card.href = "/international-vq-motorcycle.html?id=" + encodeURIComponent(item.item_id);
    card.style.cssText = "display:block;background:#242424;border:1px solid #555;border-top:3px solid #ed1c24;border-radius:9px;padding:12px;color:#fff;text-decoration:none;min-width:0";
    const img = document.createElement("img");
    img.src = item.image_url;
    img.alt = [item.make, item.model, item.year].filter(Boolean).join(" ");
    img.loading = "lazy";
    img.style.cssText = "display:block;width:100%;height:165px;object-fit:cover;border-radius:6px;background:#202020";
    img.onerror = function () { img.remove(); };
    const title = document.createElement("strong");
    title.textContent = [item.year, item.make, item.model].filter(Boolean).join(" ");
    const detail = document.createElement("p");
    detail.style.cssText = "margin:6px 0;color:#dedede;font-size:14px";
    detail.textContent = [
      item.mileage != null ? Number(item.mileage).toLocaleString("en-GB") + " miles" : "",
      Number(item.price) > 0 ? Number(item.price).toLocaleString("en-GB", { style:"currency", currency:"GBP" }) : "Price on request"
    ].filter(Boolean).join(" · ");
    const action = document.createElement("span");
    action.style.cssText = "color:#fff;font-weight:700;text-decoration:underline";
    action.textContent = "View motorcycle →";
    card.append(img, title, detail, action);
    return card;
  }
  async function begin() {
    const main = document.querySelector("main");
    if (!main) return;
    const h1 = main.querySelector("h1");
    if (!h1) return;
    const heading = h1.textContent.trim().replace(/\s+/g, " ");
    if (!norm(heading).startsWith(norm(name))) return;
    const model = heading.slice(name.length).trim();
    if (!model || /^(?:motorcycles|models|stock|history|range)$/i.test(model)) return;
    const key = norm(model);
    const existing = document.getElementById("anybikeInternationalPublishedStock");
    if (existing) return;
    const panel = document.createElement("section");
    panel.id = "anybikeInternationalPublishedStock";
    panel.className = "end-action";
    panel.style.cssText = "margin:22px 0;padding:22px;border:1px solid #484848;border-top:3px solid #ed1c24;border-radius:12px;background:#171717;color:#fff";
    const title = document.createElement("h2");
    title.textContent = name + " motorcycles in Available Stock";
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.style.cssText = "color:#ddd;line-height:1.6";
    status.textContent = "Checking approved international motorcycle stock…";
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px";
    const links = document.createElement("p");
    links.style.cssText = "margin:16px 0 0;display:flex;flex-wrap:wrap;gap:12px";
    const stockLink = document.createElement("a");
    stockLink.href = "/available-stock.html?make=" + encodeURIComponent(name);
    stockLink.textContent = "Browse all " + name + " Available Stock →";
    stockLink.style.cssText = "color:#fff;font-weight:700";
    const sourceLink = document.createElement("a");
    sourceLink.href = "/bulk-buying-request.html?make=" + encodeURIComponent(name) + "&model=" + encodeURIComponent(model);
    sourceLink.textContent = "Ask AnyBike to source a " + model + " →";
    sourceLink.style.cssText = "color:#fff;font-weight:700";
    links.append(stockLink, sourceLink);
    panel.append(title, status, grid, links);
    const currentStock = document.getElementById("internationalModelStock") ||
      document.getElementById("r1250LiveStock") ||
      document.querySelector(".anybike-model-stock-grid")?.closest("section");
    const target = currentStock || main.querySelector(".hero") || h1.closest("section") || h1;
    target.insertAdjacentElement(currentStock ? "beforebegin" : "afterend", panel);
    const endpoint = "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/international-public-stock";
    let authToken = "";
    try {
      const client = window.sb || window.supabase?.createClient?.(
        "https://tuehtnezhdnkqbbhttgp.supabase.co", "sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK"
      );
      authToken = (await client?.auth?.getSession?.())?.data?.session?.access_token || "";
    } catch (_) {}
    // Different pages historically used different storage keys. Honour any existing
    // signed-in session via the site's configured Supabase client first.
    try {
      const globalClient = window.anybikeSupabaseClient || window.supabaseClient;
      const existingToken = (await globalClient?.auth?.getSession?.())?.data?.session?.access_token;
      if (existingToken) authToken = existingToken;
    } catch (_) {}
    try {
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch(endpoint, { cache:"no-store", headers:authToken ? { Authorization:"Bearer " + authToken } : {} });
          if (response.status !== 503) break;
        } catch (err) {
          if (attempt === 1) throw err;
        }
      }
      if (!response || !response.ok) {
        if (response?.status === 403) { panel.remove(); return; }
        status.textContent = "Live stock is temporarily unavailable. Please use Available Stock or contact AnyBike to check current motorcycles.";
        return;
      }
      const body = await response.json();
      const items = Array.isArray(body.items) ? body.items : [];
      const brandStock = items.filter(x => norm(x.make) === norm(name) && x.item_id && Number(x.price) > 0 && x.image_url);
      const exact = brandStock.filter(x => {
        const stockModel = norm(x.model);
        return stockModel === key || stockModel.startsWith(key);
      });
      const selected = (exact.length ? exact : brandStock).slice(0, 6);
      title.textContent = exact.length ? name + " " + model + " — available UK motorcycles" : "Other " + name + " motorcycles currently for sale";
      status.textContent = exact.length ?
        exact.length + " published " + name + " " + model + " listing" + (exact.length === 1 ? "" : "s") + ". Availability and purchase terms are confirmed before ordering." :
        "No exact " + name + " " + model + " is currently published. These are alternative " + name + " models, not the motorcycle you requested. We can source the exact model separately.";
      if (!selected.length) status.textContent = "No published " + name + " stock is currently listed. Ask AnyBike to source the model you want.";
      grid.replaceChildren(...selected.map(makeCard));
      // Hide duplicate legacy stock section only after a successful live feed.
      // Its separate enquiry form and the approved editorial remain untouched.
      if (currentStock && currentStock !== panel && !currentStock.querySelector("form")) {
        currentStock.hidden = true;
        currentStock.style.setProperty("display", "none", "important");
      }
    } catch (err) {
      status.textContent = "Unable to check live motorcycles right now. Browse Available Stock or send a sourcing request.";
      console.warn("AnyBike approved model stock feed unavailable", err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin, { once: true });
  else begin();
})();
