'use strict';
/*  Vivah Rental Showroom - backend (zero dependencies, Node 16+)  */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { URL } = require('url');

const DB = require('./lib/db');
const A = require('./lib/auth');
const MP = require('./lib/multipart');
const D = require('./lib/defaults');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONT = path.resolve(__dirname, '..', 'frontend');
const IMAGES = path.join(FRONT, 'images');
const SECURE_COOKIES = process.env.SECURE_COOKIES === '1';

DB.load();
const db = () => DB.db;

/* ---------------------------------------------------------------- first-run owner account */
function ensureOwner() {
  if (db().admin) return;
  const pw = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
  const h = A.hashPassword(pw);
  db().admin = { username: 'owner', salt: h.salt, hash: h.hash, mustChange: true, createdAt: new Date().toISOString() };
  DB.saveNow();
  const note = `VIVAH OWNER LOGIN\n-----------------\nURL:       http://localhost:${PORT}/owner/\nUsername:  owner\nPassword:  ${pw}\n\nChange this password inside the Owner panel (Settings > Owner account), then delete this file.\n`;
  fs.writeFileSync(path.join(DB.DATA_DIR, 'OWNER-LOGIN.txt'), note);
  console.log('\n' + note);
}
ensureOwner();

/* ---------------------------------------------------------------- helpers */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4' };
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const str = (v, max = 2000) => (v == null ? '' : String(v)).slice(0, max);
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const bool = v => v === true || v === 'true' || v === 1;
const slugify = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const nowIso = () => new Date().toISOString();
const clientIp = req => (req.socket.remoteAddress || '') + '';

function send(res, status, body, headers) {
  const req = res.req;
  let type = 'application/json; charset=utf-8', data = body;
  if (Buffer.isBuffer(body)) type = 'application/octet-stream';
  else if (typeof body === 'string') type = 'text/html; charset=utf-8';
  else data = JSON.stringify(body);
  const h = Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-store' }, headers || {});
  sendRaw(res, status, data, h);
}
function sendRaw(res, status, data, h) {
  const req = res.req;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const compressible = /^(text\/|application\/(json|javascript|xml)|image\/svg)/.test(h['Content-Type'] || '') && buf.length > 1024;
  if (compressible && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    h['Content-Encoding'] = 'gzip'; h['Vary'] = 'Accept-Encoding';
    const z = zlib.gzipSync(buf); h['Content-Length'] = z.length; res.writeHead(status, h); return res.end(req.method === 'HEAD' ? undefined : z);
  }
  h['Content-Length'] = buf.length; res.writeHead(status, h); res.end(req.method === 'HEAD' ? undefined : buf);
}
const fail = (res, status, message) => send(res, status, { error: message });

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const buf = await readBody(req, 12 * 1024 * 1024);
  if (!buf.length) return {};
  try { const v = JSON.parse(buf.toString('utf8')); return isObj(v) ? v : {}; } catch (e) { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

/* ---------------------------------------------------------------- sessions */
function adminSession(req) { const p = A.verify(A.parseCookies(req).vivah_owner); return p && p.t === 'admin' && db().admin ? p : null; }
function customerSession(req) {
  const p = A.verify(A.parseCookies(req).vivah_sid);
  if (!p || p.t !== 'cust') return null;
  const c = db().customers.find(x => x.id === p.id);
  return c && !c.blocked ? c : null;
}
const safeCustomer = c => c && ({ id: c.id, name: c.name, phone: c.phone, email: c.email, wishlist: c.wishlist || [] });

/* ---------------------------------------------------------------- catalogue helpers */
const catBySlug = slug => db().categories.find(c => c.slug === slug);
function effStatus(p) { return (p.status === 'Out of Stock' || p.stock <= 0) ? 'Out of Stock' : p.status === 'Few Left' ? 'Few Left' : 'Available'; }
function publicProduct(p) {
  const cat = catBySlug(p.category) || {};
  return { id: p.id, category: p.category, name: p.name, code: p.code, color: p.color, price: p.price, status: effStatus(p), image: p.image, images: p.images || [], description: p.description || '', sizes: (p.sizes && p.sizes.length) ? p.sizes : (cat.sizes || []), specs: p.specs || [], featured: !!p.featured };
}
const productVisible = p => p.visible !== false && (catBySlug(p.category) || {}).visible !== false;
const sortedCats = () => db().categories.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

function publicSite() {
  const s = db().settings, pay = s.payments;
  return {
    brand: s.brand,
    theme: { defaultMode: s.theme.defaultMode, showThemeToggle: s.theme.showThemeToggle, customJs: s.theme.customJs },
    collectionsPage: s.collectionsPage,
    header: s.header, footer: s.footer,
    booking: { requireLogin: s.booking.requireLogin, events: s.booking.events, maxDays: s.booking.maxDays },
    payments: { depositPercent: pay.depositPercent, currencySymbol: pay.currencySymbol, terms: pay.terms,
      methods: { razorpay: { enabled: !!(pay.razorpay.enabled && pay.razorpay.keyId && pay.razorpay.keySecret), keyId: pay.razorpay.keyId }, upi: { enabled: !!(pay.upi.enabled && pay.upi.id), id: pay.upi.id, name: pay.upi.name }, cash: { enabled: !!pay.cash.enabled } } },
    ui: s.ui, layouts: s.layouts,
    categories: sortedCats().filter(c => c.visible !== false),
    pages: db().pages.filter(p => p.published).map(p => ({ slug: p.slug, title: p.title, parent: p.parent || '' }))
  };
}
function findPage(slug) { slug = String(slug || '').replace(/^\/+|\/+$/g, '').toLowerCase(); return db().pages.find(p => p.slug === slug); }
function publicPage(p) {
  const parts = p.slug.split('/'), crumbs = [];
  for (let i = 1; i < parts.length; i++) { const pp = findPage(parts.slice(0, i).join('/')); if (pp && pp.published) crumbs.push({ slug: pp.slug, title: pp.title }); }
  return Object.assign({}, p, { sections: p.sections.filter(x => x.visible !== false), crumbs });
}
function publicProductsFor(q) {
  let list = db().products.filter(productVisible);
  if (q.c) list = list.filter(p => p.category === q.c);
  if (q.ids) { const ids = String(q.ids).split(','); list = ids.map(id => list.find(p => p.id === id)).filter(Boolean); }
  if (q.featured) list = list.filter(p => p.featured);
  if (q.q) {
    const words = String(q.q).toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter(p => { const hay = (p.name + ' ' + p.color + ' ' + p.code + ' ' + p.category + ' ' + ((catBySlug(p.category) || {}).label || '')).toLowerCase(); return words.every(w => hay.includes(w)); });
  }
  if (q.sort === 'lo') list = list.slice().sort((a, b) => a.price - b.price);
  if (q.sort === 'hi') list = list.slice().sort((a, b) => b.price - a.price);
  const limit = Math.min(parseInt(q.limit, 10) || 2000, 2000);
  return list.slice(0, limit).map(publicProduct);
}

/* ---------------------------------------------------------------- HTML shells (SEO + theme + boot data) */
function themeCss() {
  const t = db().settings.theme;
  const v = o => `--cream:${o.cream};--ivory:${o.ivory};--paper:${o.paper};--ink:${o.ink};--dark:${o.dark};--gold:${o.gold};--gold-l:${o.goldL};--line:${o.line};--green:${o.green};--red:${o.red}`;
  const clean = x => String(x || '').replace(/<\/style/gi, '<\\/style');
  return `:root{${v(t.light)};--serif:${clean(t.fontSerif)};--sans:${clean(t.fontSans)};--poster-bright:${Math.min(2, Math.max(0.5, num(t.posterBrightness, 1.12)))};--photo-bright:${Math.min(2, Math.max(0.5, num(t.photoBrightness, 1.1)))}}[data-theme=dark]{${v(t.dark)}}\n${clean(t.customCss)}`;
}
function shell(file, meta, extraBoot) {
  let html = fs.readFileSync(path.join(FRONT, file), 'utf8');
  const s = db().settings, b = s.brand;
  const title = meta.title || b.title, desc = meta.description || b.description;
  const siteUrl = (b.siteUrl || '').replace(/\/$/, '');
  const seo = `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">` +
    (meta.image ? `<meta property="og:image" content="${esc((siteUrl || '') + '/' + String(meta.image).replace(/^\//, ''))}">` : '') +
    (b.favicon ? `<link rel="icon" href="/${esc(String(b.favicon).replace(/^\//, ''))}">` : '');
  const mode = s.theme.defaultMode || 'light';
  const themeScript = `<script>try{var m=localStorage.getItem('vivah-theme')||'${mode}';if(m==='auto')m=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';if(m==='dark')document.documentElement.dataset.theme='dark'}catch(e){}</script>`;
  const boot = Object.assign({ site: publicSite() }, extraBoot || {});
  const bootScript = `<script>window.__BOOT__=${JSON.stringify(boot).replace(/</g, '\\u003c')}</script>`;
  const fonts = s.theme.fontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${esc(s.theme.fontsUrl)}" rel="stylesheet">` : '';
  html = html.replace('<!--SEO-->', seo).replace('<!--FONTS-->', fonts).replace('<!--THEMESCRIPT-->', themeScript)
    .replace('<!--THEMECSS-->', `<style id="site-theme">${themeCss()}</style>${s.theme.customHead || ''}`).replace('<!--BOOT-->', bootScript);
  return html;
}
function maintenancePage() {
  const m = db().settings.maintenance;
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(db().settings.brand.name)}</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4efe6;color:#2a2118;font-family:Georgia,serif;text-align:center;padding:24px"><div><h1 style="letter-spacing:.3em;font-weight:500">${esc(db().settings.brand.name)}</h1><p style="max-width:420px;margin:12px auto 0">${esc(m.message)}</p></div>`;
}

