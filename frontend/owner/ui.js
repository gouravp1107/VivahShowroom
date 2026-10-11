/* Owner panel: helpers, form-field engine, media / product pickers */
(() => {
const O = window.OWN = { cache: {}, dirty: false };
const ICONS = window.VIVAH_ICONS || {};

/* ---------- dom helper ---------- */
const h = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    const v = attrs[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected' || k === 'indeterminate') e[k] = v;
    else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
};
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const src = p => !p ? '' : /^(https?:|\/|data:)/.test(p) ? p : '/' + p;
const money = n => '\u20B9' + Number(n || 0).toLocaleString('en-IN');
const fdate = s => s ? new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
Object.assign(O, { h, $, $$, esc, clone, src, money, fdate });

/* ---------- api ---------- */
O.api = async (method, path, body, raw) => {
  const opt = { method, headers: { 'X-Requested-With': 'vivah' }, credentials: 'same-origin' };
  if (raw) opt.body = raw; else if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt); let j = {}; const ct = r.headers.get('content-type') || '';
  if (ct.includes('json')) { try { j = await r.json(); } catch (e) {} }
  if (r.status === 401 && path !== '/api/admin/login' && path !== '/api/admin/me') { O.onLoggedOut && O.onLoggedOut(); throw new Error('Please log in again.'); }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong'), { status: r.status, data: j });
  return j;
};
O.toast = (msg, type) => { const t = h('div', { class: 'toast ' + (type || '') }, msg); document.body.append(t); requestAnimationFrame(() => t.classList.add('in')); setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, type === 'err' ? 5000 : 2200); };
O.guard = fn => async (...a) => { try { return await fn(...a); } catch (e) { O.toast(e.message, 'err'); } };

/* ---------- modal ---------- */
O.modal = (title, build, opt) => {
  opt = opt || {};
  const body = h('div', { class: 'm-body' }), foot = h('div', { class: 'm-foot' });
  const box = h('div', { class: 'm-box' + (opt.wide ? ' wide' : '') }, h('div', { class: 'm-head' }, h('h3', null, title), h('button', { class: 'm-x', onclick: () => close() }, '\u00D7')), body, opt.noFoot ? null : foot);
  const wrap = h('div', { class: 'm-wrap' }, box); document.body.append(wrap);
  const close = r => { wrap.remove(); document.removeEventListener('keydown', ek); if (opt.onClose) opt.onClose(r); };
  const ek = e => { if (e.key === 'Escape' && wrap === [...document.querySelectorAll('.m-wrap')].pop()) close(); }; document.addEventListener('keydown', ek);
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  const api = { close, body, foot, wrap, button(label, cls, fn) { const b = h('button', { class: 'btn ' + (cls || ''), onclick: async () => { b.disabled = true; try { await fn(api); } catch (e) { O.toast(e.message, 'err'); } b.disabled = false; } }, label); foot.append(b); return b; } };
  build(api); return api;
};
O.confirm = (msg, okLabel, danger) => new Promise(res => { let done = false; const m = O.modal('Please confirm', a => { a.body.append(h('p', { class: 'confirm-text' }, msg)); a.button('Cancel', '', () => { done = true; a.close(); res(false); }); a.button(okLabel || 'OK', danger ? 'danger' : 'primary', () => { done = true; a.close(); res(true); }); }, { onClose: () => { if (!done) res(false); } }); });
O.prompt = (title, label, value) => new Promise(res => { let done = false; O.modal(title, a => { const i = h('input', { class: 'inp', value: value || '', placeholder: label }); a.body.append(h('label', { class: 'fld' }, h('span', null, label), i)); setTimeout(() => i.focus(), 50); i.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); }); a.button('Cancel', '', () => { done = true; a.close(); res(null); }); const ok = a.button('OK', 'primary', () => { done = true; a.close(); res(i.value.trim()); }); }, { onClose: () => { if (!done) res(null); } }); });

/* ---------- data caches ---------- */
O.products = async (force) => { if (!O.cache.products || force) O.cache.products = (await O.api('GET', '/api/admin/products')).items; return O.cache.products; };
O.categories = async (force) => { if (!O.cache.categories || force) { const r = await O.api('GET', '/api/admin/categories'); O.cache.categories = r.items; O.cache.catCounts = r.counts; } return O.cache.categories; };
O.pages = async (force) => { if (!O.cache.pages || force) O.cache.pages = (await O.api('GET', '/api/admin/pages')).items; return O.cache.pages; };
O.refreshUrlList = async () => {
  const [cats, pages] = await Promise.all([O.categories(true), O.pages(true)]);
  const urls = ['/', ...cats.map(c => '/collection/' + c.slug), ...pages.filter(p => !p.system).map(p => '/p/' + p.slug)];
  $('#url-list').replaceChildren(...urls.map(u => h('option', { value: u })));
};

