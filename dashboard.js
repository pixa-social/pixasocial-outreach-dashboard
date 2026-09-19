/* boot: p0-p1 text, p2-p3 b64 */
(async () => {
  const [t0, t1, b2, b3] = await Promise.all([
    fetch('dashboard.p0.js.txt', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }),
    fetch('dashboard.p1.js.txt', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }),
    fetch('dashboard.p2.b64', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }),
    fetch('dashboard.p3.b64', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }),
  ]);
  (0, eval)([t0, t1, atob(b2.trim()), atob(b3.trim())].join(''));
})().catch((e) => {
  const el = document.getElementById('table');
  if (el) el.innerHTML = '<div class="empty">Boot failed: ' + String(e) + '</div>';
  console.error(e);
});
