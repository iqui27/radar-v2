# Google Search Console Integration - RADAR v2

## 📊 Fluxo de Dados

```
Google Search Console API
    ↓
fetch-gsc-data.js / fetch-gsc-data.py
    ↓
radar-data.csv (term, clicks, impressions, ctr, position)
    ↓
RADAR Import (lib/radar-import.ts)
    ↓
radar-data-source.ts (RAW_RADAR_DATA)
    ↓
Score Calculation (lib/radar-data.ts)
    ↓
Dashboard Components
```

---

## 🔧 Setup

### 1. Google Cloud Console

1. Create project: https://console.cloud.google.com
2. Enable **Search Console API**
3. Create **Service Account**
4. Download JSON credentials → `~/.config/gsc-credentials.json`
5. Add Service Account email to GSC site verification:
   - Go to Search Console → Settings → Users → Add user
   - Add the Service Account email with "Full" permissions

### 2. Install Dependencies

```bash
# Node.js
npm install googleapis

# Python
pip install google-auth google-api-python-client
```

---

## 🚀 Usage

### Node.js

```bash
node scripts/fetch-gsc-data.js \
  --site "sc-domain:bb.com.br" \
  --days 90 \
  --output radar-data.csv \
  --limit 5000
```

### Python

```bash
python scripts/fetch-gsc-data.py \
  --site "sc-domain:bb.com.br" \
  --days 90 \
  --output radar-data.csv \
  --limit 5000
```

---

## 📋 GSC API Query Structure

```json
{
  "siteUrl": "sc-domain:bb.com.br",
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "dimensions": ["query"],
  "aggregationType": "auto",
  "rowLimit": 5000,
  "type": "web"
}
```

### Site URL Formats

| Type | Example |
|------|---------|
| Domain property | `sc-domain:bb.com.br` |
| URL-prefix property | `https://www.bb.com.br/` |

---

## 📊 Dados Retornados

| GSC Field | RADAR Field | Notes |
|-----------|-------------|-------|
| `keys[0]` | `term` | Query string |
| `clicks` | `clicks` | Integer |
| `impressions` | `impressions` | Integer |
| `ctr` | `ctr` | GSC returns decimal (0.02), RADAR uses % (2.11) |
| `position` | `position` | Average position (1.0 - 100.0) |

---

## 🧮 Score Calculation (Local)

### Formula

```
score = weight × (1 - (ctr / expCTR))
```

### Expected CTR Table (Default)

| Position | Expected CTR |
|----------|--------------|
| 1 | 39.8% |
| 2 | 18.7% |
| 3 | 10.2% |
| 4 | 7.2% |
| 5 | 5.1% |
| 6-10 | 4.4% → 1.6% |
| 11-20 | 1.0% → 0.3% |

### Weight by Position

| Position Range | Weight |
|----------------|--------|
| ≤ 3 | 0.2 |
| ≤ 6 | 0.45 |
| ≤ 10 | 0.7 |
| > 10 | 1.0 |

### Score Bands → Action

| Score Range | Action | Color |
|-------------|--------|-------|
| ≤ 0.10 | Avoid | 🟢 #9BCF75 |
| ≤ 0.30 | Evaluate | 🟡 #D9D86A |
| ≤ 0.60 | Test | 🟠 #F4B24C |
| > 0.60 | Invest | 🔴 #E46147 |

---

## 📁 Import Format (CSV)

```csv
term,clicks,impressions,ctr,position
banco do brasil,131481,6243349,2.11,1.3
bb,81949,2870808,2.85,1.11
concurso banco do brasil,56835,414319,13.72,2.21
```

### Accepted Headers (Aliases)

| Standard | Alternatives |
|----------|--------------|
| term | termo, keyword, consulta |
| clicks | cliques, click |
| impressions | impressões, imp |
| ctr | ctr %, ctr real, ctrpercent |
| position | posição, pos, ranking |

---

## ⚠️ Limitations

- GSC API max 5000 rows per request
- For > 5000 terms: paginate or use multiple requests with filters
- GSC retains data for 16 months max
- ctr can be calculated locally if missing: `(clicks / impressions) × 100`

---

## 🔒 Security

- Keep `gsc-credentials.json` secure - never commit to repo
- Add to `.gitignore`:
  ```
  ~/.config/gsc-credentials.json
  radar-data.csv  # if contains sensitive data
  ```

---

## 📚 References

- [GSC API Docs](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Search Analytics Query](https://developers.google.com/webmaster-tools/v1/searchanalytics)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)