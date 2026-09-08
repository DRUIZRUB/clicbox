// ClickBox Content Script — runs on product pages
// Adds a floating "Import to ClickBox" button on supported stores

(function () {
  'use strict';

  const ADMIN_URL = 'https://clicbox-81bfc.web.app/admin/productos';

  // ── CORS relay: inject fetch helper into ClickBox admin pages ──
  // When running on the ClickBox domain, expose a helper that routes
  // fetch requests through the extension's background worker (no CORS limits)
  if (location.hostname === 'clicbox-81bfc.web.app') {
    window.CLICKBOX_EXT_FETCH = (url) =>
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'CLICKBOX_FETCH', url }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (response?.ok) resolve(response.data);
          else reject(new Error(response?.error || 'Fetch failed'));
        });
      });
    return; // No need to inject the import button on our own admin page
  }

  // Don't inject twice
  if (document.getElementById('clickbox-import-btn')) return;

  function getMeta(name) {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? el.getAttribute('content') : '';
  }

  function extractProductData() {
    const data = {
      source: location.hostname
    };

    // ── 1. JSON-LD structured data (most reliable for many sites) ──
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const sc of scripts) {
      try {
        const parsed = JSON.parse(sc.textContent || '{}');
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        const product = candidates.find(x => x['@type'] === 'Product');
        if (product) {
          data.name = data.name || product.name || '';
          const offers = product.offers;
          data.price = data.price || (offers && (offers.price || (Array.isArray(offers) && offers[0]?.price))) || '';
          const img = product.image;
          data.image = data.image || (img ? (Array.isArray(img) ? img[0] : img) : '');
          data.description = data.description || (product.description || '').replace(/<[^>]+>/g, '').trim().slice(0, 500);
          data.brand = data.brand || product.brand?.name || '';
          if (product.sku) data.sku = product.sku;
        }
      } catch (e) { /* continue */ }
    }

    // ── 2. NEXT_DATA (Specific for Sam's Club / Walmart) ──
    const nextDataEl = document.getElementById('__NEXT_DATA__');
    if (nextDataEl) {
      try {
        const nextData = JSON.parse(nextDataEl.textContent || '{}');
        // Structure varies, so we try common paths
        const item = nextData?.props?.pageProps?.initialData?.payload?.mainItem || 
                     nextData?.props?.pageProps?.initialData?.payload?.products?.[0];
        
        if (item) {
          data.name = data.name || item.name || item.productName;
          data.price = data.price || item.price?.amount || item.price?.finalPrice?.amount;
          data.image = data.image || item.image?.url;
          data.brand = data.brand || item.brand;
          data.productId = item.productId || item.id;
          
          // Technical specs / Dimensions / Weight
          const specs = item.specifications || [];
          const dimSpec = specs.find(s => s.name?.toLowerCase().includes('dimension') || s.name?.toLowerCase().includes('size'));
          const weightSpec = specs.find(s => s.name?.toLowerCase().includes('weight'));

          if (dimSpec) data.rawDimensions = dimSpec.value;
          if (weightSpec) data.rawWeight = weightSpec.value;
        }
      } catch (e) { console.warn('ClickBox: Error parsing NEXT_DATA', e); }
    }

    // ── 3. Open Graph / Meta Fallbacks ──
    if (!data.name)  data.name  = getMeta('og:title')  || document.title || '';
    if (!data.image) data.image = getMeta('og:image')  || '';
    if (!data.price) {
      const ogPrice = getMeta('og:price:amount') || getMeta('product:price:amount');
      if (ogPrice) data.price = ogPrice;
    }

    // ── 4. Visible Text Extraction for Price ──
    if (!data.price) {
      const priceEl = document.querySelector('[data-automation="buybox-price"], .price-characteristic, [itemprop="price"], .a-price-whole, .ProductPrice, [class*="price"]');
      if (priceEl) {
        const match = priceEl.textContent.match(/[\d]+[\.,]?\d{0,2}/);
        if (match) data.price = match[0].replace(',', '.');
      }
    }

    // ── 5. Advanced Dimension Parsing ──
    const bodyText = document.body.innerText;
    const combinedText = (data.description || '') + ' ' + (data.rawDimensions || '') + ' ' + bodyText;

    // Standard patterns
    const aW = combinedText.match(/assembled\s*width[:\s]*([\d.]+)\s*(in|cm)?/i);
    const aH = combinedText.match(/assembled\s*height[:\s]*([\d.]+)\s*(in|cm)?/i);
    const aD = combinedText.match(/(?:assembled\s*depth|assembled\s*length)[:\s]*([\d.]+)\s*(in|cm)?/i);
    const d3 = combinedText.match(/([\d.]+)\s*[xX×]\s*([\d.]+)\s*[xX×]\s*([\d.]+)\s*(in|inches|cm)/i);

    let l, w, h, unit;

    if (aW && aH && aD) {
      l = parseFloat(aD[1]);
      w = parseFloat(aW[1]);
      h = parseFloat(aH[1]);
      unit = aW[2] || 'in';
    } else if (d3) {
      l = parseFloat(d3[1]);
      w = parseFloat(d3[2]);
      h = parseFloat(d3[3]);
      unit = d3[4];
    }

    // ── 6. Smart Logic Estimation (Inspired by calculate_sams_volume.py) ──
    if (!l || !w || !h) {
      const name = (data.name || "").toLowerCase();
      if (name.includes('diaper') || name.includes('pañales')) { l = 16; w = 10; h = 14; }
      else if (name.includes('formula') || name.includes('leche')) { l = 6; w = 6; h = 8; }
      else if (name.includes('detergent') || name.includes('detergente')) { l = 10; w = 7; h = 13; }
      else if (name.includes('stroller') || name.includes('coche')) { l = 30; w = 24; h = 32; }
      else if (name.includes('cereal')) { l = 12; w = 5; h = 18; }
      else if (name.includes('snack') || name.includes('galletas') || name.includes('chips')) { l = 14; w = 10; h = 12; }
      else if (name.includes('wipe') || name.includes('toallitas')) { l = 12; w = 8; h = 10; }
      else {
        // Conservative generic default if still nothing
        l = 10; w = 8; h = 6;
      }
      data.estimated = true;
    }

    if (l && w && h) {
      if (unit?.toLowerCase().startsWith('cm')) { l /= 2.54; w /= 2.54; h /= 2.54; }
      const sorted = [l, w, h].sort((x, y) => y - x);
      data.largo  = sorted[0].toFixed(2);
      data.ancho  = sorted[1].toFixed(2);
      data.alto   = sorted[2].toFixed(2);
      data.volumen = (sorted[0] * sorted[1] * sorted[2] / 1728.0).toFixed(4); // cubic feet
    }

    // ── 7. Weight ──
    const weightText = (data.rawWeight || '') + ' ' + bodyText;
    const wm = weightText.match(/assembled\s*weight[:\s]*([\d.]+)\s*(lb|kg|oz)?/i)
            || weightText.match(/(?:item|product|net)\s*weight[:\s]*([\d.]+)\s*(lb|pound|kg|oz|g\b)?/i);
    if (wm) {
      let weightVal = parseFloat(wm[1]);
      const wu = (wm[2] || '').toLowerCase();
      if (wu.startsWith('kg')) weightVal *= 2.20462;
      else if (wu === 'oz')    weightVal /= 16;
      else if (wu === 'g')     weightVal *= 0.00220462;
      data.libras = weightVal.toFixed(2);
    } else {
      data.libras = "1.00"; // Default
    }

    return data;
  }

  /* ─── Summary of what was found ─── */
  function summarize(data) {
    const found = [];
    if (data.name)    found.push(`<div class="item"><strong>📦</strong> <span>${data.name.slice(0, 50)}${data.name.length > 50 ? '...' : ''}</span></div>`);
    if (data.price)   found.push(`<div class="item"><strong>💰</strong> <span class="highlight">$${data.price}</span></div>`);
    if (data.largo)   found.push(`<div class="item"><strong>📐</strong> <span>${data.largo}" × ${data.ancho}" × ${data.alto}"</span> ${data.estimated ? '<small>(est.)</small>' : ''}</div>`);
    if (data.volumen) found.push(`<div class="item"><strong>📦</strong> <span>${data.volumen} ft³</span></div>`);
    if (data.libras)  found.push(`<div class="item"><strong>⚖️</strong> <span>${data.libras} lbs</span></div>`);
    return found;
  }


  /* ─── Floating Button UI ─── */
  const btn = document.createElement('div');
  btn.id = 'clickbox-import-btn';
  btn.innerHTML = `
    <div id="cb-pill">
      <span id="cb-icon">📦</span>
      <span id="cb-label">Importar a ClickBox</span>
    </div>
    <div id="cb-panel" style="display:none">
      <div id="cb-header">
        <span style="font-weight:700;font-size:0.9rem">Click<span style="color:#3b82f6">Box</span> Importador</span>
        <button id="cb-close" title="Cerrar">✕</button>
      </div>
      <div id="cb-preview">Analizando página...</div>
      <button id="cb-go">✅ Importar al Admin</button>
      <div id="cb-note">Se abrirá el panel con todos los campos prellenados</div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #clickbox-import-btn {
      position: fixed; bottom: 30px; right: 30px; z-index: 2147483647;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }
    #cb-pill {
      display: flex; align-items: center; gap: 10px;
      background: #000;
      color: #fff; padding: 14px 24px; border-radius: 16px;
      cursor: pointer; font-weight: 700; font-size: 0.95rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      user-select: none;
      border: 1px solid rgba(255,255,255,0.1);
    }
    #cb-pill:hover { 
      transform: translateY(-4px) scale(1.02); 
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
      background: #111;
    }
    #cb-panel {
      position: absolute; bottom: 85px; right: 0;
      background: rgba(15, 20, 30, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px; padding: 24px; width: 340px;
      box-shadow: 0 30px 100px rgba(0,0,0,0.8);
      color: #fff;
    }
    #cb-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    #cb-close { background:rgba(255,255,255,0.05); border:none; color:#94a3b8; cursor:pointer; font-size:0.9rem; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.2s; }
    #cb-close:hover { color:#fff; background:rgba(239,68,68,0.2); }
    #cb-preview { 
      font-size:0.85rem; line-height:1.6; color:#94a3b8; margin-bottom:20px; 
      background:rgba(0,0,0,0.3); padding:16px; border-radius:16px; min-height:80px; 
      border: 1px solid rgba(255,255,255,0.05);
    }
    #cb-preview .item { display:flex; gap:12px; margin-bottom:8px; align-items:flex-start; }
    #cb-preview .item strong { color:#fff; font-size:1rem; }
    #cb-preview .highlight { color:#10b981; font-weight:800; font-size:1.1rem; }
    #cb-preview small { font-size:0.7rem; color:#64748b; font-style:italic; }
    #cb-go {
      width:100%; padding:16px; background: #fff;
      color:#000; border:none; border-radius:14px; font-weight:800;
      font-size:1rem; cursor:pointer; transition:all 0.2s;
      display:flex; align-items:center; justify-content:center; gap:8px;
    }
    #cb-go:hover { transform:translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); background:#f8fafc; }
    #cb-go:active { transform:translateY(0); }
    #cb-go:disabled { background:#334155; color:#64748b; cursor:not-allowed; transform:none; }
    #cb-note { font-size:0.75rem; color:#64748b; text-align:center; margin-top:12px; }
    #cb-icon { font-size:1.2rem; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(btn);

  let extractedData = null;
  let panelOpen = false;

  const pill  = btn.querySelector('#cb-pill');
  const panel = btn.querySelector('#cb-panel');
  const preview = btn.querySelector('#cb-preview');
  const goBtn   = btn.querySelector('#cb-go');
  const closeBtn = btn.querySelector('#cb-close');

  pill.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? 'block' : 'none';
    if (panelOpen) {
      preview.innerHTML = '<span style="color:#64748b">⏳ Analizando...</span>';
      setTimeout(() => {
        extractedData = extractProductData();
        const found = summarize(extractedData);
        if (found.length > 0) {
          preview.innerHTML = found.map(f => `<div class="found-item">${f}</div>`).join('');
          goBtn.disabled = false;
        } else {
          preview.innerHTML = '<span class="none">No se encontraron datos de producto en esta página.</span>';
          goBtn.disabled = true;
        }
      }, 300);
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panelOpen = false;
    panel.style.display = 'none';
  });

  goBtn.addEventListener('click', () => {
    if (!extractedData) return;
    const d = extractedData;
    const params = new URLSearchParams({
      import: '1',
      src:    location.href,
      name:   d.name   || '',
      price:  d.price  || '',
      image:  d.image  || '',
      desc:   d.description || '',
      largo:  d.largo  || '',
      ancho:  d.ancho  || '',
      alto:   d.alto   || '',
      vol:    d.volumen || '',
      lbs:    d.libras || '',
    });
    const win = window.open(`${ADMIN_URL}?${params.toString()}`, '_blank');
    if (!win || win.closed) {
      alert('Permite ventanas emergentes para este sitio. Luego haz clic de nuevo en "Importar al Admin".');
    } else {
      goBtn.textContent = '✅ ¡Abierto en el Admin!';
      setTimeout(() => { goBtn.textContent = '✅ Importar al Admin'; }, 3000);
    }
  });

})();
