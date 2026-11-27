/* Daily offer display only. Menu, basket and checkout prices are unchanged. */
(() => {
  'use strict';
  const mounts = [...document.querySelectorAll('[data-daily-offer]')];
  if (!mounts.length) return;
  const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 });
  let offers = [], timer, loading = false;
  const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  function validate(offer) {
    if (!offer || offer.approved !== true || !text(offer.title, 100) ||
        !Array.isArray(offer.items) || offer.items.length < 1 || offer.items.length > 8 ||
        !offer.items.every(item => text(item, 160)) ||
        typeof offer.price !== 'number' || !Number.isFinite(offer.price) || offer.price <= 0 ||
        offer.price > 100000 || (offer.terms && !text(offer.terms, 300)) ||
        (offer.compact !== undefined && typeof offer.compact !== 'boolean')) return null;
    const start = timestamp(offer.start), end = timestamp(offer.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
        end - start > 25 * 3600000) return null;
    // Local raster paths, plus the one reviewed self-contained offer-card asset.
    const image = typeof offer.image === 'string' && (/^(?:assets\/menu\/)?[a-zA-Z0-9_-]+\.(?:webp|jpg|jpeg|png)$/.test(offer.image) || offer.image === 'daily-offer-approved.svg') ? offer.image : '';
    // The canonical link is generated when the daily data entry is prepared.
    // Reject an old link if the title, items, price or destination changed.
    const orderMessage = 'عايز أطلب ' + offer.title + '\n' + offer.items.join(' + ') + '\nسعر العرض: ' + offer.price + ' جنيه';
    try {
      const link = new URL(offer.orderLink);
      if (link.protocol !== 'https:' || link.hostname !== 'wa.me' || link.pathname !== '/201275165496' ||
          link.hash || link.username || link.password || link.port ||
          [...link.searchParams.keys()].some(key => key !== 'text') ||
          link.searchParams.getAll('text').length !== 1 || link.searchParams.get('text') !== orderMessage) return null;
    } catch (_) { return null; }
    return { ...offer, startTime: start, endTime: end, image };
  }
  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  // Offer popup: same validated entry as the banner, once per visit per offer.
  const POP_KEY = 'alhella-offer-pop';
  function closePop() {
    const pop = document.getElementById('dailyOfferPop');
    if (pop) pop.remove();
  }
  function renderPop(offer) {
    closePop();
    if (!offer) return;
    const seenKey = offer.title + '|' + offer.startTime;
    let seen = '';
    try { seen = sessionStorage.getItem(POP_KEY) || ''; } catch (_) { return; }
    if (seen === seenKey) return;
    setTimeout(() => {
      if (document.getElementById('dailyOfferPop')) return;
      const now = Date.now();
      const still = offers.some(o => o.startTime <= now && now < o.endTime && (o.title + '|' + o.startTime) === seenKey);
      if (!still) return;
      // A visitor who landed deep-linked inside a category, offers or reviews
      // view came for that content; don't cover it with the popup.
      if (/^#(?:c-|offers|reviews)/.test(location.hash)) return;
      const pop = el('div', 'story-modal');
      pop.id = 'dailyOfferPop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-modal', 'true');
      pop.setAttribute('aria-label', 'عرض اليوم');
      const backdrop = el('div', 'story-backdrop');
      backdrop.addEventListener('click', closePop);
      const panel = el('div', 'story-panel');
      panel.style.maxWidth = '380px';
      const x = el('button', 'story-close', '×');
      x.type = 'button';
      x.setAttribute('aria-label', 'إغلاق');
      x.addEventListener('click', closePop);
      panel.append(x);
      if (offer.image) {
        const img = el('img', 'story-photo');
        img.alt = offer.title;
        img.style.height = '170px';
        img.decoding = 'async';
        img.addEventListener('error', () => img.remove(), { once: true });
        img.src = offer.image;
        panel.append(img);
      }
      const content = el('div', 'story-content');
      content.append(el('div', 'story-brand', 'عرض اليوم · ع الحلة'));
      const h = el('h2', '', offer.title);
      h.style.cssText = 'font-size:24px;margin:3px 0 8px';
      content.append(h);
      const ing = el('div', 'story-ingredients');
      ing.style.fontSize = '13.5px';
      offer.items.forEach((item, i) => {
        if (i) ing.append(document.createElement('br'));
        ing.append(document.createTextNode('• ' + item));
      });
      content.append(ing);
      const line = el('p', '', offer.terms || ('العرض بـ ' + money.format(offer.price) + ' جنيه'));
      line.style.cssText = 'margin:10px 0 12px;font-weight:900;color:#8E0F16;font-size:16.5px';
      content.append(line);
      const row = el('div');
      row.style.cssText = 'display:flex;gap:8px';
      const order = el('a', '', 'اطلب العرض واتساب');
      order.href = offer.orderLink;
      order.target = '_blank';
      order.rel = 'noopener';
      order.style.cssText = 'flex:1.2;background:#B5161E;color:#fff;border-radius:12px;padding:11px 8px;font-weight:900;text-align:center;text-decoration:none;font-size:14.5px';
      order.addEventListener('click', closePop);
      const cont = el('button', '', 'كمّل المنيو');
      cont.type = 'button';
      cont.style.cssText = 'flex:1;background:#FFE7D6;color:#8E0F16;border:0;border-radius:12px;padding:11px 8px;font-weight:900;font-family:inherit;font-size:14.5px';
      cont.addEventListener('click', closePop);
      row.append(order, cont);
      content.append(row);
      panel.append(content);
      pop.append(backdrop, panel);
      document.body.append(pop);
      try { sessionStorage.setItem(POP_KEY, seenKey); } catch (_) {}
    }, 1200);
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePop(); });
  function render() {
    clearTimeout(timer);
    const now = Date.now();
    const active = offers.filter(offer => offer.startTime <= now && now < offer.endTime);
    // Ambiguous overlapping entries fail closed instead of picking an offer.
    const offer = active.length === 1 ? active[0] : null;
    mounts.forEach(mount => {
      mount.replaceChildren();
      mount.hidden = !offer;
      if (!offer) return;
      const article = el('article', offer.compact === true ? 'daily-offer daily-offer--compact' : 'daily-offer');
      article.setAttribute('aria-label', 'عرض اليوم');
      const copy = el('div', 'daily-offer__copy');
      copy.append(el('span', 'daily-offer__badge', 'عرض اليوم'));
      copy.append(el('h2', 'daily-offer__title', offer.title));
      const list = el('ul', 'daily-offer__items');
      offer.items.forEach(item => list.append(el('li', '', item)));
      copy.append(list);
      const price = el('p', 'daily-offer__price', money.format(offer.price));
      price.append(el('span', '', ' جنيه'));
      copy.append(price);
      if (offer.terms) copy.append(el('p', 'daily-offer__terms', offer.terms));
      const contact = el('a', 'daily-offer__contact', 'اطلب العرض');
      contact.href = offer.orderLink;
      contact.target = '_blank'; contact.rel = 'noopener';
      contact.addEventListener('click', event => {
        if (Date.now() < offer.startTime || Date.now() >= offer.endTime) { event.preventDefault(); render(); }
      });
      copy.append(contact);
      article.append(copy);
      if (offer.image) {
        const image = el('img', 'daily-offer__image');
        image.alt = offer.title;
        image.width = 360; image.height = 280;
        image.decoding = 'async';
        image.addEventListener('error', () => image.remove(), { once: true });
        image.src = offer.image;
        article.append(image);
      }
      mount.append(article);
    });
    renderPop(offer);
    const next = offers.flatMap(offer => [offer.startTime, offer.endTime]).filter(time => time > now);
    if (next.length) timer = setTimeout(render, Math.min(Math.min(...next) - now + 25, 2147483647));
  }
  async function refresh() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch('daily-offer.json', { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Daily offer unavailable');
      const data = await response.json();
      offers = data && data.version === 1 && Array.isArray(data.offers) && data.offers.length <= 31
        ? data.offers.map(validate).filter(Boolean) : [];
    } catch (_) { offers = []; }
    finally { loading = false; render(); }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { render(); refresh(); }
  });
  // Public static data only. Preloaded entries switch at their configured boundaries without a reload.
  setInterval(refresh, 3600000);
  refresh();
})();