/* ---------- media library & picker ---------- */
O.pickImage = (multi) => new Promise(res => {
  let chosen = [], done = false, files = [], folder = '__all', q = '';
  const m = O.modal(multi ? 'Choose images' : 'Choose an image', a => {
    const grid = h('div', { class: 'pick-grid' }), sel = h('select', { class: 'inp sm', onchange: e => { folder = e.target.value; draw(); } }), search = h('input', { class: 'inp sm', placeholder: 'Search file name\u2026', oninput: e => { q = e.target.value.toLowerCase(); draw(); } });
    const up = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async e => { await upload([...e.target.files], folder === '__all' || folder === '/' ? 'uploads' : folder); e.target.value = ''; } });
    const count = h('span', { class: 'muted' });
    a.body.append(h('div', { class: 'pick-bar' }, sel, search, h('button', { class: 'btn', onclick: () => up.click() }, '\u2191 Upload'), up, count), grid);
    async function upload(list, fold) { if (!list.length) return; O.toast('Uploading\u2026'); const fd = new FormData(); fd.append('folder', fold); list.forEach(f => fd.append('files', f)); const r = await O.api('POST', '/api/admin/media', undefined, fd); if (r.skipped.length) O.toast('Skipped (not a valid image): ' + r.skipped.join(', '), 'err'); await load(); if (r.saved.length) { if (multi) chosen.push(...r.saved); else chosen = [r.saved[0]]; draw(); if (!multi && r.saved.length) finish(); } }
    async function load() { const r = await O.api('GET', '/api/admin/media'); files = r.files; sel.replaceChildren(h('option', { value: '__all' }, 'All folders'), ...r.folders.map(f => h('option', { value: f }, f === '/' ? '(root)' : f))); sel.value = folder; draw(); }
    function draw() {
      const list = files.filter(f => (folder === '__all' || f.folder === folder) && (!q || f.path.toLowerCase().includes(q)));
      count.textContent = list.length + ' images' + (multi ? ' \u00B7 ' + chosen.length + ' selected' : '');
      grid.replaceChildren(...list.slice(0, 300).map(f => h('button', { class: 'pick-item' + (chosen.includes(f.path) ? ' on' : ''), title: f.path, onclick: () => { if (multi) { const i = chosen.indexOf(f.path); i >= 0 ? chosen.splice(i, 1) : chosen.push(f.path); draw(); } else { chosen = [f.path]; finish(); } } }, h('img', { src: '/' + f.path, loading: 'lazy' }), h('span', null, f.name))));
      if (list.length > 300) grid.append(h('p', { class: 'muted' }, 'Showing the first 300. Use search or a folder to narrow down.'));
    }
    function finish() { done = true; a.close(); res(chosen); }
    if (multi) a.button('Use selected', 'primary', () => finish()); a.button('Cancel', '', () => { done = true; a.close(); res(null); });
    load().catch(e => O.toast(e.message, 'err'));
  }, { wide: true, onClose: () => { if (!done) res(null); } });
});
O.pickProducts = (selected) => new Promise(async res => {
  const chosen = [...(selected || [])], all = await O.products(); let done = false;
  O.modal('Choose products', a => {
    let cat = '', q = ''; const cats = O.cache.categories || [];
    const grid = h('div', { class: 'pick-grid' }), count = h('span', { class: 'muted' });
    const sel = h('select', { class: 'inp sm', onchange: e => { cat = e.target.value; draw(); } }, h('option', { value: '' }, 'All collections'), ...cats.map(c => h('option', { value: c.slug }, c.label)));
    a.body.append(h('div', { class: 'pick-bar' }, sel, h('input', { class: 'inp sm', placeholder: 'Search name or code\u2026', oninput: e => { q = e.target.value.toLowerCase(); draw(); } }), count), grid);
    function draw() { const list = all.filter(p => (!cat || p.category === cat) && (!q || (p.name + ' ' + p.code).toLowerCase().includes(q))); count.textContent = list.length + ' products \u00B7 ' + chosen.length + ' selected'; grid.replaceChildren(...list.slice(0, 200).map(p => h('button', { class: 'pick-item' + (chosen.includes(p.id) ? ' on' : ''), onclick: () => { const i = chosen.indexOf(p.id); i >= 0 ? chosen.splice(i, 1) : chosen.push(p.id); draw(); } }, h('img', { src: src(p.image), loading: 'lazy' }), h('span', null, p.name + ' \u00B7 ' + p.code)))); }
    draw(); a.button('Use selected', 'primary', () => { done = true; a.close(); res(chosen); }); a.button('Cancel', '', () => { done = true; a.close(); res(null); });
  }, { wide: true, onClose: () => { if (!done) res(null); } });
});