/* ---------------------------------------------------------------- static files */
function serveFile(req, res, file, headersExtra) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(req, res);
    const ext = path.extname(file).toLowerCase();
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const immutable = /^\/images\//.test(req.pathname);
    const h = Object.assign({ 'Content-Type': MIME[ext] || 'application/octet-stream', 'ETag': etag, 'Cache-Control': immutable ? 'public, no-cache' : 'no-cache', 'X-Content-Type-Options': 'nosniff' }, headersExtra || {});
    if (ext === '.svg') h['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    if (/^(text\/|application\/(javascript|json))/.test(h['Content-Type']) || ext === '.svg') return fs.readFile(file, (e, buf) => e ? notFound(req, res) : sendRaw(res, 200, buf, h));
    h['Content-Length'] = st.size; res.writeHead(200, h);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}
function notFound(req, res) {
  if (req.pathname.startsWith('/api/')) return fail(res, 404, 'Not found');
  if (/\.[a-z0-9]{2,5}$/i.test(req.pathname) && !req.pathname.endsWith('.html')) return send(res, 404, 'Not found');
  send(res, 404, shell('page.html', { title: 'Page not found | ' + db().settings.brand.name }, { notFound: true, page: null }));
}
function serveStatic(req, res) {
  let p;
  try { p = decodeURIComponent(req.pathname); } catch (e) { return notFound(req, res); }
  if (p.includes('\0') || p.split('/').some(seg => seg.startsWith('.'))) return notFound(req, res);
  const file = path.resolve(FRONT, '.' + p);
  if (file !== FRONT && !file.startsWith(FRONT + path.sep)) return notFound(req, res);
  const rel = path.relative(FRONT, file).replace(/\\/g, '/');
  if (/^[^/]+\.html$/.test(rel)) return notFound(req, res); // html shells are only served through clean routes
  if (rel === 'owner') return redirect(res, '/owner/');
  serveFile(req, res, file);
}
const redirect = (res, to, code) => { res.writeHead(code || 302, { Location: to, 'Cache-Control': 'no-store' }); res.end(); };

/* ---------------------------------------------------------------- router */
const routes = [];
function route(method, pattern, handler) {
  const keys = []; const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return '([^/]+)'; }).replace(/\*/g, '(.*)') + '$');
  routes.push({ method, re, keys, handler });
}
const needAdmin = fn => (ctx) => { if (!adminSession(ctx.req)) return fail(ctx.res, 401, 'Owner login required'); return fn(ctx); };

/* ================================================================ PUBLIC API */
route('GET', '/api/health', ({ res }) => send(res, 200, { ok: true, time: nowIso() }));
route('GET', '/api/site', ({ res }) => send(res, 200, publicSite()));
route('GET', '/api/page', ({ res, query }) => { const p = findPage(query.slug); if (!p || !p.published) return fail(res, 404, 'Page not found'); send(res, 200, publicPage(p)); });
route('GET', '/api/products', ({ res, query }) => send(res, 200, publicProductsFor(query)));
route('GET', '/api/products/:id', ({ res, params }) => {
  const p = db().products.find(x => x.id === params.id);
  if (!p || !productVisible(p)) return fail(res, 404, 'Product not found');
  send(res, 200, publicProduct(p));
});
route('GET', '/api/products/:id/availability', ({ res, params, query }) => {
  const p = db().products.find(x => x.id === params.id);
  if (!p) return fail(res, 404, 'Product not found');
  send(res, 200, { available: availableUnits(p, query.start, query.end) });
});

route('GET', '/api/gallery', ({ res }) => send(res, 200, db().gallery.filter(g => g.visible !== false).map(g => ({ id: g.id, image: g.image, alt: g.alt }))));
route('POST', '/api/subscribe', async ({ req, res, body }) => {
  if (A.limited('sub:' + clientIp(req), 10, 3600e3)) return fail(res, 429, 'Too many requests');
  const email = str(body.email, 200).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
  if (!db().subscribers.some(s => s.email === email)) { db().subscribers.push({ id: DB.uid('s'), email, at: nowIso() }); DB.save(); }
  send(res, 200, { ok: true });
});
route('POST', '/api/contact', async ({ req, res, body }) => {
  if (A.limited('contact:' + clientIp(req), 8, 3600e3)) return fail(res, 429, 'Too many requests');
  const m = { id: DB.uid('m'), name: str(body.name, 120).trim(), phone: str(body.phone, 30).trim(), email: str(body.email, 200).trim(), subject: str(body.subject, 200), message: str(body.message, 4000).trim(), date: str(body.date, 40), read: false, at: nowIso() };
  if (!m.name || (!m.phone && !m.email) || !m.message) return fail(res, 400, 'Please fill in your name, a phone or email, and a message.');
  db().messages.unshift(m); DB.save(); send(res, 200, { ok: true });
});

