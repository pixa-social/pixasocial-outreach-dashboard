function expandRows(data) {
  if (!data || Number(data.schema_version) !== 2 || !data.key_map) return data;
  const km = data.key_map;
  data.rows = (data.rows || []).map((r) => {
    const o = {};
    for (const [k, v] of Object.entries(r)) o[km[k] || k] = v;
    return o;
  });
  return data;
}

const DATA_URL = 'data/outreach.json';
const DATA_GZ_B64_URL = 'data/outreach.json.gz.b64';

let DATA = null;
let activeTab = 'overview';

async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.text();
}

async function decodeGzipB64(b64) {
  b64 = String(b64).replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (typeof DecompressionStream === 'undefined') throw new Error('no DecompressionStream');
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const text = await new Response(stream).text();
  return expandRows(JSON.parse(text));
}

async function loadData() {
  try {
    const r = await fetch(DATA_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(DATA_URL + ' ' + r.status);
    return expandRows(await r.json());
  } catch (e) {
    console.warn('outreach.json failed', e);
  }
  try {
    return await decodeGzipB64(await fetchText(DATA_GZ_B64_URL));
  } catch (e) {
    console.warn('gz.b64 failed, trying shards', e);
  }
  const parts = await Promise.all(
    [0, 1, 2, 3].map((i) => fetchText('data/outreach.json.gz.b64.' + i))
  );
  return decodeGzipB64(parts.join(''));
}
