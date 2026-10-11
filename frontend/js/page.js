(() => {
const V = window.VIVAH, { esc, t, $ } = V, app = $('#app'), page = V.BOOT.page;
if (!page || V.BOOT.notFound) {
  document.title = t('misc.pageNotFound');
  app.innerHTML = `<section class="sec nf"><div class="sec-head"><p class="eyebrow">404</p><h2>${esc(t('misc.pageNotFound'))}</h2><span class="orn">&#10048;</span></div><p class="nf-text">${esc(t('misc.pageNotFoundText'))}</p><p class="nf-text"><a class="btn btn-gold" href="/">${esc(t('cat.crumbHome'))}</a></p></section>`;
} else {
  let crumb = '';
  if (page.crumbs && page.crumbs.length) crumb = `<div class="page-crumb"><p class="cp-crumb"><a href="/">${esc(t('cat.crumbHome'))}</a> ${page.crumbs.map(c => `<span>&rsaquo;</span> <a href="/p/${esc(c.slug)}">${esc(c.title)}</a>`).join(' ')} <span>&rsaquo;</span> <b>${esc(page.title)}</b></p></div>`;
  app.innerHTML = crumb + '<div id="blocks"></div>';
  V.blocks.render($('#blocks'), page.sections);
}
})();
