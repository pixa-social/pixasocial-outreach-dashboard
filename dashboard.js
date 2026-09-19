/* boot: concat same-origin parts then eval */
(async () => {
  const parts = await Promise.all(
    [0, 1, 2, 3].map((i) =>
      fetch('dashboard.p' + i + '.js.txt', { cache: 'no-store' }).then((r) => {
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