/* ---- customer accounts */
route('POST', '/api/auth/register', async ({ req, res, body }) => {
  if (A.limited('reg:' + clientIp(req), 10, 3600e3)) return fail(res, 429, 'Too many attempts');
  const name = str(body.name, 120).trim(), phone = str(body.phone, 30).replace(/\D/g, '').slice(-10), email = str(body.email, 200).trim().toLowerCase(), pw = str(body.password, 200);
  if (!name) return fail(res, 400, 'Please enter your name.');
  if (phone.length !== 10) return fail(res, 400, 'Enter a valid 10-digit mobile number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
  if (pw.length < 6) return fail(res, 400, 'Password must be at least 6 characters.');
  if (db().customers.some(c => c.phone === phone || (email && c.email === email))) return fail(res, 409, 'An account with this mobile number or email already exists. Please log in.');
  const h = A.hashPassword(pw);
  const c = { id: DB.uid('c'), name, phone, email, salt: h.salt, hash: h.hash, wishlist: [], blocked: false, createdAt: nowIso() };
  db().customers.push(c); DB.save();
  send(res, 200, { customer: safeCustomer(c) }, { 'Set-Cookie': A.cookie('vivah_sid', A.sign({ t: 'cust', id: c.id }, 30 * 86400), 30 * 86400, SECURE_COOKIES) });
});
route('POST', '/api/auth/login', async ({ req, res, body }) => {
  if (A.limited('login:' + clientIp(req), 15, 15 * 60e3)) return fail(res, 429, 'Too many attempts. Please wait a few minutes.');
  const id = str(body.id, 200).trim().toLowerCase(), digits = id.replace(/\D/g, '').slice(-10);
  const c = db().customers.find(x => (id.includes('@') ? x.email === id : (digits.length === 10 && x.phone === digits)));
  if (!c || c.blocked || !A.verifyPassword(str(body.password, 200), c)) return fail(res, 401, 'Incorrect mobile/email or password.');
  send(res, 200, { customer: safeCustomer(c) }, { 'Set-Cookie': A.cookie('vivah_sid', A.sign({ t: 'cust', id: c.id }, 30 * 86400), 30 * 86400, SECURE_COOKIES) });
});
route('POST', '/api/auth/logout', ({ res }) => send(res, 200, { ok: true }, { 'Set-Cookie': A.cookie('vivah_sid', '', 0, SECURE_COOKIES) }));
route('GET', '/api/auth/me', ({ req, res }) => send(res, 200, { customer: safeCustomer(customerSession(req)) || null }));
route('PUT', '/api/me/wishlist', ({ req, res, body }) => {
  const c = customerSession(req); if (!c) return fail(res, 401, 'Login required');
  c.wishlist = (Array.isArray(body.ids) ? body.ids : []).map(x => str(x, 80)).slice(0, 500); DB.save(); send(res, 200, { ok: true });
});

/* ---- bookings */
const ACTIVE = ['pending', 'confirmed', 'picked-up'];
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5) + 1; }
function availableUnits(p, start, end) {
  const total = Math.max(0, num(p.stock, 0));
  if (!start || !end) return total;
  const used = db().bookings.filter(b => ACTIVE.includes(b.status) && b.items.some(i => i.productId === p.id) && !(b.end < start || b.start > end)).length;
  return Math.max(0, total - used);
}
const money = n => Math.round(num(n) * 100) / 100;
function recalcPayment(b) {
  b.payment.paid = money(b.payment.history.filter(h => h.amount > 0).reduce((s, h) => s + h.amount, 0) - b.payment.history.filter(h => h.amount < 0).reduce((s, h) => s - h.amount, 0));
  if (b.payment.status === 'refunded') return;
  b.payment.status = b.payment.paid <= 0 ? (b.payment.status === 'verification' ? 'verification' : 'unpaid') : b.payment.paid >= b.total ? 'paid' : 'partial';
  if (b.status === 'pending' && b.payment.paid >= b.deposit && b.payment.paid > 0) b.status = 'confirmed';
}
const dueNow = b => Math.max(0, money(b.payment.paid < b.deposit ? b.deposit - b.payment.paid : b.total - b.payment.paid));
function publicBooking(b, withToken) {
  return { id: b.id, items: b.items, start: b.start, end: b.end, days: b.days, event: b.event, name: b.name, phone: b.phone, total: b.total, deposit: b.deposit, status: b.status, payment: { status: b.payment.status, paid: b.payment.paid, method: b.payment.method }, dueNow: dueNow(b), createdAt: b.createdAt, token: withToken ? b.token : undefined };
}
function bookingAccess(ctx, id, token) {
  const b = db().bookings.find(x => x.id === id); if (!b) return null;
  const c = customerSession(ctx.req);
  if ((c && b.customerId === c.id) || (token && b.token && token === b.token)) return b;
  return null;
}
route('POST', '/api/bookings', async ({ req, res, body }) => {
  if (A.limited('book:' + clientIp(req), 20, 3600e3)) return fail(res, 429, 'Too many requests');
  const s = db().settings, cust = customerSession(req);
  if (s.booking.requireLogin && !cust) return fail(res, 401, s.ui['pd.errLogin']);
  const name = str(body.name, 120).trim(), phone = str(body.phone, 30).replace(/\D/g, '').slice(-10), phone2 = str(body.phone2, 30).replace(/\D/g, '').slice(-10);
  if (!name) return fail(res, 400, s.ui['pd.errName']);
  if (phone.length !== 10) return fail(res, 400, s.ui['pd.errPhone']);
  if (body.phone2 && str(body.phone2).replace(/\D/g, '').length && phone2.length !== 10) return fail(res, 400, s.ui['pd.errPhone2']);
  const start = str(body.start, 10), end = str(body.end, 10), today = nowIso().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) return fail(res, 400, s.ui['pd.errDates']);
  const days = daysBetween(start, end);
  if (days > (s.booking.maxDays || 30)) return fail(res, 400, `You can rent for at most ${s.booking.maxDays || 30} days at a time.`);
  const wanted = (Array.isArray(body.items) ? body.items : []).slice(0, 10);
  if (!wanted.length) return fail(res, 400, 'No product selected.');
  const items = [];
  for (const w of wanted) {
    const p = db().products.find(x => x.id === w.productId);
    if (!p || !productVisible(p)) return fail(res, 404, 'This product is no longer available.');
    if (effStatus(p) === 'Out of Stock') return fail(res, 409, `${p.name} is out of stock.`);
    if (availableUnits(p, start, end) < 1) return fail(res, 409, `${p.name} is already reserved for these dates. Please choose other dates or another look.`);
    const pub = publicProduct(p);
    const size = pub.sizes.includes(w.size) ? w.size : (pub.sizes[0] || '');
    items.push({ productId: p.id, name: p.name, code: p.code, image: p.image, size, price: p.price });
  }
  const total = money(items.reduce((t, i) => t + i.price * days, 0));
  const deposit = money(Math.ceil(total * (num(s.payments.depositPercent, 30) / 100)));
  db().counters.booking++;
  const b = { id: 'VR-' + db().counters.booking, token: crypto.randomBytes(16).toString('hex'), customerId: cust ? cust.id : null, items, start, end, days, event: str(body.event, 60), name, phone, phone2, notes: str(body.notes, 1000), adminNotes: '', total, deposit, status: 'pending', payment: { status: 'unpaid', paid: 0, method: '', ref: '', history: [] }, createdAt: nowIso() };
  db().bookings.unshift(b); DB.save();
  send(res, 200, { booking: publicBooking(b, true) });
});
route('GET', '/api/bookings/mine', ({ req, res }) => {
  const c = customerSession(req); if (!c) return fail(res, 401, 'Login required');
  send(res, 200, { bookings: db().bookings.filter(b => b.customerId === c.id).map(b => publicBooking(b)) });
});
route('GET', '/api/bookings/:id', ({ res, req, params, query }) => {
  const b = bookingAccess({ req }, params.id, query.token); if (!b) return fail(res, 404, 'Booking not found');
  send(res, 200, { booking: publicBooking(b) });
});
route('POST', '/api/bookings/:id/cancel', async ({ req, res, params, body }) => {
  const b = bookingAccess({ req }, params.id, body.token); if (!b) return fail(res, 404, 'Booking not found');
  if (b.status !== 'pending') return fail(res, 409, 'Only pending bookings can be cancelled online. Please contact the showroom.');
  b.status = 'cancelled'; DB.save(); send(res, 200, { booking: publicBooking(b) });
});
route('POST', '/api/bookings/:id/pay', async ({ req, res, params, body }) => {
  const b = bookingAccess({ req }, params.id, body.token); if (!b) return fail(res, 404, 'Booking not found');
  if (['cancelled', 'returned'].includes(b.status)) return fail(res, 409, 'This booking is closed.');
  const pay = db().settings.payments, method = str(body.method, 20), due = dueNow(b);
  if (due <= 0) return fail(res, 409, 'Nothing is due on this booking.');
  if (method === 'cash') {
    if (!pay.cash.enabled) return fail(res, 400, 'Not available');
    b.payment.method = 'cash'; DB.save(); return send(res, 200, { booking: publicBooking(b), result: 'cash' });
  }
  if (method === 'upi') {
    if (!pay.upi.enabled || !pay.upi.id) return fail(res, 400, 'Not available');
    const ref = str(body.ref, 60).trim();
    if (ref.length < 6) return fail(res, 400, 'Enter the UPI reference / UTR number.');
    b.payment.method = 'upi'; b.payment.ref = ref; if (b.payment.paid <= 0) b.payment.status = 'verification';
    b.payment.pending = { amount: due, ref, at: nowIso() }; DB.save();
    return send(res, 200, { booking: publicBooking(b), result: 'verify' });
  }
  if (method === 'razorpay') {
    const rz = pay.razorpay; if (!(rz.enabled && rz.keyId && rz.keySecret)) return fail(res, 400, 'Not available');
    try {
      const order = await razorpayRequest('POST', '/v1/orders', { amount: Math.round(due * 100), currency: 'INR', receipt: b.id, notes: { booking: b.id } });
      b.payment.pending = { amount: due, orderId: order.id, at: nowIso() }; DB.save();
      return send(res, 200, { result: 'razorpay', order: { id: order.id, amount: order.amount, currency: order.currency }, keyId: rz.keyId, booking: publicBooking(b), prefill: { name: b.name, contact: b.phone } });
    } catch (e) { return fail(res, 502, 'Could not start the online payment. ' + e.message); }
  }
  fail(res, 400, 'Unknown payment method');
});
route('POST', '/api/bookings/:id/razorpay-verify', async ({ req, res, params, body }) => {
  const b = bookingAccess({ req }, params.id, body.token); if (!b) return fail(res, 404, 'Booking not found');
  const rz = db().settings.payments.razorpay, pend = b.payment.pending;
  if (!pend || !pend.orderId || pend.orderId !== body.razorpay_order_id) return fail(res, 400, 'Payment does not match this booking.');
  const expect = crypto.createHmac('sha256', rz.keySecret).update(body.razorpay_order_id + '|' + body.razorpay_payment_id).digest('hex');
  const given = Buffer.from(str(body.razorpay_signature, 200)), exp = Buffer.from(expect);
  if (given.length !== exp.length || !crypto.timingSafeEqual(given, exp)) return fail(res, 400, 'Payment verification failed.');
  if (!b.payment.history.some(h => h.ref === body.razorpay_payment_id)) b.payment.history.push({ at: nowIso(), method: 'razorpay', amount: pend.amount, ref: str(body.razorpay_payment_id, 80), note: 'Online payment' });
  b.payment.method = 'razorpay'; delete b.payment.pending; recalcPayment(b); DB.save();
  send(res, 200, { booking: publicBooking(b), result: 'paid' });
});
function razorpayRequest(method, p, payload) {
  const rz = db().settings.payments.razorpay;
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : '';
    const r = https.request({ host: 'api.razorpay.com', path: p, method, auth: rz.keyId + ':' + rz.keySecret, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, timeout: 15000 }, resp => {
      const chunks = []; resp.on('data', c => chunks.push(c));
      resp.on('end', () => { let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {} resp.statusCode < 300 ? resolve(j) : reject(new Error((j.error && j.error.description) || ('HTTP ' + resp.statusCode))); });
    });
    r.on('error', reject); r.on('timeout', () => { r.destroy(new Error('timeout')); }); r.end(data);
  });
}

