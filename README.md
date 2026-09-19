# pixasocial-outreach-dashboard

Static outreach dashboard for PixaSocial (Maya agency track, affiliates, Justin customer outreach, SEO/links, and inbox replies).

## Live data

- **Source of truth:** [`data/outreach.json`](data/outreach.json)
- **UI:** [`index.html`](index.html) loads that JSON (local path first, then jsDelivr / raw GitHub CDN).

## Tabs

| Tab | Contents |
|-----|----------|
| Overview | All outreach rows (excludes dedicated Replies feed) |
| Maya Agency Track | Agency partnership sends |
| Affiliates/Distributors | Affiliate / marketplace / distributor outreach |
| Justin Customer | Justin’s customer outreach (India / USA / Africa / Other) |
| SEO/Links | Directory / mention ledger (live, waiting, blocked, parked) |
| Replies | Known inbound partner replies |

## Row schema

Append new rows to `data/outreach.json` → `rows` array. Keep `schema_version` and bump `updated_at_ist`.

```json
{
  "id": "optional-stable-id",
  "date_ist": "2026-09-19 15:28:11 IST",
  "agent": "Justin",
  "campaign": "justin-customer-usa",
  "tab": "justin-customer",
  "name": "Acme",
  "email": "hello@acme.com",
  "region": "USA",
  "subject": "Quick note on PixaSocial",
  "status": "sent",
  "notes": "Company or follow-up context",
  "website": "https://acme.com",
  "reply_snippet": "",
  "reply_date_ist": "",
  "message_id": ""
}
```

### Required fields

| Field | Description |
|-------|-------------|
| `date_ist` | Send or event time in IST (`YYYY-MM-DD HH:MM:SS IST`) |
| `agent` | `Maya` · `Justin` · `SEO` (or your name) |
| `campaign` | Batch / wave id (e.g. `justin-customer-usa`, `seo-links`) |
| `tab` | `maya-agency` · `affiliates` · `justin-customer` · `seo-links` · `replies` |
| `name` | Contact or company display name |
| `email` | Contact email (can be empty for SEO channels) |
| `region` | Geo or segment |
| `subject` | Email subject or listing URL |
| `status` | See status colors below |
| `notes` | Free text |

### Status colors

| Status | Meaning |
|--------|--------|
| `sent` | Outreach delivered |
| `replied` | Inbound reply (use notes for subtypes like replied-apply / replied-advertiser) |
| `hot` | High-priority interest |
| `meeting` | Call / meeting proposed or booked |
| `won` | Closed / live listing |
| `skipped` | Intentionally not pursuing (e.g. paid guest post) |
| `bounce` | Delivery failure |

## How Justin / SEO append rows

1. Open `data/outreach.json`.
2. Add your object to the `rows` array (newest first is nice but UI sorts by `date_ist`).
3. Set `tab` to `justin-customer` or `seo-links`.
4. Update top-level `updated_at_ist` and recount `totals` if you maintain them by hand (or regenerate with the build script).
5. Commit to `main` — Vercel / static host picks up the change.

For SEO listings you can also keep editing `parts/mention_ledger.json` and regenerate `data/outreach.json`.

## Legacy `parts/`

`parts/meta.json`, USA shards, and `mention_ledger.json` remain for backward compatibility and rebuilds. The dashboard UI now reads **only** `data/outreach.json`.

## Local preview

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```


## Data files

- `data/outreach.json` — full source of truth (preferred)
- Shards (fallback if the full file is unavailable): `data/outreach-meta.json` + `data/outreach-<tab>.json` (Justin may be split into `outreach-justin-customer-0.json` / `-1.json`)
