'use strict';
/* Default content for a brand-new install. Everything here becomes editable from the Owner panel. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rid = () => crypto.randomBytes(4).toString('hex');

/* ---------- Text & label strings (Login window, Payment window, product page etc.) ---------- */
const UI_GROUPS = [
  { group: 'Collection page', items: [
    ['cat.explore', 'Banner button', 'Explore the Collection \u2192'],
    ['cat.crumbHome', 'Breadcrumb: home', 'Home'],
    ['cat.filters', 'Filters button', 'Filters'],
    ['cat.color', 'Filter group: colour', 'Color'],
    ['cat.products', 'Product count word', 'products'],
    ['cat.sortBy', 'Sort placeholder', 'Sort by'],
    ['cat.lo', 'Sort: low to high', 'Price: low to high'],
    ['cat.hi', 'Sort: high to low', 'Price: high to low'],
    ['cat.code', 'Code label', 'Code'],
    ['cat.rental', 'Rental word', 'Rental'],
    ['cat.perDay', 'Per day word', '/day'],
    ['cat.viewDetails', 'View details button', 'View Details'],
    ['cat.more', 'Show more button', 'Show more'],
    ['cat.noMatch', 'No match message', 'No products match these filters. Clear a filter to see more.'],
    ['cat.empty', 'Empty collection message', 'This collection is being photographed. New looks arrive soon.'],
    ['cat.filtersNote', 'Filters empty note', 'Filters appear once photos are added.']
  ]},
  { group: 'Product status labels', items: [
    ['status.available', 'Available', 'Available'],
    ['status.few', 'Few left', 'Few Left'],
    ['status.out', 'Out of stock', 'Out of Stock']
  ]},
  { group: 'Product page', items: [
    ['pd.badge1', 'Badge 1', 'Cleaned & sanitized'],
    ['pd.badge2', 'Badge 2', 'Styled by experts'],
    ['pd.badge3', 'Badge 3', 'Showroom trial'],
    ['pd.reserveTitle', 'Booking card title', 'Reserve this look'],
    ['pd.reserveSub', 'Booking card subtitle', 'Choose your size and dates. We will call to confirm your booking.'],
    ['pd.step1', 'Step 1 title', 'Choose your size'],
    ['pd.step2', 'Step 2 title', 'Dates and occasion'],
    ['pd.step3', 'Step 3 title', 'Your details'],
    ['pd.start', 'Rental start label', 'Rental start'],
    ['pd.end', 'Rental end label', 'Rental end'],
    ['pd.event', 'Event type label', 'Event type'],
    ['pd.name', 'Name label', 'Your name'],
    ['pd.namePh', 'Name placeholder', 'Full name'],
    ['pd.phone', 'Phone label', 'Phone number'],
    ['pd.phonePh', 'Phone placeholder', '10-digit mobile'],
    ['pd.phone2', 'Partner phone label', "Partner's number (optional)"],
    ['pd.phone2Ph', 'Partner phone placeholder', 'For couple bookings'],
    ['pd.notes', 'Notes label', 'Notes (optional)'],
    ['pd.notesPh', 'Notes placeholder', 'Fitting preferences, delivery or showroom visit'],
    ['pd.selectDates', 'Total line before dates chosen', 'Select your dates'],
    ['pd.day', 'Day word (singular)', 'day'],
    ['pd.days', 'Day word (plural)', 'days'],
    ['pd.submit', 'Submit button', 'Request Booking'],
    ['pd.note', 'Small note under button', 'Final deposit and fitting are confirmed with you at the showroom.'],
    ['pd.errName', 'Error: name', 'Please enter your name.'],
    ['pd.errPhone', 'Error: phone', 'Enter a valid 10-digit phone number.'],
    ['pd.errPhone2', 'Error: partner phone', "Partner's number should be 10 digits, or leave it empty."],
    ['pd.errDates', 'Error: dates', 'Choose a rental start and end date.'],
    ['pd.errLogin', 'Error: login required', 'Please log in to continue your booking.'],
    ['pd.doneTitle', 'Booking received title', 'Booking request received'],
    ['pd.doneText', 'Booking received text ({name}, {phone})', 'Thank you, {name}. We will call you on {phone} to confirm.'],
    ['pd.payNow', 'Pay now button (after booking)', 'Pay deposit now'],
    ['pd.keepBrowsing', 'Keep browsing button', 'Keep browsing'],
    ['pd.related', 'Related eyebrow', 'You may also like'],
    ['pd.moreFrom', 'Related heading prefix', 'More from'],
    ['pd.notFound', 'Product not found', 'This product is not available yet.'],
    ['pd.backHome', 'Back home link', 'Back to home'],
    ['pd.detCollection', 'Detail label: collection', 'Collection'],
    ['pd.detColour', 'Detail label: colour', 'Colour'],
    ['pd.detCode', 'Detail label: code', 'Code'],
    ['pd.detSizes', 'Detail label: sizes', 'Sizes'],
    ['pd.detStock', 'Detail label: availability', 'Availability']
  ]},
  { group: 'Login / Register window', items: [
    ['auth.tabLogin', 'Login tab', 'Log in'],
    ['auth.tabRegister', 'Register tab', 'Create account'],
    ['auth.titleLogin', 'Login heading', 'Welcome back'],
    ['auth.subLogin', 'Login subtext', 'Log in to track your bookings and save your wishlist.'],
    ['auth.titleRegister', 'Register heading', 'Join Vivah'],
    ['auth.subRegister', 'Register subtext', 'Create an account for faster bookings.'],
    ['auth.name', 'Name label', 'Full name'],
    ['auth.phone', 'Phone label', 'Mobile number'],
    ['auth.email', 'Email label', 'Email (optional)'],
    ['auth.loginId', 'Login id label', 'Mobile number or email'],
    ['auth.password', 'Password label', 'Password'],
    ['auth.loginBtn', 'Login button', 'Log in'],
    ['auth.registerBtn', 'Register button', 'Create account'],
    ['auth.noAccount', 'Switch to register text', "New here? Create an account"],
    ['auth.haveAccount', 'Switch to login text', 'Already have an account? Log in'],
    ['auth.accountTitle', 'Account panel title', 'My Account'],
    ['auth.hello', 'Greeting ({name})', 'Hello, {name}'],
    ['auth.logout', 'Logout button', 'Log out'],
    ['auth.myBookings', 'My bookings button', 'View my bookings'],
    ['auth.errGeneric', 'Generic error', 'Something went wrong. Please try again.']
  ]},
  { group: 'Payment window', items: [
    ['pay.title', 'Heading', 'Complete your booking'],
    ['pay.sub', 'Subtext', 'Pay the deposit to secure your look.'],
    ['pay.booking', 'Booking id label', 'Booking'],
    ['pay.total', 'Total label', 'Total rental'],
    ['pay.deposit', 'Deposit label', 'Deposit to pay now'],
    ['pay.balance', 'Balance label', 'Balance at showroom'],
    ['pay.choose', 'Choose method heading', 'Choose payment method'],
    ['pay.razorpay', 'Online option', 'Pay online (UPI, cards, netbanking)'],
    ['pay.upi', 'UPI option', 'Pay by UPI and enter reference'],
    ['pay.cash', 'Cash option', 'Pay at the showroom'],
    ['pay.upiHelp', 'UPI instructions ({upi}, {amount})', 'Pay {amount} to UPI ID {upi}, then enter the UPI reference / UTR number below.'],
    ['pay.upiOpen', 'Open UPI app button', 'Open UPI app'],
    ['pay.utr', 'UTR placeholder', 'UPI reference / UTR number'],
    ['pay.confirm', 'Confirm button', 'Confirm'],
    ['pay.payBtn', 'Pay online button', 'Pay now'],
    ['pay.close', 'Close button', 'Close'],
    ['pay.okTitle', 'Success heading', 'Thank you!'],
    ['pay.okPaid', 'Success text: paid online', 'Payment received. Your booking is confirmed.'],
    ['pay.okVerify', 'Success text: UPI submitted', 'We have received your reference and will verify the payment shortly.'],
    ['pay.okCash', 'Success text: pay at showroom', 'Your booking is noted. Please pay the deposit at the showroom to confirm it.'],
    ['pay.fail', 'Failure message', 'Payment could not be completed. Please try again.'],
    ['pay.none', 'No payment methods message', 'Online payments are not set up yet. We will call you to confirm your booking.']
  ]},
  { group: 'Search, wishlist & bookings panels', items: [
    ['search.title', 'Search heading', 'Search the collection'],
    ['search.placeholder', 'Search placeholder', 'Search by colour, code or collection'],
    ['search.empty', 'No results', 'No looks found. Try another word.'],
    ['wish.title', 'Wishlist heading', 'Your Wishlist'],
    ['wish.empty', 'Wishlist empty', 'Tap the heart on any look to save it here.'],
    ['bk.title', 'Bookings heading', 'My Bookings'],
    ['bk.empty', 'Bookings empty', 'You have no bookings yet.'],
    ['bk.login', 'Bookings need login', 'Log in to see your bookings.'],
    ['bk.pay', 'Pay balance button', 'Pay now'],
    ['bk.cancel', 'Cancel button', 'Cancel booking']
  ]},
  { group: 'Misc', items: [
    ['misc.backToTop', 'Back to top label', 'Back to top'],
    ['misc.closeLabel', 'Close label', 'Close'],
    ['misc.pageNotFound', '404 heading', 'Page not found'],
    ['misc.pageNotFoundText', '404 text', 'The page you are looking for does not exist.'],
    ['misc.contactSent', 'Contact form success', 'Thank you. We will get back to you shortly.']
  ]}
];
const UI_DEFAULTS = {};
UI_GROUPS.forEach(g => g.items.forEach(([k, , v]) => { UI_DEFAULTS[k] = v; }));

