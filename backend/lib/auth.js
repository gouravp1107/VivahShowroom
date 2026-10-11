'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./db');

const secretFile = path.join(DATA_DIR, 'secret.key');
let SECRET;
try { SECRET = fs.readFileSync(secretFile, 'utf8').trim(); } catch (e) {}
if (!SECRET || SECRET.length < 32) { SECRET = crypto.randomBytes(48).toString('hex'); fs.writeFileSync(secretFile, SECRET, { mode: 0o600 }); }

function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, rec) {
  if (!rec || !rec.hash) return false;
  const h = crypto.scryptSync(String(pw), rec.salt, 64);
  const b = Buffer.from(rec.hash, 'hex');
  return b.length === h.length && crypto.timingSafeEqual(h, b);
}
const b64 = s => Buffer.from(s).toString('base64url');
function sign(payload, ttlSec) {
  const body = b64(JSON.stringify(Object.assign({}, payload, { exp: Date.now() + ttlSec * 1000 })));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + mac;
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (e) { return null; }
}
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function cookie(name, value, maxAgeSec, secure) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}
/* simple in-memory rate limiter */
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}
module.exports = { hashPassword, verifyPassword, sign, verify, parseCookies, cookie, limited, SECRET };