/* ================================================================ OWNER API */
route('POST', '/api/admin/login', async ({ req, res, body }) => {
  if (A.limited('adm:' + clientIp(req), 8, 15 * 60e3)) return fail(res, 429, 'Too many attempts. Wait 15 minutes.');
  const ad = db().admin;
  const ok = ad && str(body.username, 100).trim().toLowerCase() === ad.username.toLowerCase() && A.verifyPassword(str(body.password, 200), ad);
  if (!ok) return fail(res, 401, 'Incorrect username or password.');
  send(res, 200, { ok: true, username: ad.username, mustChange: !!ad.mustChange }, { 'Set-Cookie': A.cookie('vivah_owner', A.sign({ t: 'admin' }, 12 * 3600), 12 * 3600, SECURE_COOKIES) });
});
route('POST', '/api/admin/logout', ({ res }) => send(res, 200, { ok: true }, { 'Set-Cookie': A.cookie('vivah_owner', '', 0, SECURE_COOKIES) }));
route('GET', '/api/admin/me', ({ req, res }) => { const s = adminSession(req); send(res, 200, s ? { loggedIn: true, username: db().admin.username, mustChange: !!db().admin.mustChange } : { loggedIn: false }); });
route('POST', '/api/admin/account', needAdmin(async ({ res, body }) => {
  const ad = db().admin;
  if (!A.verifyPassword(str(body.current, 200), ad)) return fail(res, 403, 'Current password is incorrect.');
  const user = str(body.username, 60).trim() || ad.username, pw = str(body.next, 200);
  if (pw && pw.length < 8) return fail(res, 400, 'New password must be at least 8 characters.');
  ad.username = user; if (pw) { const h = A.hashPassword(pw); ad.salt = h.salt; ad.hash = h.hash; ad.mustChange = false; try { fs.unlinkSync(path.join(DB.DATA_DIR, 'OWNER-LOGIN.txt')); } catch (e) {} }
  DB.saveNow(); send(res, 200, { ok: true, username: ad.username });
}));

route('GET', '/api/admin/stats', needAdmin(({ res }) => {
  const d = db(), month = nowIso().slice(0, 7);
  const byStatus = {}; d.bookings.forEach(b => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
  const collected = d.bookings.reduce((t, b) => t + b.payment.paid, 0);
  const monthCollected = d.bookings.filter(b => b.createdAt.slice(0, 7) === month).reduce((t, b) => t + b.payment.paid, 0);
  const lowStock = d.products.filter(p => p.visible !== false && (p.stock <= 1 || p.status !== 'Available')).slice(0, 12).map(p => ({ id: p.id, name: p.name, code: p.code, stock: p.stock, status: effStatus(p) }));
  const perCat = sortedCats().map(c => ({ slug: c.slug, label: c.label, products: d.products.filter(p => p.category === c.slug).length, units: d.products.filter(p => p.category === c.slug).reduce((t, p) => t + num(p.stock), 0) }));
  send(res, 200, { products: d.products.length, categories: d.categories.length, pages: d.pages.length, bookings: d.bookings.length, customers: d.customers.length, subscribers: d.subscribers.length, unreadMessages: d.messages.filter(m => !m.read).length, byStatus, collected: money(collected), monthCollected: money(monthCollected), toVerify: d.bookings.filter(b => b.payment.status === 'verification').length, lowStock, perCat, recent: d.bookings.slice(0, 8).map(b => ({ id: b.id, name: b.name, total: b.total, status: b.status, createdAt: b.createdAt })), outOfStock: d.products.filter(p => effStatus(p) === 'Out of Stock').length });
}));

/* ---- settings */
const SETTING_KEYS = ['brand', 'theme', 'header', 'footer', 'booking', 'payments', 'ui', 'layouts', 'maintenance', 'collectionsPage'];
route('GET', '/api/admin/settings', needAdmin(({ res }) => {
  const s = JSON.parse(JSON.stringify(db().settings));
  if (s.payments.razorpay.keySecret) s.payments.razorpay.keySecret = '********';
  send(res, 200, { settings: s, uiGroups: D.UI_GROUPS, uiDefaults: D.UI_DEFAULTS, defaults: { theme: { light: D.LIGHT, dark: D.DARK } } });
}));
route('PUT', '/api/admin/settings', needAdmin(async ({ res, body }) => {
  const s = db().settings;
  for (const k of SETTING_KEYS) {
    if (!(k in body) || !isObj(body[k])) continue;
    if (k === 'payments' && isObj(body.payments.razorpay)) {
      const secret = body.payments.razorpay.keySecret;
      if (secret === '********' || secret === undefined) body.payments.razorpay.keySecret = s.payments.razorpay.keySecret;
    }
    if (k === 'ui') { Object.keys(body.ui).forEach(key => { body.ui[key] = str(body.ui[key], 2000); }); body.ui = Object.assign({}, s.ui, body.ui); }
    s[k] = body[k];
  }
  DB.saveNow(); send(res, 200, { ok: true });
}));

/* ---- gallery inventory (separate from products, posters and windows) */
route('GET', '/api/admin/gallery', needAdmin(({ res }) => send(res, 200, { items: db().gallery })));
route('POST', '/api/admin/gallery', needAdmin(async ({ res, body }) => {
  const list = (Array.isArray(body.items) ? body.items : [body]).slice(0, 300).filter(x => x && x.image);
  const made = list.map(x => ({ id: 'g' + DB.uid(''), image: str(x.image, 400), alt: str(x.alt, 200), visible: x.visible !== false }));
  db().gallery.push(...made); DB.save(); send(res, 200, { items: made });
}));
route('PUT', '/api/admin/gallery/:id', needAdmin(async ({ res, params, body }) => {
  const g = db().gallery.find(x => x.id === params.id); if (!g) return fail(res, 404, 'Not found');
  if ('alt' in body) g.alt = str(body.alt, 200); if ('visible' in body) g.visible = bool(body.visible); if ('image' in body && body.image) g.image = str(body.image, 400);
  DB.save(); send(res, 200, { item: g });
}));
route('POST', '/api/admin/gallery-order', needAdmin(async ({ res, body }) => {
  const ids = Array.isArray(body.ids) ? body.ids : [], by = Object.fromEntries(db().gallery.map(g => [g.id, g]));
  const ordered = ids.map(i => by[i]).filter(Boolean); const rest = db().gallery.filter(g => !ids.includes(g.id));
  db().gallery = [...ordered, ...rest]; DB.save(); send(res, 200, { ok: true });
}));
route('DELETE', '/api/admin/gallery/:id', needAdmin(({ res, params }) => { db().gallery = db().gallery.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true }); }));
route('POST', '/api/admin/gallery-delete', needAdmin(async ({ res, body }) => { const ids = new Set(Array.isArray(body.ids) ? body.ids : []); db().gallery = db().gallery.filter(x => !ids.has(x.id)); DB.save(); send(res, 200, { ok: true }); }));