/* ---------- Categories ---------- */
const T = (label, slug) => ({ label, slug: slug || '' });
const CATS = [
  ['bride', 'Bride', 'The Bride Collection', 'Bride Collection', 'Timeless looks for every chapter of your story.', 'Bridal Lehenga', 4999, 'center 18%', [T('Bridal Dresses'), T('Jewellery', 'bride-jewellery'), T('Juti', 'bride-juti')], ['S','M','L','XL','XXL']],
  ['groom', 'Groom', 'The Groom Collection', 'Groom Collection', 'Regal looks for the man of the hour.', 'Groom Sherwani', 3999, 'center 22%', [T('Groom Wear'), T('Jewellery', 'groom-jewellery'), T('Juti', 'groom-juti'), T('Saafas', 'saafas')], ['S','M','L','XL','XXL']],
  ['bride-jewellery', 'Bride Jewellery', 'Bride Jewellery', 'Bride Jewellery', 'Heirloom pieces to complete the bridal look.', 'Bridal Necklace Set', 2499, 'center 45%', [T('Jewellery'), T('Bridal Dresses', 'bride'), T('Juti', 'bride-juti')], ['Free size']],
  ['groom-jewellery', 'Groom Jewellery', 'Groom Jewellery', 'Groom Jewellery', 'Malas and necklaces for the groom.', 'Groom Mala', 1499, 'center 40%', [T('Jewellery'), T('Groom Wear', 'groom'), T('Saafas', 'saafas')], ['Free size']],
  ['bride-juti', 'Bride Juti', 'Bride Juti', 'Bride Juti', 'Handcrafted juti for every bridal function.', 'Bridal Juti', 799, 'center 60%', [T('Juti'), T('Bridal Dresses', 'bride'), T('Jewellery', 'bride-jewellery')], ['5','6','7','8']],
  ['groom-juti', 'Groom Juti', 'Groom Juti', 'Groom Juti', 'Classic juti to match every sherwani.', 'Groom Juti', 699, 'center 90%', [T('Juti'), T('Groom Wear', 'groom'), T('Saafas', 'saafas')], ['7','8','9','10']],
  ['garba-dress', 'Garba Dress', 'Garba Dress Collection', 'Garba Dress', 'Colour, mirror work and movement for Navratri.', 'Garba Dress', 2499, 'center 40%', [T('Garba Dress'), T('Festival for Women', 'festival-women')], ['S','M','L','XL','XXL']],
  ['saafas', 'Saafas', 'Saafa Collection', 'Saafas', 'Wedding and festival saafas in every shade.', 'Saafa', 599, 'center 22%', [T('Saafas'), T('Groom Wear', 'groom'), T('Groom Juti', 'groom-juti')], ['Free size']],
  ['festival-women', 'Festival for Women', 'Festival Wear for Women', 'Festival for Women', 'Look your best from Diwali to Navratri.', 'Festive Outfit', 2999, 'center 40%', [T('Festival Wear'), T('Garba Dress', 'garba-dress')], ['S','M','L','XL','XXL']],
  ['festival-men', 'Festival for Men', 'Festival Wear for Men', 'Festival for Men', 'Sharp festive looks for every celebration.', 'Festive Outfit', 1999, 'center 25%', [T('Festival Wear'), T('Groom Wear', 'groom')], ['S','M','L','XL','XXL']]
];
function defaultCategories() {
  return CATS.map(([slug, label, title, crumb, tagline, noun, base, pos, tabs, sizes], i) => ({
    id: slug, slug, label, title, crumb, tagline, noun, basePrice: base, bannerPos: pos, tabs, sizes,
    bannerImage: `images/posters/${slug}.jpg`, thumbImage: `images/categories/${slug}.jpg`, visible: true, order: i,
    buttonLabel: '', thumbFit: 'cover', bannerSide: 'left', seoTitle: '', seoDescription: ''
  }));
}

