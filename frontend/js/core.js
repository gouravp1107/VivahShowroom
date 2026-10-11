/* Vivah storefront core: data access, header/footer, login / payment / search / wishlist windows */
(() => {
const BOOT = window.__BOOT__ || {}, SITE = BOOT.site || {};
const UI = SITE.ui || {}, PAY = SITE.payments || {}, BRAND = SITE.brand || {};
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = s => esc(s).replace(/\r?\n/g, '<br>');
const t = (k, vars) => { let s = UI[k] != null ? UI[k] : k; if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]); return s; };
const sym = PAY.currencySymbol || '\u20B9';
const rupee = n => sym + Number(n || 0).toLocaleString('en-IN');
const src = p => !p ? '' : /^(https?:|\/|data:)/.test(p) ? p : '/' + p;
const url = u => { u = String(u || '#'); return /^(https?:|mailto:|tel:|#|\/)/.test(u) ? u : '/' + u; };
const COLOR_HEX = { Red: '#b0102a', Maroon: '#6e1030', Pink: '#f08aa8', Ivory: '#e6d9bf', Gold: '#c9a14a', Green: '#2f9a5a', Blue: '#1f3a7a', Purple: '#6a3a8a', Black: '#222222', White: '#f5f5f5', Cream: '#efe4cc', Orange: '#e07a1f', Yellow: '#e8c52e', Silver: '#b8b8c0', Brown: '#7a4a2a', Teal: '#1a8a8a', Beige: '#d8c3a0', Peach: '#f2b79a', Multi: 'linear-gradient(135deg,#b0102a,#c9a14a,#1f3a7a)' };

async function api(method, path, body) {
  const opt = { method, headers: { 'X-Requested-With': 'vivah' }, credentials: 'same-origin' };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt); let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw Object.assign(new Error(j.error || t('auth.errGeneric')), { status: r.status, data: j });
  return j;
}
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

/* ---------- state ---------- */
const state = { customer: null, wish: store.get('vivah-wishlist', []) };
const pageFlags = (BOOT.page || {});

/* ---------- header ---------- */
const MARK = '<svg class="logo-mark" viewBox="0 0 48 28" aria-hidden="true"><defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#8a5a1f"/><stop offset=".5" stop-color="#f3dca4"/><stop offset="1" stop-color="#a8793a"/></linearGradient></defs><g fill="none" stroke="url(#gl)" stroke-width="1.4"><path d="M24 2c4 5 4 12 0 20-4-8-4-15 0-20z"/><path d="M24 22C18 19 13 14 12 7c6 1 10 6 12 15z"/><path d="M24 22c6-3 11-8 12-15-6 1-10 6-12 15z"/><path d="M24 22C15 22 8 18 4 12c7-1 14 2 20 10z"/><path d="M24 22c9 0 16-4 20-10-7-1-14 2-20 10z"/></g><circle cx="24" cy="25.5" r="1.4" fill="url(#gl)"/></svg>';
const logoHtml = (small) => BRAND.logoImage
  ? `<img class="logo-img${small ? ' sm' : ''}" src="${esc(src(BRAND.logoImage))}" alt="${esc(BRAND.name)}">`
  : `${!small && BRAND.showMark !== false ? MARK : ''}<span class="logo-name">${esc(BRAND.name)}</span><small>${esc(BRAND.sub)}</small>`;
const ico = {
  moon: '<svg class="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg><svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>'
};
function renderHeader() {
  const H = SITE.header || {}, show = H.show || {}, cur = location.pathname.replace(/\/$/, '') || '/';
  const li = l => {
    const kids = (l.children || []).filter(c => c.label);
    const on = cur === url(l.url).replace(/\/$/, '');
    return `<li${kids.length ? ' class="has-sub"' : ''}><a href="${esc(url(l.url))}"${on ? ' class="on" aria-current="page"' : ''}>${esc(l.label)}</a>${kids.length ? `<ul class="sub">${kids.map(c => `<li><a href="${esc(url(c.url))}">${esc(c.label)}</a></li>`).join('')}</ul>` : ''}</li>`;
  };
  const a = H.announcement;
  if (a && a.enabled && a.text) { const el = $('#site-announce'); el.className = 'announce'; el.style.cssText = `background:${esc(a.bg)};color:${esc(a.color)}`; el.innerHTML = a.link ? `<a href="${esc(url(a.link))}">${esc(a.text)}</a>` : esc(a.text); }
  const btn = (id, label, svg, cls) => `<button id="${id}" aria-label="${esc(label)}"${cls ? ` class="${cls}"` : ''}>${svg}</button>`;
  $('#site-header').innerHTML = `<header class="header${H.sticky === false ? ' not-sticky' : ''}">
    <a href="/" class="logo" aria-label="${esc(BRAND.name)}">${logoHtml(false)}</a>
    <nav class="nav" id="nav"><ul>${(H.links || []).map(li).join('')}</ul></nav>
    <div class="icons">${show.theme !== false && (SITE.theme || {}).showThemeToggle !== false ? btn('theme-toggle', 'Toggle dark mode', ico.moon) : ''}${show.search !== false ? btn('btn-search', t('search.title'), ico.search) : ''}${show.wishlist !== false ? btn('btn-wish', t('wish.title'), ico.heart) : ''}${show.account !== false ? btn('btn-account', t('auth.accountTitle'), ico.user) : ''}${show.cart !== false ? `<button id="btn-bookings" aria-label="${esc(t('bk.title'))}" class="cart">${ico.bag}<span id="cart-count">0</span></button>` : ''}</div>
    <button class="menu-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>
  </header>`;
  const toggle = $('.menu-toggle'), nav = $('#nav');
  toggle.addEventListener('click', () => { const o = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); });
  const tt = $('#theme-toggle');
  if (tt) tt.addEventListener('click', () => { const dark = document.documentElement.dataset.theme === 'dark'; if (dark) delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = 'dark'; try { localStorage.setItem('vivah-theme', dark ? 'light' : 'dark'); } catch (e) {} });
  const on = (id, fn) => { const e = $(id); if (e) e.addEventListener('click', fn); };
  on('#btn-search', openSearch); on('#btn-wish', openWishlist); on('#btn-account', openAccount); on('#btn-bookings', openBookings);
  $$('.nav li.has-sub > a').forEach(a => a.addEventListener('click', e => { if (matchMedia('(max-width:1200px)').matches && a.parentNode.classList.contains('has-sub') && !a.parentNode.classList.contains('open')) { e.preventDefault(); a.parentNode.classList.add('open'); } }));
}

