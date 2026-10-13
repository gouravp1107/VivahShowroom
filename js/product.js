(() => {
const V = window.VIVAH, { esc, nl, t, rupee, src, $, $$, api } = V, B = V.blocks, app = $('#app');
const p = V.BOOT.product, cat = V.BOOT.category || {}, siblings = V.BOOT.siblings || [];
const L = (V.SITE.layouts || {}).product || {};
if (!p) { app.innerHTML = `<p class="cp-empty">${esc(t('pd.notFound'))} <a href="/">${esc(t('pd.backHome'))}</a></p>`; return; }
const sizes = p.sizes.length ? p.sizes : ['Free size'], events = (V.SITE.booking || {}).events || ['Wedding'];
const out = p.status === 'Out of Stock';
const imgs = [p.image, ...(p.images || [])].filter(Boolean);
const specs = [[t('pd.detCollection'), cat.crumb || cat.label || ''], [t('pd.detColour'), p.color], [t('pd.detCode'), p.code], [t('pd.detSizes'), sizes.join(', ')], ...(p.specs || []).map(s => [s.k, s.v])].filter(x => x[1]);
app.innerHTML = `<div id="blk-before"></div><div class="pd" id="pd"><div class="pd-media"><figure class="gold-frame"><img id="pd-img" src="${esc(src(p.image))}" alt="${esc(p.name)}"></figure>${imgs.length > 1 ? `<div class="pd-thumbs">${imgs.map((i, k) => `<button data-i="${esc(src(i))}" class="${k ? '' : 'on'}"><img src="${esc(src(i))}" alt=""></button>`).join('')}</div>` : ''}</div>
 <div class="pd-info" id="pd-info"><p class="cp-crumb"><a href="/">${esc(t('cat.crumbHome'))}</a> <span>&rsaquo;</span> <a href="/collection/${esc(p.category)}">${esc(cat.crumb || cat.label || '')}</a> <span>&rsaquo;</span> <b>${esc(p.name)}</b></p>
  <p class="eyebrow">${esc(t('cat.code'))} ${esc(p.code)}</p><h1>${esc(p.name)}</h1>
  <p class="pd-price">${esc(t('cat.rental'))} ${rupee(p.price)} ${esc(t('cat.perDay'))}</p><p class="status ${B.statusCls(p.status)}">${esc(B.statusLabel(p.status))}</p>
  <ul class="pd-badges"><li>${esc(t('pd.badge1'))}</li><li>${esc(t('pd.badge2'))}</li><li>${esc(t('pd.badge3'))}</li></ul>
  ${p.description ? `<p class="pd-desc">${nl(p.description)}</p>` : ''}
  <dl class="pd-details">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  <div class="pd-card gold-frame"><h2 class="pd-card-title">${esc(t('pd.reserveTitle'))}</h2><p class="pd-card-sub">${esc(t('pd.reserveSub'))}</p>
  <form id="pd-form" novalidate>
   <h3 class="pd-step"><span>1</span>${esc(t('pd.step1'))}</h3>
   <fieldset><legend class="sr-only">${esc(t('pd.step1'))}</legend><div class="pd-sizes">${sizes.map((s, k) => `<label><input type="radio" name="size" value="${esc(s)}" ${k ? '' : 'checked'}><span>${esc(s)}</span></label>`).join('')}</div></fieldset>
   <h3 class="pd-step"><span>2</span>${esc(t('pd.step2'))}</h3>
   <div class="pd-row"><label>${esc(t('pd.start'))}<input type="date" id="f-start" required></label><label>${esc(t('pd.end'))}<input type="date" id="f-end" required></label></div>
   <label>${esc(t('pd.event'))}<select id="f-event">${events.map(e => `<option>${esc(e)}</option>`).join('')}</select></label>
   <h3 class="pd-step"><span>3</span>${esc(t('pd.step3'))}</h3>
   <div class="pd-row"><label>${esc(t('pd.name'))}<input id="f-name" required autocomplete="name" placeholder="${esc(t('pd.namePh'))}"></label><label>${esc(t('pd.phone'))}<input id="f-phone" type="tel" inputmode="numeric" placeholder="${esc(t('pd.phonePh'))}" required></label></div>
   <label>${esc(t('pd.phone2'))}<input id="f-phone2" type="tel" inputmode="numeric" placeholder="${esc(t('pd.phone2Ph'))}"></label>
   <label>${esc(t('pd.notes'))}<textarea id="f-notes" rows="2" placeholder="${esc(t('pd.notesPh'))}"></textarea></label>
   <div class="pd-total"><span id="pd-days">${esc(t('pd.selectDates'))}</span><b id="pd-sum"></b></div>
   <p class="pd-err" id="pd-err" role="alert"></p>
   <button class="btn btn-gold pd-submit" type="submit" ${out ? 'disabled' : ''}>${esc(out ? t('status.out') : t('pd.submit'))}</button>
   <p class="pd-note">${esc(t('pd.note'))}</p>
  </form><div class="pd-done" id="pd-done" hidden></div></div></div></div>
 <section class="sec pd-related" id="pd-related" hidden><div class="sec-head"><p class="eyebrow">${esc(t('pd.related'))}</p><h2>${esc(t('pd.moreFrom'))} ${esc(cat.crumb || cat.label || '')}</h2><span class="orn">&#10048;</span></div><div class="trend-row" id="pd-rel"></div></section><div id="blk-after"></div>`;
if ((L.before || []).length) B.render($('#blk-before'), L.before);
if ((L.after || []).length) B.render($('#blk-after'), L.after);
$$('.pd-thumbs button').forEach(b => b.addEventListener('click', () => { $('#pd-img').src = b.dataset.i; $$('.pd-thumbs button').forEach(x => x.classList.toggle('on', x === b)); }));

const today = new Date().toISOString().slice(0, 10); ['f-start', 'f-end'].forEach(id => $('#' + id).min = today);
let avail = true;
async function checkAvail() {
  const a = $('#f-start').value, b = $('#f-end').value; avail = true; if (!a || !b || b < a) return;
  try { const r = await api('GET', `/api/products/${encodeURIComponent(p.id)}/availability?start=${a}&end=${b}`); avail = r.available > 0; $('#pd-err').textContent = avail ? '' : p.name + ' is already reserved for these dates. Please choose other dates.'; } catch (e) {}
}
const calc = () => { const a = $('#f-start').value, b = $('#f-end').value; if (!a || !b || b < a) { $('#pd-days').textContent = t('pd.selectDates'); $('#pd-sum').textContent = ''; return 0; }
  const d = Math.round((new Date(b) - new Date(a)) / 864e5) + 1; $('#pd-days').textContent = `${d} ${d > 1 ? t('pd.days') : t('pd.day')} \u00D7 ${rupee(p.price)}`; $('#pd-sum').textContent = rupee(d * p.price); return d; };
$('#f-start').addEventListener('change', () => { if ($('#f-end').value < $('#f-start').value) $('#f-end').value = $('#f-start').value; $('#f-end').min = $('#f-start').value; calc(); checkAvail(); });
$('#f-end').addEventListener('change', () => { calc(); checkAvail(); });
setTimeout(() => { const c = V.state.customer; if (c) { if (!$('#f-name').value) $('#f-name').value = c.name; if (!$('#f-phone').value) $('#f-phone').value = c.phone; } }, 700);

async function submit() {
  const err = $('#pd-err'), d = calc(), ph = v => v.replace(/\D/g, '').length >= 10;
  if (!$('#f-name').value.trim()) return err.textContent = t('pd.errName');
  if (!ph($('#f-phone').value)) return err.textContent = t('pd.errPhone');
  if ($('#f-phone2').value && !ph($('#f-phone2').value)) return err.textContent = t('pd.errPhone2');
  if (!d) return err.textContent = t('pd.errDates');
  if (!avail) return;
  err.textContent = '';
  const size = $('input[name=size]:checked').value, btn = $('.pd-submit'); btn.disabled = true;
  if (V.STATIC) {
    const days = d, total = days * p.price, text = `Booking request\n${p.name} (code ${p.code}), size ${size}\nDates: ${$('#f-start').value} to ${$('#f-end').value} (${days} ${days > 1 ? 'days' : 'day'})\nEvent: ${$('#f-event').value}\nEstimated rental: ${rupee(total)}\nName: ${$('#f-name').value.trim()}\nPhone: ${$('#f-phone').value}${$('#f-phone2').value ? '\nPartner phone: ' + $('#f-phone2').value : ''}${$('#f-notes').value ? '\nNotes: ' + $('#f-notes').value : ''}`;
    const link = V.contactUrl(text, 'Booking request: ' + p.name);
    $('#pd-form').hidden = true; const done = $('#pd-done'); done.hidden = false;
    done.innerHTML = `<h2>${esc(t('pd.doneTitle'))}</h2><p>${link ? 'Send your request to the showroom to complete it.' : 'Please call the showroom with these details.'}</p><pre class="pd-summary">${esc(text)}</pre><p>${link ? `<a class="btn btn-gold" target="_blank" rel="noopener" href="${esc(link)}">Send booking request</a> ` : ''}<a class="btn btn-outline" href="/collection/${esc(p.category)}">${esc(t('pd.keepBrowsing'))}</a></p>`;
    return;
  }
  try {
    const r = await api('POST', '/api/bookings', { items: [{ productId: p.id, size }], start: $('#f-start').value, end: $('#f-end').value, event: $('#f-event').value, name: $('#f-name').value, phone: $('#f-phone').value, phone2: $('#f-phone2').value, notes: $('#f-notes').value });
    const b = r.booking; V.rememberBooking(b); V.updateBadge();
    $('#pd-form').hidden = true; const done = $('#pd-done'); done.hidden = false;
    done.innerHTML = `<h2>${esc(t('pd.doneTitle'))}</h2><p>${esc(t('pd.doneText', { name: $('#f-name').value.trim(), phone: $('#f-phone').value }))}</p><ul><li>${esc(p.name)} (${esc(p.code)}), ${esc(size)}</li><li>${esc(b.start)} \u2192 ${esc(b.end)} (${b.days} ${esc(b.days > 1 ? t('pd.days') : t('pd.day'))})</li><li>${esc($('#f-event').value)}</li><li>${esc(t('pay.total'))}: ${rupee(b.total)}</li><li>${esc(t('pay.booking'))}: ${esc(b.id)}</li></ul><p><button class="btn btn-gold" id="pd-pay">${esc(t('pd.payNow'))}</button> <a class="btn btn-outline" href="/collection/${esc(p.category)}">${esc(t('pd.keepBrowsing'))}</a></p>`;
    $('#pd-pay').addEventListener('click', () => V.openPayment(b)); V.openPayment(b);
  } catch (e) {
    btn.disabled = false;
    if (e.status === 401) { err.textContent = e.message; V.openAuth('login', () => submit()); } else err.textContent = e.message;
  }
}
$('#pd-form').addEventListener('submit', e => { e.preventDefault(); submit(); });

const rel = siblings.filter(x => x.id !== p.id); const idx = siblings.findIndex(x => x.id === p.id);
const ordered = idx >= 0 ? [...siblings.slice(idx + 1), ...siblings.slice(0, idx)] : rel;
if (ordered.length) { $('#pd-related').hidden = false; $('#pd-rel').innerHTML = ordered.slice(0, 8).map(x => B.trendCard(x, 0, '')).join(''); }
V.reveal();
})();