/* ---------- Home page ---------- */
function defaultProducts() {
  const file = path.join(__dirname, '..', 'seed-products.json');
  let list = [];
  try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
  return list.map(p => Object.assign({ description: '', images: [], featured: false, visible: true, sizes: [], specs: [], createdAt: new Date().toISOString() }, p));
}
function trendingIds(products) {
  const T6 = [['bride', 2], ['groom', 8], ['bride-jewellery', 11], ['groom-jewellery', 5], ['groom-juti', 6], ['saafas', 4]];
  return T6.map(([c, i]) => (products.filter(p => p.category === c)[i] || {}).id).filter(Boolean);
}
function featuredIds(products) {
  const pick = [['bride', 0], ['groom', 0], ['bride-jewellery', 0], ['groom-juti', 0], ['saafas', 1]];
  return pick.map(([c, i]) => (products.filter(p => p.category === c)[i] || {}).id).filter(Boolean);
}
function defaultGallery() {
  let files = [];
  try { files = fs.readdirSync(path.join(__dirname, '..', '..', 'frontend', 'images', 'couple')).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort(); } catch (e) {}
  const step = files.length > 40 ? files.length / 40 : 1, out = [];
  for (let i = 0; i < Math.min(40, files.length); i++) out.push({ id: 'g' + rid(), image: 'images/couple/' + files[Math.floor(i * step)], alt: 'Celebration look ' + (i + 1), visible: true });
  return out;
}
const sec = (type, data, extra) => Object.assign({ id: rid(), type, visible: true, data }, extra || {});

