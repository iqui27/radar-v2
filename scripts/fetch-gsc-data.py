#!/usr/bin/env python3
"""
Script para extrair dados do Google Search Console para o RADAR v2

Uso:
  python fetch-gsc-data.py --site "sc-domain:bb.com.br" --days 90 --output radar-data.csv

Requer:
  - Google Cloud Project com Search Console API enabled
  - Service Account JSON credentials em ~/.config/gsc-credentials.json
  - Site verificado no GSC com Service Account added
"""

import argparse
import csv
import json
from datetime import datetime, timedelta
from pathlib import Path

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    print("❌ Instale: pip install google-auth google-api-python-client")
    exit(1)


CREDENTIALS_PATH = Path.home() / ".config" / "gsc-credentials.json"


def get_credentials():
    """Load Service Account credentials"""
    if not CREDENTIALS_PATH.exists():
        raise FileNotFoundError(
            f"Credentials not found at {CREDENTIALS_PATH}\n"
            "Create a Service Account in Google Cloud Console and save JSON here"
        )
    return service_account.Credentials.from_service_account_file(
        str(CREDENTIALS_PATH),
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
    )


def fetch_gsc_data(site_url: str, start_date: str, end_date: str, row_limit: int = 5000):
    """Fetch search analytics data from GSC API"""
    creds = get_credentials()
    service = build("searchconsole", "v1", credentials=creds)

    request = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query"],
        "aggregationType": "auto",
        "rowLimit": row_limit,
        "type": "web"
    }

    response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()

    if "rows" not in response:
        print(f"⚠️ No data returned. Check site verification and permissions.")
        return []

    return response["rows"]


def transform_for_radar(rows: list) -> list:
    """Transform GSC API response to RADAR format"""
    data = []
    for row in rows:
        term = row["keys"][0]
        clicks = row["clicks"]
        impressions = row["impressions"]
        ctr = row["ctr"] * 100  # Convert decimal to percentage
        position = row["position"]
        
        data.append({
            "term": term,
            "clicks": clicks,
            "impressions": impressions,
            "ctr": round(ctr, 2),
            "position": round(position, 2)
        })
    
    return data


def write_csv(data: list, output_path: str):
    """Write data to CSV file"""
    fieldnames = ["term", "clicks", "impressions", "ctr", "position"]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ Wrote {len(data)} rows to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Fetch GSC data for RADAR v2")
    parser.add_argument("--site", required=True, help="Site URL (e.g., 'sc-domain:bb.com.br')")
    parser.add_argument("--days", type=int, default=90, help="Number of days to fetch")
    parser.add_argument("--output", default="radar-data.csv", help="Output CSV file")
    parser.add_argument("--limit", type=int, default=5000, help="Max rows to fetch")
    
    args = parser.parse_args()
    
    # Calculate date range
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=args.days)).strftime("%Y-%m-%d")
    
    print(f"🔍 Fetching GSC data for {args.site}")
    print(f"   Date range: {start_date} to {end_date}")
    print(f"   Row limit: {args.limit}")
    
    # Fetch data
    rows = fetch_gsc_data(args.site, start_date, end_date, args.limit)
    
    if not rows:
        return
    
    # Transform
    data = transform_for_radar(rows)
    
    # Write CSV
    write_csv(data, args.output)
    
    # Print summary
    total_clicks = sum(row["clicks"] for row in data)
    total_impressions = sum(row["impressions"] for row in data)
    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    
    print(f"\n📊 Summary:")
    print(f"   Total terms: {len(data)}")
    print(f"   Total clicks: {total_clicks:,}")
    print(f"   Total impressions: {total_impressions:,}")
    print(f"   Average CTR: {avg_ctr:.2f}%")


if __name__ == "__main__":
    main()