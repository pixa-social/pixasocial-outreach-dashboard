
const BASES = [
'',
'https://cdn.jsdelivr.net/gh/pixa-social/pixasocial-outreach-dashboard@main/',
'https://raw.githubusercontent.com/pixa-social/pixasocial-outreach-dashboard/main/',
];
const TABS_DATA = ['maya-agency','affiliates','justin-customer','seo-links','replies'];
let DATA = null;
let activeTab = 'overview';
async function fetchJson(url) {
const r = await fetch(url, { cache: 'no-store' });
if (!r.ok) throw new Error(url + ' ' + r.status);
return r.json();
}
async function loadFromBase(base) {
try {
return await fetchJson(base + 'data/outreach.json');
} catch (_) {}
try {
  const meta = await fetchJson(base + 'data/outreach-meta.json');
  const parts = [];
  for (let i = 0; i < 20; i++) {
    try { parts.push(await fetchJson(base + 'data/outreach.part' + i + '.json')); }
    catch (_) { break; }
  }
  if (parts.length) {
    return { ...meta, rows: parts.flatMap(p => p.rows || []) };
  }
} catch (_) {}
const meta = await fetchJson(base + 'data/outreach-meta.json');
async function loadTabRows(tab) {
try {
  const one = await fetchJson(base + 'data/outreach-' + tab + '.json');
  if (Array.isArray(one.rows) && one.rows.length) return one.rows;
} catch (_) {}
const rows = [];
let gotChunk = false;
for (let i = 0; i < 20; i++) {
  try {
    const part = await fetchJson(base + 'data/outreach-' + tab + '-' + i + '.json');
    rows.push(...(part.rows || []));
    gotChunk = true;
  } catch (_) { if (gotChunk) break; }
}
if (gotChunk) return rows;
if (tab === 'justin-customer') return loadJustinFromParts(base);
if (tab === 'seo-links') return loadSeoFromLedger(base);
return rows;
}
async function loadJustinFromParts(base) {
  const out = [];
  const statusMap = { bounced: 'bounce', ooo: 'skipped', 'auto-ack': 'sent' };
  try {
    const urls = ['usa_a_0','usa_a_1','usa_a_2','usa_b_0','usa_b_1','usa_b_2'].map(u => base + 'parts/' + u + '.json');
    const USA = (await Promise.all(urls.map(u => fetchJson(u).catch(() => [])))).flat();
    for (const o of USA) {
      out.push({
        date_ist: o.sent_at || '',
        agent: 'Justin',
        campaign: 'justin-customer-usa',
        tab: 'justin-customer',
        name: o.name || '',
        email: o.email || '',
        region: 'USA',
        subject: o.subject || '',
        status: statusMap[(o.status || 'sent').toLowerCase()] || (o.status || 'sent').toLowerCase(),
        notes: o.company || '',
      });
    }
  } catch (_) {}
  for (let i = 0; i < 12; i++) {
    const id = 'r' + String(i).padStart(2, '0');
    try {
      const chunk = await fetchJson(base + 'parts/' + id + '.json');
      const items = Array.isArray(chunk) ? chunk : (chunk.rows || chunk.activities || []);
      for (const o of items) {
        if ((o.track || o.tab || '') !== 'justin-customer' && (o.owner || '') !== 'Justin') continue;
        const st = statusMap[String(o.status || 'sent').toLowerCase()] || String(o.status || 'sent').toLowerCase();
        out.push({
          date_ist: o.date || o.date_ist || o.sent_at || '',
          agent: o.owner || 'Justin',
          campaign: o.batch || o.track || 'justin-customer',
          tab: 'justin-customer',
          name: o.name || '',
          email: o.email || '',
          region: o.geo || o.region || '',
          subject: o.subject || '',
          status: ['sent','replied','hot','meeting','won','skipped','bounce'].includes(st) ? st : 'sent',
          notes: o.notes || o.company || '',
        });
      }
    } catch (_) { if (i > 0) break; }
  }
  return out;
}
async function loadSeoFromLedger(base) {
  try {
    const L = await fetchJson(base + 'parts/mention_ledger.json');
    const out = [];
    const map = { live: 'won', waiting: 'sent', blocked: 'skipped', parked: 'skipped' };
    for (const [bucket, status] of Object.entries(map)) {
      for (const o of (L[bucket] || [])) {
        out.push({
          date_ist: L.as_of || '',
          agent: 'SEO',
          campaign: 'seo-links',
          tab: 'seo-links',
          name: o.channel || '',
          email: '',
          region: o.type || bucket,
          subject: o.url || o.next || '',
          status,
          notes: bucket + ': ' + (o.note || o.why || o.unblock || o.next || o.type || ''),
          website: o.url || '',
        });
      }
    }
    return out;
  } catch (_) { return []; }
}
const tabFiles = [];
for (const t of TABS_DATA) {
tabFiles.push({ rows: await loadTabRows(t) });
}
const rows = tabFiles.flatMap(p => p.rows || []);
return { ...meta, rows };
}
async function loadData() {
let lastErr;
for (const base of BASES) {
try {
return await loadFromBase(base);
} catch (e) { lastErr = e; }
}
throw lastErr || new Error('no data');
}
function esc(s) {
return String(s == null ? '' : s)
.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function badge(status) {
const s = (status || 'sent').toLowerCase();
return `<span class="badge ${esc(s)}">${esc(s)}</span>`;
}
function dateOnly(ist) {
if (!ist) return '';
const m = String(ist).match(/(\d{4}-\d{2}-\d{2})/);
return m ? m[1] : '';
}
function uniq(arr) {
return [...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
function fillSelect(id, values) {
const el = document.getElementById(id);
const cur = el.value;
const opts = ['<option value="">All</option>'].concat(values.map(v =>
`<option value="${esc(v)}">${esc(v)}</option>`));
el.innerHTML = opts.join('');
if (values.includes(cur)) el.value = cur;
}
function rowsForTab(tab) {
const all = DATA.rows || [];
if (tab === 'overview') return all.filter(r => r.tab !== 'replies');
return all.filter(r => r.tab === tab);
}
function currentFilters() {
return {
status: document.getElementById('f-status').value,
agent: document.getElementById('f-agent').value,
region: document.getElementById('f-region').value,
campaign: document.getElementById('f-campaign').value,
from: document.getElementById('f-from').value,
to: document.getElementById('f-to').value,
q: (document.getElementById('f-q').value || '').trim().toLowerCase(),
};
}
function applyFilters(rows) {
const f = currentFilters();
return rows.filter(r => {
if (f.status && r.status !== f.status) return false;
if (f.agent && r.agent !== f.agent) return false;
if (f.region && r.region !== f.region) return false;
if (f.campaign && r.campaign !== f.campaign) return false;
const d = dateOnly(r.date_ist);
if (f.from && d && d < f.from) return false;
if (f.to && d && d > f.to) return false;
if (f.q) {
const blob = [r.name,r.email,r.subject,r.notes,r.campaign,r.region,r.reply_snippet].join(' ').toLowerCase();
if (!blob.includes(f.q)) return false;
}
return true;
});
}
function renderCards() {
const t = DATA.totals || {};
const by = t.by_status || {};
const items = [
['ALL', t.all || 0],
['SENT', by.sent || 0],
['REPLIED', by.replied || 0],
['MEETING', by.meeting || 0],
['HOT', by.hot || 0],
['WON', by.won || 0],
['SKIPPED', by.skipped || 0],
['BOUNCE', by.bounce || 0],
];
document.getElementById('cards').innerHTML = items.map(([l,n]) =>
`<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`
).join('');
}
function renderTabs() {
const tabs = DATA.tabs || [];
const counts = DATA.totals?.by_tab || {};
document.getElementById('tabs').innerHTML = tabs.map(t => {
const c = t.id === 'overview' ? (DATA.totals?.all || 0) : (counts[t.id] || 0);
return `<button class="tab${t.id===activeTab?' active':''}" data-tab="${esc(t.id)}" onclick="showTab('${esc(t.id)}')">${esc(t.label)} (${c})</button>`;
}).join('');
}
function syncFilterOptions(baseRows) {
fillSelect('f-status', uniq(baseRows.map(r => r.status)));
fillSelect('f-agent', uniq(baseRows.map(r => r.agent)));
fillSelect('f-region', uniq(baseRows.map(r => r.region)));
fillSelect('f-campaign', uniq(baseRows.map(r => r.campaign)));
}
function renderTable() {
const base = rowsForTab(activeTab);
syncFilterOptions(base);
const rows = applyFilters(base);
document.getElementById('meta').innerHTML =
`Showing <b>${rows.length}</b> of <b>${base.length}</b> in <b>${esc(activeTab)}</b>`;
if (!rows.length) {
document.getElementById('table').innerHTML = `<div class="empty">No rows match these filters.</div>`;
return;
}
const showReply = activeTab === 'replies' || activeTab === 'overview';
const body = rows.map(r => {
const replyCell = (r.reply_snippet)
? `<div class="snippet">${esc(r.reply_snippet)}</div>${r.reply_date_ist ? `<div class="notes">${esc(r.reply_date_ist)}</div>` : ''}`
: '—';
return `<tr>
<td>${esc(r.date_ist || '—')}</td>
<td>${esc(r.agent || '')}</td>
<td>${esc(r.campaign || '')}</td>
<td>${esc(r.name || '')}</td>
<td>${r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : '—'}</td>
<td>${esc(r.region || '—')}</td>
<td>${esc(r.subject || '—')}</td>
<td>${badge(r.status)}</td>
<td class="notes">${esc(r.notes || '—')}</td>
${showReply ? `<td>${replyCell}</td>` : ''}
</tr>`;
}).join('');
document.getElementById('table').innerHTML = `
<div class="table-wrap"><table>
<thead><tr>
<th>Date (IST)</th><th>Agent</th><th>Campaign</th><th>Name</th><th>Email</th>
<th>Region</th><th>Subject</th><th>Status</th><th>Notes</th>
${showReply ? '<th>Reply</th>' : ''}
</tr></thead>
<tbody>${body}</tbody>
</table></div>`;
}
function showTab(id) {
activeTab = id;
[...document.querySelectorAll('.tab')].forEach(b => b.classList.toggle('active', b.dataset.tab === id));
renderTable();
}
async function boot() {
DATA = await loadData();
document.getElementById('updated').textContent = DATA.updated_at_ist || '';
renderCards();
renderTabs();
['f-status','f-agent','f-region','f-campaign','f-from','f-to','f-q'].forEach(id => {
document.getElementById(id).addEventListener('input', renderTable);
document.getElementById(id).addEventListener('change', renderTable);
});
showTab('overview');
}
boot().catch(e => {
document.getElementById('table').innerHTML = '<div class="empty">Failed to load data/outreach.json</div>';
console.error(e);
});