function homeSections(products) {
  return [
    sec('hero', {
      image: 'images/posters/couple.jpg', imagePos: 'center 30%', mark: '\u274A',
      title: 'The Art of\nThe Occasion', sub: 'Curated rental looks for\nweddings and festivals',
      tag: 'Timeless traditions. Modern celebrations.\nNow within reach.',
      buttons: [{ label: 'Explore Collection \u2192', url: '/collections', style: 'gold' }, { label: 'Couple Looks', url: '/#couple', style: 'outline' }, { label: 'Book a Showroom Appointment', url: '/p/showroom', style: 'ghost' }],
      words: ['Rent', 'Wear', 'Celebrate', 'Return', 'Sustain', 'Beautifully']
    }),
    sec('categories', { ariaLabel: 'Shop by category' }),
    sec('featured', {
      eyebrow: 'Featured Rental Collection', title: 'Weddings\nFestivals\nand Beyond',
      text: 'Iconic looks for your most memorable moments.\nRent. Relive. Celebrate in style.',
      button: { label: 'View All Collections \u2192', url: '/collections' },
      productIds: featuredIds(products)
    }),
    sec('spotlight', {
      anchor: 'couple', frameStyle: 'rounded', eyebrow: 'Couple Collection', heading: 'The Royal Wedding Edit', image: 'images/couple/couple-040.jpg', alt: 'Bride and groom in coordinated pink and ivory wedding looks', caption: 'Rose & Ivory', flip: false,
      eyebrow2: 'Look of the season', title: 'Rose & Ivory, Together',
      text: 'A coordinated bride and groom pairing, chosen as one story. Reserve both looks for the same dates and try them on in the showroom.',
      bullets: ['Coordinated couple looks', 'Jewellery and juti to complete the set', 'Rent by the day, return after the celebration'],
      buttons: [{ label: 'Shop the Bride', url: '/collection/bride', style: 'gold' }, { label: 'Shop the Groom', url: '/collection/groom', style: 'outline' }]
    }),
    sec('spotlight', {
      anchor: 'jewellery', frameStyle: 'rounded', eyebrow: 'Spotlight', heading: 'The Jewellery Edit', image: 'images/bride-jewellery/jewellery-bride-004.jpg', alt: 'Bridal jewellery set', caption: 'Heirloom pieces', flip: true,
      eyebrow2: 'Complete the look', title: 'Heirloom Pieces, Rented',
      text: 'Necklace sets, malas and juti chosen to match your outfit. Add them to your booking and collect everything in one visit.',
      bullets: ['Necklace sets and earrings', 'Malas and saafas for the groom', 'Fitted and styled at the showroom'],
      buttons: [{ label: 'Bride Jewellery', url: '/collection/bride-jewellery', style: 'gold' }, { label: 'Groom Jewellery', url: '/collection/groom-jewellery', style: 'outline' }]
    }),
    sec('spotlight', {
      anchor: 'festive', frameStyle: 'rounded', eyebrow: 'Spotlight', heading: 'The Festive Edit', image: 'images/couple/couple-001.jpg', alt: 'Couple in festive orange and pink outfits', caption: 'Festive colour', flip: false,
      eyebrow2: 'Navratri to Diwali', title: 'Colour for Every Celebration',
      text: 'Bright lehengas, kurtas and dupattas for garba nights and festive evenings. Rent for a day or a week.',
      bullets: ['Garba and festival outfits', 'Matching looks for couples', 'Quick showroom trials'],
      buttons: [{ label: 'Garba Dress', url: '/collection/garba-dress', style: 'gold' }, { label: 'Festival for Women', url: '/collection/festival-women', style: 'outline' }]
    }),
    sec('spotlight', {
      anchor: 'saafa', frameStyle: 'rounded', eyebrow: 'Spotlight', heading: 'Crown the Groom', image: 'images/saafas/pagdi-010.jpg', alt: 'Pink saafa with gold band', caption: 'The saafa', flip: true,
      eyebrow2: 'Finishing touch', title: 'Saafas in Every Shade',
      text: 'The right saafa completes a sherwani. Choose from classic and statement shades, tied and ready to wear.',
      bullets: ['Wedding and festival saafas', 'Matching juti and mala', 'Free size, styled in the showroom'],
      buttons: [{ label: 'Shop Saafas', url: '/collection/saafas', style: 'gold' }]
    }),
    sec('trending', { eyebrow: 'Trending Zone', heading: 'Most Loved This Season', badge: 'Trending', productIds: trendingIds(products) }),
    sec('gallery', { eyebrow: 'Showroom Gallery', heading: 'Celebrations Dressed by Vivah', note: 'Photos come from Gallery in the owner panel.' }),
    sec('feedback', {
      eyebrow: 'Customer Feedback', heading: 'Words from Our Families',
      items: [
        ['Aarohi S.', 'Bride', 'The lehenga arrived pressed and perfectly fitted. I felt like a queen on my wedding day without buying a thing.'],
        ['Kabir M.', 'Groom', 'Booked the sherwani and juti together. The showroom team styled everything in one visit.'],
        ['Meera & Rohan', 'Couple', 'We coordinated our looks for the reception. Easy booking, and returning was just as simple.'],
        ['Ishita P.', 'Bride', 'The jewellery set matched my outfit so well that guests asked where I bought it. Renting felt effortless.'],
        ['Vikram J.', 'Groom', 'Sharp fit, great saafa and juti, and the team was patient through every change.'],
        ['Neha & Arjun', 'Couple', 'We tried our looks together at the showroom and left with everything sorted for the week.']
      ].map(([name, role, text]) => ({ name, role, text, stars: 5 }))
    }),
    sec('trust', { items: [
      { icon: 'gem', title: 'Premium Rental Collections', sub: 'For every occasion' },
      { icon: 'hanger', title: 'Professionally Styled', sub: 'By fashion experts' },
      { icon: 'calendar', title: 'Showroom Appointments', sub: 'Personalized experience' },
      { icon: 'heart', title: 'Sustainable Fashion', sub: 'Look good. Do good.' },
      { icon: 'truck', title: 'Cleaned & Sanitized', sub: 'With care' }
    ]})
  ];
}

