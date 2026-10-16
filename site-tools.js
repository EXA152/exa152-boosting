(() => {
  'use strict';

  const data = window.EXA152_DATA || { listings: {}, order: [], marketplaces: {} };
  const settings = window.EXA152_SETTINGS || {};
  const listings = data.listings || {};
  const effectiveWorkload = settings.workload || data.workload || {};
  const effectiveSiteUpdated = settings.siteUpdated || data.siteUpdated || '';
  const recentDays = Math.max(0, Math.min(5, Number(settings.recentlyUpdatedDays ?? 5)));

  const byId = id => listings[id] || null;
  const moneyText = item => item.priceText || `$${Number(item.price || 0).toFixed(2)} / unit`;
  const prettyDate = iso => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric'}).format(new Date(y,m-1,d));
  };
  const statusClass = value => 'status-' + String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const todayISO = () => new Date().toISOString().slice(0,10);
  const withinDate = iso => iso && todayISO() <= iso;
  const recentlyChanged = iso => {
    if (!iso || recentDays <= 0) return false;
    const changed = new Date(iso + 'T00:00:00');
    const today = new Date(todayISO() + 'T00:00:00');
    const diff = Math.floor((today - changed) / 86400000);
    return diff >= 0 && diff < recentDays;
  };
  const orderEnabled = item => item.enabled !== false && String(item.status || '').toLowerCase() === 'available';
  const pausedReasonFor = item =>
    item?.pausedReason ||
    settings.pausedReason ||
    'Temporarily paused. Ordering is currently unavailable.';
  const visibleListing = item => item.visible !== false;


  const workloadClass = level => 'workload-' + String(level || 'normal').toLowerCase().replace(/[^a-z0-9]+/g,'-');

  function hydrateWorkload(root=document) {
    const w = effectiveWorkload;
    const label = w.label || 'Current workload';
    const message = w.message || 'Orders are completed in the order received.';
    root.querySelectorAll('[data-role="workload-label"]').forEach(el => el.textContent = label);
    root.querySelectorAll('[data-role="workload-message"]').forEach(el => el.textContent = message);
    root.querySelectorAll('.detail-workload').forEach(el => {
      el.innerHTML = '';
      const dot = document.createElement('span');
      dot.className = 'workload-dot';
      const strong = document.createElement('strong');
      strong.textContent = label;
      el.append(dot, strong);
    });
    root.querySelectorAll('.workload-notice, .detail-order-info').forEach(el => {
      [...el.classList].filter(c=>c.startsWith('workload-')).forEach(c=>el.classList.remove(c));
      el.classList.add(workloadClass(w.level));
    });
  }

  function setDeliveryText(root, item) {
    const text = item?.deliveryText || data.defaultDeliveryText || 'Delivery time varies with current order volume.';
    root.querySelectorAll('[data-role="delivery"]').forEach(el => el.textContent = text);
  }

  function trackMarketplaceClick(link, item=null) {
    const href = link?.href || '';
    const marketplace =
      item?.marketplaceLabel ||
      (href.includes('zeusx.com') ? 'ZeusX' : href.includes('eldorado.gg') ? 'Eldorado' : 'Marketplace');

    const params = {
      marketplace,
      destination_url: href,
      listing_id: item?.id || '',
      listing_name: item?.title || '',
      game: item?.gameLabel || '',
      page_path: location.pathname
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', item ? 'listing_marketplace_click' : 'marketplace_click', params);
    }

    // Also expose the most recent click in the dataLayer for easy GA/Tag Manager debugging.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: item ? 'listing_marketplace_click' : 'marketplace_click',
      ...params
    });
  }

  function initMarketplaceTracking() {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href*="eldorado.gg"], a[href*="zeusx.com"]');
      if (!link) return;
      const card = link.closest('[data-listing-id]');
      const detailId = document.body.dataset.listingId;
      const item = card ? byId(card.dataset.listingId) : (detailId ? byId(detailId) : null);
      trackMarketplaceClick(link, item);
    });
  }

  function ensurePromoBadges(card, item) {
    let wrap = card.querySelector('.promo-badges');
    const badges = [];
    if (item.featuredLabel) badges.push(['featured', item.featuredLabel]);
    if (withinDate(item.newUntil)) badges.push(['new', 'New']);
    if (recentlyChanged(item.updated) || withinDate(item.updatedBadgeUntil)) badges.push(['updated', 'Recently Updated']);

    if (!badges.length) {
      if (wrap) wrap.remove();
      return;
    }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'promo-badges';
      const marker = card.querySelector('.card-badge-row');
      if (marker) marker.insertAdjacentElement('afterend', wrap);
      else card.prepend(wrap);
    }
    wrap.replaceChildren(...badges.map(([kind,text]) => {
      const span = document.createElement('span');
      span.className = `promo-badge promo-${kind}`;
      span.textContent = text;
      return span;
    }));
  }

  function applyAvailability(card, item) {
    card.dataset.enabled = orderEnabled(item) ? 'true' : 'false';
    let reason = card.querySelector('[data-role="paused-reason"]');
    if (!orderEnabled(item)) {
      if (!reason) {
        reason = document.createElement('p');
        reason.dataset.role = 'paused-reason';
        reason.className = 'paused-reason';
        const cta = card.querySelector('.cta-row');
        if (cta) cta.insertAdjacentElement('beforebegin', reason);
        else card.appendChild(reason);
      }
      reason.textContent = pausedReasonFor(item);
    } else if (reason) {
      reason.remove();
    }

    const market = card.querySelector('[data-role="market-link"]');
    if (market) {
      if (orderEnabled(item)) {
        market.href = item.marketplaceUrl;
        market.removeAttribute('aria-disabled');
        market.classList.remove('button-disabled');
        market.textContent = `View on ${item.marketplaceLabel}`;
      } else {
        market.removeAttribute('href');
        market.setAttribute('aria-disabled','true');
        market.classList.add('button-disabled');
        market.textContent = 'Currently unavailable';
      }
    }
  }


  function ensureDeliveryLine(card, item) {
    let el = card.querySelector('[data-role="delivery"]');
    if (!el) {
      el = document.createElement('p');
      el.className = 'delivery-estimate card-delivery';
      el.dataset.role = 'delivery';
      const meta = card.querySelector('.listing-meta-row');
      if (meta) meta.insertAdjacentElement('afterend', el);
      else {
        const cta = card.querySelector('.cta-row');
        if (cta) cta.insertAdjacentElement('beforebegin', el);
        else card.appendChild(el);
      }
    }
    el.textContent = item.deliveryText || data.defaultDeliveryText || 'Delivery time varies with current order volume.';
  }

  function faqFor(item) {
    const market = item.marketplaceLabel;
    return [
      [`Where do I order ${item.detailTitle}?`, `Use the View on ${market} button on this page. The order, payment and buyer/seller communication are handled through ${market}.`],
      ['Is the price on this page current?', `This page currently shows ${moneyText(item)}. It was last updated ${prettyDate(item.updated || effectiveSiteUpdated)}. Confirm the final price on ${market} before ordering.`],
      ['What does this listing cover?', item.description],
      ['How do I check availability?', `The status shown here is ${item.status}. The live ${market} listing is the final source for current availability and order details.`]
    ];
  }

  function availabilityUrl(item) {
    return String(item.status).toLowerCase() === 'available'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';
  }

  function schemaFor(item) {
    const base = 'https://exa152.github.io/exa152-boosting/';
    const pageUrl = base + item.page;
    const socialUrl = base + item.socialImage;
    const offer = {
      '@type':'Offer', url:item.marketplaceUrl, price:Number(item.price).toFixed(2), priceCurrency:'USD',
      availability: availabilityUrl(item), seller:{'@type':'Person',name:'EXA152'}
    };
    const entity = item.type === 'In-Game Item'
      ? {'@type':'Product','@id':pageUrl+'#product',name:item.detailTitle,description:item.description,image:socialUrl,category:`${item.gameLabel} ${item.type}`,url:pageUrl,mainEntityOfPage:pageUrl,offers:offer}
      : {'@type':'Service','@id':pageUrl+'#service',name:item.detailTitle,serviceType:item.title,description:item.description,image:socialUrl,category:`${item.gameLabel} ${item.type}`,url:pageUrl,mainEntityOfPage:pageUrl,provider:{'@type':'Person',name:'EXA152'},areaServed:'Worldwide',offers:offer};
    const breadcrumb = {'@type':'BreadcrumbList','@id':pageUrl+'#breadcrumb',itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:base},
      {'@type':'ListItem',position:2,name:item.gameLabel,item:base+'#'+item.game},
      {'@type':'ListItem',position:3,name:item.detailTitle,item:pageUrl}
    ]};
    const faq = {'@type':'FAQPage','@id':pageUrl+'#faq',mainEntity:faqFor(item).map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
    const webpage = {'@type':'WebPage','@id':pageUrl+'#webpage',url:pageUrl,name:item.detailTitle+' | EXA152',dateModified:item.updated || effectiveSiteUpdated,breadcrumb:{'@id':pageUrl+'#breadcrumb'},mainEntity:{'@id':entity['@id']}};
    return {'@context':'https://schema.org','@graph':[webpage,breadcrumb,entity,faq]};
  }

  function hydrateCard(card) {
    const item = byId(card.dataset.listingId);
    if (!item) return;
    const title = card.querySelector('[data-role="title"], h3'); if (title) title.textContent = item.title;
    const price = card.querySelector('[data-role="price"], .price'); if (price) price.textContent = moneyText(item);
    const desc = card.querySelector('[data-role="description"]'); if (desc) desc.textContent = item.description;
    const discount = card.querySelector('[data-role="discount"], .discount-note');
    if (discount) { discount.textContent = item.discountText || ''; discount.hidden = !item.discountText; }
    const updated = card.querySelector('[data-role="updated"], .price-updated');
    if (updated) { const iso=item.updated || effectiveSiteUpdated; updated.textContent='Updated '+prettyDate(iso); updated.setAttribute('datetime',iso); }
    const type = card.querySelector('[data-role="type"]'); if (type) type.textContent = item.type;
    const status = card.querySelector('[data-role="status"]');
    if (status) { status.textContent=item.status; status.className=`status-badge ${statusClass(item.status)}`; }
    const market = card.querySelector('[data-role="market-link"]'); if (market) market.href=item.marketplaceUrl;
    ensurePromoBadges(card,item);
    ensureDeliveryLine(card,item);
    applyAvailability(card,item);
    setDeliveryText(card,item);
    const img = card.querySelector('img[data-role="image"], img.listing-image');
    if (img) { img.alt=item.imageAlt; if (!item.socialImage.endsWith('.jpg')) img.src=item.image; }
    const source = card.querySelector('picture source[type="image/webp"]'); if (source) source.srcset=item.image;
  }

  function hydrateDetail() {
    const id = document.body.dataset.listingId;
    const item = byId(id);
    if (!item) return;
    document.title = `${item.detailTitle} | EXA152 on ${item.marketplaceLabel}`;
    const metaDesc = document.querySelector('meta[name="description"]'); if (metaDesc) metaDesc.content=item.description;
    const title = document.querySelector('[data-role="detail-title"]'); if (title) title.textContent=item.detailTitle;
    const bc = document.querySelector('[data-role="breadcrumb-title"]'); if (bc) bc.textContent=item.detailTitle;
    const desc = document.querySelector('.hero [data-role="description"]'); if (desc) desc.textContent=item.description;
    document.querySelectorAll('.hero [data-role="price"]').forEach(el=>el.textContent=moneyText(item));
    const updated = document.querySelector('.hero [data-role="updated"]');
    if (updated) { const iso=item.updated || effectiveSiteUpdated; updated.textContent='Price updated '+prettyDate(iso); updated.setAttribute('datetime',iso); }
    const type = document.querySelector('.hero [data-role="type"]'); if (type) type.textContent=item.type;
    const status = document.querySelector('.hero [data-role="status"]'); if (status) { status.textContent=item.status; status.className=`status-badge ${statusClass(item.status)}`; }
    const market = document.querySelector('.hero [data-role="market-link"]');
    if (market) {
      if (orderEnabled(item)) {
        market.href=item.marketplaceUrl;
        market.removeAttribute('aria-disabled');
        market.classList.remove('button-disabled');
      } else {
        market.removeAttribute('href');
        market.setAttribute('aria-disabled','true');
        market.classList.add('button-disabled');
        market.textContent='Currently unavailable';
        let note = document.querySelector('.detail-paused-reason');
        if (!note) {
          note = document.createElement('p');
          note.className='detail-paused-reason';
          market.insertAdjacentElement('afterend', note);
        }
        note.textContent = pausedReasonFor(item);
      }
    }
    document.querySelectorAll('[data-role="marketplace-label"]').forEach(el=>el.textContent=item.marketplaceLabel);
    const faq = document.getElementById('listing-faq');
    if (faq) {
      faq.replaceChildren(...faqFor(item).map(([q,a])=>{
        const d=document.createElement('details'); const s=document.createElement('summary'); const p=document.createElement('p');
        s.textContent=q; p.textContent=a; d.append(s,p); return d;
      }));
    }
    setDeliveryText(document,item);
    hydrateWorkload(document);
    const schema = document.getElementById('listing-structured-data'); if (schema) schema.textContent=JSON.stringify(schemaFor(item));
  }

  function initListingTools() {
    const offers = document.getElementById('offers');
    if (!offers) return;
    const cards = [...offers.querySelectorAll('article.card[data-listing-id]')];
    const groups = [...offers.querySelectorAll('.offer-group')];
    const originalGroupOrder = new Map(groups.map((g,i)=>[g,i]));
    const originalCardOrder = new Map(cards.map((c,i)=>[c,i]));
    const search = document.getElementById('listing-search');
    const sort = document.getElementById('listing-sort');
    const priceFilter = document.getElementById('price-filter');
    const bar = document.getElementById('offer-filter');
    const count = document.getElementById('listing-count');
    let filter='all';

    function matchesFilter(card,item) {
      if (filter.startsWith('marketplace:') && item.marketplace!==filter.split(':')[1]) return false;
      if (filter.startsWith('game:') && item.game!==filter.split(':')[1]) return false;
      const pf = priceFilter?.value || 'all';
      const price = Number(item.price || 0);
      if (pf==='under-1' && !(price < 1)) return false;
      if (pf==='1-to-2.99' && !(price >= 1 && price < 3)) return false;
      if (pf==='3-plus' && !(price >= 3)) return false;
      return true;
    }
    function searchable(item) {
      return [item.title,item.detailTitle,item.gameLabel,item.marketplaceLabel,item.type,item.status,item.description,item.discountText].join(' ').toLowerCase();
    }
    function cardCompare(a,b,mode) {
      const ia=byId(a.dataset.listingId), ib=byId(b.dataset.listingId); if(!ia||!ib) return 0;
      const unavailableA = orderEnabled(ia) ? 0 : 1;
      const unavailableB = orderEnabled(ib) ? 0 : 1;
      if (unavailableA !== unavailableB) return unavailableA - unavailableB;
      if(mode==='price-asc') return ia.price-ib.price || ia.title.localeCompare(ib.title);
      if(mode==='price-desc') return ib.price-ia.price || ia.title.localeCompare(ib.title);
      return originalCardOrder.get(a)-originalCardOrder.get(b);
    }
    function groupCompare(a,b,mode) {
      const gameA=a.id, gameB=b.id;
      if(mode==='game') return (game_labels[gameA]||gameA).localeCompare(game_labels[gameB]||gameB);
      if(mode==='marketplace') {
        const ma = a.querySelector('[data-listing-id]') ? byId(a.querySelector('[data-listing-id]').dataset.listingId)?.marketplaceLabel || '' : '';
        const mb = b.querySelector('[data-listing-id]') ? byId(b.querySelector('[data-listing-id]').dataset.listingId)?.marketplaceLabel || '' : '';
        return ma.localeCompare(mb) || (game_labels[gameA]||gameA).localeCompare(game_labels[gameB]||gameB);
      }
      return originalGroupOrder.get(a)-originalGroupOrder.get(b);
    }
    const game_labels = {phasmophobia:'Phasmophobia',fortnite:'Fortnite Save the World',palworld:'Palworld'};
    function updateFilterCounts() {
      if (!bar) return;
      const all = Object.values(listings).filter(visibleListing);
      const countFor = f => {
        if (f==='all') return all.length;
        if (f.startsWith('marketplace:')) {
          const v=f.split(':')[1]; return all.filter(i=>i.marketplace===v).length;
        }
        if (f.startsWith('game:')) {
          const v=f.split(':')[1]; return all.filter(i=>i.game===v).length;
        }
        return all.length;
      };
      bar.querySelectorAll('.filter-chip').forEach(chip=>{
        const el=chip.querySelector('.filter-count');
        if (el) el.textContent = countFor(chip.dataset.filter||'all');
      });
    }
    function apply() {
      const q=(search?.value||'').trim().toLowerCase();
      const mode=sort?.value||'recommended';
      let visible=0;
      cards.forEach(card=>{
        const item=byId(card.dataset.listingId); if(!item) return;
        const show=visibleListing(item) && matchesFilter(card,item) && (!q || searchable(item).includes(q));
        card.hidden=!show; if(show) visible++;
      });
      groups.forEach(group=>{
        const grid=group.querySelector('.cards');
        if(grid) [...grid.querySelectorAll('article.card[data-listing-id]')].sort((a,b)=>cardCompare(a,b,mode)).forEach(c=>grid.appendChild(c));
        group.hidden=![...group.querySelectorAll('article.card[data-listing-id]')].some(c=>!c.hidden);
      });
      if(mode==='game'||mode==='marketplace'||mode==='recommended') {
        const parent=groups[0]?.parentElement;
        if(parent) [...groups].sort((a,b)=>groupCompare(a,b,mode)).forEach(g=>parent.appendChild(g));
      }
      if(count) count.textContent=`${visible} of ${Object.values(listings).filter(visibleListing).length} listing${visible===1?'':'s'} shown`;
    }
    bar?.addEventListener('click',e=>{
      const button=e.target.closest('.filter-chip'); if(!button) return;
      filter=button.dataset.filter||'all';
      bar.querySelectorAll('.filter-chip').forEach(chip=>{const active=chip===button;chip.classList.toggle('active',active);chip.setAttribute('aria-pressed',active?'true':'false');});
      apply();
    });
    search?.addEventListener('input',apply);
    sort?.addEventListener('change',apply);
    priceFilter?.addEventListener('change',apply);
    updateFilterCounts();
    apply();
  }

  function initMobileMenu() {
    document.querySelectorAll('.site-header').forEach(header=>{
      const toggle=header.querySelector('.menu-toggle'); const nav=header.querySelector('#site-nav'); if(!toggle||!nav) return;
      const close=()=>{header.classList.remove('mobile-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation menu');};
      toggle.addEventListener('click',()=>{const open=!header.classList.contains('mobile-open');header.classList.toggle('mobile-open',open);toggle.setAttribute('aria-expanded',open?'true':'false');toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');});
      nav.addEventListener('click',e=>{if(e.target.closest('a')) close();});
      document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});
    });
  }


  function initCopyLinks() {
    document.querySelectorAll('[data-copy-link]').forEach(button => {
      button.addEventListener('click', async () => {
        const url = button.dataset.copyLink || location.href;
        try {
          await navigator.clipboard.writeText(url);
          const original = button.textContent;
          button.textContent = 'Copied!';
          button.classList.add('copied');
          setTimeout(() => {
            button.textContent = original;
            button.classList.remove('copied');
          }, 1600);
        } catch {
          const temp = document.createElement('textarea');
          temp.value = url;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          button.textContent = 'Copied!';
          setTimeout(() => button.textContent = 'Copy link', 1600);
        }
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'copy_service_link', { page_path: location.pathname });
        }
      });
    });
  }

  function initBackToTop() {
    const button = document.querySelector('.back-to-top');
    if (!button) return;
    const update = () => button.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive:true });
    button.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    update();
  }

  function initExternalLinkNotices() {
    document.querySelectorAll('a[target="_blank"][href*="eldorado.gg"], a[target="_blank"][href*="zeusx.com"]').forEach(link => {
      link.classList.add('external-market-link');
      if (!link.querySelector('.external-icon')) {
        const icon = document.createElement('span');
        icon.className = 'external-icon';
        icon.setAttribute('aria-hidden','true');
        icon.textContent = '↗';
        link.appendChild(icon);
      }
      link.title = (link.title ? link.title + ' — ' : '') + 'Opens an external marketplace website';
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('article.card[data-listing-id]').forEach(hydrateCard);
    hydrateDetail();
    hydrateWorkload(document);
    initListingTools();
    initMobileMenu();
    initMarketplaceTracking();
    initCopyLinks();
    initBackToTop();
    initExternalLinkNotices();
  });
})();
