(() => {
  'use strict';

  const data = window.EXA152_DATA || { listings: {}, order: [], marketplaces: {} };
  const listings = data.listings || {};

  const byId = id => listings[id] || null;
  const moneyText = item => item.priceText || `$${Number(item.price || 0).toFixed(2)} / unit`;
  const prettyDate = iso => {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric'}).format(new Date(y,m-1,d));
  };
  const statusClass = value => 'status-' + String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  function faqFor(item) {
    const market = item.marketplaceLabel;
    return [
      [`Where do I order ${item.detailTitle}?`, `Use the View on ${market} button on this page. The order, payment and buyer/seller communication are handled through ${market}.`],
      ['Is the price on this page current?', `This page currently shows ${moneyText(item)}. It was last updated ${prettyDate(item.updated || data.siteUpdated)}. Confirm the final price on ${market} before ordering.`],
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
    const webpage = {'@type':'WebPage','@id':pageUrl+'#webpage',url:pageUrl,name:item.detailTitle+' | EXA152',dateModified:item.updated || data.siteUpdated,breadcrumb:{'@id':pageUrl+'#breadcrumb'},mainEntity:{'@id':entity['@id']}};
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
    if (updated) { const iso=item.updated || data.siteUpdated; updated.textContent='Updated '+prettyDate(iso); updated.setAttribute('datetime',iso); }
    const type = card.querySelector('[data-role="type"]'); if (type) type.textContent = item.type;
    const status = card.querySelector('[data-role="status"]');
    if (status) { status.textContent=item.status; status.className=`status-badge ${statusClass(item.status)}`; }
    const market = card.querySelector('[data-role="market-link"]'); if (market) market.href=item.marketplaceUrl;
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
    if (updated) { const iso=item.updated || data.siteUpdated; updated.textContent='Price updated '+prettyDate(iso); updated.setAttribute('datetime',iso); }
    const type = document.querySelector('.hero [data-role="type"]'); if (type) type.textContent=item.type;
    const status = document.querySelector('.hero [data-role="status"]'); if (status) { status.textContent=item.status; status.className=`status-badge ${statusClass(item.status)}`; }
    const market = document.querySelector('.hero [data-role="market-link"]'); if (market) market.href=item.marketplaceUrl;
    document.querySelectorAll('[data-role="marketplace-label"]').forEach(el=>el.textContent=item.marketplaceLabel);
    const faq = document.getElementById('listing-faq');
    if (faq) {
      faq.replaceChildren(...faqFor(item).map(([q,a])=>{
        const d=document.createElement('details'); const s=document.createElement('summary'); const p=document.createElement('p');
        s.textContent=q; p.textContent=a; d.append(s,p); return d;
      }));
    }
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
    const bar = document.getElementById('offer-filter');
    const count = document.getElementById('listing-count');
    let filter='all';

    function matchesFilter(card,item) {
      if (filter.startsWith('marketplace:')) return item.marketplace===filter.split(':')[1];
      if (filter.startsWith('game:')) return item.game===filter.split(':')[1];
      return true;
    }
    function searchable(item) {
      return [item.title,item.detailTitle,item.gameLabel,item.marketplaceLabel,item.type,item.status,item.description,item.discountText].join(' ').toLowerCase();
    }
    function cardCompare(a,b,mode) {
      const ia=byId(a.dataset.listingId), ib=byId(b.dataset.listingId); if(!ia||!ib) return 0;
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
    function apply() {
      const q=(search?.value||'').trim().toLowerCase();
      const mode=sort?.value||'recommended';
      let visible=0;
      cards.forEach(card=>{
        const item=byId(card.dataset.listingId); if(!item) return;
        const show=matchesFilter(card,item) && (!q || searchable(item).includes(q));
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
      if(count) count.textContent=`${visible} listing${visible===1?'':'s'} shown`;
    }
    bar?.addEventListener('click',e=>{
      const button=e.target.closest('.filter-chip'); if(!button) return;
      filter=button.dataset.filter||'all';
      bar.querySelectorAll('.filter-chip').forEach(chip=>{const active=chip===button;chip.classList.toggle('active',active);chip.setAttribute('aria-pressed',active?'true':'false');});
      apply();
    });
    search?.addEventListener('input',apply);
    sort?.addEventListener('change',apply);
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

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('article.card[data-listing-id]').forEach(hydrateCard);
    hydrateDetail();
    initListingTools();
    initMobileMenu();
  });
})();
