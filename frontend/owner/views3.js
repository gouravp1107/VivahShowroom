/* Owner views: Posters, Windows, Gallery - each is its own inventory, separate from products and from each other */
(() => {
const O = window.OWN, { h, $, esc, clone, src } = O, V = O.views;

/* ============ Posters ============ */
V.posters = { title: 'Posters', async render(box, top) {
  const [cats, pages, sr] = await Promise.all([O.categories(true), O.pages(true), O.api('GET', '/api/admin/settings')]);
  const S = sr.settings, CP = clone(S.collectionsPage);
  box.append(h('div', { class: 'notice' }, 'Posters are the wide banner pictures. Each poster is shown whole, at full screen width, with nothing cropped \u2014 use wide pictures (ideal 3:1, e.g. 2172 \u00D7 724). Posters are kept separately: deleting products, gallery photos or window pictures never changes them.'));
  const row = (label, sub, path, onPick, onRemove) => h('div', { class: 'pg' }, h('img', { src: src(path), style: { width: '210px', aspectRatio: '3/1', objectFit: 'contain', background: '#f3ead8', borderRadius: '6px', border: '1px solid var(--line)' } }), h('div', { class: 't' }, h('b', null, label), h('small', null, sub + (path ? ' \u00B7 ' + path.split('/').pop() : ' \u00B7 no poster'))), h('button', { class: 'btn sm primary', onclick: O.guard(async () => { const r = await O.pickImage(false); if (r && r[0]) { await onPick(r[0]); O.toast('Poster replaced', 'ok'); location.reload(); } }) }, 'Replace'), onRemove ? h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Remove this poster picture?', 'Remove', true)) { await onRemove(); location.reload(); } }) }, 'Remove') : null);
  const home = pages.find(p => p.system), hero = home && home.sections.find(s => s.type === 'hero');
  const list = h('div', { class: 'pg-tree' });
  if (hero) list.append(row('Home page poster', 'Top of the home page', hero.data.image, async p => { hero.data.image = p; await O.api('PUT', '/api/admin/pages/' + home.id, home); }, async () => { hero.data.image = ''; await O.api('PUT', '/api/admin/pages/' + home.id, home); }));
  list.append(row('All Collections page poster', 'Opens from "Explore Collection" \u2014 shows every collection mixed', CP.bannerImage, async p => { CP.bannerImage = p; await O.api('PUT', '/api/admin/settings', { collectionsPage: CP }); }));
  cats.forEach(c => list.append(row(c.label + ' poster', '/collection/' + c.slug, c.bannerImage, async p => { await O.api('PUT', '/api/admin/categories/' + c.id, Object.assign({}, c, { bannerImage: p })); })));
  pages.filter(p => !p.system).forEach(pg => pg.sections.forEach((sec, i) => { if (sec.type === 'banner') list.append(row('Page banner: ' + pg.title, '/p/' + pg.slug, sec.data.image, async p => { sec.data.image = p; await O.api('PUT', '/api/admin/pages/' + pg.id, pg); })); }));
  box.append(list);
  box.append(h('p', { class: 'muted' }, 'To change the text on a poster edit the collection (Collections) or the page (Pages & sections). Brightness for all posters: Design & theme.'));
  box.append(O.formCard('"All Collections" page text', [{ k: 'title', label: 'Heading', type: 'text' }, { k: 'tagline', label: 'Tag line', type: 'text' }, { k: 'buttonLabel', label: 'Button text (empty = default)', type: 'text' }], CP));
  O.saveButton(top, async () => { await O.api('PUT', '/api/admin/settings', { collectionsPage: CP }); }, 'Save text');
} };

/* ============ Windows ============ */
V.windows = { title: 'Windows (round pictures on the home page)', async render(box, top) {
  const cats = await O.categories(true);
  box.append(h('div', { class: 'notice' }, 'Windows are the round pictures under the poster that open each collection. They are separate from posters and products: deleting a product never removes a window. Choose a picture that is different from the poster. "Zoom out" shows the whole picture inside the window.'));
  const grid = h('div', { class: 'swatches' });
  cats.forEach((c, i) => {
    const prev = h('div', { class: 'win-prev' }), draw = () => prev.replaceChildren(h('img', { src: src(c.thumbImage), style: { objectFit: c.thumbFit === 'contain' ? 'contain' : 'cover' } }));
    const save = O.guard(async () => { await O.api('PUT', '/api/admin/categories/' + c.id, c); O.toast('Saved', 'ok'); });
    draw();
    grid.append(h('section', { class: 'card' }, h('div', { class: 'win-row' }, prev, h('div', null, h('b', null, c.label), h('div', { class: 'muted' }, c.visible === false ? 'Hidden' : 'Shown on home page'))),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn sm primary', onclick: O.guard(async () => { const r = await O.pickImage(false); if (r && r[0]) { c.thumbImage = r[0]; draw(); await save(); } }) }, 'Change picture'),
        h('select', { class: 'inp sm', onchange: async e => { c.thumbFit = e.target.value; draw(); await save(); } }, h('option', { value: 'cover', selected: c.thumbFit !== 'contain' }, 'Fill window'), h('option', { value: 'contain', selected: c.thumbFit === 'contain' }, 'Zoom out (show whole)')),
        h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: c.visible !== false, onchange: async e => { c.visible = e.target.checked; await save(); } }), 'Show'))));
  });
  box.append(grid);
} };