/* ---------- footer ---------- */
function renderFooter() {
  const F = SITE.footer || {}, S = F.subscribe || {};
  const year = new Date().getFullYear();
  $('#site-footer').innerHTML = `<footer class="footer">
    <a href="/" class="logo logo-sm">${logoHtml(true)}</a>
    <nav class="footer-nav">${(F.links || []).map(l => `<a href="${esc(url(l.url))}">${esc(l.label)}</a>`).join('')}</nav>
    ${S.enabled !== false ? `<form class="subscribe" id="subscribe" novalidate><label for="email">${esc(S.label)}</label><div><input id="email" type="email" placeholder="${esc(S.placeholder)}" required><button aria-label="Subscribe">&rarr;</button></div><p id="sub-msg" role="status"></p></form>` : ''}
    <div class="social">${(F.social || []).map(s => `<a href="${esc(url(s.url))}" aria-label="${esc(s.label)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div>
    <div class="footer-base"><span>${esc(F.copyright || ('\u00A9 ' + year + ' ' + BRAND.name + ' ' + BRAND.sub))}</span><a class="owner-link" href="${esc(url(F.ownerUrl || '/owner/'))}">${esc(F.ownerLabel || 'Owner Login')}</a></div>
  </footer>`;
  const f = $('#subscribe');
  if (f) f.addEventListener('submit', async e => {
    e.preventDefault(); const msg = $('#sub-msg'), v = $('#email').value.trim();
    try { await api('POST', '/api/subscribe', { email: v }); msg.textContent = S.success; msg.className = 'ok'; f.reset(); } catch (er) { msg.textContent = S.error; msg.className = 'err'; }
  });
}

/* ---------- modal + drawer ---------- */
function modal(html, opt) {
  opt = opt || {};
  const wrap = document.createElement('div'); wrap.className = 'vmodal' + (opt.drawer ? ' drawer' : '');
  wrap.innerHTML = `<div class="vmodal-box" role="dialog" aria-modal="true"><button class="vmodal-x" aria-label="${esc(t('misc.closeLabel'))}">&times;</button><div class="vmodal-body">${html}</div></div>`;
  document.body.appendChild(wrap); document.body.classList.add('modal-open');
  requestAnimationFrame(() => wrap.classList.add('in'));
  const close = () => { wrap.classList.remove('in'); document.body.classList.remove('modal-open'); setTimeout(() => wrap.remove(), 200); document.removeEventListener('keydown', esck); if (opt.onClose) opt.onClose(); };
  const esck = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esck);
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  $('.vmodal-x', wrap).addEventListener('click', close);
  const body = $('.vmodal-body', wrap);
  return { el: body, wrap, close, set(h) { body.innerHTML = h; } };
}

/* ---------- auth ---------- */
async function loadMe() { try { state.customer = (await api('GET', '/api/auth/me')).customer; } catch (e) { state.customer = null; } if (state.customer) mergeWish(state.customer.wishlist || []); refreshHearts(); }
function mergeWish(serverIds) { const merged = [...new Set([...serverIds, ...state.wish])]; if (merged.length !== state.wish.length) { state.wish = merged; store.set('vivah-wishlist', merged); } if (merged.length !== serverIds.length) api('PUT', '/api/me/wishlist', { ids: merged }).catch(() => {}); }
function openAccount() {
  if (state.customer) {
    const m = modal(`<h2 class="vm-title">${esc(t('auth.accountTitle'))}</h2><p class="vm-sub">${esc(t('auth.hello', { name: state.customer.name }))}</p><p class="vm-sub">${esc(state.customer.phone)}${state.customer.email ? ' &middot; ' + esc(state.customer.email) : ''}</p><div class="vm-actions"><button class="btn btn-gold" data-a="bk">${esc(t('auth.myBookings'))}</button><button class="btn btn-outline" data-a="out">${esc(t('auth.logout'))}</button></div>`);
    m.el.addEventListener('click', async e => { const a = e.target.dataset.a; if (a === 'bk') { m.close(); openBookings(); } if (a === 'out') { await api('POST', '/api/auth/logout', {}); state.customer = null; m.close(); updateBadge(); } });
    return m;
  }
  return openAuth('login');
}
function openAuth(mode, then) {
  const m = modal('');
  const draw = (md, err) => {
    const reg = md === 'register';
    m.set(`<div class="vm-tabs"><button data-m="login" class="${reg ? '' : 'on'}">${esc(t('auth.tabLogin'))}</button><button data-m="register" class="${reg ? 'on' : ''}">${esc(t('auth.tabRegister'))}</button></div>
      <h2 class="vm-title">${esc(t(reg ? 'auth.titleRegister' : 'auth.titleLogin'))}</h2><p class="vm-sub">${esc(t(reg ? 'auth.subRegister' : 'auth.subLogin'))}</p>
      <form class="vm-form" novalidate>
        ${reg ? `<label>${esc(t('auth.name'))}<input name="name" autocomplete="name" required></label><label>${esc(t('auth.phone'))}<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" required></label><label>${esc(t('auth.email'))}<input name="email" type="email" autocomplete="email"></label>`
          : `<label>${esc(t('auth.loginId'))}<input name="id" autocomplete="username" required></label>`}
        <label>${esc(t('auth.password'))}<input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required></label>
        <p class="vm-err" role="alert">${esc(err || '')}</p>
        <button class="btn btn-gold" type="submit">${esc(t(reg ? 'auth.registerBtn' : 'auth.loginBtn'))}</button>
        <button class="vm-link" type="button" data-m="${reg ? 'login' : 'register'}">${esc(t(reg ? 'auth.haveAccount' : 'auth.noAccount'))}</button>
      </form>`);
    $$('[data-m]', m.el).forEach(b => b.addEventListener('click', () => draw(b.dataset.m)));
    $('form', m.el).addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f)), btn = $('button[type=submit]', f); btn.disabled = true;
      try { const r = await api('POST', reg ? '/api/auth/register' : '/api/auth/login', v); state.customer = r.customer; mergeWish(r.customer.wishlist || []); m.close(); updateBadge(); refreshHearts(); if (then) then(r.customer); }
      catch (er) { draw(md, er.message); }
    });
  };
  draw(mode || 'login'); return m;
}

/* ---------- wishlist ---------- */
const isWished = id => state.wish.includes(id);
function toggleWish(id) {
  const i = state.wish.indexOf(id); if (i >= 0) state.wish.splice(i, 1); else state.wish.push(id);
  store.set('vivah-wishlist', state.wish); if (state.customer) api('PUT', '/api/me/wishlist', { ids: state.wish }).catch(() => {});
  refreshHearts();
}
function refreshHearts() { $$('.wish[data-pid]').forEach(b => { const on = isWished(b.dataset.pid); b.setAttribute('aria-pressed', on); b.classList.toggle('active', on); }); }
async function openWishlist() {
  const m = modal(`<h2 class="vm-title">${esc(t('wish.title'))}</h2><div class="vm-list" id="wl"></div>`, { drawer: true });
  const draw = async () => {
    const box = $('#wl', m.el); if (!state.wish.length) { box.innerHTML = `<p class="vm-sub">${esc(t('wish.empty'))}</p>`; return; }
    let items = []; try { items = await api('GET', '/api/products?ids=' + encodeURIComponent(state.wish.join(','))); } catch (e) {}
    box.innerHTML = items.length ? items.map(p => `<div class="vm-item"><a href="/product/${esc(p.id)}"><img src="${esc(src(p.image))}" alt=""></a><div><a href="/product/${esc(p.id)}"><b>${esc(p.name)}</b></a><span>${esc(t('cat.rental'))} ${rupee(p.price)}${esc(t('cat.perDay'))}</span></div><button data-rm="${esc(p.id)}" aria-label="Remove">&times;</button></div>`).join('') : `<p class="vm-sub">${esc(t('wish.empty'))}</p>`;
  };
  m.el.addEventListener('click', e => { const id = e.target.dataset.rm; if (id) { toggleWish(id); draw(); } });
  draw();
}

/* ---------- search ---------- */
function openSearch() {
  const m = modal(`<h2 class="vm-title">${esc(t('search.title'))}</h2><input class="vm-search" type="search" placeholder="${esc(t('search.placeholder'))}" autofocus><div class="vm-list" id="sr"></div>`, { drawer: true });
  const inp = $('.vm-search', m.el), box = $('#sr', m.el); let tm, seq = 0;
  inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(async () => {
    const q = inp.value.trim(); if (q.length < 2) { box.innerHTML = ''; return; } const my = ++seq;
    let items = []; try { items = await api('GET', '/api/products?limit=24&q=' + encodeURIComponent(q)); } catch (e) {}
    if (my !== seq) return;
    box.innerHTML = items.length ? items.map(p => `<a class="vm-item" href="/product/${esc(p.id)}"><img src="${esc(src(p.image))}" alt=""><div><b>${esc(p.name)}</b><span>${esc(t('cat.code'))} ${esc(p.code)} &middot; ${rupee(p.price)}${esc(t('cat.perDay'))}</span></div></a>`).join('') : `<p class="vm-sub">${esc(t('search.empty'))}</p>`;
  }, 250); });
  setTimeout(() => inp.focus(), 60);
}

/* ---------- bookings + payment ---------- */
const myBookings = () => store.get('vivah-bookings', []);
function rememberBooking(b) { const l = myBookings().filter(x => x.id !== b.id); l.unshift({ id: b.id, token: b.token }); store.set('vivah-bookings', l.slice(0, 30)); updateBadge(); }
async function updateBadge() {
  const el = $('#cart-count'); if (!el) return;
  let n = 0;
  if (state.customer) { try { n = (await api('GET', '/api/bookings/mine')).bookings.filter(b => ['pending', 'confirmed'].includes(b.status) && b.dueNow > 0).length; } catch (e) {} }
  el.textContent = n; el.style.display = n ? '' : 'none';
}
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', 'picked-up': 'Picked up', returned: 'Returned', cancelled: 'Cancelled' };
const PAY_LABEL = { unpaid: 'Unpaid', verification: 'Verifying', partial: 'Part paid', paid: 'Paid', refunded: 'Refunded' };
async function openBookings() {
  const m = modal(`<h2 class="vm-title">${esc(t('bk.title'))}</h2><div class="vm-list" id="bkl"><p class="vm-sub">&hellip;</p></div>`, { drawer: true });
  const box = $('#bkl', m.el); let list = [];
  try {
    if (state.customer) list = (await api('GET', '/api/bookings/mine')).bookings.map(b => Object.assign(b, { token: (myBookings().find(x => x.id === b.id) || {}).token }));
    else { const out = []; for (const x of myBookings()) { try { out.push(Object.assign((await api('GET', `/api/bookings/${x.id}?token=${x.token}`)).booking, { token: x.token })); } catch (e) {} } list = out; }
  } catch (e) {}
  if (!list.length) { box.innerHTML = `<p class="vm-sub">${esc(t('bk.empty'))}</p>` + (state.customer ? '' : `<p class="vm-sub"><button class="vm-link" data-login>${esc(t('bk.login'))}</button></p>`); }
  else box.innerHTML = list.map(b => `<div class="vm-booking" data-id="${esc(b.id)}"><div class="vm-bk-head"><b>${esc(b.id)}</b><span class="vm-pill ${esc(b.status)}">${esc(STATUS_LABEL[b.status] || b.status)}</span></div>
    <p>${b.items.map(i => esc(i.name) + (i.size ? ' (' + esc(i.size) + ')' : '')).join(', ')}</p><p class="vm-muted">${esc(b.start)} \u2192 ${esc(b.end)} &middot; ${b.days} ${esc(b.days > 1 ? t('pd.days') : t('pd.day'))}</p>
    <p>${esc(t('pay.total'))}: <b>${rupee(b.total)}</b> &middot; <span class="vm-pill pay-${esc(b.payment.status)}">${esc(PAY_LABEL[b.payment.status] || b.payment.status)}</span></p>
    <div class="vm-actions">${b.dueNow > 0 && !['cancelled', 'returned'].includes(b.status) ? `<button class="btn btn-gold btn-sm" data-pay="${esc(b.id)}">${esc(t('bk.pay'))} ${rupee(b.dueNow)}</button>` : ''}${b.status === 'pending' ? `<button class="btn btn-outline btn-sm" data-cancel="${esc(b.id)}">${esc(t('bk.cancel'))}</button>` : ''}</div></div>`).join('');
  m.el.addEventListener('click', async e => {
    const d = e.target.dataset; const b = list.find(x => x.id === (d.pay || d.cancel));
    if (e.target.hasAttribute('data-login')) { m.close(); openAuth('login', openBookings); }
    if (d.pay && b) { m.close(); openPayment(b); }
    if (d.cancel && b && confirm(t('bk.cancel') + '?')) { try { await api('POST', `/api/bookings/${b.id}/cancel`, { token: b.token }); m.close(); openBookings(); updateBadge(); } catch (er) { alert(er.message); } }
  });
}
function loadScript(s) { return new Promise((res, rej) => { if ($(`script[src="${s}"]`)) return res(); const e = document.createElement('script'); e.src = s; e.onload = res; e.onerror = rej; document.head.appendChild(e); }); }
function openPayment(b) {
  const M = PAY.methods || {}, opts = [];
  if (M.razorpay && M.razorpay.enabled) opts.push(['razorpay', t('pay.razorpay')]);
  if (M.upi && M.upi.enabled) opts.push(['upi', t('pay.upi')]);
  if (M.cash && M.cash.enabled) opts.push(['cash', t('pay.cash')]);
  const due = b.dueNow != null ? b.dueNow : b.deposit, balance = Math.max(0, b.total - (b.payment ? b.payment.paid : 0) - due);
  const m = modal('');
  const sumHtml = `<div class="vm-sum"><div><span>${esc(t('pay.booking'))}</span><b>${esc(b.id)}</b></div>${(b.items || []).map(i => `<div class="vm-sum-item"><span>${esc(i.name)}${i.size ? ' (' + esc(i.size) + ')' : ''}</span><b>${rupee(i.price)} \u00D7 ${b.days}</b></div>`).join('')}<div><span>${esc(t('pay.total'))}</span><b>${rupee(b.total)}</b></div><div class="due"><span>${esc(t('pay.deposit'))}</span><b>${rupee(due)}</b></div><div><span>${esc(t('pay.balance'))}</span><b>${rupee(balance)}</b></div></div>`;
  const done = (key) => { m.set(`<div class="vm-done"><div class="vm-tick">&#10003;</div><h2 class="vm-title">${esc(t('pay.okTitle'))}</h2><p class="vm-sub">${esc(t(key))}</p>${sumHtml}<div class="vm-actions"><button class="btn btn-outline" data-close>${esc(t('pay.close'))}</button></div></div>`); $('[data-close]', m.el).addEventListener('click', m.close); updateBadge(); };
  if (!opts.length) { m.set(`<h2 class="vm-title">${esc(t('pay.title'))}</h2>${sumHtml}<p class="vm-sub">${esc(t('pay.none'))}</p><div class="vm-actions"><button class="btn btn-outline" data-close>${esc(t('pay.close'))}</button></div>`); $('[data-close]', m.el).addEventListener('click', m.close); return m; }
  let method = opts[0][0];
  const draw = (err) => {
    m.set(`<h2 class="vm-title">${esc(t('pay.title'))}</h2><p class="vm-sub">${esc(t('pay.sub'))}</p>${sumHtml}<h3 class="vm-h3">${esc(t('pay.choose'))}</h3>
      <div class="vm-methods">${opts.map(([k, l]) => `<label class="${k === method ? 'on' : ''}"><input type="radio" name="pm" value="${k}" ${k === method ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>
      <div id="pm-extra">${method === 'upi' ? `<p class="vm-sub">${esc(t('pay.upiHelp', { upi: M.upi.id, amount: rupee(due) }))}</p><a class="btn btn-outline btn-sm" href="upi://pay?pa=${encodeURIComponent(M.upi.id)}&pn=${encodeURIComponent(M.upi.name || BRAND.name)}&am=${due}&cu=INR&tn=${encodeURIComponent(b.id)}">${esc(t('pay.upiOpen'))}</a><input class="vm-input" id="utr" placeholder="${esc(t('pay.utr'))}" autocomplete="off">` : ''}</div>
      ${PAY.terms ? `<p class="vm-muted">${esc(PAY.terms)}</p>` : ''}<p class="vm-err" role="alert">${esc(err || '')}</p>
      <button class="btn btn-gold vm-pay" id="pm-go">${esc(method === 'razorpay' ? t('pay.payBtn') + ' ' + rupee(due) : t('pay.confirm'))}</button>`);
    $$('input[name=pm]', m.el).forEach(r => r.addEventListener('change', () => { method = r.value; draw(); }));
    $('#pm-go', m.el).addEventListener('click', go);
  };
  async function go() {
    const btn = $('#pm-go', m.el); btn.disabled = true;
    try {
      const body = { method, token: b.token };
      if (method === 'upi') body.ref = $('#utr', m.el).value;
      const r = await api('POST', `/api/bookings/${b.id}/pay`, body);
      if (r.result === 'cash') return done('pay.okCash');
      if (r.result === 'verify') return done('pay.okVerify');
      if (r.result === 'razorpay') {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        const rz = new window.Razorpay({ key: r.keyId, amount: r.order.amount, currency: r.order.currency, order_id: r.order.id, name: BRAND.name, description: b.id, prefill: r.prefill, theme: { color: '#a8793a' },
          handler: async resp => { try { await api('POST', `/api/bookings/${b.id}/razorpay-verify`, Object.assign({ token: b.token }, resp)); done('pay.okPaid'); } catch (er) { draw(er.message); } },
          modal: { ondismiss: () => draw() } });
        rz.on('payment.failed', () => draw(t('pay.fail'))); rz.open(); return;
      }
    } catch (er) { draw(er.message); }
  }
  draw(); return m;
}

/* ---------- poster fit: give each banner the real ratio of its image so it is never cropped ---------- */
function fitPosters(root) {
  $$('.hero,.cp-banner', root || document).forEach(el => {
    const m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || ''); if (!m) return;
    const im = new Image();
    im.onload = () => { if (im.naturalWidth && im.naturalHeight) el.style.setProperty('--ar', (im.naturalWidth / im.naturalHeight).toFixed(4)); };
    im.src = m[1];
  });
  const h = $('.header'); if (h) document.documentElement.style.setProperty('--hdr', (h.offsetHeight + (($('#site-announce') || {}).offsetHeight || 0)) + 'px');
}

/* ---------- misc: reveal, progress, lightbox, hearts ---------- */
function polish() {
  const bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  const top = document.createElement('button'); top.className = 'to-top'; top.setAttribute('aria-label', t('misc.backToTop')); top.innerHTML = '&uarr;'; document.body.appendChild(top);
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%'; top.classList.toggle('show', scrollY > 700); };
  addEventListener('scroll', upd, { passive: true }); upd();
  const lb = document.createElement('div'); lb.className = 'lightbox'; lb.hidden = true; lb.innerHTML = '<button aria-label="Close">&times;</button><img alt="">'; document.body.appendChild(lb);
  lb.addEventListener('click', () => lb.hidden = true); document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });
  document.addEventListener('click', e => {
    const g = e.target.closest('.gal-tile'); if (g) { $('img', lb).src = g.dataset.src; lb.hidden = false; }
    const w = e.target.closest('.wish');
    if (w) { e.preventDefault(); if (w.dataset.pid) toggleWish(w.dataset.pid); else { const on = w.getAttribute('aria-pressed') === 'true'; w.setAttribute('aria-pressed', !on); w.classList.toggle('active', !on); } }
  });
}
function reveal(root) {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .06 });
  $$('.sec,.featured,.trust,.categories', root || document).forEach(el => { if (!el.classList.contains('reveal')) { el.classList.add('reveal'); io.observe(el); } });
}

/* ---------- init ---------- */
function init() {
  if (pageFlags.showHeader !== false) renderHeader();
  if (pageFlags.showFooter !== false) renderFooter();
  fitPosters(); addEventListener('resize', () => fitPosters()); polish(); loadMe().then(updateBadge);
  if ((SITE.theme || {}).customJs) { try { const s = document.createElement('script'); s.text = SITE.theme.customJs; document.body.appendChild(s); } catch (e) {} }
}
window.VIVAH = { fitPosters, BOOT, SITE, UI, PAY, $, $$, esc, nl, t, rupee, src, url, api, store, state, modal, openAuth, openPayment, openBookings, rememberBooking, isWished, refreshHearts, reveal, COLOR_HEX, updateBadge };
init();
})();
