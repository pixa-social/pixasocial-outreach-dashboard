
const CDN='https://cdn.jsdelivr.net/gh/pixa-social/pixasocial-outreach-dashboard@main/';
const BUST='?v=0919e';
const TAB_ORDER=['all','justin-customer','maya-agency','maya-affiliate','maya-distribution','maya-africa','maya-latam','maya-institutional','other'];
let DATA=null,activeTrack='all';
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(iso){if(!iso)return '—';const d=iso.replace('T',' ').replace(/\.\d+/,'').replace(/Z$/,' UTC');return d.length>22?d.slice(0,19)+' UTC':d;}
function badge(st){st=(st||'').toLowerCase();let c='st-sent';if(st==='replied')c='st-replied';else if(st==='ooo'||st==='auto-ack')c='st-ooo';else if(st==='bounced'||st==='blocked')c='st-bounced';return `<span class="badge ${c}">${esc(st)}</span>`;}
function expandSlim(raw,acts){return acts.map(a=>({date:a.d||a.date||'',direction:a.dir||a.direction||'',status:a.st||a.status||'',track:a.tr||a.track||'',geo:a.g||a.geo||'',name:a.n||a.name||'',company:a.c||a.company||'',email:a.e||a.email||'',subject:a.s||a.subject||'',notes:a.note||a.notes||'',owner:a.o||a.owner||''}));}
function filtered(){const acts=(DATA&&DATA.activities)||[];const q=(document.getElementById('q').value||'').trim().toLowerCase();const status=document.getElementById('status').value;const owner=document.getElementById('owner').value;const from=document.getElementById('from').value;const to=document.getElementById('to').value;return acts.filter(a=>{if(activeTrack!=='all'&&a.track!==activeTrack)return false;if(status&&a.status!==status)return false;if(owner&&a.owner!==owner)return false;if(from&&(a.date||'')<from)return false;if(to&&(a.date||'').slice(0,10)>to)return false;if(q&&!`${a.email} ${a.company} ${a.subject} ${a.name} ${a.notes}`.toLowerCase().includes(q))return false;return true;});}
function renderCards(){const s=(DATA&&DATA.summary)||{};const o=s.by_owner||{};document.getElementById('cards').innerHTML=[['Activities',s.total_activities||0],['Outbound',s.outbound||0],['Replies',s.replies||0],['Reply rate',(s.reply_rate_pct!=null?s.reply_rate_pct+'%':'—')],['Justin',o.Justin||0],['Maya',o.Maya||0]].map(([l,n])=>`<div class="card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');}
function renderTabs(){const labels=(DATA&&DATA.tab_labels)||{};const tracks=(DATA&&DATA.tracks)||['all'];const by=(DATA.summary&&DATA.summary.by_track)||{};document.getElementById('tabs').innerHTML=TAB_ORDER.filter(t=>tracks.includes(t)).map(t=>{const n=t==='all'?(DATA.summary&&DATA.summary.total_activities)||0:(by[t]||0);return `<button class="tab${t===activeTrack?' active':''}" data-track="${t}">${esc(labels[t]||t)} (${n})</button>`;}).join('');[...document.querySelectorAll('.tab')].forEach(b=>b.addEventListener('click',()=>{activeTrack=b.dataset.track;renderTabs();renderTable();}));}
function renderTable(){const rows=filtered();document.getElementById('count-label').textContent=rows.length+' shown';if(!rows.length){document.getElementById('table').innerHTML='<div class="empty">No matching activities.</div>';return;}document.getElementById('table').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Owner / Track</th><th>Name / Company</th><th>Email</th><th>Subject</th><th>Geo</th><th>Notes</th></tr></thead><tbody>${rows.map(a=>{const oc=a.owner==='Maya'?'owner-maya':'owner-justin';const rc=a.status==='replied'?'row-replied':'';return `<tr class="${oc} ${rc}"><td>${esc(fmtDate(a.date))}</td><td>${badge(a.status)}<div class="muted">${esc(a.direction)}</div></td><td>${esc(a.owner)}<div class="muted">${esc((DATA.tab_labels||{})[a.track]||a.track)}</div></td><td>${esc(a.name)}<div class="muted">${esc(a.company)}</div></td><td><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></td><td>${esc(a.subject)}</td><td class="muted">${esc(a.geo)}</td><td class="notes">${esc(a.notes)}</td></tr>`;}).join('')}</tbody></table></div>`;}
function bindFilters(){['q','status','owner','from','to'].forEach(id=>{document.getElementById(id).addEventListener('input',renderTable);document.getElementById(id).addEventListener('change',renderTable);});}
async function boot(){
  try{
    const local=await fetch('data.json',{cache:'no-store'});
    if(local.ok){DATA=await local.json(); if(DATA.schema==='activities-v1-slim'){DATA={...DATA,schema:'activities-v1',activities:expandSlim(DATA,DATA.activities)};}}
    else throw new Error('no local');
  }catch(e){
    const meta=await fetch(CDN+'parts/meta.json'+BUST,{cache:'no-store'}).then(r=>r.json());
    const chunks=await Promise.all((meta.chunk_files||[]).map(f=>fetch(CDN+'parts/'+f+BUST,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(f+' '+r.status);return r.json();})));
    let acts=chunks.flat();
    if(meta.slim) acts=expandSlim(meta,acts);
    DATA={...meta,schema:'activities-v1',activities:acts};
  }
  document.getElementById('updated').textContent=DATA.updated_at||'';
  renderCards();renderTabs();bindFilters();renderTable();
}
boot().catch(e=>{document.getElementById('table').innerHTML='<div class="empty">Failed to load data (CDN parts may still be uploading).</div>';console.error(e);});