/* ---- generic collection helpers */
const STATUS = ['Available', 'Few Left', 'Out of Stock'];
function cleanSections(arr) {
  return (Array.isArray(arr) ? arr : []).slice(0, 200).map(s => ({ id: str(s.id, 40) || D.rid(), type: str(s.type, 30), visible: s.visible !== false, data: isObj(s.data) ? s.data : {} })).filter(s => s.type);
}
function cleanProduct(b, old) {
  const o = old || {};
  const pick = (k, d) => (k in b ? b[k] : (k in o ? o[k] : d));
  return {
    id: o.id, category: str(pick('category', ''), 80), name: str(pick('name', ''), 200).trim(), code: str(pick('code', ''), 40).trim(), color: str(pick('color', ''), 40).trim(),
    price: Math.max(0, num(pick('price', 0))), status: STATUS.includes(pick('status')) ? pick('status') : 'Available', stock: Math.max(0, Math.floor(num(pick('stock', 1)))),
    image: str(pick('image', ''), 400), images: (Array.isArray(pick('images', [])) ? pick('images', []) : []).map(x => str(x, 400)).filter(Boolean).slice(0, 12),
    description: str(pick('description', ''), 4000), sizes: (Array.isArray(pick('sizes', [])) ? pick('sizes', []) : []).map(x => str(x, 20).trim()).filter(Boolean).slice(0, 20),
    specs: (Array.isArray(pick('specs', [])) ? pick('specs', []) : []).map(x => ({ k: str(x.k, 80), v: str(x.v, 300) })).filter(x => x.k).slice(0, 20),
    featured: bool(pick('featured', false)), visible: pick('visible', true) !== false, createdAt: o.createdAt || nowIso(), updatedAt: nowIso()
  };
}
function cleanCategory(b, old) {
  const o = old || {}; const pick = (k, d) => (k in b ? b[k] : (k in o ? o[k] : d));
  return {
    id: o.id, slug: slugify(pick('slug', '') || pick('label', '')), label: str(pick('label', ''), 80).trim(), title: str(pick('title', ''), 120), crumb: str(pick('crumb', ''), 80), tagline: str(pick('tagline', ''), 300), noun: str(pick('noun', 'Outfit'), 60),
    basePrice: Math.max(0, num(pick('basePrice', 0))), bannerPos: str(pick('bannerPos', 'center 30%'), 40), bannerImage: str(pick('bannerImage', ''), 400), thumbImage: str(pick('thumbImage', ''), 400), buttonLabel: str(pick('buttonLabel', ''), 80), thumbFit: pick('thumbFit', 'cover') === 'contain' ? 'contain' : 'cover', bannerSide: pick('bannerSide', 'left') === 'right' ? 'right' : 'left', bannerSide: pick('bannerSide', 'left') === 'right' ? 'right' : 'left',
    tabs: (Array.isArray(pick('tabs', [])) ? pick('tabs', []) : []).map(t => ({ label: str(t.label, 60), slug: str(t.slug, 80) })).filter(t => t.label).slice(0, 10),
    sizes: (Array.isArray(pick('sizes', [])) ? pick('sizes', []) : []).map(x => str(x, 20).trim()).filter(Boolean).slice(0, 20),
    visible: pick('visible', true) !== false, order: num(pick('order', 0)), seoTitle: str(pick('seoTitle', ''), 160), seoDescription: str(pick('seoDescription', ''), 300)
  };
}
function cleanPage(b, old) {
  const o = old || {}; const pick = (k, d) => (k in b ? b[k] : (k in o ? o[k] : d));
  let slug = o.system ? o.slug : String(pick('slug', '')).toLowerCase().split('/').map(slugify).filter(Boolean).join('/');
  return { id: o.id, slug, title: str(pick('title', ''), 160).trim(), parent: o.system ? '' : str(pick('parent', ''), 120), type: o.type || 'custom', system: !!o.system, published: bool(pick('published', true)) || !!o.system, showHeader: pick('showHeader', true) !== false, showFooter: pick('showFooter', true) !== false, seoTitle: str(pick('seoTitle', ''), 160), seoDescription: str(pick('seoDescription', ''), 300), ogImage: str(pick('ogImage', ''), 400), sections: cleanSections(pick('sections', [])), updatedAt: nowIso() };
}