function pageHead(eyebrow, heading) { return sec('richtext', { eyebrow, heading, html: '', align: 'center', narrow: true }); }
function defaultPages(products) {
  const P = (slug, title, sections, extra) => Object.assign({ id: slug || 'home', slug, title, parent: '', type: slug ? 'custom' : 'home', published: true, showHeader: true, showFooter: true, seoTitle: '', seoDescription: '', ogImage: '', sections, system: !slug }, extra || {});
  return [
    P('', 'Home', homeSections(products), { system: true }),
    P('about', 'About Us', [
      sec('banner', { image: 'images/posters/couple.jpg', pos: 'center 30%', title: 'About Vivah', text: 'Rental looks for weddings and festivals, styled with care.', button: { label: 'Explore the Collection \u2192', url: '/collection/bride' } }),
      sec('richtext', { eyebrow: 'Who we are', heading: 'Dressing your celebrations', align: 'center', narrow: true,
        html: '<p>Vivah Rental Showroom brings together bridal wear, groom wear, jewellery, juti and saafas for weddings and festivals, all available to rent by the day.</p><p>Every piece is cleaned, sanitized and styled by our team, so you can celebrate beautifully without the cost of buying a look you will wear once.</p>' }),
      sec('trust', { items: [{ icon: 'gem', title: 'Premium Collections', sub: 'For every occasion' }, { icon: 'hanger', title: 'Expert Styling', sub: 'In person at the showroom' }, { icon: 'heart', title: 'Sustainable Fashion', sub: 'Rent. Wear. Return.' }] })
    ]),
    P('about/our-story', 'Our Story', [
      sec('richtext', { eyebrow: 'Our Story', heading: 'Timeless traditions. Modern celebrations.', align: 'center', narrow: true,
        html: '<p>Vivah began with a simple idea: everyone deserves to look their best on the days that matter most, without compromise on quality or budget.</p><p>Edit this page from the Owner panel to tell your own story.</p>' })
    ], { parent: 'about' }),
    P('rental-process', 'Rental Process', [
      sec('richtext', { eyebrow: 'How it works', heading: 'Rent. Wear. Celebrate. Return.', align: 'center', narrow: true, html: '' }),
      sec('trust', { items: [
        { icon: 'search', title: '1. Choose your look', sub: 'Browse online or visit the showroom' },
        { icon: 'calendar', title: '2. Reserve your dates', sub: 'Pick size, dates and pay the deposit' },
        { icon: 'hanger', title: '3. Try and collect', sub: 'Fitting and styling at the showroom' },
        { icon: 'truck', title: '4. Return after the event', sub: 'We clean and care for everything' }
      ] })
    ]),
    P('showroom', 'Showroom', [
      sec('richtext', { eyebrow: 'Visit us', heading: 'Book a showroom appointment', align: 'center', narrow: true,
        html: '<p>Try your looks with our stylists, see the fabrics up close and finalise your fittings. Send us a message and we will confirm a convenient time.</p>' }),
      sec('contact', { heading: 'Request an appointment', text: 'Tell us your event date and the looks you are interested in.', showInfo: true, buttonLabel: 'Send request', subject: 'Showroom appointment' })
    ]),
    P('faq', 'FAQ', [
      sec('faq', { eyebrow: 'FAQ', heading: 'Questions, answered', items: [
        { q: 'How does renting work?', a: 'Choose a look, select your size and dates, and pay the deposit to reserve it. Collect it from the showroom, wear it, and return it after your event.' },
        { q: 'Can I try before I rent?', a: 'Yes. Book a showroom appointment and our stylists will help you try your looks and finalise the fit.' },
        { q: 'What if the fit is not right?', a: 'Our team can recommend the right size and arrange simple alterations where possible. Please reserve in advance so there is time to adjust.' },
        { q: 'Are the outfits cleaned?', a: 'Every piece is professionally cleaned and sanitized between rentals.' },
        { q: 'How do I pay?', a: 'You can pay the deposit online or at the showroom. The balance is settled at the showroom.' }
      ] })
    ]),
    P('contact', 'Contact', [
      sec('richtext', { eyebrow: 'Contact', heading: 'We would love to hear from you', align: 'center', narrow: true, html: '' }),
      sec('contact', { heading: 'Send us a message', text: '', showInfo: true, buttonLabel: 'Send message', subject: 'Website enquiry' })
    ]),
    P('terms', 'Terms & Conditions', [
      sec('richtext', { eyebrow: 'Legal', heading: 'Terms & Conditions', align: 'left', narrow: true,
        html: '<p>Replace this text with your rental terms: deposit, late return charges, damage policy, cancellation and refund policy.</p>' })
    ]),
    P('privacy', 'Privacy Policy', [
      sec('richtext', { eyebrow: 'Legal', heading: 'Privacy Policy', align: 'left', narrow: true,
        html: '<p>Replace this text with your privacy policy describing what customer data you collect and how it is used.</p>' })
    ])
  ];
}