/* ---------- rich text editor ---------- */
function richEditor(val, set) {
  const ed = h('div', { class: 'rte', contenteditable: 'true', html: val || '' }), ta = h('textarea', { class: 'inp code', rows: 8, hidden: true });
  let src_ = false;
  const cmd = (c, v) => { ed.focus(); document.execCommand(c, false, v); set(ed.innerHTML); };
  const tb = h('div', { class: 'rte-bar' },
    ...[['B', 'bold'], ['I', 'italic'], ['U', 'underline']].map(([l, c]) => h('button', { type: 'button', title: c, onclick: () => cmd(c) }, l)),
    h('button', { type: 'button', onclick: () => cmd('formatBlock', 'h2') }, 'H2'), h('button', { type: 'button', onclick: () => cmd('formatBlock', 'h3') }, 'H3'), h('button', { type: 'button', onclick: () => cmd('formatBlock', 'p') }, '\u00B6'),
    h('button', { type: 'button', onclick: () => cmd('insertUnorderedList') }, '\u2022 List'), h('button', { type: 'button', onclick: () => cmd('insertOrderedList') }, '1. List'),
    h('button', { type: 'button', onclick: () => { const u = prompt('Link address (e.g. /p/faq or https://...)'); if (u) cmd('createLink', u); } }, 'Link'), h('button', { type: 'button', onclick: () => cmd('unlink') }, 'Unlink'),
    h('button', { type: 'button', onclick: async () => { const r = await O.pickImage(false); if (r && r[0]) cmd('insertImage', '/' + r[0]); } }, 'Image'), h('button', { type: 'button', onclick: () => cmd('removeFormat') }, 'Clear'),
    h('button', { type: 'button', class: 'right', onclick: () => { src_ = !src_; if (src_) { ta.value = ed.innerHTML; } else { ed.innerHTML = ta.value; set(ta.value); } ta.hidden = !src_; ed.hidden = src_; } }, '</> HTML'));
  ed.addEventListener('input', () => set(ed.innerHTML)); ta.addEventListener('input', () => set(ta.value));
  ed.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  return h('div', { class: 'rte-wrap' }, tb, ed, ta);
}

