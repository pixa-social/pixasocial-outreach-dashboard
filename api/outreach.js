const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
module.exports = (req, res) => {
  try {
    const B64 = [0, 1, 2, 3].map((i) =>
      fs.readFileSync(path.join(__dirname, 'd' + i + '.txt'), 'utf8')
    ).join('');
    const buf = zlib.gunzipSync(Buffer.from(B64, 'base64'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.statusCode = 200;
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e) }));
  }
};