/* ---------- Settings ---------- */
const LIGHT = { cream: '#f4efe6', ivory: '#faf6ee', paper: '#fffaf1', ink: '#2a2118', dark: '#1b1714', gold: '#a8793a', goldL: '#c9a46a', line: '#d9cfbc', green: '#2e8b4f', red: '#a3213a' };
const DARK = { cream: '#120a0d', ivory: '#1b1015', paper: '#251419', ink: '#f6ead6', dark: '#0a0507', gold: '#e2b862', goldL: '#f0d28c', line: '#3d2b30', green: '#6fd99a', red: '#ff8a9c' };

function defaultSettings() {
  const catLinks = CATS.map(c => ({ label: c[1], url: '/collection/' + c[0] }));
  return {
    brand: {
      name: 'VIVAH', sub: 'RENTAL SHOWROOM', logoImage: '', favicon: '', showMark: true,
      title: 'Vivah Rental Showroom | Wedding & Festival Rentals', description: 'Curated rental looks for weddings and festivals.',
      phone: '', whatsapp: '', email: '', address: '', hours: '', siteUrl: ''
    },
    theme: { light: LIGHT, dark: DARK, fontSerif: "'Cormorant Garamond',Georgia,serif", fontSans: "'Jost',system-ui,sans-serif",
      fontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap',
      defaultMode: 'light', showThemeToggle: true, posterBrightness: 1.12, photoBrightness: 1.1, customCss: '', customHead: '', customJs: '' },
    header: { sticky: true, announcement: { enabled: false, text: 'Festive season bookings are open', link: '/collection/garba-dress', bg: '#2a2118', color: '#f6ead6' },
      links: catLinks, show: { theme: true, search: true, wishlist: true, account: true, cart: true } },
    footer: {
      links: [{ label: 'About Us', url: '/p/about' }, { label: 'Our Story', url: '/p/about/our-story' }, { label: 'Rental Process', url: '/p/rental-process' }, { label: 'Showroom', url: '/p/showroom' }, { label: 'FAQ', url: '/p/faq' }, { label: 'Contact', url: '/p/contact' }],
      subscribe: { enabled: true, label: 'Join our celebration list', placeholder: 'Enter your email address', success: 'Thank you. You are on the list.', error: 'Enter a valid email address.' },
      social: [{ label: 'IG', url: '#' }, { label: 'f', url: '#' }, { label: 'P', url: '#' }, { label: '\u25B6', url: '#' }],
      copyright: '', ownerLabel: 'Owner Login', ownerUrl: '/owner/'
    },
    booking: { requireLogin: false, events: ['Wedding', 'Engagement', 'Mehendi', 'Reception', 'Festival'], maxDays: 30 },
    payments: {
      depositPercent: 30, currencySymbol: '\u20B9', terms: '',
      razorpay: { enabled: false, keyId: '', keySecret: '' },
      upi: { enabled: true, id: '', name: 'Vivah Rental Showroom' },
      cash: { enabled: true }
    },
    ui: Object.assign({}, UI_DEFAULTS),
    layouts: { category: { before: [], after: [] }, product: { before: [], after: [] } },
    collectionsPage: { title: 'All Collections', crumb: 'All Collections', tagline: 'Every look from every collection, mixed together.', bannerImage: 'images/posters/couple.jpg', buttonLabel: '', seoTitle: '', seoDescription: '' },
    maintenance: { enabled: false, message: 'We are updating the showroom. Please check back soon.' }
  };
}

