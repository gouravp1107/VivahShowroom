/* Owner views: dashboard, pages, templates, layouts, products, collections */
(() => {
const O = window.OWN, { h, $, $$, esc, clone, src, money, fdate } = O, V = O.views = O.views || {};
const statusPill = s => h('span', { class: 'pill ' + ({ Available: 'ok', 'Few Left': 'low', 'Out of Stock': 'out' }[s] || '') }, s);

/* ============ dashboard ============ */
V.dashboard = { title: 'Dashboard', async render(box) {
  const s = await O.api('GET', '/api/admin/stats'), st = s.byStatus;
  box.append(h('div', { class: 'stats' }, ...[['Products', s.products], ['Collections', s.categories], ['Pages', s.pages], ['Bookings', s.bookings], ['Collected (all time)', money(s.collected)], ['Collected (this month)', money(s.monthCollected)], ['Customers', s.customers], ['Subscribers', s.subscribers]].map(([l, v]) => h('div', { class: 'stat' }, h('b', null, v), h('span', null, l)))));
  if (s.toVerify) box.append(h('div', { class: 'notice' }, s.toVerify + ' UPI payment(s) are waiting for you to verify. ', h('a', { href: '#/bookings' }, 'Open bookings')));
  if (O.me().mustChange) box.append(h('div', { class: 'notice' }, 'You are still using the first-time password. ', h('a', { href: '#/settings' }, 'Change it now'), ' before putting the site online.'));
  box.append(h('div', { class: 'grid2' },
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Bookings by status'), h('div', { class: 'row' }, ...['pending', 'confirmed', 'picked-up', 'returned', 'cancelled'].map(k => h('span', { class: 'pill ' + k }, k + ': ' + (st[k] || 0))))),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Needs attention'), s.unreadMessages ? h('p', null, s.unreadMessages + ' unread message(s). ', h('a', { href: '#/inbox' }, 'Read')) : h('p', { class: 'muted' }, 'No unread messages.'), h('p', null, s.outOfStock + ' product(s) out of stock.')),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Stock by collection'), h('table', null, h('tbody', null, ...s.perCat.map(c => h('tr', null, h('td', null, c.label), h('td', null, c.products + ' looks'), h('td', null, c.units + ' units')))))),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Low or unavailable stock'), s.lowStock.length ? h('table', null, h('tbody', null, ...s.lowStock.map(p => h('tr', null, h('td', null, h('a', { href: '#/products/' + p.id }, p.name + ' \u00B7 ' + p.code)), h('td', null, p.stock + ' left'), h('td', null, statusPill(p.status)))))) : h('p', { class: 'muted' }, 'All good.')),
    h('section', { class: 'card', style: { gridColumn: '1/-1' } }, h('h3', { class: 'card-t' }, 'Recent bookings'), s.recent.length ? h('table', null, h('tbody', null, ...s.recent.map(b => h('tr', null, h('td', null, b.id), h('td', null, b.name), h('td', null, money(b.total)), h('td', null, h('span', { class: 'pill ' + b.status }, b.status)), h('td', null, fdate(b.createdAt)))))) : h('p', { class: 'muted' }, 'No bookings yet.'))));
} };

