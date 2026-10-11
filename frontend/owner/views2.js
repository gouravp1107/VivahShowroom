/* Owner views: media, header/footer, design, texts, payments, bookings, customers, inbox, settings */
(() => {
const O = window.OWN, { h, $, $$, esc, clone, src, money, fdate } = O, V = O.views;
const getSettings = async () => (await O.api('GET', '/api/admin/settings'));
const saveKeys = async (S, keys) => { const body = {}; keys.forEach(k => body[k] = S[k]); await O.api('PUT', '/api/admin/settings', body); };

/* ============ media ============ */
V.media = { title: 'Images & media', async render(box, top) {
  let files = [], folder = '__all', q = '', onlyUnused = false; const sel = new Set();
  const grid = h('div', { class: 'media-grid' }), folderSel = h('select', { class: 'inp', onchange: e => { folder = e.target.value; draw(); } }), count = h('span', { class: 'muted' }), bulk = h('div', { class: 'toolbar', hidden: true });
  const fileIn = h('input', { type: 'file', multiple: true, accept: 'image/*', hidden: true, onchange: e => { upload([...e.target.files]); e.target.value = ''; } });
  const dz = h('div', { class: 'dz' }, 'Drag images here to upload, or ', h('button', { class: 'btn sm', onclick: () => fileIn.click() }, 'choose files'), fileIn, h('div', { class: 'hint' }, 'JPG, PNG, WebP, GIF or SVG. Uploaded into the folder selected below (default: uploads).'));
  ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => upload([...e.dataTransfer.files]));
  top.append(h('button', { class: 'btn', onclick: O.guard(async () => { const n = await O.prompt('New folder', 'Folder name (e.g. festival-women)'); if (n) { folder = n.toLowerCase().replace(/[^a-z0-9]+/g, '-'); O.toast('Folder "' + folder + '" will be created when you upload an image into it'); if (![...folderSel.options].some(o => o.value === folder)) folderSel.append(h('option', { value: folder }, folder)); folderSel.value = folder; draw(); } }) }, '+ New folder'));
  box.append(dz, h('div', { class: 'toolbar' }, folderSel, h('input', { class: 'inp', placeholder: 'Search file name\u2026', oninput: e => { q = e.target.value.toLowerCase(); draw(); } }), h('label', { class: 'row' }, h('input', { type: 'checkbox', onchange: e => { onlyUnused = e.target.checked; draw(); } }), 'Only images not used anywhere'), h('span', { class: 'sp' }), count), bulk, grid);
  async function upload(list) { list = list.filter(f => f.type.startsWith('image/')); if (!list.length) return O.toast('Choose image files', 'err'); O.toast('Uploading ' + list.length + '\u2026'); const fd = new FormData(); fd.append('folder', folder === '__all' || folder === '/' ? 'uploads' : folder); list.forEach(f => fd.append('files', f)); try { const r = await O.api('POST', '/api/admin/media', undefined, fd); if (r.skipped.length) O.toast('Not valid images: ' + r.skipped.join(', '), 'err'); else O.toast(r.saved.length + ' uploaded', 'ok'); await load(); } catch (e) { O.toast(e.message, 'err'); } }
  async function load() { const r = await O.api('GET', '/api/admin/media'); files = r.files; const cur = folder; folderSel.replaceChildren(h('option', { value: '__all' }, 'All folders'), ...r.folders.map(f => h('option', { value: f }, f === '/' ? '(root)' : f))); if (![...folderSel.options].some(o => o.value === cur)) folderSel.append(h('option', { value: cur }, cur)); folderSel.value = cur; draw(); }
  function draw() {
    const list = files.filter(f => (folder === '__all' || f.folder === folder) && (!q || f.path.toLowerCase().includes(q)) && (!onlyUnused || !f.used)); count.textContent = list.length + ' images';
    grid.replaceChildren(...list.slice(0, 400).map(f => h('div', { class: 'media-item' }, h('input', { class: 'sel', type: 'checkbox', checked: sel.has(f.path), onchange: e => { e.target.checked ? sel.add(f.path) : sel.delete(f.path); drawBulk(); } }), f.used ? h('span', { class: 'tag' }, 'in use') : null, h('img', { src: '/' + f.path, loading: 'lazy', onclick: () => preview(f) }), h('div', { class: 'meta' }, h('b', { title: f.path }, f.name), Math.round(f.size / 1024) + ' KB'))));
    if (list.length > 400) grid.append(h('p', { class: 'muted' }, 'Showing 400 of ' + list.length + '. Use search or a folder.')); drawBulk();
  }
  function drawBulk() { bulk.hidden = !sel.size; bulk.replaceChildren(h('b', null, sel.size + ' selected'), h('button', { class: 'btn sm danger', onclick: O.guard(async () => { const used = files.filter(f => sel.has(f.path) && f.used).length; if (await O.confirm('Delete ' + sel.size + ' image file(s) from the server permanently?' + (used ? ' ' + used + ' of them are currently used on the website and will show as broken.' : ''), 'Delete', true)) { await O.api('POST', '/api/admin/media/delete', { paths: [...sel] }); sel.clear(); await load(); O.toast('Deleted', 'ok'); } }) }, 'Delete selected'), h('button', { class: 'btn sm', onclick: () => { sel.clear(); draw(); } }, 'Clear')); }
  function preview(f) { O.modal(f.name, a => { a.body.append(h('img', { src: '/' + f.path, style: { maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: '0 auto' } }), h('dl', { class: 'kv', style: { marginTop: '12px' } }, h('dt', null, 'Path'), h('dd', null, f.path), h('dt', null, 'Size'), h('dd', null, Math.round(f.size / 1024) + ' KB'), h('dt', null, 'Used on site'), h('dd', null, f.used ? 'Yes' : 'No'))); a.button('Copy path', '', () => { navigator.clipboard && navigator.clipboard.writeText(f.path); O.toast('Copied'); }); a.button('Rename', '', async () => { const n = await O.prompt('Rename file', 'New name (without extension)', f.name.replace(/\.[^.]+$/, '')); if (n) { await O.api('POST', '/api/admin/media/rename', { from: f.path, name: n }); a.close(); await load(); O.toast('Renamed (links on the website were updated)', 'ok'); } }); a.button('Close', 'primary', () => a.close()); }); }
  await load();
} };

/* ============ header & footer ============ */
V.headerfooter = { title: 'Header & footer', async render(box, top) {
  const { settings: S } = await getSettings(); await O.categories(); await O.pages();
  O.saveButton(top, () => saveKeys(S, ['header', 'footer', 'brand']));
  const linkDef = (k, label, withChildren) => ({ k, label, type: 'list', item: [{ k: 'label', label: 'Text', type: 'text' }, { k: 'url', label: 'Link', type: 'url' }, ...(withChildren ? [{ k: 'children', label: 'Dropdown links (optional)', type: 'list', item: [{ k: 'label', label: 'Text', type: 'text' }, { k: 'url', label: 'Link', type: 'url' }], itemLabel: x => x.label, newItem: { label: 'Link', url: '/' } }] : [])], itemLabel: x => x.label, newItem: { label: 'New link', url: '/' } });
  box.append(
    O.formCard('Logo', [{ k: 'name', label: 'Brand name', type: 'text' }, { k: 'sub', label: 'Under-name text', type: 'text' }, { k: 'showMark', label: 'Show the flower ornament above the name', type: 'bool' }, { k: 'logoImage', label: 'Logo image (replaces the text logo if set)', type: 'image' }, { k: 'favicon', label: 'Browser tab icon', type: 'image' }], S.brand),
    O.formCard('Header menu', [{ k: 'sticky', label: 'Keep header fixed at top while scrolling', type: 'bool' }, linkDef('links', 'Menu links (in order)', true)], S.header),
    O.formCard('Header icons', [{ k: 'theme', label: 'Dark-mode button', type: 'bool' }, { k: 'search', label: 'Search', type: 'bool' }, { k: 'wishlist', label: 'Wishlist', type: 'bool' }, { k: 'account', label: 'Account / login', type: 'bool' }, { k: 'cart', label: 'Bookings (bag) button', type: 'bool' }], S.header.show),
    O.formCard('Announcement bar (above the header)', [{ k: 'enabled', label: 'Show announcement bar', type: 'bool' }, { k: 'text', label: 'Text', type: 'text' }, { k: 'link', label: 'Link (optional)', type: 'url' }, { k: 'bg', label: 'Background colour', type: 'color' }, { k: 'color', label: 'Text colour', type: 'color' }], S.header.announcement),
    O.formCard('Footer links', [linkDef('links', 'Links', false)], S.footer),
    O.formCard('Footer newsletter box', [{ k: 'enabled', label: 'Show the email sign-up', type: 'bool' }, { k: 'label', label: 'Heading', type: 'text' }, { k: 'placeholder', label: 'Placeholder', type: 'text' }, { k: 'success', label: 'Success message', type: 'text' }, { k: 'error', label: 'Error message', type: 'text' }], S.footer.subscribe),
    O.formCard('Footer social & bottom line', [{ k: 'social', label: 'Social links (text shown in the round button, e.g. IG, f, P)', type: 'list', item: [{ k: 'label', label: 'Text / letters', type: 'text' }, { k: 'url', label: 'Link', type: 'url' }], itemLabel: x => x.label, newItem: { label: 'IG', url: 'https://' } }, { k: 'copyright', label: 'Copyright line (empty = automatic)', type: 'text' }, { k: 'ownerLabel', label: 'Owner login link text', type: 'text' }, { k: 'ownerUrl', label: 'Owner login link address', type: 'text' }], S.footer));
} };

/* ============ design ============ */
V.design = { title: 'Design & theme', async render(box, top) {
  const { settings: S, defaults } = await getSettings(); const T = S.theme;
  O.saveButton(top, () => saveKeys(S, ['theme']));
  const names = [['cream', 'Page background'], ['ivory', 'Header / panels'], ['paper', 'Cards'], ['ink', 'Text'], ['dark', 'Footer'], ['gold', 'Accent (gold)'], ['goldL', 'Accent light'], ['line', 'Borders'], ['green', 'Available (green)'], ['red', 'Few left / error (red)']];
  box.append(O.formCard('Light theme colours', names.map(([k, l]) => ({ k, label: l, type: 'color' })), T.light), O.formCard('Dark theme colours', names.map(([k, l]) => ({ k, label: l, type: 'color' })), T.dark),
    h('div', { class: 'row', style: { marginBottom: '18px' } }, h('button', { class: 'btn', onclick: () => { Object.assign(T.light, defaults.theme.light); Object.assign(T.dark, defaults.theme.dark); O.markDirty(); O.toast('Original colours restored \u2014 press Save'); location.reload; } }, 'Restore original colours (then reload page)')),
    O.formCard('Fonts & mode', [{ k: 'defaultMode', label: 'Default mode for new visitors', type: 'select', options: [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Follow visitor device']] }, { k: 'showThemeToggle', label: 'Allow visitors to switch dark mode', type: 'bool' }, { k: 'photoBrightness', label: 'Photo brightness for spotlight and gallery pictures (1 = original)', type: 'number', min: 0.5, max: 2, step: 0.01 }, { k: 'posterBrightness', label: 'Poster brightness (1 = original, 1.12 = slightly brighter, 1.3 = much brighter)', type: 'number', min: 0.5, max: 2, step: 0.01 }, { k: 'fontsUrl', label: 'Google Fonts link', type: 'text' }, { k: 'fontSerif', label: 'Heading font (CSS)', type: 'text' }, { k: 'fontSans', label: 'Body font (CSS)', type: 'text' }], T),
    O.formCard('Advanced code (applies to every page)', [{ k: 'customCss', label: 'Custom CSS', type: 'code', rows: 8 }, { k: 'customHead', label: 'Extra <head> code (analytics, pixels, verification tags)', type: 'code', rows: 5 }, { k: 'customJs', label: 'Custom JavaScript (runs on every page)', type: 'code', rows: 6 }], T),
    h('p', { class: 'muted' }, 'Tip: after saving, open the website in a new tab to see the change.'));
} };

/* ============ texts ============ */
V.texts = { title: 'Text, login & payment windows', async render(box, top) {
  const r = await getSettings(), S = r.settings, groups = r.uiGroups, defaults = r.uiDefaults;
  O.saveButton(top, () => saveKeys(S, ['ui']));
  const q = h('input', { class: 'inp', placeholder: 'Search any text\u2026', oninput: e => draw(e.target.value.toLowerCase()) }), host = h('div');
  box.append(h('p', { class: 'muted' }, 'Every label, button, message and heading used in the collection pages, product page, booking form, login window, payment window, search, wishlist and bookings panels. Use {name} style placeholders exactly as shown.'), h('div', { class: 'toolbar' }, q), host);
  function draw(f) {
    host.replaceChildren(...groups.map(g => { const items = g.items.filter(([k, l]) => !f || (k + ' ' + l + ' ' + S.ui[k]).toLowerCase().includes(f)); if (!items.length) return null;
      return h('section', { class: 'card' }, h('h3', { class: 'card-t' }, g.group), h('div', { class: 'grid2' }, ...items.map(([k, l]) => h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, l), h('input', { class: 'inp', value: S.ui[k] == null ? '' : S.ui[k], oninput: e => { S.ui[k] = e.target.value; O.markDirty(); } }), S.ui[k] !== defaults[k] ? h('small', { class: 'hint' }, 'Original: ' + defaults[k]) : null)))); }));
  }
  draw('');
} };

/* ============ payments & booking ============ */
V.payments = { title: 'Payment & booking settings', async render(box, top) {
  const { settings: S } = await getSettings(); const P = S.payments;
  O.saveButton(top, () => saveKeys(S, ['payments', 'booking']));
  box.append(h('div', { class: 'notice' }, 'The payment window offers the methods you switch on below. Online payments use Razorpay (you need your own Razorpay account and keys). UPI is a manual method: the customer pays to your UPI ID and enters the reference number; you verify it under Bookings. Card details are never handled by this website.'),
    O.formCard('Booking rules', [{ k: 'requireLogin', label: 'Customers must log in before booking', type: 'bool' }, { k: 'maxDays', label: 'Maximum rental days per booking', type: 'number', min: 1 }, { k: 'events', label: 'Event types in the booking form', type: 'strings' }], S.booking),
    O.formCard('Deposit & currency', [{ k: 'depositPercent', label: 'Deposit to pay when booking (% of total rental)', type: 'number', min: 0, max: 100 }, { k: 'currencySymbol', label: 'Currency symbol', type: 'text' }, { k: 'terms', label: 'Small note shown in the payment window (refund policy etc.)', type: 'area', rows: 2 }], P),
    O.formCard('Online payment \u2014 Razorpay', [{ k: 'enabled', label: 'Enable Razorpay (UPI, cards, netbanking)', type: 'bool' }, { k: 'keyId', label: 'Key ID', type: 'text', placeholder: 'rzp_live_\u2026' }, { k: 'keySecret', label: 'Key secret (hidden after saving; leave as is to keep it)', type: 'text' }], P.razorpay),
    O.formCard('UPI (manual verification)', [{ k: 'enabled', label: 'Enable UPI', type: 'bool' }, { k: 'id', label: 'Your UPI ID', type: 'text', placeholder: 'name@bank' }, { k: 'name', label: 'Name shown in the UPI app', type: 'text' }], P.upi),
    O.formCard('Pay at showroom', [{ k: 'enabled', label: 'Allow "pay at the showroom"', type: 'bool' }], P.cash));
} };

/* ============ bookings ============ */
V.bookings = { title: 'Bookings & payments', async render(box, top) {
  let items = (await O.api('GET', '/api/admin/bookings')).items; const st = { status: '', q: '' };
  const sel = h('select', { class: 'inp', onchange: e => { st.status = e.target.value; draw(); } }, h('option', { value: '' }, 'All statuses'), ...['pending', 'confirmed', 'picked-up', 'returned', 'cancelled'].map(x => h('option', null, x)), h('option', { value: '__verify' }, 'Payment to verify'));
  const tbl = h('div', { class: 'tbl-wrap' });
  box.append(h('div', { class: 'toolbar' }, h('input', { class: 'inp', placeholder: 'Search id, name or phone\u2026', oninput: e => { st.q = e.target.value.toLowerCase(); draw(); } }), sel), tbl);
  function draw() {
    const list = items.filter(b => (!st.status || (st.status === '__verify' ? b.payment.status === 'verification' : b.status === st.status)) && (!st.q || (b.id + ' ' + b.name + ' ' + b.phone).toLowerCase().includes(st.q)));
    tbl.replaceChildren(list.length ? h('table', null, h('thead', null, h('tr', null, ...['Booking', 'Customer', 'Items', 'Dates', 'Total', 'Paid', 'Status', 'Payment', ''].map(x => h('th', null, x)))), h('tbody', null, ...list.map(b => h('tr', null, h('td', null, h('b', null, b.id), h('div', { class: 'muted' }, fdate(b.createdAt))), h('td', null, b.name, h('div', { class: 'muted' }, b.phone)), h('td', null, b.items.map(i => i.name + ' (' + i.size + ')').join(', ')), h('td', null, b.start + ' \u2192 ' + b.end, h('div', { class: 'muted' }, b.days + ' days \u00B7 ' + b.event)), h('td', null, money(b.total)), h('td', null, money(b.payment.paid)), h('td', null, h('span', { class: 'pill ' + b.status }, b.status)), h('td', null, h('span', { class: 'pill ' + b.payment.status }, b.payment.status), b.payment.pending && b.payment.pending.ref ? h('div', { class: 'muted' }, 'UTR ' + b.payment.pending.ref) : null), h('td', null, h('button', { class: 'btn sm primary', onclick: () => open(b) }, 'Open')))))) : h('div', { class: 'empty' }, 'No bookings found.'));
  }
  function open(b) {
    O.modal('Booking ' + b.id, a => {
      const notes = h('textarea', { class: 'inp', rows: 3, value: b.adminNotes || '', placeholder: 'Private notes (not shown to the customer)' });
      const stSel = h('select', { class: 'inp', onchange: O.guard(async e => { const r = await O.api('PUT', '/api/admin/bookings/' + b.id, { status: e.target.value }); Object.assign(b, r.item); draw(); O.refreshBadges(); O.toast('Status updated', 'ok'); }) }, ...['pending', 'confirmed', 'picked-up', 'returned', 'cancelled'].map(x => h('option', { selected: b.status === x }, x)));
      a.body.append(h('dl', { class: 'kv' }, h('dt', null, 'Customer'), h('dd', null, b.name + ' \u00B7 ' + b.phone + (b.phone2 ? ' \u00B7 partner ' + b.phone2 : '')), h('dt', null, 'Dates'), h('dd', null, b.start + ' \u2192 ' + b.end + ' (' + b.days + ' days) \u00B7 ' + b.event), h('dt', null, 'Items'), h('dd', null, b.items.map(i => i.name + ' \u00B7 ' + i.code + ' \u00B7 size ' + i.size + ' \u00B7 ' + money(i.price) + '/day').join('; ')), h('dt', null, 'Total / deposit'), h('dd', null, money(b.total) + ' / ' + money(b.deposit)), h('dt', null, 'Paid'), h('dd', null, money(b.payment.paid) + ' (' + b.payment.status + ')'), h('dt', null, 'Customer notes'), h('dd', null, b.notes || '\u2014')),
        h('label', { class: 'fld', style: { margin: '14px 0' } }, h('span', { class: 'fld-l' }, 'Booking status'), stSel),
        b.payment.pending && b.payment.pending.ref ? h('div', { class: 'notice' }, 'Customer reports a UPI payment of ' + money(b.payment.pending.amount) + ', reference ' + b.payment.pending.ref + '. Check your bank/UPI app, then record it below.') : null,
        h('h4', null, 'Payments'), b.payment.history.length ? h('table', null, h('tbody', null, ...b.payment.history.map(p => h('tr', null, h('td', null, fdate(p.at)), h('td', null, p.method), h('td', null, money(p.amount)), h('td', null, p.ref || p.note || ''))))) : h('p', { class: 'muted' }, 'No payments recorded.'),
        h('div', { class: 'row', style: { margin: '10px 0' } }, (() => { const amt = h('input', { class: 'inp sm', type: 'number', placeholder: 'Amount (negative = refund)', value: b.payment.pending ? b.payment.pending.amount : Math.max(0, b.deposit - b.payment.paid) }), m = h('select', { class: 'inp sm' }, ...['cash', 'upi', 'card', 'bank', 'razorpay'].map(x => h('option', null, x))), ref = h('input', { class: 'inp sm', placeholder: 'Reference (optional)', value: b.payment.pending && b.payment.pending.ref || '' }); return [amt, m, ref, h('button', { class: 'btn sm primary', onclick: O.guard(async () => { const r = await O.api('POST', '/api/admin/bookings/' + b.id + '/payment', { amount: amt.value, method: m.value, ref: ref.value }); Object.assign(b, r.item); draw(); a.close(); open(b); O.refreshBadges(); O.toast('Payment recorded', 'ok'); }) }, 'Record payment')]; })()),
        h('label', { class: 'fld' }, h('span', { class: 'fld-l' }, 'Private notes'), notes));
      a.button('Delete booking', 'danger', async () => { if (await O.confirm('Delete booking ' + b.id + ' permanently?', 'Delete', true)) { await O.api('DELETE', '/api/admin/bookings/' + b.id); items = items.filter(x => x !== b); a.close(); draw(); } });
      a.button('Save notes', '', async () => { const r = await O.api('PUT', '/api/admin/bookings/' + b.id, { adminNotes: notes.value }); Object.assign(b, r.item); O.toast('Saved', 'ok'); });
      a.button('Close', 'primary', () => a.close());
    }, { wide: true });
  }
  draw();
} };

/* ============ customers ============ */
V.customers = { title: 'Customers', async render(box) {
  const items = (await O.api('GET', '/api/admin/customers')).items;
  box.append(items.length ? h('div', { class: 'tbl-wrap' }, h('table', null, h('thead', null, h('tr', null, ...['Name', 'Mobile', 'Email', 'Joined', 'Bookings', 'Status', ''].map(x => h('th', null, x)))), h('tbody', null, ...items.map(c => h('tr', null, h('td', null, c.name), h('td', null, c.phone), h('td', null, c.email || '\u2014'), h('td', null, fdate(c.createdAt)), h('td', null, c.bookings), h('td', null, c.blocked ? h('span', { class: 'pill out' }, 'Blocked') : h('span', { class: 'pill ok' }, 'Active')),
    h('td', null, h('button', { class: 'btn sm', onclick: O.guard(async () => { await O.api('PUT', '/api/admin/customers/' + c.id, { blocked: !c.blocked }); location.reload(); }) }, c.blocked ? 'Unblock' : 'Block'), ' ', h('button', { class: 'btn sm', onclick: O.guard(async () => { const p = await O.prompt('Set a new password for ' + c.name, 'New password (min 6 characters)'); if (p) { await O.api('PUT', '/api/admin/customers/' + c.id, { newPassword: p }); O.toast('Password changed', 'ok'); } }) }, 'Reset password'), ' ', h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Delete ' + c.name + '? Their bookings stay.', 'Delete', true)) { await O.api('DELETE', '/api/admin/customers/' + c.id); location.reload(); } }) }, 'Delete'))))))) : h('div', { class: 'empty' }, 'No customer accounts yet.'));
} };

/* ============ messages & subscribers ============ */
V.inbox = { title: 'Messages & subscribers', async render(box) {
  const msgs = (await O.api('GET', '/api/admin/messages')).items, subs = (await O.api('GET', '/api/admin/subscribers')).items; let tab = 'm';
  const body = h('div'), tabs = h('div', { class: 'tabs' }); box.append(tabs, body);
  function draw() {
    tabs.replaceChildren(h('button', { class: tab === 'm' ? 'on' : '', onclick: () => { tab = 'm'; draw(); } }, 'Messages (' + msgs.length + ')'), h('button', { class: tab === 's' ? 'on' : '', onclick: () => { tab = 's'; draw(); } }, 'Newsletter subscribers (' + subs.length + ')'));
    if (tab === 'm') body.replaceChildren(...(msgs.length ? msgs.map(m => h('section', { class: 'card', style: m.read ? { opacity: .7 } : { borderColor: 'var(--gold)' } }, h('div', { class: 'row' }, h('b', null, m.name), h('span', { class: 'muted' }, [m.phone, m.email].filter(Boolean).join(' \u00B7 ')), m.subject ? h('span', { class: 'pill' }, m.subject) : null, h('span', { class: 'right muted' }, fdate(m.at))), m.date ? h('p', { class: 'muted' }, 'Preferred date: ' + m.date) : null, h('p', { style: { whiteSpace: 'pre-wrap' } }, m.message), h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: O.guard(async () => { await O.api('PUT', '/api/admin/messages/' + m.id, { read: !m.read }); m.read = !m.read; draw(); O.refreshBadges(); }) }, m.read ? 'Mark unread' : 'Mark read'), m.phone ? h('a', { class: 'btn sm', href: 'tel:' + m.phone }, 'Call') : null, m.email ? h('a', { class: 'btn sm', href: 'mailto:' + m.email }, 'Email') : null, h('button', { class: 'btn sm', onclick: O.guard(async () => { if (await O.confirm('Delete this message?', 'Delete', true)) { await O.api('DELETE', '/api/admin/messages/' + m.id); msgs.splice(msgs.indexOf(m), 1); draw(); O.refreshBadges(); } }) }, 'Delete')))) : [h('div', { class: 'empty' }, 'No messages yet.')]));
    else body.replaceChildren(h('div', { class: 'toolbar' }, h('button', { class: 'btn', onclick: () => { const blob = new Blob(['email,date\n' + subs.map(s => s.email + ',' + s.at).join('\n')], { type: 'text/csv' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'subscribers.csv' }); document.body.append(a); a.click(); a.remove(); } }, 'Download CSV')), subs.length ? h('div', { class: 'tbl-wrap' }, h('table', null, h('tbody', null, ...subs.map(s => h('tr', null, h('td', null, s.email), h('td', null, fdate(s.at)), h('td', null, h('button', { class: 'btn sm', onclick: O.guard(async () => { await O.api('DELETE', '/api/admin/subscribers/' + s.id); subs.splice(subs.indexOf(s), 1); draw(); }) }, 'Remove'))))))) : h('div', { class: 'empty' }, 'No subscribers yet.'));
  }
  draw();
} };

/* ============ settings ============ */
V.settings = { title: 'Settings & backup', async render(box, top) {
  const { settings: S } = await getSettings();
  O.saveButton(top, () => saveKeys(S, ['brand', 'maintenance']));
  const acc = { username: O.me().username, current: '', next: '' };
  box.append(
    O.formCard('Business details (shown on Contact sections)', [{ k: 'phone', label: 'Phone', type: 'text' }, { k: 'whatsapp', label: 'WhatsApp number (with country code)', type: 'text' }, { k: 'email', label: 'Email', type: 'text' }, { k: 'hours', label: 'Opening hours', type: 'text' }, { k: 'address', label: 'Showroom address', type: 'area', rows: 2 }], S.brand),
    O.formCard('Website search-engine details', [{ k: 'title', label: 'Home page title', type: 'text' }, { k: 'description', label: 'Home page description', type: 'area', rows: 2 }, { k: 'siteUrl', label: 'Your website address (e.g. https://www.vivahrentals.in) \u2014 used in sitemap.xml', type: 'text' }], S.brand),
    O.formCard('Maintenance mode', [{ k: 'enabled', label: 'Show a "we will be back soon" page to visitors (you can still use the owner panel)', type: 'bool' }, { k: 'message', label: 'Message', type: 'area', rows: 2 }], S.maintenance),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Owner account'), h('div', { class: 'grid2' }, ...O.fields([{ k: 'username', label: 'Username', type: 'text' }, { k: 'current', label: 'Current password', type: 'text' }, { k: 'next', label: 'New password (min 8 characters; leave empty to keep)', type: 'text' }], acc, () => {})), h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onclick: O.guard(async () => { await O.api('POST', '/api/admin/account', { username: acc.username, current: acc.current, next: acc.next }); O.toast('Account updated', 'ok'); }) }, 'Update account'))),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Backup & restore'), h('p', { class: 'muted' }, 'A backup contains all pages, text, products, bookings and customers (not the image files \u2014 those live in frontend/images). The server also keeps a daily copy in backend/data/backups.'),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '/api/admin/backup' }, 'Download backup'), (() => { const f = h('input', { type: 'file', accept: '.json', hidden: true, onchange: O.guard(async e => { const file = e.target.files[0]; if (!file) return; if (!await O.confirm('Restore from "' + file.name + '"? This replaces ALL current content.', 'Restore', true)) return; await O.api('POST', '/api/admin/restore', JSON.parse(await file.text())); O.toast('Restored', 'ok'); setTimeout(() => location.reload(), 800); }) }); return [f, h('button', { class: 'btn', onclick: () => f.click() }, 'Restore from backup file\u2026')]; })())),
    h('section', { class: 'card' }, h('h3', { class: 'card-t' }, 'Reset website content'), h('p', { class: 'muted' }, 'Puts all pages, texts, settings, collections and products back to the original version. Bookings and customers are kept.'), h('button', { class: 'btn danger', onclick: O.guard(async () => { const t = await O.prompt('Reset everything', 'Type RESET to confirm'); if (t === 'RESET') { await O.api('POST', '/api/admin/reset-content', { confirm: 'RESET' }); O.toast('Reset done', 'ok'); setTimeout(() => location.reload(), 800); } }) }, 'Reset to original')));
} };
})();
