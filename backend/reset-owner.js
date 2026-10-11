'use strict';
/* Run this ONLY when the website is stopped:  node backend\reset-owner.js
   It creates a new random owner password (your content, bookings and customers are not touched). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DB = require('./lib/db');
const A = require('./lib/auth');
DB.load();
const pw = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
const h = A.hashPassword(pw);
const d = DB.db;
d.admin = Object.assign(d.admin || { username: 'owner' }, { salt: h.salt, hash: h.hash, mustChange: true });
DB.saveNow();
const note = `VIVAH OWNER LOGIN (reset)\n-------------------------\nURL:       http://localhost:3000/owner/\nUsername:  ${d.admin.username}\nPassword:  ${pw}\n\nChange it in the Owner panel (Settings & backup > Owner account), then delete this file.\n`;
fs.writeFileSync(path.join(DB.DATA_DIR, 'OWNER-LOGIN.txt'), note);
console.log('\n' + note);