/* a deleted product disappears from every section, template, layout and wishlist (posters, windows and gallery are separate and untouched) */
function removeProductRefs(idList) {
  const gone = new Set(idList);
  const clean = secs => (secs || []).forEach(sc => { if (sc.data && Array.isArray(sc.data.productIds)) sc.data.productIds = sc.data.productIds.filter(x => !gone.has(x)); });
  db().pages.forEach(pg => clean(pg.sections)); db().templates.forEach(t => clean(t.sections));
  const L = db().settings.layouts; ['category', 'product'].forEach(k => ['before', 'after'].forEach(w => clean(L[k] && L[k][w])));
  db().customers.forEach(c => { if (c.wishlist) c.wishlist = c.wishlist.filter(x => !gone.has(x)); });
}
/* ---- products */
route('GET', '/api/admin/products', needAdmin(({ res }) => send(res, 200, { items: db().products })));
route('POST', '/api/admin/products', needAdmin(async ({ res, body }) => {
  const p = cleanProduct(body);
  if (!p.name || !p.category) return fail(res, 400, 'Name and collection are required.');
  const base = p.code ? `${p.category}-${slugify(p.code)}` : DB.uid(p.category);
  let id = base, n = 2; while (db().products.some(x => x.id === id)) id = base + '-' + n++;
  p.id = id; if (!p.code) p.code = id.split('-').pop().toUpperCase();
  db().products.unshift(p); DB.save(); send(res, 200, { item: p });
}));
route('PUT', '/api/admin/products/:id', needAdmin(async ({ res, params, body }) => {
  const i = db().products.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  const p = cleanProduct(body, db().products[i]); if (!p.name) return fail(res, 400, 'Name is required.');
  db().products[i] = p; DB.save(); send(res, 200, { item: p });
}));
route('DELETE', '/api/admin/products/:id', needAdmin(({ res, params }) => {
  const i = db().products.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  db().products.splice(i, 1);
  removeProductRefs([params.id]);
  DB.save(); send(res, 200, { ok: true });
}));
route('POST', '/api/admin/products-bulk', needAdmin(async ({ res, body }) => {
  const ids = new Set(Array.isArray(body.ids) ? body.ids : []); const d = db();
  if (body.action === 'delete') { d.products = d.products.filter(p => !ids.has(p.id)); removeProductRefs([...ids]); }
  else if (body.action === 'update' && isObj(body.patch)) {
    const allowed = ['category', 'price', 'status', 'stock', 'visible', 'featured', 'color'];
    d.products.forEach((p, i) => { if (ids.has(p.id)) { const patch = {}; allowed.forEach(k => { if (k in body.patch) patch[k] = body.patch[k]; }); d.products[i] = cleanProduct(patch, p); } });
  } else if (body.action === 'create' && Array.isArray(body.items)) {
    const made = [];
    for (const it of body.items.slice(0, 500)) {
      const p = cleanProduct(it); if (!p.name || !p.category) continue;
      const base = p.code ? `${p.category}-${slugify(p.code)}` : DB.uid(p.category); let id = base, n = 2; while (d.products.some(x => x.id === id)) id = base + '-' + n++;
      p.id = id; if (!p.code) p.code = id.split('-').pop().toUpperCase(); d.products.push(p); made.push(p.id);
    }
    DB.save(); return send(res, 200, { ok: true, created: made.length });
  } else return fail(res, 400, 'Unknown action');
  DB.save(); send(res, 200, { ok: true });
}));

/* ---- categories */
route('GET', '/api/admin/categories', needAdmin(({ res }) => send(res, 200, { items: sortedCats(), counts: db().categories.reduce((o, c) => { o[c.slug] = db().products.filter(p => p.category === c.slug).length; return o; }, {}) })));
route('POST', '/api/admin/categories', needAdmin(async ({ res, body }) => {
  const c = cleanCategory(body); if (!c.label || !c.slug) return fail(res, 400, 'Name is required.');
  if (catBySlug(c.slug)) return fail(res, 409, 'A collection with this URL name already exists.');
  c.id = c.slug; if (!c.title) c.title = c.label; if (!c.crumb) c.crumb = c.label; if (!c.order) c.order = db().categories.length;
  db().categories.push(c); DB.save(); send(res, 200, { item: c });
}));
route('PUT', '/api/admin/categories/:id', needAdmin(async ({ res, params, body }) => {
  const i = db().categories.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  const old = db().categories[i], c = cleanCategory(body, old); if (!c.label || !c.slug) return fail(res, 400, 'Name is required.');
  if (c.slug !== old.slug) {
    if (catBySlug(c.slug)) return fail(res, 409, 'A collection with this URL name already exists.');
    db().products.forEach(p => { if (p.category === old.slug) p.category = c.slug; });
    db().categories.forEach(x => x.tabs && x.tabs.forEach(t => { if (t.slug === old.slug) t.slug = c.slug; }));
    const fixLinks = l => { if (l && l.url === '/collection/' + old.slug) l.url = '/collection/' + c.slug; };
    db().settings.header.links.forEach(fixLinks); db().settings.footer.links.forEach(fixLinks);
  }
  db().categories[i] = c; DB.save(); send(res, 200, { item: c });
}));
route('DELETE', '/api/admin/categories/:id', needAdmin(({ res, params, query }) => {
  const i = db().categories.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  const slug = db().categories[i].slug, n = db().products.filter(p => p.category === slug).length;
  if (n && query.force !== '1') return send(res, 409, { error: `This collection still has ${n} products.`, count: n });
  if (query.force === '1') db().products = db().products.filter(p => p.category !== slug);
  db().categories.splice(i, 1); db().settings.header.links = db().settings.header.links.filter(l => l.url !== '/collection/' + slug);
  DB.save(); send(res, 200, { ok: true });
}));

/* ---- pages and templates */
route('GET', '/api/admin/pages', needAdmin(({ res }) => send(res, 200, { items: db().pages })));
route('POST', '/api/admin/pages', needAdmin(async ({ res, body }) => {
  const p = cleanPage(body); if (!p.title) return fail(res, 400, 'Page title is required.');
  if (!p.slug) p.slug = slugify(p.title);
  if (!p.slug || findPage(p.slug)) return fail(res, 409, 'A page with this URL already exists.');
  if (['api', 'owner', 'images', 'css', 'js'].includes(p.slug.split('/')[0])) return fail(res, 400, 'That URL is reserved.');
  p.id = DB.uid('pg'); db().pages.push(p); DB.save(); send(res, 200, { item: p });
}));
route('PUT', '/api/admin/pages/:id', needAdmin(async ({ res, params, body }) => {
  const i = db().pages.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  const old = db().pages[i], p = cleanPage(body, old); if (!p.title) return fail(res, 400, 'Page title is required.');
  if (!old.system) {
    if (!p.slug) return fail(res, 400, 'Page URL is required.');
    const clash = db().pages.find(x => x.slug === p.slug && x.id !== old.id); if (clash) return fail(res, 409, 'A page with this URL already exists.');
    if (p.slug !== old.slug) { // keep links and child pages working
      db().pages.forEach(x => { if (x.slug.startsWith(old.slug + '/')) x.slug = p.slug + x.slug.slice(old.slug.length); });
      const fix = l => { if (l && l.url) { if (l.url === '/p/' + old.slug) l.url = '/p/' + p.slug; else if (l.url.startsWith('/p/' + old.slug + '/')) l.url = '/p/' + p.slug + l.url.slice(('/p/' + old.slug).length); } };
      db().settings.header.links.forEach(fix); db().settings.footer.links.forEach(fix);
    }
  }
  p.id = old.id; db().pages[i] = p; DB.save(); send(res, 200, { item: p });
}));
route('DELETE', '/api/admin/pages/:id', needAdmin(({ res, params }) => {
  const i = db().pages.findIndex(x => x.id === params.id); if (i < 0) return fail(res, 404, 'Not found');
  if (db().pages[i].system) return fail(res, 400, 'The home page cannot be deleted.');
  const slug = db().pages[i].slug; db().pages.splice(i, 1);
  db().pages.forEach(x => { if (x.parent === slug) x.parent = ''; });
  DB.save(); send(res, 200, { ok: true });
}));
route('GET', '/api/admin/templates', needAdmin(({ res }) => send(res, 200, { items: db().templates })));
route('POST', '/api/admin/templates', needAdmin(async ({ res, body }) => {
  const t = { id: DB.uid('tpl'), name: str(body.name, 100).trim(), description: str(body.description, 300), sections: cleanSections(body.sections) };
  if (!t.name) return fail(res, 400, 'Template name is required.');
  db().templates.push(t); DB.save(); send(res, 200, { item: t });
}));
route('PUT', '/api/admin/templates/:id', needAdmin(async ({ res, params, body }) => {
  const t = db().templates.find(x => x.id === params.id); if (!t) return fail(res, 404, 'Not found');
  t.name = str(body.name, 100).trim() || t.name; t.description = str(body.description, 300); if (Array.isArray(body.sections)) t.sections = cleanSections(body.sections);
  DB.save(); send(res, 200, { item: t });
}));
route('DELETE', '/api/admin/templates/:id', needAdmin(({ res, params }) => {
  db().templates = db().templates.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true });
}));