/* ---------- form-field engine ---------- */
function fieldWrap(def, control, extra) { return h('div', { class: 'fld' + (extra ? ' ' + extra : '') }, def.label ? h('span', { class: 'fld-l' }, def.label) : null, control, def.hint ? h('small', { class: 'hint' }, def.hint) : null); }
function imageField(def, val, set) {
  const prev = h('div', { class: 'img-prev' }), inp = h('input', { class: 'inp sm', value: val || '', placeholder: 'images/folder/file.jpg or https://\u2026' });
  const draw = () => { prev.replaceChildren(val ? h('img', { src: src(val) }) : h('span', { class: 'muted' }, 'No image')); };
  const upd = v => { val = v; inp.value = v; set(v); draw(); };
  inp.addEventListener('change', () => upd(inp.value.trim()));
  draw();
  return fieldWrap(def, h('div', { class: 'img-field' }, prev, h('div', { class: 'img-ctl' }, inp, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn sm', onclick: async () => { const r = await O.pickImage(false); if (r && r[0]) upd(r[0]); } }, 'Choose / upload'), h('button', { type: 'button', class: 'btn sm', onclick: () => upd('') }, 'Remove')))));
}
function listField(def, val, set, ctx) {
  const arr = val = Array.isArray(val) ? val : [], box = h('div', { class: 'lst' });
  const label = (it, i) => (def.itemLabel && def.itemLabel(it)) || ('Item ' + (i + 1));
  function draw() {
    box.replaceChildren(...arr.map((it, i) => {
      const body = h('div', { class: 'lst-body', hidden: true }), head = h('div', { class: 'lst-head' },
        h('button', { type: 'button', class: 'lst-t', onclick: () => { body.hidden = !body.hidden; if (!body.hidden && !body.childElementCount) body.append(...fields(def.item, it, () => { set(arr); title.textContent = label(it, i); }, ctx)); } }, h('span', { class: 'caret' }, '\u25B8'), (() => { const t = h('span', { class: 'lst-title' }, label(it, i)); return t; })()),
        h('div', { class: 'lst-ctl' }, h('button', { type: 'button', title: 'Move up', disabled: i === 0, onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); set(arr); draw(); } }, '\u2191'), h('button', { type: 'button', title: 'Move down', disabled: i === arr.length - 1, onclick: () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); set(arr); draw(); } }, '\u2193'), h('button', { type: 'button', title: 'Duplicate', onclick: () => { arr.splice(i + 1, 0, clone(it)); set(arr); draw(); } }, '\u29C9'), h('button', { type: 'button', title: 'Delete', class: 'del', onclick: () => { arr.splice(i, 1); set(arr); draw(); } }, '\u00D7')));
      const title = head.querySelector('.lst-title');
      return h('div', { class: 'lst-item' }, head, body);
    }), h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn sm', onclick: () => { arr.push(clone(def.newItem || {})); set(arr); draw(); const last = box.querySelectorAll('.lst-item'); last[last.length - 1].querySelector('.lst-t').click(); } }, '+ ' + (def.addLabel || 'Add')), def.multiImage ? h('button', { type: 'button', class: 'btn sm', onclick: async () => { const r = await O.pickImage(true); if (r && r.length) { r.forEach(p => arr.push({ image: p, alt: '' })); set(arr); draw(); } } }, '+ Add several images') : null));
  }
  draw(); return fieldWrap(def, box);
}
function stringsField(def, val, set) {
  const arr = val = Array.isArray(val) ? val : [], box = h('div', { class: 'strs' });
  function draw() { box.replaceChildren(...arr.map((s, i) => h('div', { class: 'row' }, h('input', { class: 'inp sm', value: s, oninput: e => { arr[i] = e.target.value; set(arr); } }), h('button', { type: 'button', class: 'btn sm', disabled: i === 0, onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); set(arr); draw(); } }, '\u2191'), h('button', { type: 'button', class: 'btn sm', onclick: () => { arr.splice(i, 1); set(arr); draw(); } }, '\u00D7'))), h('button', { type: 'button', class: 'btn sm', onclick: () => { arr.push(''); set(arr); draw(); box.querySelectorAll('input')[arr.length - 1].focus(); } }, '+ Add')); }
  draw(); return fieldWrap(def, box);
}
function productIdsField(def, val, set) {
  let arr = Array.isArray(val) ? val : [], box = h('div', { class: 'chips' });
  async function draw() {
    const all = await O.products(); const by = Object.fromEntries(all.map(p => [p.id, p]));
    box.replaceChildren(...arr.map((id, i) => { const p = by[id]; return h('div', { class: 'chip' }, p ? h('img', { src: src(p.image) }) : null, h('span', null, p ? p.name + ' \u00B7 ' + p.code : id + ' (missing)'), h('button', { type: 'button', onclick: () => { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); set(arr); draw(); } } }, '\u2191'), h('button', { type: 'button', onclick: () => { arr.splice(i, 1); set(arr); draw(); } }, '\u00D7')); }),
      h('button', { type: 'button', class: 'btn sm', onclick: async () => { const r = await O.pickProducts(arr); if (r) { arr.length = 0; arr.push(...r); set(arr); draw(); } } }, arr.length ? 'Change products' : '+ Choose products'));
  }
  draw(); return fieldWrap(def, box);
}
function fields(defs, data, onChange, ctx) {
  return defs.map(def => {
    const set = v => { data[def.k] = v; onChange(def.k, v); };
    const v = data[def.k];
    switch (def.type) {
      case 'text': case 'url': return fieldWrap(def, h('input', { class: 'inp', value: v == null ? '' : v, placeholder: def.placeholder || '', list: def.type === 'url' ? 'url-list' : null, oninput: e => set(e.target.value) }));
      case 'number': return fieldWrap(def, h('input', { class: 'inp', type: 'number', value: v == null ? '' : v, min: def.min, max: def.max, step: def.step || 'any', oninput: e => set(e.target.value === '' ? '' : Number(e.target.value)) }));
      case 'area': return fieldWrap(def, h('textarea', { class: 'inp', rows: def.rows || 3, value: v || '', oninput: e => set(e.target.value) }));
      case 'code': return fieldWrap(def, h('textarea', { class: 'inp code', rows: def.rows || 8, spellcheck: 'false', value: v || '', oninput: e => set(e.target.value) }));
      case 'html': return fieldWrap(def, richEditor(v, set));
      case 'bool': return h('label', { class: 'fld chk' }, h('input', { type: 'checkbox', checked: !!v, onchange: e => set(e.target.checked) }), h('span', null, def.label), def.hint ? h('small', { class: 'hint' }, def.hint) : null);
      case 'select': return fieldWrap(def, h('select', { class: 'inp', onchange: e => set(e.target.value) }, ...def.options.map(([val, lab]) => h('option', { value: val, selected: String(v) === String(val) }, lab))));
      case 'color': { const txt = h('input', { class: 'inp sm', value: v || '', oninput: e => { set(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) pick.value = e.target.value; } }); const pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000', oninput: e => { set(e.target.value); txt.value = e.target.value; } }); return fieldWrap(def, h('div', { class: 'row' }, pick, txt)); }
      case 'image': return imageField(def, v, set);
      case 'icon': { const sel = h('select', { class: 'inp', onchange: e => { set(e.target.value); pv.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[e.target.value] + '</svg>'; } }, ...Object.keys(ICONS).map(k => h('option', { value: k, selected: k === v }, k))); const pv = h('span', { class: 'icon-prev', html: '<svg viewBox="0 0 24 24">' + (ICONS[v] || '') + '</svg>' }); return fieldWrap(def, h('div', { class: 'row' }, pv, sel)); }
      case 'button': { const o = data[def.k] = data[def.k] || { label: '', url: '' }; const ch = () => set(o); return fieldWrap(def, h('div', { class: 'row btn-row' }, h('input', { class: 'inp sm', placeholder: 'Label', value: o.label || '', oninput: e => { o.label = e.target.value; ch(); } }), h('input', { class: 'inp sm', placeholder: 'Link', list: 'url-list', value: o.url || '', oninput: e => { o.url = e.target.value; ch(); } }), def.style ? h('select', { class: 'inp sm', onchange: e => { o.style = e.target.value; ch(); } }, ...[['gold', 'Gold'], ['outline', 'Outline'], ['ghost', 'Ghost']].map(([a, b]) => h('option', { value: a, selected: (o.style || 'gold') === a }, b))) : null)); }
      case 'list': return listField(def, v, set, ctx);
      case 'strings': return stringsField(def, v, set);
      case 'productids': return productIdsField(def, v, set);
      case 'category': return fieldWrap(def, h('select', { class: 'inp', onchange: e => set(e.target.value) }, h('option', { value: '' }, '\u2014 none \u2014'), ...(O.cache.categories || []).map(c => h('option', { value: c.slug, selected: c.slug === v }, c.label))));
      default: return h('div', null, 'Unknown field ' + def.type);
    }
  });
}
O.fields = fields;
O.formCard = (title, defs, data, onChange, ctx) => h('section', { class: 'card' }, title ? h('h3', { class: 'card-t' }, title) : null, h('div', { class: 'grid2' }, ...fields(defs, data, onChange || (() => O.markDirty()), ctx)));
O.markDirty = () => { O.dirty = true; const b = $('#save-btn'); if (b) b.classList.add('dirty'); };
O.markClean = () => { O.dirty = false; const b = $('#save-btn'); if (b) b.classList.remove('dirty'); };
addEventListener('beforeunload', e => { if (O.dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- section builder (pages, templates and page layouts) ---------- */
const DEFS = () => window.VIVAH_BLOCK_DEFS, defOf = t => DEFS().find(d => d.type === t);
const rid = () => Math.random().toString(16).slice(2, 10);
O.newSection = type => { const d = defOf(type); return { id: rid(), type, visible: true, data: clone(d.defaults) }; };
O.sectionBuilder = (sections, onChange, opts) => {
  opts = opts || {};
  const box = h('div', { class: 'sb' });
  const changed = () => { O.markDirty(); onChange && onChange(sections); };
  function draw() {
    box.replaceChildren();
    if (!sections.length) box.append(h('div', { class: 'empty' }, 'No sections yet. Add your first section below.'));
    sections.forEach((s, i) => {
      const d = defOf(s.type) || { label: s.type, icon: '?', fields: [] };
      const body = h('div', { class: 'sb-body', hidden: !s._open });
      const fill = () => { if (!body.childElementCount) body.append(h('div', { class: 'grid2' }, ...fields(d.fields, s.data, (k) => { changed(); const pv = card.querySelector('.sb-sum'); if (pv) pv.textContent = summary(s); }, {}))); };
      const toggle = () => { s._open = body.hidden; body.hidden = !body.hidden; if (!body.hidden) fill(); card.classList.toggle('open', !body.hidden); };
      const card = h('div', { class: 'sb-card' + (s.visible === false ? ' off' : '') + (s._open ? ' open' : '') },
        h('div', { class: 'sb-head' }, h('button', { type: 'button', class: 'sb-t', onclick: toggle }, h('span', { class: 'sb-ic' }, d.icon), h('span', null, h('b', null, d.label), h('small', { class: 'sb-sum' }, summary(s)))),
          h('div', { class: 'lst-ctl' }, h('button', { type: 'button', title: s.visible === false ? 'Hidden \u2013 click to show' : 'Visible \u2013 click to hide', onclick: () => { s.visible = s.visible === false; changed(); draw(); } }, s.visible === false ? '\u25CC' : '\u25C9'),
            h('button', { type: 'button', title: 'Move up', disabled: i === 0, onclick: () => { sections.splice(i - 1, 0, sections.splice(i, 1)[0]); changed(); draw(); } }, '\u2191'),
            h('button', { type: 'button', title: 'Move down', disabled: i === sections.length - 1, onclick: () => { sections.splice(i + 1, 0, sections.splice(i, 1)[0]); changed(); draw(); } }, '\u2193'),
            h('button', { type: 'button', title: 'Duplicate', onclick: () => { const c = clone(s); c.id = rid(); delete c._open; sections.splice(i + 1, 0, c); changed(); draw(); } }, '\u29C9'),
            h('button', { type: 'button', title: 'Delete', class: 'del', onclick: async () => { if (await O.confirm('Delete this ' + d.label.toLowerCase() + ' section?', 'Delete', true)) { sections.splice(i, 1); changed(); draw(); } } }, '\u00D7'))), body);
      if (s._open) fill(); box.append(card);
    });
    box.append(h('div', { class: 'row sb-add' }, h('button', { type: 'button', class: 'btn primary', onclick: addSection }, '+ Add section'), opts.templates === false ? null : h('button', { type: 'button', class: 'btn', onclick: applyTemplate }, 'Insert from template\u2026')));
  }
  function summary(s) { const d = s.data || {}; return String(d.heading || d.title || d.eyebrow || (d.items && d.items.length + ' items') || (d.images && d.images.length + ' photos') || (d.html && d.html.replace(/<[^>]+>/g, ' ').trim().slice(0, 60)) || '').replace(/\n/g, ' ').slice(0, 70); }
  function addSection() {
    O.modal('Add a section', a => { a.body.append(h('div', { class: 'type-grid' }, ...DEFS().map(d => h('button', { class: 'type-card', onclick: () => { const s = O.newSection(d.type); s._open = true; sections.push(s); changed(); draw(); a.close(); setTimeout(() => box.lastElementChild.previousElementSibling.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); } }, h('span', { class: 'type-ic' }, d.icon), h('b', null, d.label), h('small', null, d.desc))))); }, { wide: true, noFoot: true });
  }
  async function applyTemplate() {
    const tpls = (await O.api('GET', '/api/admin/templates')).items;
    O.modal('Insert sections from a template', a => { a.body.append(tpls.length ? h('div', { class: 'type-grid' }, ...tpls.map(t => h('button', { class: 'type-card', onclick: () => { t.sections.forEach(s => { const c = clone(s); c.id = rid(); sections.push(c); }); changed(); draw(); a.close(); } }, h('b', null, t.name), h('small', null, (t.description || '') + ' (' + t.sections.length + ' sections)')))) : h('p', null, 'No templates saved yet.')); }, { wide: true, noFoot: true });
  }
  draw(); return box;
};
O.cleanSections = s => (s || []).map(x => { const c = { id: x.id, type: x.type, visible: x.visible !== false, data: x.data }; return c; });
})();