/* ============ Gallery ============ */
V.gallery = { title: 'Gallery', async render(box, top) {
  let items = (await O.api('GET', '/api/admin/gallery')).items; const sel = new Set();
  const grid = h('div', { class: 'media-grid' }), bulk = h('div', { class: 'toolbar', hidden: true }), count = h('span', { class: 'muted' });
  box.append(h('div', { class: 'notice' }, 'The home page gallery shows these photos in two rows that scroll sideways together. This gallery is separate: adding or deleting photos here never changes products, posters or windows, and the reverse is also true.'));
  top.append(h('button', { class: 'btn primary', onclick: O.guard(async () => { const r = await O.pickImage(true); if (r && r.length) { const res = await O.api('POST', '/api/admin/gallery', { items: r.map(p => ({ image: p, alt: '' })) }); items.push(...res.items); draw(); O.toast(r.length + ' photos added', 'ok'); } }) }, '+ Add photos'));
  box.append(h('div', { class: 'toolbar' }, count), bulk, grid);
  function draw() {
    count.textContent = items.length + ' photos (' + items.filter(g => g.visible !== false).length + ' shown)';
    grid.replaceChildren(...items.map((g, i) => h('div', { class: 'media-item' + (g.visible === false ? ' off' : ''), style: g.visible === false ? { opacity: .5 } : {} }, h('input', { class: 'sel', type: 'checkbox', checked: sel.has(g.id), onchange: e => { e.target.checked ? sel.add(g.id) : sel.delete(g.id); drawBulk(); } }), h('img', { src: src(g.image), loading: 'lazy' }),
      h('div', { class: 'meta' }, h('div', { class: 'row' }, h('button', { class: 'btn sm', title: 'Move earlier', disabled: i === 0, onclick: O.guard(async () => { items.splice(i - 1, 0, items.splice(i, 1)[0]); await order(); draw(); }) }, '\u2190'), h('button', { class: 'btn sm', title: 'Move later', disabled: i === items.length - 1, onclick: O.guard(async () => { items.splice(i + 1, 0, items.splice(i, 1)[0]); await order(); draw(); }) }, '\u2192'), h('button', { class: 'btn sm', title: g.visible === false ? 'Show' : 'Hide', onclick: O.guard(async () => { g.visible = g.visible === false; await O.api('PUT', '/api/admin/gallery/' + g.id, { visible: g.visible }); draw(); }) }, g.visible === false ? 'Show' : 'Hide'), h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Remove this photo from the gallery? The picture file stays in Images & media.', 'Remove', true)) { await O.api('DELETE', '/api/admin/gallery/' + g.id); items.splice(i, 1); sel.delete(g.id); draw(); } }) }, '\u00D7')))))); drawBulk();
  }
  const order = () => O.api('POST', '/api/admin/gallery-order', { ids: items.map(g => g.id) });
  function drawBulk() { bulk.hidden = !sel.size; bulk.replaceChildren(h('b', null, sel.size + ' selected'), h('button', { class: 'btn sm danger', onclick: O.guard(async () => { if (await O.confirm('Remove ' + sel.size + ' photos from the gallery?', 'Remove', true)) { await O.api('POST', '/api/admin/gallery-delete', { ids: [...sel] }); items = items.filter(g => !sel.has(g.id)); sel.clear(); draw(); } }) }, 'Remove selected'), h('button', { class: 'btn sm', onclick: () => { sel.clear(); draw(); } }, 'Clear')); }
  draw();
} };
})();