/* ---- bookings, customers, subscribers, messages */
route('GET', '/api/admin/bookings', needAdmin(({ res }) => send(res, 200, { items: db().bookings.map(b => Object.assign({}, b, { token: undefined })) })));
route('PUT', '/api/admin/bookings/:id', needAdmin(async ({ res, params, body }) => {
  const b = db().bookings.find(x => x.id === params.id); if (!b) return fail(res, 404, 'Not found');
  if (['pending', 'confirmed', 'picked-up', 'returned', 'cancelled'].includes(body.status)) b.status = body.status;
  if ('adminNotes' in body) b.adminNotes = str(body.adminNotes, 2000);
  if (['unpaid', 'verification', 'partial', 'paid', 'refunded'].includes(body.paymentStatus)) { b.payment.status = body.paymentStatus; if (body.paymentStatus !== 'refunded') recalcPayment(b); }
  DB.save(); send(res, 200, { item: Object.assign({}, b, { token: undefined }) });
}));
route('POST', '/api/admin/bookings/:id/payment', needAdmin(async ({ res, params, body }) => {
  const b = db().bookings.find(x => x.id === params.id); if (!b) return fail(res, 404, 'Not found');
  const amount = money(body.amount); if (!amount) return fail(res, 400, 'Enter an amount (use a negative number for a refund).');
  b.payment.history.push({ at: nowIso(), method: str(body.method, 20) || 'cash', amount, ref: str(body.ref, 80), note: str(body.note, 200) || (amount < 0 ? 'Refund' : 'Recorded by owner') });
  delete b.payment.pending; if (b.payment.status === 'refunded') b.payment.status = 'unpaid'; recalcPayment(b); DB.save(); send(res, 200, { item: Object.assign({}, b, { token: undefined }) });
}));
route('DELETE', '/api/admin/bookings/:id', needAdmin(({ res, params }) => { db().bookings = db().bookings.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true }); }));
route('GET', '/api/admin/customers', needAdmin(({ res }) => send(res, 200, { items: db().customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, blocked: !!c.blocked, createdAt: c.createdAt, bookings: db().bookings.filter(b => b.customerId === c.id).length })) })));
route('PUT', '/api/admin/customers/:id', needAdmin(async ({ res, params, body }) => {
  const c = db().customers.find(x => x.id === params.id); if (!c) return fail(res, 404, 'Not found');
  if ('name' in body) c.name = str(body.name, 120); if ('email' in body) c.email = str(body.email, 200).toLowerCase(); if ('blocked' in body) c.blocked = bool(body.blocked);
  if (body.newPassword) { if (String(body.newPassword).length < 6) return fail(res, 400, 'Password must be at least 6 characters.'); const h = A.hashPassword(body.newPassword); c.salt = h.salt; c.hash = h.hash; }
  DB.save(); send(res, 200, { ok: true });
}));
route('DELETE', '/api/admin/customers/:id', needAdmin(({ res, params }) => { db().customers = db().customers.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true }); }));
route('GET', '/api/admin/subscribers', needAdmin(({ res }) => send(res, 200, { items: db().subscribers })));
route('DELETE', '/api/admin/subscribers/:id', needAdmin(({ res, params }) => { db().subscribers = db().subscribers.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true }); }));
route('GET', '/api/admin/messages', needAdmin(({ res }) => send(res, 200, { items: db().messages })));
route('PUT', '/api/admin/messages/:id', needAdmin(async ({ res, params, body }) => { const m = db().messages.find(x => x.id === params.id); if (!m) return fail(res, 404, 'Not found'); m.read = bool(body.read); DB.save(); send(res, 200, { ok: true }); }));
route('DELETE', '/api/admin/messages/:id', needAdmin(({ res, params }) => { db().messages = db().messages.filter(x => x.id !== params.id); DB.save(); send(res, 200, { ok: true }); }));

