/* PixaSocial Outreach — same-origin data/outreach.json only */
const DATA_URL = 'data/outreach.json';

let DATA = null;
let activeTab = 'overview';

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

async function loadData() {
  const r = await fetch(DATA_URL, { cache: 'no-store' });
  if (!r.ok) throw new Error(DATA_URL + ' ' + r.status);
  return expandRows(await r.json());
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function badge(status) {
  const s = String(status || 'sent').toLowerCase();
  return '<span class="badge ' + esc(s) + '">' + esc(s) + '</span>';
}

function dateOnly(ist) {
  if (!ist) return '';
  const m = String(ist).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function fillSelect(id, values) {
  const el = document.getElementById(id);
  if (!el) return;
  const cur = el.value;
  el.innerHTML =
    '<option value="">All</option>' +
    values.map((v) => '<option value="' + esc(v) + '">' + esc(v) + '</option>').join('');
  if (values.includes(cur)) el.value = cur;
}

function rowWebsite(r) {
  const w = String(r.website || r.live_url || r.live_link || '').trim();
  if (w) return w;
  const sub = String(r.subject || '').trim();
  if (/^https?:\/\//i.test(sub)) return sub;
  return '';
}

function hasLiveOrWebsite(r) {
  return Boolean(rowWebsite(r));
}

function linkCell(url) {
  if (!url) return '—';
  let href = url;
  if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
  let label = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (label.length > 36) label = label.slice(0, 34) + '…';
  return (
    '<a class="ext" href="' +
    esc(href) +
    '" target="_blank" rel="noopener noreferrer">' +
    esc(label) +
    '</a>'
  );
}

function rowsForTab(tab) {
  const all = DATA.rows || [];
  if (tab === 'overview') return all.filter((r) => r.tab !== 'replies');
  return all.filter((r) => r.tab === tab);
}

function currentFilters() {
  return {
    status: document.getElementById('f-status').value || '',
    agent: document.getElementById('f-agent').value || '',
    region: document.getElementById('f-region').value || '',
    campaign: document.getElementById('f-campaign').value || '',
    from: document.getElementById('f-from').value || '',
    to: document.getElementById('f-to').value || '',
    q: (document.getElementById('f-q').value || '').trim().toLowerCase(),
    hasLink: document.getElementById('f-has-link').checked,
  };
}

function applyFilters(rows) {
  const f = currentFilters();
  return rows.filter((r) => {
    if (f.status && r.status !== f.status) return false;
    if (f.agent && r.agent !== f.agent) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.campaign && r.campaign !== f.campaign) return false;
    const d = dateOnly(r.date_ist);
    if (f.from && d && d < f.from) return false;
    if (f.to && d && d > f.to) return false;
    if (f.hasLink && !hasLiveOrWebsite(r)) return false;
    if (f.q) {
      const blob = [r.name, r.email, r.subject, r.notes, r.campaign, r.region, r.reply_snippet, r.website]
        .join(' ')
        .toLowerCase();
      if (!blob.includes(f.q)) return false;
    }
    return true;
  });
}

function ensureTotals() {
  if (DATA.totals && DATA.totals.all) return;
  const by_tab = {}, by_status = {}, by_agent = {};
  for (const r of DATA.rows || []) {
    if (r.tab) by_tab[r.tab] = (by_tab[r.tab] || 0) + 1;
    const st = String(r.status || 'sent').toLowerCase();
    by_status[st] = (by_status[st] || 0) + 1;
    if (r.agent) by_agent[r.agent] = (by_agent[r.agent] || 0) + 1;
  }
  DATA.totals = { all: (DATA.rows || []).length, by_tab, by_status, by_agent };
}

function renderCards() {
  ensureTotals();
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
  document.getElementById('cards').innerHTML = items
    .map(([l, n]) => '<div class="card"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>')
    .join('');
}

function renderTabs() {
  ensureTotals();
  const tabs = DATA.tabs || [];
  const counts = DATA.totals.by_tab || {};
  const overviewCount = (DATA.totals.all || 0) - (counts.replies || 0);
  document.getElementById('tabs').innerHTML = tabs
    .map((t) => {
      const c = t.id === 'overview' ? overviewCount : counts[t.id] || 0;
      return (
        '<button type="button" class="tab' +
        (t.id === activeTab ? ' active' : '') +
        '" data-tab="' +
        esc(t.id) +
        '">' +
        esc(t.label) +
        ' (' +
        c +
        ')</button>'
      );
    })
    .join('');
  document.querySelectorAll('.tab').forEach((b) => {
    b.onclick = () => showTab(b.dataset.tab);
  });
}

function syncFilterOptions(baseRows) {
  fillSelect('f-status', uniq(baseRows.map((r) => r.status)));
  fillSelect('f-agent', uniq(baseRows.map((r) => r.agent)));
  fillSelect('f-region', uniq(baseRows.map((r) => r.region)));
  fillSelect('f-campaign', uniq(baseRows.map((r) => r.campaign)));
}

function renderTable() {
  const base = rowsForTab(activeTab);
  syncFilterOptions(base);
  const rows = applyFilters(base);
  document.getElementById('meta').innerHTML =
    'Showing <b>' + rows.length + '</b> of <b>' + base.length + '</b> in <b>' + esc(activeTab) + '</b>';
  if (!rows.length) {
    document.getElementById('table').innerHTML =
      '<div class="empty">No rows match these filters. Clear filters to see data.</div>';
    return;
  }
  const showReply = activeTab === 'replies' || activeTab === 'overview';
  const body = rows
    .map((r) => {
      const replyCell = r.reply_snippet
        ? '<div class="snippet">' +
          esc(r.reply_snippet) +
          '</div>' +
          (r.reply_date_ist ? '<div class="notes">' + esc(r.reply_date_ist) + '</div>' : '')
        : '—';
      return (
        '<tr>' +
        '<td>' + esc(r.date_ist || '—') + '</td>' +
        '<td>' + esc(r.agent || '') + '</td>' +
        '<td>' + esc(r.campaign || '') + '</td>' +
        '<td>' + esc(r.name || '') + '</td>' +
        '<td>' + (r.email ? '<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : '—') + '</td>' +
        '<td>' + linkCell(rowWebsite(r)) + '</td>' +
        '<td>' + esc(r.region || '—') + '</td>' +
        '<td>' + esc(r.subject || '—') + '</td>' +
        '<td>' + badge(r.status) + '</td>' +
        '<td class="notes">' + esc(r.notes || '—') + '</td>' +
        (showReply ? '<td>' + replyCell + '</td>' : '') +
        '</tr>'
      );
    })
    .join('');
  document.getElementById('table').innerHTML =
    '<div class="table-wrap"><table><thead><tr>' +
    '<th>Date (IST)</th><th>Agent</th><th>Campaign</th><th>Name</th><th>Email</th>' +
    '<th>Website</th><th>Region</th><th>Subject</th><th>Status</th><th>Notes</th>' +
    (showReply ? '<th>Reply</th>' : '') +
    '</tr></thead><tbody>' +
    body +
    '</tbody></table></div>';
}

function showTab(id) {
  activeTab = id;
  document.querySelectorAll('.tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === id);
  });
  renderTable();
}

function bindFilters() {
  ['f-status', 'f-agent', 'f-region', 'f-campaign', 'f-from', 'f-to', 'f-q', 'f-has-link'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', renderTable);
    el.addEventListener('change', renderTable);
  });
}

async function boot() {
  document.getElementById('table').innerHTML = '<div class="empty">Loading outreach…</div>';
  DATA = await loadData();
  window.DATA = DATA;
  document.getElementById('updated').textContent = DATA.updated_at_ist || '';
  document.getElementById('f-status').value = '';
  document.getElementById('f-agent').value = '';
  document.getElementById('f-region').value = '';
  document.getElementById('f-campaign').value = '';
  document.getElementById('f-from').value = '';
  document.getElementById('f-to').value = '';
  document.getElementById('f-q').value = '';
  document.getElementById('f-has-link').checked = false;
  renderCards();
  renderTabs();
  bindFilters();
  showTab('overview');
}

boot().catch((e) => {
  document.getElementById('table').innerHTML =
    '<div class="empty">Failed to load <code>data/outreach.json</code> (same-origin). Check deploy.</div>';
  console.error(e);
});