/* ============ pages ============ */
V.pages = { title: 'Pages & sections', async render(box, top, rest) {
  if (rest[0]) return editPage(box, top, rest.join('/'));
  const pages = await O.pages(true);
  top.append(h('button', { class: 'btn primary', onclick: () => newPage() }, '+ New page'));
  const byParent = {}; pages.forEach(p => { const par = p.slug.includes('/') ? p.slug.split('/').slice(0, -1).join('/') : ''; (byParent[par] = byParent[par] || []).push(p); });
  const rows = (par, depth) => (byParent[par] || []).flatMap(p => [h('div', { class: 'pg' + (depth ? ' child' : '') }, h('div', { class: 't' }, h('b', null, p.title), h('small', null, p.system ? 'Home page \u2014 /' : '/p/' + p.slug + ' \u00B7 ' + p.sections.length + ' sections')), p.published ? h('span', { class: 'pill ok' }, 'Live') : h('span', { class: 'pill' }, 'Draft'), h('a', { class: 'btn sm', href: p.system ? '/' : '/p/' + p.slug, target: '_blank' }, 'View'), h('button', { class: 'btn sm primary', onclick: () => O.go('#/pages/' + p.id) }, 'Edit'), p.system ? null : h('button', { class: 'btn sm', onclick: () => newPage(p.slug) }, '+ Subpage'), p.system ? null : h('button', { class: 'btn sm', onclick: O.guard(async () => { const t = await O.prompt('Duplicate page', 'New page title', p.title + ' copy'); if (!t) return; await O.api('POST', '/api/admin/pages', { title: t, sections: clone(p.sections), published: false }); location.reload(); }) }, 'Duplicate'), p.system ? null : h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Delete the page "' + p.title + '"? Its subpages will move up a level.', 'Delete', true)) { await O.api('DELETE', '/api/admin/pages/' + p.id); location.reload(); } }) }, 'Delete')), ...(p.system ? [] : rows(p.slug, depth + 1))]);
  box.append(h('div', { class: 'pg-tree' }, ...rows('', 0)));
  async function newPage(parent) {
    const tpls = (await O.api('GET', '/api/admin/templates')).items; let tpl = tpls[0];
    O.modal(parent ? 'New subpage of /p/' + parent : 'New page', a => {
      const t = h('input', { class: 'inp', placeholder: 'e.g. Bridal Care Guide' }), s = h('input', { class: 'inp', placeholder: 'auto from title' });
      const sel = h('select', { class: 'inp', onchange: e => { tpl = tpls.find(x => x.id === e.target.value); } }, ...tpls.map(x => h('option', { value: x.id }, x.name)));
      a.body.append(h('div', { class: 'grid2' }, h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, 'Page title'), t), h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, 'URL name'), s, h('small', { class: 'hint' }, 'Address will be /p/' + (parent ? parent + '/' : '') + '\u2026')), h('label', { class: 'fld', style: { gridColumn: '1/-1' } }, h('span', { class: 'fld-l' }, 'Start from template'), sel)));
      a.button('Cancel', '', () => a.close());
      a.button('Create page', 'primary', async () => { const slug = (parent ? parent + '/' : '') + (s.value.trim() || t.value.trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const r = await O.api('POST', '/api/admin/pages', { title: t.value.trim(), slug, sections: tpl ? clone(tpl.sections) : [] }); a.close(); O.cache.pages = null; O.go('#/pages/' + r.item.id); });
    });
  }
} };
async function editPage(box, top, id) {
  const pages = await O.pages(true), page = clone(pages.find(p => p.id === id));
  if (!page) { box.append(h('div', { class: 'notice' }, 'Page not found.')); return; }
  document.querySelector('#top h2').textContent = 'Edit: ' + page.title;
  top.append(h('a', { class: 'btn', href: '#/pages' }, '\u2190 All pages'), h('a', { class: 'btn', target: '_blank', href: page.system ? '/' : '/p/' + page.slug }, 'View live'));
  top.append(h('button', { class: 'btn', onclick: O.guard(async () => { const n = await O.prompt('Save as template', 'Template name', page.title + ' layout'); if (!n) return; await O.api('POST', '/api/admin/templates', { name: n, description: 'Saved from page "' + page.title + '"', sections: O.cleanSections(page.sections) }); O.toast('Template saved', 'ok'); }) }, 'Save as template'));
  O.saveButton(top, async () => { const body = clone(page); body.sections = O.cleanSections(page.sections); await O.api('PUT', '/api/admin/pages/' + page.id, body); O.cache.pages = null; O.refreshUrlList(); });
  const settings = [{ k: 'title', label: 'Page title', type: 'text' }, ...(page.system ? [] : [{ k: 'slug', label: 'URL (after /p/) \u2014 use / for subpages e.g. about/our-story', type: 'text' }, { k: 'published', label: 'Published (untick to hide as draft)', type: 'bool' }]), { k: 'showHeader', label: 'Show header', type: 'bool' }, { k: 'showFooter', label: 'Show footer', type: 'bool' }, { k: 'seoTitle', label: 'Browser / Google title', type: 'text' }, { k: 'seoDescription', label: 'Google description', type: 'area', rows: 2 }, { k: 'ogImage', label: 'Social share image', type: 'image' }];
  box.append(h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Page settings'), h('div', { class: 'grid2' }, ...O.fields(settings, page, () => O.markDirty()))));
  await O.categories(); await O.products();
  box.append(h('h3', { style: { margin: '6px 0 12px' } }, 'Sections (top to bottom)'), O.sectionBuilder(page.sections, () => {}));
}

/* ============ templates ============ */
V.templates = { title: 'Page templates', async render(box, top, rest) {
  if (rest[0]) return editTemplate(box, top, rest[0]);
  const items = (await O.api('GET', '/api/admin/templates')).items;
  box.append(h('p', { class: 'muted' }, 'Templates are reusable section layouts. Create a new page from a template, or insert a template into any page. You can also save any page as a template from its editor.'));
  top.append(h('button', { class: 'btn primary', onclick: O.guard(async () => { const n = await O.prompt('New template', 'Template name'); if (!n) return; const r = await O.api('POST', '/api/admin/templates', { name: n, sections: [] }); O.go('#/templates/' + r.item.id); }) }, '+ New template'));
  box.append(h('div', { class: 'pg-tree' }, ...items.map(t => h('div', { class: 'pg' }, h('div', { class: 't' }, h('b', null, t.name), h('small', null, (t.description || '') + ' \u00B7 ' + t.sections.length + ' sections')), h('button', { class: 'btn sm primary', onclick: () => O.go('#/templates/' + t.id) }, 'Edit'), h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Delete template "' + t.name + '"? Pages already made from it are not affected.', 'Delete', true)) { await O.api('DELETE', '/api/admin/templates/' + t.id); O.go('#/templates'); location.reload(); } }) }, 'Delete')))));
} };
async function editTemplate(box, top, id) {
  const t = clone((await O.api('GET', '/api/admin/templates')).items.find(x => x.id === id)); if (!t) return;
  document.querySelector('#top h2').textContent = 'Template: ' + t.name;
  top.append(h('a', { class: 'btn', href: '#/templates' }, '\u2190 Templates'));
  O.saveButton(top, async () => { await O.api('PUT', '/api/admin/templates/' + t.id, { name: t.name, description: t.description, sections: O.cleanSections(t.sections) }); });
  await O.categories(); await O.products();
  box.append(h('section', { class: 'card' }, h('div', { class: 'grid2' }, ...O.fields([{ k: 'name', label: 'Template name', type: 'text' }, { k: 'description', label: 'Description', type: 'text' }], t, () => O.markDirty()))), O.sectionBuilder(t.sections, () => {}, { templates: false }));
}

/* ============ collection & product page layouts ============ */
V.layouts = { title: 'Collection & product pages', async render(box, top) {
  const s = (await O.api('GET', '/api/admin/settings')).settings, L = clone(s.layouts); await O.categories(); await O.products();
  O.saveButton(top, async () => { ['category', 'product'].forEach(k => ['before', 'after'].forEach(w => { L[k][w] = O.cleanSections(L[k][w]); })); await O.api('PUT', '/api/admin/settings', { layouts: L }); });
  box.append(h('p', { class: 'muted' }, 'The product listing and the booking form are built in. Here you can add extra sections above or below them on every collection page and every product page. Labels on those pages are edited under "Text, login & payment windows".'));
  [['category', 'Collection pages'], ['product', 'Product pages']].forEach(([k, label]) => [['before', 'above'], ['after', 'below']].forEach(([w, wl]) => box.append(h('section', { class: 'card' }, h('h3', { class: 'card-t' }, label + ' \u2014 sections ' + wl), O.sectionBuilder(L[k][w], () => {}, { templates: false })))));
} };

/* ============ products / inventory ============ */
V.products = { title: 'Products & inventory', async render(box, top, rest) {
  if (rest[0]) return editProduct(box, top, rest[0]);
  const cats = await O.categories(), all = await O.products(true);
  top.append(h('button', { class: 'btn primary', onclick: () => O.go('#/products/new') }, '+ New product'), h('button', { class: 'btn', onclick: bulkAdd }, 'Add many from images'));
  const st = { cat: '', q: '', status: '', page: 0, sel: new Set(), sort: 'new' }, PER = 50;
  const catSel = h('select', { class: 'inp', onchange: e => { st.cat = e.target.value; st.page = 0; draw(); } }, h('option', { value: '' }, 'All collections'), ...cats.map(c => h('option', { value: c.slug }, c.label + ' (' + (O.cache.catCounts[c.slug] || 0) + ')')));
  const stSel = h('select', { class: 'inp', onchange: e => { st.status = e.target.value; st.page = 0; draw(); } }, h('option', { value: '' }, 'Any status'), ...['Available', 'Few Left', 'Out of Stock', 'hidden'].map(x => h('option', { value: x }, x === 'hidden' ? 'Hidden from website' : x)));
  const q = h('input', { class: 'inp', placeholder: 'Search name, colour or code\u2026', oninput: e => { st.q = e.target.value.toLowerCase(); st.page = 0; draw(); } });
  const pcount = h('span', { class: 'muted' }), bulk = h('div', { class: 'toolbar', hidden: true }), tbl = h('div', { class: 'tbl-wrap' }), pager = h('div', { class: 'toolbar' });
  box.append(h('div', { class: 'toolbar' }, q, catSel, stSel, h('span', { class: 'sp' }), pcount), bulk, tbl, pager);
  const catName = s => (cats.find(c => c.slug === s) || {}).label || s;
  function filtered() { return all.filter(p => (!st.cat || p.category === st.cat) && (!st.status || (st.status === 'hidden' ? p.visible === false : p.status === st.status)) && (!st.q || (p.name + ' ' + p.code + ' ' + p.color).toLowerCase().includes(st.q))); }
  function draw() {
    const list = filtered(), part = list.slice(st.page * PER, st.page * PER + PER); pcount.textContent = list.length + ' products';
    const allOn = part.length && part.every(p => st.sel.has(p.id));
    tbl.replaceChildren(h('table', null, h('thead', null, h('tr', null, h('th', null, h('input', { type: 'checkbox', checked: allOn, onchange: e => { part.forEach(p => e.target.checked ? st.sel.add(p.id) : st.sel.delete(p.id)); draw(); } })), h('th', null, ''), h('th', null, 'Name'), h('th', null, 'Code'), h('th', null, 'Collection'), h('th', null, 'Price/day'), h('th', null, 'Stock'), h('th', null, 'Status'), h('th', null, ''))),
      h('tbody', null, ...part.map(p => h('tr', null, h('td', null, h('input', { type: 'checkbox', checked: st.sel.has(p.id), onchange: e => { e.target.checked ? st.sel.add(p.id) : st.sel.delete(p.id); drawBulk(); } })), h('td', null, h('img', { class: 'thumb', src: src(p.image), loading: 'lazy' })), h('td', null, h('a', { href: '#/products/' + p.id }, p.name), p.visible === false ? h('span', { class: 'pill', style: { marginLeft: '6px' } }, 'hidden') : null, p.featured ? h('span', { class: 'pill low', style: { marginLeft: '6px' } }, '\u2605') : null), h('td', null, p.code), h('td', null, catName(p.category)),
        h('td', null, h('input', { class: 'inp sm', type: 'number', value: p.price, style: { width: '90px' }, onchange: O.guard(async e => { await quick(p, { price: Number(e.target.value) }); }) })),
        h('td', null, h('input', { class: 'inp sm', type: 'number', min: 0, value: p.stock, style: { width: '70px' }, onchange: O.guard(async e => { await quick(p, { stock: Number(e.target.value) }); }) })),
        h('td', null, h('select', { class: 'inp sm', onchange: O.guard(async e => { await quick(p, { status: e.target.value }); }) }, ...['Available', 'Few Left', 'Out of Stock'].map(x => h('option', { selected: p.status === x }, x)))),
        h('td', null, h('a', { class: 'btn sm', href: '/product/' + p.id, target: '_blank' }, 'View'), ' ', h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Delete "' + p.name + '" (' + p.code + ')? The image file stays in your media library.', 'Delete', true)) { await O.api('DELETE', '/api/admin/products/' + p.id); all.splice(all.indexOf(p), 1); st.sel.delete(p.id); draw(); } }) }, 'Delete')))))));
    const pages = Math.ceil(list.length / PER); pager.replaceChildren(h('button', { class: 'btn sm', disabled: st.page === 0, onclick: () => { st.page--; draw(); } }, '\u2190 Prev'), h('span', { class: 'muted' }, 'Page ' + (st.page + 1) + ' of ' + Math.max(1, pages)), h('button', { class: 'btn sm', disabled: st.page + 1 >= pages, onclick: () => { st.page++; draw(); } }, 'Next \u2192')); drawBulk();
  }
  async function quick(p, patch) { const r = await O.api('PUT', '/api/admin/products/' + p.id, Object.assign({}, p, patch)); Object.assign(p, r.item); O.toast('Updated', 'ok'); }
  function drawBulk() {
    bulk.hidden = !st.sel.size; if (!st.sel.size) return; const ids = [...st.sel];
    const act = (label, patch, cls) => h('button', { class: 'btn sm ' + (cls || ''), onclick: O.guard(async () => { await O.api('POST', '/api/admin/products-bulk', { action: 'update', ids, patch }); await O.products(true); all.length = 0; all.push(...O.cache.products); st.sel.clear(); draw(); O.toast('Updated ' + ids.length + ' products', 'ok'); }) }, label);
    bulk.replaceChildren(h('b', null, ids.length + ' selected'), act('Mark Available', { status: 'Available' }), act('Mark Few Left', { status: 'Few Left' }), act('Mark Out of Stock', { status: 'Out of Stock' }), act('Hide', { visible: false }), act('Show', { visible: true }),
      h('button', { class: 'btn sm', onclick: O.guard(async () => { const v = await O.prompt('Set price per day for ' + ids.length + ' products', 'Price in rupees'); if (v && !isNaN(v)) { await O.api('POST', '/api/admin/products-bulk', { action: 'update', ids, patch: { price: Number(v) } }); await O.products(true); all.length = 0; all.push(...O.cache.products); st.sel.clear(); draw(); } }) }, 'Set price\u2026'),
      h('button', { class: 'btn sm danger', onclick: O.guard(async () => { if (await O.confirm('Delete ' + ids.length + ' products? This cannot be undone.', 'Delete all', true)) { await O.api('POST', '/api/admin/products-bulk', { action: 'delete', ids }); await O.products(true); all.length = 0; all.push(...O.cache.products); st.sel.clear(); draw(); } }) }, 'Delete'));
  }
  function bulkAdd() {
    O.modal('Add many products from images', a => {
      let paths = [], cat = cats[0] && cats[0].slug, price = 1999, stock = 1;
      const info = h('p', { class: 'muted' }, 'Choose or upload several photos; one product is made for each.');
      a.body.append(info, h('div', { class: 'grid2' }, ...O.fields([{ k: 'cat', label: 'Collection', type: 'category' }, { k: 'price', label: 'Price per day', type: 'number' }, { k: 'stock', label: 'Units in stock', type: 'number' }, { k: 'color', label: 'Colour (optional)', type: 'text' }], st.b = { cat, price, stock, color: '' }, () => {})), h('button', { class: 'btn', onclick: async () => { const r = await O.pickImage(true); if (r) { paths = r; info.textContent = paths.length + ' images chosen.'; } } }, 'Choose images\u2026'));
      a.button('Cancel', '', () => a.close());
      a.button('Create products', 'primary', async () => { const b = st.b; if (!b.cat) throw new Error('Choose a collection'); if (!paths.length) throw new Error('Choose some images first'); const catObj = cats.find(c => c.slug === b.cat); const items = paths.map((p, i) => ({ category: b.cat, name: (b.color ? b.color + ' ' : '') + (catObj.noun || 'Outfit'), color: b.color, price: b.price, stock: b.stock, image: p, code: (p.split('/').pop().replace(/\.[^.]+$/, '').replace(/^.*?(\d+)$/, '$1')) })); const r = await O.api('POST', '/api/admin/products-bulk', { action: 'create', items }); a.close(); O.toast(r.created + ' products created', 'ok'); O.go('#/products'); location.reload(); });
    });
  }
  draw();
} };
async function editProduct(box, top, id) {
  const cats = await O.categories(), isNew = id === 'new'; let p;
  if (isNew) p = { category: cats[0] ? cats[0].slug : '', name: '', code: '', color: '', price: 1999, status: 'Available', stock: 1, image: '', images: [], description: '', sizes: [], specs: [], featured: false, visible: true };
  else { p = clone((await O.products(true)).find(x => x.id === id)); if (!p) { box.append(h('div', { class: 'notice' }, 'Product not found.')); return; } }
  document.querySelector('#top h2').textContent = isNew ? 'New product' : 'Edit: ' + p.name;
  top.append(h('a', { class: 'btn', href: '#/products' }, '\u2190 Products'), isNew ? null : h('a', { class: 'btn', target: '_blank', href: '/product/' + p.id }, 'View live'));
  const sizesTxt = { v: (p.sizes || []).join(', ') }, szObj = { sizes: sizesTxt.v, specs: p.specs = p.specs || [] };
  O.saveButton(top, async () => { const body = clone(p); body.sizes = sizesTxt.v.split(',').map(x => x.trim()).filter(Boolean); const r = await O.api(isNew ? 'POST' : 'PUT', '/api/admin/products' + (isNew ? '' : '/' + p.id), body); O.cache.products = null; O.markClean(); O.go('#/products/' + r.item.id); });
  box.append(
    O.formCard('Details', [{ k: 'name', label: 'Name', type: 'text' }, { k: 'code', label: 'Code (shown to customers)', type: 'text' }, { k: 'category', label: 'Collection', type: 'select', options: cats.map(c => [c.slug, c.label]) }, { k: 'color', label: 'Colour (used for filters)', type: 'text', placeholder: 'Red, Maroon, Gold\u2026' }, { k: 'price', label: 'Rental price per day (\u20B9)', type: 'number', min: 0 }, { k: 'description', label: 'Description', type: 'area', rows: 4 }], p),
    O.formCard('Inventory & visibility', [{ k: 'stock', label: 'Units in stock (bookings are blocked when all units are reserved for the chosen dates)', type: 'number', min: 0 }, { k: 'status', label: 'Status label', type: 'select', options: [['Available', 'Available'], ['Few Left', 'Few Left'], ['Out of Stock', 'Out of Stock']] }, { k: 'visible', label: 'Visible on website', type: 'bool' }, { k: 'featured', label: 'Featured (can be shown in "Product grid" sections)', type: 'bool' }], p),
    O.formCard('Images', [{ k: 'image', label: 'Main image', type: 'image' }, { k: 'images', label: 'Extra photos (shown as thumbnails on the product page)', type: 'list', item: [], multiImage: false }], p),
    O.formCard('Sizes & specifications', [{ k: 'sizes', label: 'Sizes available (comma separated). Leave empty to use the collection default.', type: 'text' }, { k: 'specs', label: 'Extra specifications', type: 'list', item: [{ k: 'k', label: 'Label', type: 'text' }, { k: 'v', label: 'Value', type: 'text' }], itemLabel: x => x.k, newItem: { k: 'Fabric', v: '' } }], szObj));
  // sizes uses its own text binding
  const sizeInp = $$('input.inp', box).find(i => i.closest('.fld') && i.closest('.fld').textContent.startsWith('Sizes available'));
  if (sizeInp) { sizeInp.value = sizesTxt.v; sizeInp.oninput = e => { sizesTxt.v = e.target.value; O.markDirty(); }; }
  // extra photos: simple multi-image chooser
  const extra = $$('.fld', box).find(f => f.textContent.startsWith('Extra photos'));
  if (extra) { extra.replaceChildren(h('span', { class: 'fld-l' }, 'Extra photos (thumbnails on the product page)'), (() => { const wrap = h('div', { class: 'chips' }); const draw = () => wrap.replaceChildren(...(p.images || []).map((im, i) => h('div', { class: 'chip' }, h('img', { src: src(im) }), h('span', null, im.split('/').pop()), h('button', { onclick: () => { p.images.splice(i, 1); O.markDirty(); draw(); } }, '\u00D7'))), h('button', { class: 'btn sm', onclick: async () => { const r = await O.pickImage(true); if (r) { p.images = [...(p.images || []), ...r]; O.markDirty(); draw(); } } }, '+ Add photos')); draw(); return wrap; })()); }
}

/* ============ collections ============ */
V.categories = { title: 'Collections', async render(box, top, rest) {
  if (rest[0]) return editCat(box, top, rest[0]);
  const cats = await O.categories(true);
  top.append(h('button', { class: 'btn primary', onclick: () => O.go('#/categories/new') }, '+ New collection'));
  box.append(h('p', { class: 'muted' }, 'Collections are the groups of products (Bride, Groom, Saafas\u2026). Each has its own page, banner poster and round picture on the home page. After adding one, add it to the header menu under "Header & footer".'));
  box.append(h('div', { class: 'pg-tree' }, ...cats.map((c, i) => h('div', { class: 'pg' }, h('img', { class: 'thumb', style: { width: '40px', height: '52px', objectFit: 'cover', borderRadius: '6px' }, src: src(c.thumbImage) }), h('div', { class: 't' }, h('b', null, c.label), h('small', null, '/collection/' + c.slug + ' \u00B7 ' + (O.cache.catCounts[c.slug] || 0) + ' products')), c.visible === false ? h('span', { class: 'pill' }, 'Hidden') : h('span', { class: 'pill ok' }, 'Live'),
    h('button', { class: 'btn sm', disabled: i === 0, onclick: O.guard(async () => { await swap(cats, i, i - 1); }) }, '\u2191'), h('button', { class: 'btn sm', disabled: i === cats.length - 1, onclick: O.guard(async () => { await swap(cats, i, i + 1); }) }, '\u2193'),
    h('button', { class: 'btn sm primary', onclick: () => O.go('#/categories/' + c.id) }, 'Edit'),
    h('button', { class: 'btn sm', onclick: O.guard(async () => { if (!await O.confirm('Delete the collection "' + c.label + '"?', 'Continue', true)) return; try { await O.api('DELETE', '/api/admin/categories/' + c.id); } catch (e) { if (e.status === 409 && await O.confirm(e.message + ' Delete the collection AND all its products?', 'Delete everything', true)) await O.api('DELETE', '/api/admin/categories/' + c.id + '?force=1'); else if (e.status !== 409) throw e; else return; } O.cache.products = null; O.refreshUrlList(); O.go('#/categories'); location.reload(); }) }, 'Delete')))));
  async function swap(list, a, b) { const A = list[a], B = list[b]; const oa = A.order, ob = B.order; await O.api('PUT', '/api/admin/categories/' + A.id, Object.assign({}, A, { order: b })); await O.api('PUT', '/api/admin/categories/' + B.id, Object.assign({}, B, { order: a })); O.go('#/categories'); location.reload(); }
} };
async function editCat(box, top, id) {
  const cats = await O.categories(), isNew = id === 'new';
  let c = isNew ? { label: '', slug: '', title: '', crumb: '', tagline: '', noun: 'Outfit', basePrice: 1999, bannerPos: 'center 30%', bannerImage: '', thumbImage: '', thumbFit: 'cover', bannerSide: 'left', bannerSide: 'left', buttonLabel: '', tabs: [], sizes: ['S', 'M', 'L', 'XL'], visible: true, order: cats.length, seoTitle: '', seoDescription: '' } : clone(cats.find(x => x.id === id));
  if (!c) return; document.querySelector('#top h2').textContent = isNew ? 'New collection' : 'Edit: ' + c.label;
  top.append(h('a', { class: 'btn', href: '#/categories' }, '\u2190 Collections'), isNew ? null : h('a', { class: 'btn', target: '_blank', href: '/collection/' + c.slug }, 'View live'));
  const sz = { v: (c.sizes || []).join(', ') };
  O.saveButton(top, async () => { const body = clone(c); body.sizes = sz.v.split(',').map(x => x.trim()).filter(Boolean); const r = await O.api(isNew ? 'POST' : 'PUT', '/api/admin/categories' + (isNew ? '' : '/' + c.id), body); await O.categories(true); O.refreshUrlList(); O.markClean(); O.go('#/categories/' + r.item.id); });
  box.append(O.formCard('Collection', [{ k: 'label', label: 'Name (menu & circle)', type: 'text' }, { k: 'slug', label: 'URL name (/collection/\u2026)', type: 'text', hint: isNew ? 'Leave empty to make it from the name.' : 'Changing this updates products and menu links automatically.' }, { k: 'title', label: 'Banner heading', type: 'text' }, { k: 'crumb', label: 'Breadcrumb name', type: 'text' }, { k: 'tagline', label: 'Banner tag line', type: 'text' }, { k: 'buttonLabel', label: 'Banner button text (empty = default)', type: 'text' }, { k: 'noun', label: 'What one item is called (e.g. Bridal Lehenga)', type: 'text' }, { k: 'visible', label: 'Visible on website', type: 'bool' }], c),
    O.formCard('Pictures', [{ k: 'bannerImage', label: 'Banner poster (shown whole, never cropped \u2014 any size works, wide posters look best)', type: 'image' }, { k: 'thumbImage', label: 'Round picture on home page (window)', type: 'image' }, { k: 'thumbFit', label: 'Window picture fit', type: 'select', options: [['cover', 'Fill the window (may trim edges)'], ['contain', 'Zoom out \u2014 show the whole picture']] }, { k: 'bannerSide', label: 'Text box position on the poster', type: 'select', options: [['left', 'Left'], ['right', 'Right']] }, { k: 'bannerSide', label: 'Text box position on the poster', type: 'select', options: [['left', 'Left'], ['right', 'Right']] }, { k: 'bannerPos', label: 'Banner focus (only used on very small screens)', type: 'text' }], c),
    O.formCard('Sizes & tabs', [{ k: 'sizes', label: 'Default sizes (comma separated)', type: 'text' }, { k: 'tabs', label: 'Tab buttons above the products', type: 'list', item: [{ k: 'label', label: 'Label', type: 'text' }, { k: 'slug', label: 'Links to collection (URL name) \u2014 leave empty for the current one', type: 'text' }], itemLabel: x => x.label, newItem: { label: 'Tab', slug: '' } }], c),
    O.formCard('Google / sharing', [{ k: 'seoTitle', label: 'Browser title', type: 'text' }, { k: 'seoDescription', label: 'Description', type: 'area', rows: 2 }], c));
  const sizeInp = $$('.fld', box).find(f => f.textContent.startsWith('Default sizes')); if (sizeInp) { const i = $('input', sizeInp); i.value = sz.v; i.oninput = e => { sz.v = e.target.value; O.markDirty(); }; }
}
})();
