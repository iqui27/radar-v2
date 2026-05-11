#!/usr/bin/env node
/**
 * Script para extrair dados do Google Search Console para o RADAR v2
 * 
 * Uso:
 *   node fetch-gsc-data.js --site "sc-domain:bb.com.br" --days 90 --output radar-data.csv
 * 
 * Requer:
 *   - npm install googleapis
 *   - Service Account JSON em ~/.config/gsc-credentials.json
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

const CREDENTIALS_PATH = path.join(process.env.HOME, '.config', 'gsc-credentials.json');

// Parse command line arguments
const { values } = parseArgs({
  options: {
    site: { type: 'string', short: 's' },
    days: { type: 'string', short: 'd', default: '90' },
    output: { type: 'string', short: 'o', default: 'radar-data.csv' },
    limit: { type: 'string', short: 'l', default: '5000' },
  },
  strict: false
});

if (!values.site) {
  console.error('❌ --site required. Example: --site "sc-domain:bb.com.br"');
  process.exit(1);
}

async function fetchGSCData() {
  // Load credentials
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ Credentials not found at ${CREDENTIALS_PATH}`);
    console.error('Create a Service Account in Google Cloud Console and save JSON there');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Calculate date range
  const days = parseInt(values.days) || 90;
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const rowLimit = parseInt(values.limit) || 5000;

  console.log(`🔍 Fetching GSC data for ${values.site}`);
  console.log(`   Date range: ${startDate} to ${endDate}`);
  console.log(`   Row limit: ${rowLimit}`);

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: values.site,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        aggregationType: 'auto',
        rowLimit,
        type: 'web'
      }
    });

    const rows = response.data.rows || [];

    if (rows.length === 0) {
      console.log('⚠️ No data returned. Check site verification and permissions.');
      return;
    }

    // Transform to RADAR format
    const data = rows.map(row => ({
      term: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 100, 2),  // GSC returns decimal, convert to %
      position: Math.round(row.position, 2)
    }));

    // Write CSV
    const csv = [
      'term,clicks,impressions,ctr,position',
      ...data.map(row => `${row.term},${row.clicks},${row.impressions},${row.ctr},${row.position}`)
    ].join('\n');

    fs.writeFileSync(values.output, csv);
    console.log(`✅ Wrote ${data.length} rows to ${values.output}`);

    // Summary
    const totalClicks = data.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = data.reduce((sum, row) => sum + row.impressions, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;

    console.log('\n📊 Summary:');
    console.log(`   Total terms: ${data.length}`);
    console.log(`   Total clicks: ${totalClicks.toLocaleString()}`);
    console.log(`   Total impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`   Average CTR: ${avgCTR.toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    process.exit(1);
  }
}

fetchGSCData();