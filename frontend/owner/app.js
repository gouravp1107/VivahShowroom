/* Owner panel: login, shell, router */
(() => {
const O = window.OWN, { h, $, $$ } = O;
const NAV = [
  ['dashboard', 'Dashboard', '\u25A6'],
  ['grp', 'Website content'],
  ['pages', 'Pages & sections', '\u25A4'], ['posters', 'Posters', '\u25AC'], ['windows', 'Windows (round pictures)', '\u25D3'], ['gallery', 'Gallery', '\u25A6'], ['layouts', 'Collection & product pages', '\u25A3'], ['templates', 'Templates', '\u29C9'], ['headerfooter', 'Header & footer', '\u25AD'], ['design', 'Design & theme', '\u25D0'], ['texts', 'Text, login & payment windows', 'Aa'], ['media', 'Images & media', '\u25A8'],
  ['grp', 'Inventory'],
  ['products', 'Products', '\u25A5'], ['categories', 'Collections', '\u2630'],
  ['grp', 'Sales'],
  ['bookings', 'Bookings & payments', '\u20B9'], ['customers', 'Customers', '\u263A'], ['inbox', 'Messages & subscribers', '\u2709'], ['payments', 'Payment & booking settings', '\u25C8'],
  ['grp', 'System'],
  ['settings', 'Settings & backup', '\u2699']
];
const root = $('#root');
let me = null, badges = {};
O.views = O.views || {};
O.onLoggedOut = () => { me = null; showLogin(); };

function showLogin(msg) {
  O.markClean();
  const u = h('input', { class: 'inp', autocomplete: 'username', placeholder: 'Username', autofocus: true }), p = h('input', { class: 'inp', type: 'password', autocomplete: 'current-password', placeholder: 'Password' }), e = h('p', { class: 'err' }, msg || '');
  const go = async ev => { ev.preventDefault(); e.textContent = ''; try { const r = await O.api('POST', '/api/admin/login', { username: u.value, password: p.value }); me = r; start(); } catch (er) { e.textContent = er.message; } };
  root.replaceChildren(h('div', { class: 'login' }, h('form', { class: 'login-box', onsubmit: go }, h('h1', null, 'VIVAH'), h('p', null, 'Owner panel \u2014 sign in'), h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, 'Username'), u), h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, 'Password'), p), e, h('button', { class: 'btn primary', style: { width: '100%', justifyContent: 'center', marginTop: '6px' } }, 'Sign in'), h('p', { style: { marginTop: '16px', fontSize: '12px' } }, h('a', { href: '/' }, '\u2190 Back to website')))));
}
async function start() {
  await Promise.all([O.categories(true), O.pages(true)]); O.refreshUrlList();
  const side = h('aside', { class: 'side', id: 'side' }, h('div', { class: 'brand' }, 'VIVAH'), h('div', { class: 'brand-sub' }, 'OWNER PANEL'),
    ...NAV.map(n => n[0] === 'grp' ? h('div', { class: 'grp' }, n[1]) : h('a', { href: '#/' + n[0], 'data-r': n[0], onclick: () => side.classList.remove('open') }, h('span', { style: { width: '18px', textAlign: 'center' } }, n[2]), n[1], h('span', { class: 'n', id: 'bd-' + n[0], hidden: true }))),
    h('div', { class: 'foot' }, h('a', { href: '/', target: '_blank' }, '\u2197 View website'), h('a', { href: '#', onclick: async e => { e.preventDefault(); if (O.dirty && !confirm('You have unsaved changes. Sign out anyway?')) return; O.markClean(); await O.api('POST', '/api/admin/logout', {}); me = null; showLogin(); } }, '\u21E5 Sign out (' + me.username + ')')));
  root.replaceChildren(h('div', { class: 'shell' }, side, h('div', { class: 'main' }, h('div', { class: 'top', id: 'top' }), h('div', { class: 'content', id: 'content' }))));
  window.__side = side; route(); refreshBadges();
}
async function refreshBadges() { try { const s = await O.api('GET', '/api/admin/stats'); const set = (k, n) => { const b = $('#bd-' + k); if (b) { b.textContent = n; b.hidden = !n; } }; set('inbox', s.unreadMessages); set('bookings', s.toVerify + (s.byStatus.pending || 0)); } catch (e) {} }
O.refreshBadges = refreshBadges;

let routing = 0;
async function route() {
  if (!me) return;
  const [name, ...rest] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  const view = O.views[name] || O.views.dashboard;
  $$('.side a[data-r]').forEach(a => a.classList.toggle('on', a.dataset.r === (O.views[name] ? name : 'dashboard')));
  const my = ++routing, top = $('#top'), content = $('#content');
  top.replaceChildren(h('button', { class: 'menu-btn', onclick: () => window.__side.classList.toggle('open') }, '\u2630'), h('h2', null, view.title || ''), h('span', { class: 'sp' }));
  content.replaceChildren(h('p', { class: 'muted' }, 'Loading\u2026'));
  O.markClean();
  try { const box = h('div'); await view.render(box, top, rest); if (my === routing) content.replaceChildren(box); } catch (e) { content.replaceChildren(h('div', { class: 'notice' }, 'Could not load this page: ' + e.message)); }
  window.scrollTo(0, 0);
}
O.go = hash => { if (O.dirty && !confirm('You have unsaved changes that will be lost. Leave this page?')) return; O.markClean(); if (location.hash === hash) route(); else location.hash = hash; };
O.saveButton = (top, fn, label) => { const b = h('button', { class: 'btn primary', id: 'save-btn', onclick: async () => { b.disabled = true; try { await fn(); O.markClean(); O.toast('Saved', 'ok'); } catch (e) { O.toast(e.message, 'err'); } b.disabled = false; } }, label || 'Save changes'); top.append(b); return b; };
addEventListener('hashchange', () => { route(); });
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (a && O.dirty && !confirm('You have unsaved changes that will be lost. Leave this page?')) { e.preventDefault(); } else if (a && O.dirty) O.markClean(); }, true);

(async () => {
  try { const r = await O.api('GET', '/api/admin/me'); if (r.loggedIn) { me = r; start(); } else showLogin(); } catch (e) { showLogin(); }
})();
O.me = () => me;
})();
