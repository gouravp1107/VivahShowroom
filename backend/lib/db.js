'use strict';
/* Tiny JSON-file database: whole DB lives in memory, saved atomically to data/db.json */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const D = require('./defaults');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');
const BACKUPS = path.join(DATA_DIR, 'backups');
fs.mkdirSync(BACKUPS, { recursive: true });

let db = null, timer = null, firstRun = false;

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
/* add keys that exist in `defaults` but are missing in `target` (never overwrites owner edits) */
function fill(target, defaults) {
  for (const k of Object.keys(defaults)) {
    if (!(k in target)) target[k] = JSON.parse(JSON.stringify(defaults[k]));
    else if (isObj(defaults[k]) && isObj(target[k])) fill(target[k], defaults[k]);
  }
  return target;
}

function fresh() {
  const products = D.defaultProducts();
  return {
    version: 1,
    admin: null,
    settings: D.defaultSettings(),
    categories: D.defaultCategories(),
    products,
    pages: D.defaultPages(products),
    templates: D.TEMPLATE_PRESETS(),
    gallery: D.defaultGallery(),
    bookings: [], customers: [], subscribers: [], messages: [],
    counters: { booking: 1000 }
  };
}

function backup() {
  if (!fs.existsSync(FILE)) return;
  const stamp = new Date().toISOString().slice(0, 10);
  const dest = path.join(BACKUPS, `db-${stamp}.json`);
  try {
    if (!fs.existsSync(dest)) fs.copyFileSync(FILE, dest);
    const files = fs.readdirSync(BACKUPS).filter(f => f.startsWith('db-')).sort();
    while (files.length > 14) fs.unlinkSync(path.join(BACKUPS, files.shift()));
  } catch (e) { console.error('Backup failed:', e.message); }
}

function load() {
  if (fs.existsSync(FILE)) {
    backup();
    try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
    catch (e) {
      console.error('db.json is damaged (' + e.message + '). Restoring newest backup.');
      const b = fs.readdirSync(BACKUPS).filter(f => f.startsWith('db-')).sort().pop();
      if (!b) throw new Error('No valid database and no backup found.');
      db = JSON.parse(fs.readFileSync(path.join(BACKUPS, b), 'utf8'));
    }
    fill(db.settings, D.defaultSettings());
    fill(db.settings.ui, D.UI_DEFAULTS);
    ['categories', 'products', 'pages', 'templates', 'bookings', 'customers', 'subscribers', 'messages'].forEach(k => { if (!Array.isArray(db[k])) db[k] = []; });
    if (!Array.isArray(db.gallery)) db.gallery = D.defaultGallery();
    if (!db.counters) db.counters = { booking: 1000 };
  } else {
    db = fresh(); firstRun = true; saveNow();
  }
  return db;
}

function saveNow() {
  clearTimeout(timer); timer = null;
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}
function save() { if (!timer) timer = setTimeout(() => { try { saveNow(); } catch (e) { console.error('Save failed:', e.message); } }, 250); }
function replaceAll(next) { db = next; fill(db.settings, D.defaultSettings()); fill(db.settings.ui, D.UI_DEFAULTS); saveNow(); }
process.on('exit', () => { if (timer) try { saveNow(); } catch (e) {} });
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { try { if (timer) saveNow(); } catch (e) {} process.exit(0); }));

const uid = (prefix) => (prefix ? prefix + '-' : '') + crypto.randomBytes(5).toString('hex');
module.exports = { load, save, saveNow, replaceAll, get db() { return db; }, get firstRun() { return firstRun; }, uid, DATA_DIR };
