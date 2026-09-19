#!/usr/bin/env python3
"""Rebuild data/outreach.json from shards."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1] / "data"
meta = json.loads((root / "outreach-meta.json").read_text())
rows = []
tabs = ["maya-agency", "affiliates", "justin-customer", "seo-links", "replies"]
for tab in tabs:
    single = root / f"outreach-{tab}.json"
    if single.exists():
        rows.extend(json.loads(single.read_text()).get("rows") or [])
        continue
    i = 0
    while True:
        p = root / f"outreach-{tab}-{i}.json"
        if not p.exists():
            break
        rows.extend(json.loads(p.read_text()).get("rows") or [])
        i += 1
rows.sort(key=lambda r: r.get("date_ist") or "", reverse=True)
from collections import Counter
meta["rows"] = rows
meta["totals"] = {
    "all": len(rows),
    "by_tab": dict(Counter(r.get("tab") for r in rows)),
    "by_status": dict(Counter(r.get("status") for r in rows)),
    "by_agent": dict(Counter(r.get("agent") for r in rows)),
}
(root / "outreach.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
print("wrote", len(rows), "rows")
