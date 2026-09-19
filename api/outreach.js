const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
module.exports = (req, res) => {
  try {
    const b64 = fs.readFileSync(path.join(__dirname, 'outreach-data.b64'), 'utf8').trim();
    const buf = zlib.gunzipSync(Buffer.from(b64, 'base64'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.statusCode = 200;
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
};
