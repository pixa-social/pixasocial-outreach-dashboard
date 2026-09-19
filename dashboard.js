/* boot: load UI parts from GitHub (Vercel deploy lag workaround) */
(async () => {
  const base =
    'https://raw.githubusercontent.com/pixa-social/pixasocial-outreach-dashboard/main/';
  const parts = await Promise.all(
    [0, 1, 2, 3].map((i) =>
      fetch(base + 'dashboard.p' + i + '.js.txt', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('part ' + i + ' ' + r.status);
        return r.text();
      })
    )
  );
  (0, eval)(parts.join(''));
})().catch((e) => {
  const el = document.getElementById('table');
  if (el) el.innerHTML = '<div class="empty">Boot failed: ' + String(e) + '</div>';
  console.error(e);
});