const TEMPLATE_PRESETS = () => [
  { id: 'tpl-blank', name: 'Blank page', description: 'An empty page with a heading.', sections: [sec('richtext', { eyebrow: '', heading: 'New page', align: 'center', narrow: true, html: '<p>Write something here.</p>' })] },
  { id: 'tpl-landing', name: 'Campaign landing page', description: 'Banner, text, product row and call to action.', sections: [
    sec('banner', { image: 'images/posters/festival-women.jpg', pos: 'center 40%', title: 'Festive Collection', text: 'Rent standout looks for the season.', button: { label: 'Shop now \u2192', url: '/collection/festival-women' } }),
    sec('richtext', { eyebrow: 'Limited time', heading: 'Celebrate in style', align: 'center', narrow: true, html: '<p>Tell customers about your offer.</p>' }),
    sec('productgrid', { eyebrow: 'Our picks', heading: 'Shop the look', category: 'bride', count: 8, productIds: [] })
  ] },
  { id: 'tpl-info', name: 'Information page', description: 'Heading with rich text and FAQ.', sections: [
    sec('richtext', { eyebrow: 'Info', heading: 'Information', align: 'center', narrow: true, html: '<p>Add your content.</p>' }),
    sec('faq', { eyebrow: 'FAQ', heading: 'Questions', items: [{ q: 'Question?', a: 'Answer.' }] })
  ] }
];

module.exports = { UI_GROUPS, UI_DEFAULTS, defaultCategories, defaultProducts, defaultPages, defaultSettings, defaultGallery, TEMPLATE_PRESETS, rid, LIGHT, DARK };
