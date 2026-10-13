(() => {
const V = window.VIVAH, { esc, t, rupee, src, $, $$, api } = V, B = V.blocks;
const cat = V.BOOT.category, items = V.BOOT.products || [], app = $('#app');
if (!cat) { app.innerHTML = ''; return; }
const L = (V.SITE.layouts || {}).category || {};
const chev = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const cats = V.SITE.categories || [];
const tabs = (cat.tabs || []).filter(x => !x.slug || cats.some(c => c.slug === x.slug));
const catLabel = slug => (cats.find(c => c.slug === slug) || {}).label || '';
app.innerHTML = `<div id="blk-before"></div>
  <section class="cp-banner${cat.bannerSide === 'right' ? ' right' : ''}" id="cp-banner" style="background-image:url('${esc(src(cat.bannerImage))}');background-position:${esc(cat.bannerPos || 'center')}"><div class="cp-banner-text"><span class="hero-mark">&#10048;</span><h1>${esc(cat.title)}</h1><p>${esc(cat.tagline)}</p><a href="#cp-grid" class="btn btn-gold">${esc(cat.buttonLabel || t('cat.explore'))}</a></div></section>
  <div class="cp-top"><p class="cp-crumb"><a href="/">${esc(t('cat.crumbHome'))}</a> <span>&rsaquo;</span> <b>${esc(cat.crumb || cat.label)}</b></p>
    <div class="cp-tabs" id="cp-tabs" role="tablist">${tabs.map(x => x.slug ? `<a role="tab" href="/collection/${esc(x.slug)}">${esc(x.label)}</a>` : (cat.mixed ? `<a role="tab" class="on" aria-current="page">${esc(x.label)}</a>` : `<a role="tab" class="on" aria-current="page">${esc(x.label)}</a>`)).join('')}</div>
    <div class="cp-sort"><div class="cp-filter-wrap"><button class="cp-filter-btn" id="cp-filter-btn" aria-expanded="false" aria-controls="cp-filters">${esc(t('cat.filters'))}</button><aside class="cp-filters" id="cp-filters" aria-label="${esc(t('cat.filters'))}"></aside></div><span id="cp-count"></span>
      <select id="cp-sort" aria-label="${esc(t('cat.sortBy'))}"><option value="">${esc(t('cat.sortBy'))}</option><option value="lo">${esc(t('cat.lo'))}</option><option value="hi">${esc(t('cat.hi'))}</option></select></div></div>
  <div class="cp-shop"><div class="cp-main"><section class="cp-grid" id="cp-grid" aria-live="polite"></section><button class="btn btn-outline cp-more" id="cp-more" hidden>${esc(t('cat.more'))}</button></div></div>
  <div id="blk-after"></div>`;
if ((L.before || []).length) B.render($('#blk-before'), L.before);
if ((L.after || []).length) B.render($('#blk-after'), L.after);

V.fitPosters($('#cp-banner').parentNode);
const colors = [...new Set(items.map(p => p.color).filter(Boolean))];
$('#cp-filters').innerHTML = `<h2>${esc(t('cat.filters'))}</h2>` + (colors.length ? `<details open class="cp-group"><summary>${esc(t('cat.color'))}${chev}</summary>${colors.map(n => `<label class="cp-check"><input type="checkbox" value="${esc(n)}"><i style="background:${esc(V.COLOR_HEX[n] || '#999')}"></i><span>${esc(n)} (${items.filter(p => p.color === n).length})</span></label>`).join('')}</details>` : `<p class="cp-note">${esc(t('cat.filtersNote'))}</p>`);
const state = { colors: new Set(), sort: '', shown: 24 };
function render() {
  let list = items.filter(p => !state.colors.size || state.colors.has(p.color));
  if (state.sort) list = [...list].sort((a, b) => state.sort === 'lo' ? a.price - b.price : b.price - a.price);
  $('#cp-count').textContent = list.length + ' ' + t('cat.products');
  const part = list.slice(0, state.shown);
  $('#cp-grid').innerHTML = part.length ? part.map(p => `<article class="cp-card"><div class="cp-img"><a href="/product/${esc(p.id)}" tabindex="-1"><img src="${esc(src(p.image))}" alt="${esc(p.name)}" loading="lazy"></a>${B.heart(p.id)}</div>
    <h3>${esc(p.name)}</h3><p class="cp-type">${esc(t('cat.code'))} ${esc(p.code)}${cat.mixed ? ' &middot; ' + esc(catLabel(p.category)) : ''}</p><p class="price">${esc(t('cat.rental'))} ${rupee(p.price)}${esc(t('cat.perDay'))}</p>
    <p class="status ${B.statusCls(p.status)}">${esc(B.statusLabel(p.status))}</p>
    <div class="cp-actions"><a href="/product/${esc(p.id)}" class="btn btn-outline">${esc(t('cat.viewDetails'))}</a></div></article>`).join('')
    : `<p class="cp-empty">${esc(items.length ? t('cat.noMatch') : t('cat.empty'))}</p>`;
  $('#cp-more').hidden = list.length <= state.shown; V.refreshHearts();
}
$('#cp-filters').addEventListener('change', e => { const v = e.target.value; e.target.checked ? state.colors.add(v) : state.colors.delete(v); state.shown = 24; render(); });
$('#cp-sort').addEventListener('change', e => { state.sort = e.target.value; state.shown = 24; render(); });
$('#cp-more').addEventListener('click', () => { state.shown += 24; render(); });
const wrap = $('.cp-filter-wrap'), fb = $('#cp-filter-btn');
const setOpen = o => { wrap.classList.toggle('open', o); fb.setAttribute('aria-expanded', o); fb.classList.toggle('on', o); };
fb.addEventListener('click', e => { e.stopPropagation(); setOpen(!wrap.classList.contains('open')); });
document.addEventListener('click', e => { if (!wrap.contains(e.target)) setOpen(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
render();
})();