/* ---- media library (files live in frontend/images) */
function walk(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full, out);
    else if (IMG_EXT.includes(path.extname(f.name).toLowerCase())) { const st = fs.statSync(full); const rel = path.relative(FRONT, full).replace(/\\/g, '/'); out.push({ path: rel, folder: path.dirname(rel).replace(/^images\/?/, '') || '/', name: f.name, size: st.size, mtime: st.mtimeMs }); }
  }
  return out;
}
route('GET', '/api/admin/media', needAdmin(({ res }) => {
  const files = walk(IMAGES, []).sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
  const used = new Set(); const scan = v => { if (typeof v === 'string') { if (v.startsWith('images/')) used.add(v); } else if (Array.isArray(v)) v.forEach(scan); else if (isObj(v)) Object.values(v).forEach(scan); };
  scan(db().products); scan(db().gallery); scan(db().categories); scan(db().pages); scan(db().templates); scan(db().settings);
  send(res, 200, { files: files.map(f => Object.assign(f, { used: used.has(f.path) })), folders: [...new Set(files.map(f => f.folder))].sort() });
}));
const MAGIC = { '.jpg': b => b[0] === 0xff && b[1] === 0xd8, '.jpeg': b => b[0] === 0xff && b[1] === 0xd8, '.png': b => b[0] === 0x89 && b[1] === 0x50, '.gif': b => b.slice(0, 3).toString() === 'GIF', '.webp': b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP', '.svg': b => /<svg/i.test(b.slice(0, 2000).toString()) && !/<script|onload=|javascript:/i.test(b.toString()) };
route('POST', '/api/admin/media', needAdmin(async ({ req, res }) => {
  const buf = await readBody(req, 60 * 1024 * 1024);
  let parsed; try { parsed = MP.parse(buf, req.headers['content-type']); } catch (e) { return fail(res, 400, e.message); }
  const folder = String(parsed.fields.folder || 'uploads').split(/[\\/]+/).map(slugify).filter(Boolean).join('/') || 'uploads';
  const dir = path.resolve(IMAGES, folder); if (dir !== IMAGES && !dir.startsWith(IMAGES + path.sep)) return fail(res, 400, 'Bad folder');
  fs.mkdirSync(dir, { recursive: true });
  const saved = [], skipped = [];
  for (const f of parsed.files) {
    const ext = path.extname(f.filename).toLowerCase();
    if (!IMG_EXT.includes(ext) || !MAGIC[ext](f.data)) { skipped.push(f.filename); continue; }
    let base = slugify(path.basename(f.filename, ext)) || 'image', name = base + ext, n = 2;
    while (fs.existsSync(path.join(dir, name))) name = `${base}-${n++}${ext}`;
    fs.writeFileSync(path.join(dir, name), f.data); saved.push('images/' + (folder ? folder + '/' : '') + name);
  }
  send(res, 200, { saved, skipped });
}));
route('POST', '/api/admin/media/delete', needAdmin(async ({ res, body }) => {
  const paths = Array.isArray(body.paths) ? body.paths : [], removed = [];
  for (const p of paths) {
    const full = path.resolve(FRONT, String(p)); if (!full.startsWith(IMAGES + path.sep) || !IMG_EXT.includes(path.extname(full).toLowerCase())) continue;
    try { fs.unlinkSync(full); removed.push(p); } catch (e) {}
  }
  send(res, 200, { removed });
}));
route('POST', '/api/admin/media/rename', needAdmin(async ({ res, body }) => {
  const from = path.resolve(FRONT, str(body.from, 300)), ext = path.extname(from).toLowerCase();
  const nn = slugify(path.basename(str(body.name, 100), path.extname(str(body.name, 100)))); if (!nn) return fail(res, 400, 'Enter a name.');
  if (!from.startsWith(IMAGES + path.sep) || !fs.existsSync(from)) return fail(res, 404, 'File not found');
  const to = path.join(path.dirname(from), nn + ext); if (fs.existsSync(to)) return fail(res, 409, 'A file with that name exists.');
  fs.renameSync(from, to);
  const oldRel = path.relative(FRONT, from).replace(/\\/g, '/'), newRel = path.relative(FRONT, to).replace(/\\/g, '/');
  const rewrite = v => { if (typeof v === 'string') return v === oldRel ? newRel : v; if (Array.isArray(v)) return v.map(rewrite); if (isObj(v)) { for (const k of Object.keys(v)) v[k] = rewrite(v[k]); } return v; };
  ['products', 'categories', 'pages', 'templates', 'gallery'].forEach(k => rewrite(db()[k])); rewrite(db().settings); DB.save();
  send(res, 200, { path: newRel });
}));

/* ---- backup / restore */
route('GET', '/api/admin/backup', needAdmin(({ res }) => { DB.saveNow(); send(res, 200, Buffer.from(JSON.stringify(db(), null, 1)), { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="vivah-backup-${nowIso().slice(0, 10)}.json"` }); }));
route('POST', '/api/admin/restore', needAdmin(async ({ res, body }) => {
  if (!isObj(body) || !isObj(body.settings) || !Array.isArray(body.products) || !Array.isArray(body.pages)) return fail(res, 400, 'This file is not a Vivah backup.');
  const keepAdmin = db().admin; body.admin = keepAdmin; DB.replaceAll(body); send(res, 200, { ok: true });
}));
route('POST', '/api/admin/reset-content', needAdmin(async ({ res, body }) => {
  if (body.confirm !== 'RESET') return fail(res, 400, 'Type RESET to confirm.');
  const f = (() => { const d = require('./lib/defaults'); const products = d.defaultProducts(); return { settings: d.defaultSettings(), categories: d.defaultCategories(), products, pages: d.defaultPages(products), templates: d.TEMPLATE_PRESETS(), gallery: d.defaultGallery() }; })();
  Object.assign(db(), f); DB.saveNow(); send(res, 200, { ok: true });
}));

/* ================================================================ request handler */
async function handle(req, res) {
  res.req = req;
  const u = new URL(req.url, 'http://x'); req.pathname = u.pathname.replace(/\/{2,}/g, '/');
  const query = Object.fromEntries(u.searchParams);
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const method = req.method === 'HEAD' ? 'GET' : req.method;

  /* API */
  if (req.pathname.startsWith('/api/')) {
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return fail(res, 405, 'Method not allowed');
    if (method !== 'GET' && req.headers['x-requested-with'] !== 'vivah') return fail(res, 403, 'Bad request');
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(req.pathname); if (!m) continue;
      const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      let body = {};
      if (method === 'POST' || method === 'PUT') {
        const ct = req.headers['content-type'] || '';
        if (ct.startsWith('multipart/')) body = null; else body = await readJson(req);
      }
      return r.handler({ req, res, params, query, body, url: u });
    }
    return fail(res, 404, 'Not found');
  }
  if (method !== 'GET') return fail(res, 405, 'Method not allowed');

  const m = db().settings.maintenance, isOwnerArea = req.pathname.startsWith('/owner');

  /* legacy URLs from the original static site */
  if (req.pathname === '/index.html') return redirect(res, '/', 301);
  if (req.pathname === '/category.html') return redirect(res, '/collection/' + encodeURIComponent(query.c || 'bride'), 301);
  if (req.pathname === '/product.html') {
    const list = db().products.filter(p => p.category === query.c); const p = list[parseInt(query.i, 10) || 0];
    return redirect(res, p ? '/product/' + p.id : '/', 301);
  }

  /* clean routes -> HTML shells */
  if (!isOwnerArea && m.enabled && !adminSession(req) && !/\.[a-z0-9]+$/i.test(req.pathname)) return send(res, 503, maintenancePage(), { 'Retry-After': '3600' });
  if (req.pathname === '/') {
    const p = findPage(''); const b = db().settings.brand;
    return send(res, 200, shell('index.html', { title: p.seoTitle || b.title, description: p.seoDescription || b.description, image: p.ogImage }, { page: publicPage(p) }));
  }
  let mm;
  if (req.pathname === '/collections' || req.pathname === '/collections/') {
    const cp = db().settings.collectionsPage, cats = sortedCats().filter(c => c.visible !== false);
    const lists = cats.map(c => publicProductsFor({ c: c.slug })), mixed = [];
    for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => { if (l[i]) mixed.push(l[i]); });
    const virtual = { slug: 'all', mixed: true, label: cp.title, title: cp.title, crumb: cp.crumb || cp.title, tagline: cp.tagline, bannerImage: cp.bannerImage, bannerPos: 'center', buttonLabel: cp.buttonLabel, sizes: [], tabs: [{ label: 'All', slug: '' }, ...cats.map(c => ({ label: c.label, slug: c.slug }))] };
    return send(res, 200, shell('category.html', { title: cp.seoTitle || `${cp.title} | ${db().settings.brand.title.split('|')[0].trim()}`, description: cp.seoDescription || cp.tagline, image: cp.bannerImage }, { category: virtual, products: mixed }));
  }
  if ((mm = /^\/collection\/([^/]+)\/?$/.exec(req.pathname))) {
    const c = catBySlug(decodeURIComponent(mm[1]));
    if (!c || c.visible === false) return notFound(req, res);
    const brand = db().settings.brand.name;
    return send(res, 200, shell('category.html', { title: c.seoTitle || `${c.title} | ${db().settings.brand.title.split('|')[0].trim()}`, description: c.seoDescription || c.tagline, image: c.bannerImage }, { category: c, products: publicProductsFor({ c: c.slug }) }));
  }
  if ((mm = /^\/product\/([^/]+)\/?$/.exec(req.pathname))) {
    const p = db().products.find(x => x.id === decodeURIComponent(mm[1]));
    if (!p || !productVisible(p)) return notFound(req, res);
    const c = catBySlug(p.category), pub = publicProduct(p);
    return send(res, 200, shell('product.html', { title: `${p.name} | ${db().settings.brand.title.split('|')[0].trim()}`, description: p.description || `Rent the ${p.name} for ${db().settings.payments.currencySymbol}${p.price}/day.`, image: p.image }, { category: c, product: pub, siblings: publicProductsFor({ c: p.category }) }));
  }
  if ((mm = /^\/p\/(.+?)\/?$/.exec(req.pathname))) {
    const p = findPage(decodeURIComponent(mm[1]));
    if (!p || !p.published || p.system) return notFound(req, res);
    return send(res, 200, shell('page.html', { title: p.seoTitle || `${p.title} | ${db().settings.brand.title.split('|')[0].trim()}`, description: p.seoDescription, image: p.ogImage }, { page: publicPage(p) }));
  }
  if (req.pathname === '/owner' || req.pathname === '/owner/') return serveFile(req, res, path.join(FRONT, 'owner', 'index.html'), { 'Cache-Control': 'no-store' });
  if (req.pathname === '/robots.txt') { const base = (db().settings.brand.siteUrl || '').replace(/\/$/, ''); return send(res, 200, `User-agent: *\nDisallow: /owner/\nDisallow: /api/\n${base ? 'Sitemap: ' + base + '/sitemap.xml\n' : ''}`, { 'Content-Type': 'text/plain' }); }
  if (req.pathname === '/sitemap.xml') {
    const base = (db().settings.brand.siteUrl || ('http://' + (req.headers.host || 'localhost'))).replace(/\/$/, '');
    const urls = ['/', '/collections', ...db().pages.filter(p => p.published && !p.system).map(p => '/p/' + p.slug), ...db().categories.filter(c => c.visible !== false).map(c => '/collection/' + c.slug), ...db().products.filter(productVisible).map(p => '/product/' + p.id)];
    return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(x => `<url><loc>${esc(base + x)}</loc></url>`).join('')}</urlset>`, { 'Content-Type': 'application/xml' });
  }
  serveStatic(req, res);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(err => {
    const status = err.status || 500; if (status === 500) console.error(err);
    if (!res.headersSent) { if (req.url.startsWith('/api/')) fail(res, status, status === 500 ? 'Server error' : err.message); else send(res, status, 'Error'); } else res.end();
  });
});
server.requestTimeout = 120000;
server.listen(PORT, HOST, () => {
  console.log('===========================================================');
  console.log('  VIVAH Rental Showroom is running');
  console.log(`  Website:  http://localhost:${PORT}/`);
  console.log(`  Owner:    http://localhost:${PORT}/owner/`);
  console.log('===========================================================');
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Close the other program or set a different PORT in start.bat.` : e); process.exit(1); });
