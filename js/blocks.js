/* Section (block) renderers. The owner panel builds pages from these block types. */
(() => {
const V = window.VIVAH, { esc, nl, t, rupee, src, url, api, $, $$ } = V, ICONS = window.VIVAH_ICONS || {};
const btn = b => b && b.label ? `<a href="${esc(url(b.url))}" class="btn btn-${esc(b.style === 'ghost' ? 'ghost' : b.style === 'outline' ? 'outline' : 'gold')}">${esc(b.label)}</a>` : '';
const head = (eyebrow, heading) => (eyebrow || heading) ? `<div class="sec-head">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}${heading ? `<h2>${esc(heading)}</h2>` : ''}<span class="orn">&#10048;</span></div>` : '';
const heart = pid => `<button class="wish" ${pid ? `data-pid="${esc(pid)}"` : ''} aria-label="Wishlist" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/></svg></button>`;
const statusCls = s => (s === 'Available' || s === t('status.available')) ? 'ok' : 'low';
const statusLabel = s => s === 'Available' ? t('status.available') : s === 'Few Left' ? t('status.few') : s === 'Out of Stock' ? t('status.out') : s;
const trendCard = (p, rank, badge) => `<a class="trend-card gold-frame" href="/product/${esc(p.id)}">${rank ? `<span class="trend-rank">0${rank}</span>` : ''}${badge ? `<span class="trend-badge">${esc(badge)}</span>` : ''}<img src="${esc(src(p.image))}" alt="${esc(p.name)}" loading="lazy"><div><h3>${esc(p.name)}</h3><p>${esc(t('cat.rental'))} ${rupee(p.price)}${esc(t('cat.perDay'))}</p></div></a>`;

const B = {
  hero: { html: d => `<section class="hero" style="background-image:url('${esc(src(d.image || 'images/posters/couple.jpg'))}');background-position:${esc(d.imagePos || 'center 30%')}"><div class="hero-panel">${d.mark ? `<span class="hero-mark">${esc(d.mark)}</span>` : ''}<h1>${nl(d.title)}</h1>${d.sub ? `<p class="hero-sub">${nl(d.sub)}</p>` : ''}${d.tag ? `<p class="hero-tag">${nl(d.tag)}</p>` : ''}<div class="hero-cta">${(d.buttons || []).map(btn).join('')}</div></div>${(d.words || []).length ? `<ul class="hero-words">${d.words.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}</section>` },

  categories: { html: d => `<section class="categories" aria-label="${esc(d.ariaLabel || 'Shop by category')}"><ul id="categories">${(V.SITE.categories || []).map(c => `<li><a href="/collection/${esc(c.slug)}" class="cat"><span class="arch${c.thumbFit === 'contain' ? ' fit' : ''}"><img src="${esc(src(c.thumbImage))}" alt="${esc(c.label)}" loading="lazy"></span><span>${esc(c.label)}</span></a></li>`).join('')}</ul></section>` },

  featured: { html: (d, id) => `<section class="featured"><div class="featured-intro"><p class="eyebrow">${esc(d.eyebrow)}</p><h2>${nl(d.title)}</h2><p>${nl(d.text)}</p>${btn(Object.assign({ style: 'outline' }, d.button))}</div><div class="products" data-hydrate="${id}"></div></section>`,
    hydrate: async (el, d) => { const ids = (d.productIds || []).join(','); if (!ids) { el.innerHTML = ''; return; } const items = await api('GET', '/api/products?ids=' + encodeURIComponent(ids)); el.innerHTML = items.map(p => `<article class="card"><div class="card-img"><a href="/product/${esc(p.id)}"><img src="${esc(src(p.image))}" alt="${esc(p.name)}" loading="lazy"></a>${heart(p.id)}</div><h3>${esc(p.name)}</h3><p class="price">${esc(t('cat.rental'))} ${rupee(p.price)}${esc(t('cat.perDay'))}</p><p class="status ${statusCls(p.status)}">${esc(statusLabel(p.status))}</p><a href="/product/${esc(p.id)}" class="btn btn-outline btn-sm">${esc(t('cat.viewDetails'))}</a></article>`).join(''); } },

  spotlight: { html: d => { const fs = d.frameStyle || 'classic', cls = fs === 'classic' ? 'gold-frame' : 'frame-' + esc(fs);
      return `<section class="sec spotlight"${d.anchor ? ` id="${esc(d.anchor)}"` : ''}>${head(d.eyebrow, d.heading)}<div class="spot-grid${d.flip ? ' flip' : ''}"><figure class="${cls} spot-img"><img src="${esc(src(d.image))}" alt="${esc(d.alt)}" loading="lazy">${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}</figure><div class="gold-frame spot-copy"><p class="eyebrow">${esc(d.eyebrow2)}</p><h3>${esc(d.title)}</h3><p>${nl(d.text)}</p>${(d.bullets || []).length ? `<ul class="spot-list">${d.bullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<div class="spot-cta">${(d.buttons || []).map(btn).join('')}</div></div></div></section>`; } },

  trending: { html: (d, id) => `<section class="sec trending">${head(d.eyebrow, d.heading)}<div class="trend-row" data-hydrate="${id}"></div></section>`,
    hydrate: async (el, d) => { const ids = (d.productIds || []).join(','); if (!ids) return; const items = await api('GET', '/api/products?ids=' + encodeURIComponent(ids)); el.innerHTML = items.map((p, k) => trendCard(p, 0, d.badge)).join(''); } },

  productgrid: { html: (d, id) => `<section class="sec productgrid">${head(d.eyebrow, d.heading)}<div class="trend-row" data-hydrate="${id}"></div></section>`,
    hydrate: async (el, d) => { const q = (d.productIds && d.productIds.length) ? 'ids=' + encodeURIComponent(d.productIds.join(',')) : 'c=' + encodeURIComponent(d.category || '') + '&limit=' + (parseInt(d.count, 10) || 8) + (d.onlyFeatured ? '&featured=1' : ''); el.innerHTML = (await api('GET', '/api/products?' + q)).map(p => trendCard(p, 0, '')).join(''); } },

  gallery: { html: (d, id) => `<section class="sec gallery">${head(d.eyebrow, d.heading)}<div class="gal-wrap"><button class="gal-nav prev" aria-label="Scroll left">&lsaquo;</button><div class="gal-scroll" data-hydrate="${id}"></div><button class="gal-nav next" aria-label="Scroll right">&rsaquo;</button></div></section>`,
    hydrate: async (el, d, host) => { const items = await api('GET', '/api/gallery'); el.style.setProperty('--cols', Math.ceil(items.length / 2));
      el.innerHTML = items.map((g, k) => `<button class="gal-tile gold-frame" data-src="${esc(src(g.image))}" aria-label="View photo ${k + 1}"><img src="${esc(src(g.image))}" alt="${esc(g.alt || '')}" loading="lazy"></button>`).join('');
      const go = dir => el.scrollBy({ left: dir * el.clientWidth * .85, behavior: 'smooth' }); $('.gal-nav.prev', host).addEventListener('click', () => go(-1)); $('.gal-nav.next', host).addEventListener('click', () => go(1)); } },

  feedback: { html: d => `<section class="sec feedback">${head(d.eyebrow, d.heading)}<div class="fb-grid">${(d.items || []).map(i => { const n = Math.max(0, Math.min(5, parseInt(i.stars, 10) || 5)); return `<figure class="fb-card gold-frame"><span class="fb-q">&ldquo;</span><div class="fb-stars" aria-label="${n} out of 5">${'&#9733;'.repeat(n)}${'&#9734;'.repeat(5 - n)}</div><blockquote>${esc(i.text)}</blockquote><figcaption><b>${esc(i.name)}</b><span>${esc(i.role)}</span></figcaption></figure>`; }).join('')}</div></section>` },

  trust: { html: d => `<section class="trust"><ul>${(d.items || []).map(i => `<li><svg viewBox="0 0 24 24">${i.svg || ICONS[i.icon] || ICONS.star}</svg><div><b>${esc(i.title)}</b><span>${esc(i.sub)}</span></div></li>`).join('')}</ul></section>` },

  richtext: { html: d => `<section class="sec rich-sec">${head(d.eyebrow, d.heading)}<div class="rich ${d.narrow !== false ? 'narrow' : ''}" style="text-align:${esc(d.align || 'center')}">${d.html || ''}${(d.buttons || []).length ? `<div class="rich-cta">${d.buttons.map(btn).join('')}</div>` : ''}</div></section>` },

  banner: { html: d => `<section class="cp-banner" style="background-image:url('${esc(src(d.image))}');background-position:${esc(d.pos || 'center 30%')}"><div class="cp-banner-text"><span class="hero-mark">&#10048;</span><h1>${esc(d.title)}</h1><p>${esc(d.text)}</p>${btn(d.button && Object.assign({ style: 'gold' }, d.button))}</div></section>` },

  imagetext: { html: d => `<section class="sec imagetext">${head(d.eyebrow, d.heading)}<div class="spot-grid ${d.flip ? 'flip' : ''}"><figure class="gold-frame spot-img"><img src="${esc(src(d.image))}" alt="${esc(d.alt || '')}" loading="lazy"></figure><div class="gold-frame spot-copy"><h3>${esc(d.title)}</h3><div class="rich-inline">${d.html || ''}</div><div class="spot-cta">${(d.buttons || []).map(btn).join('')}</div></div></div></section>` },

  faq: { html: d => `<section class="sec faq">${head(d.eyebrow, d.heading)}<div class="faq-list">${(d.items || []).map(i => `<details class="faq-item gold-frame"><summary>${esc(i.q)}</summary><div>${nl(i.a)}</div></details>`).join('')}</div></section>` },

  contact: { html: (d, id) => { const b = V.SITE.brand || {}; const info = [['Phone', b.phone, 'tel:' + String(b.phone || '').replace(/\s/g, '')], ['WhatsApp', b.whatsapp, 'https://wa.me/' + String(b.whatsapp || '').replace(/\D/g, '')], ['Email', b.email, 'mailto:' + b.email], ['Address', b.address], ['Hours', b.hours]].filter(x => x[1]);
    return `<section class="sec contact">${head(d.eyebrow, d.heading)}<div class="contact-grid">${d.showInfo !== false && info.length ? `<div class="gold-frame contact-info">${info.map(([k, v, h]) => `<p><span>${esc(k)}</span>${h ? `<a href="${esc(h)}">${esc(v)}</a>` : esc(v)}</p>`).join('')}</div>` : ''}<form class="gold-frame contact-form" data-subject="${esc(d.subject || '')}" novalidate>${d.text ? `<p class="contact-text">${nl(d.text)}</p>` : ''}<label>Your name<input name="name" required autocomplete="name"></label><div class="two"><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><label>Email<input name="email" type="email" autocomplete="email"></label></div><label>Preferred date (optional)<input name="date" type="date"></label><label>Message<textarea name="message" rows="4" required></textarea></label><p class="vm-err" role="alert"></p><button class="btn btn-gold" type="submit">${esc(d.buttonLabel || 'Send')}</button></form></div></section>`; },
    hydrate: el => { const f = $('form.contact-form', el); if (!f) return; f.addEventListener('submit', async e => { e.preventDefault(); const v = Object.fromEntries(new FormData(f)); v.subject = f.dataset.subject; const err = $('.vm-err', f); err.textContent = ''; if (V.STATIC) { const text = `${v.subject || 'Enquiry'}\nName: ${v.name}\nPhone: ${v.phone || ''}\nEmail: ${v.email || ''}${v.date ? '\nPreferred date: ' + v.date : ''}\n${v.message}`; const link = V.contactUrl(text, v.subject); if (!v.name || !v.message) { err.textContent = 'Please fill in your name and a message.'; return; } if (link) { window.open(link, '_blank', 'noopener'); f.reset(); } else err.textContent = 'Please call the showroom to reach us.'; return; } try { await api('POST', '/api/contact', v); f.innerHTML = `<div class="vm-done"><div class="vm-tick">&#10003;</div><p class="vm-sub">${esc(t('misc.contactSent'))}</p></div>`; } catch (er) { err.textContent = er.message; } }); } },

  html: { html: d => `<section class="custom-html">${d.html || ''}</section>` },
  spacer: { html: d => `<div style="height:${Math.max(0, parseInt(d.height, 10) || 40)}px"></div>` }
};

/* Render a list of sections into an element. */
async function render(el, sections, append) {
  const parts = []; const hyd = [];
  (sections || []).forEach(s => {
    const b = B[s.type]; if (!b || s.visible === false) return;
    let h = ''; try { h = b.html(s.data || {}, s.id); } catch (e) { console.error('Section error', s.type, e); }
    parts.push(`<div class="blk blk-${esc(s.type)}" data-sid="${esc(s.id)}">${h}</div>`); if (b.hydrate) hyd.push([s, b]);
  });
  if (append) el.insertAdjacentHTML('beforeend', parts.join('')); else el.innerHTML = parts.join('');
  V.refreshHearts(); V.reveal(el); V.fitPosters(el);
  if (location.hash && el.id === 'blocks') setTimeout(() => { const t0 = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t0) t0.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 250);
  for (const [s, b] of hyd) { const host = $(`[data-sid="${s.id}"]`, el); if (!host) continue; const t0 = $('[data-hydrate]', host) || host; try { await b.hydrate(t0, s.data || {}, host); } catch (e) { console.error(e); } V.refreshHearts(); }
}
V.blocks = { types: B, render, trendCard, heart, statusCls, statusLabel };
})();
