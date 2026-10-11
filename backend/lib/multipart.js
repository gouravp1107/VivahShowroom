'use strict';
/* Minimal multipart/form-data parser (no dependencies). Returns {fields, files:[{name, filename, type, data}]} */
function parse(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) throw new Error('Bad multipart request');
  const boundary = Buffer.from('--' + (m[1] || m[2]));
  const fields = {}, files = [];
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    const next = buf.indexOf(boundary, pos + boundary.length);
    if (next === -1) break;
    let part = buf.slice(pos + boundary.length, next);
    if (part.slice(0, 2).toString() === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);
    const hEnd = part.indexOf('\r\n\r\n');
    if (hEnd !== -1) {
      const head = part.slice(0, hEnd).toString('utf8');
      const data = part.slice(hEnd + 4);
      const name = /name="([^"]*)"/i.exec(head);
      const fn = /filename="([^"]*)"/i.exec(head);
      const type = /content-type:\s*([^\r\n]+)/i.exec(head);
      if (fn && fn[1]) files.push({ name: name ? name[1] : '', filename: fn[1], type: type ? type[1].trim() : '', data });
      else if (name) fields[name[1]] = data.toString('utf8');
    }
    pos = next;
  }
  return { fields, files };
}
module.exports = { parse };
