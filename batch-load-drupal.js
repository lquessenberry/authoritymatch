#!/usr/bin/env node
/**
 * Batch Load Authorities into Drupal
 * Loads JSON batch files into Drupal via GraphQL mutations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  DRUPAL_URL: process.env.DRUPAL_URL || 'http://localhost:8080',
  GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT || '/graphql',
  BATCH_DIR: process.env.BATCH_DIR || './data',
  CLIENT_ID: process.env.OAUTH_CLIENT_ID || '',
  CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET || '',
  DRY_RUN: process.env.DRY_RUN === 'true',
  DELAY_MS: parseInt(process.env.DELAY_MS) || 100, // Delay between requests
  START_BATCH: parseInt(process.env.START_BATCH) || 1,
  MAX_BATCHES: parseInt(process.env.MAX_BATCHES) || Infinity,
};

// OAuth token cache
let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await fetch(`${CONFIG.DRUPAL_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CONFIG.CLIENT_ID,
      client_secret: CONFIG.CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Buffer 1 min

  return accessToken;
}

async function createAuthority(record) {
  const query = `
    mutation CreateAuthority($input: AuthorityRecordInput!) {
      createAuthorityRecord(input: $input) {
        entity {
          id
          dotNumber
          legalName
          state
        }
        errors
        violations {
          message
        }
      }
    }
  `;

  const token = await getAccessToken();

  const response = await fetch(`${CONFIG.DRUPAL_URL}${CONFIG.GRAPHQL_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          dotNumber: record.dotNumber,
          legalName: record.legalName || 'Unknown',
          dbaName: record.dbaName || '',
          state: record.state,
          status: record.status,
          phone: record.phone,
          email: record.email,
          physicalAddress: record.physicalAddress,
          mailingAddress: record.mailingAddress,
          totalDrivers: record.totalDrivers,
          totalPowerUnits: record.totalPowerUnits,
          source: record.source,
        }
      }
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }

  if (result.data?.createAuthorityRecord?.violations?.length > 0) {
    throw new Error(`Validation error: ${result.data.createAuthorityRecord.violations[0].message}`);
  }

  return result.data?.createAuthorityRecord?.entity;
}

async function processBatch(batchFile) {
  const records = JSON.parse(fs.readFileSync(batchFile, 'utf-8'));
  const results = {
    total: records.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  console.log(`📦 Processing ${path.basename(batchFile)} (${records.length} records)`);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      if (!CONFIG.DRY_RUN) {
        await createAuthority(record);
        await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
      }
      results.success++;
      process.stdout.write(`\r  ✅ ${i + 1}/${records.length} | Success: ${results.success} | Failed: ${results.failed}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ dot: record.dotNumber, error: error.message });
      process.stdout.write(`\r  ⚠️  ${i + 1}/${records.length} | Success: ${results.success} | Failed: ${results.failed}`);
    }
  }

  console.log('');
  return results;
}

async function loadBatches() {
  console.log('🚀 Drupal Batch Loader');
  console.log('=====================');
  console.log(`Drupal: ${CONFIG.DRUPAL_URL}`);
  console.log(`Batches: ${CONFIG.BATCH_DIR}`);
  console.log(`Dry run: ${CONFIG.DRY_RUN}`);
  console.log(`Delay: ${CONFIG.DELAY_MS}ms`);
  console.log('');

  // Find batch files
  const files = fs.readdirSync(CONFIG.BATCH_DIR)
    .filter(f => f.match(/batch_\d+\.json$/))
    .sort()
    .slice(CONFIG.START_BATCH - 1, CONFIG.START_BATCH - 1 + CONFIG.MAX_BATCHES);

  if (files.length === 0) {
    console.log('❌ No batch files found');
    return;
  }

  console.log(`📁 Found ${files.length} batch files`);
  console.log('');

  const totals = { total: 0, success: 0, failed: 0 };

  for (const file of files) {
    const batchPath = path.join(CONFIG.BATCH_DIR, file);
    const results = await processBatch(batchPath);

    totals.total += results.total;
    totals.success += results.success;
    totals.failed += results.failed;

    // Save error log if failures
    if (results.failed > 0) {
      const errorLog = batchPath.replace('.json', '_errors.json');
      fs.writeFileSync(errorLog, JSON.stringify(results.errors, null, 2));
      console.log(`  📝 Error log: ${path.basename(errorLog)}`);
    }

    console.log('');
  }

  console.log('✅ Loading complete!');
  console.log(`   Total: ${totals.total}`);
  console.log(`   Success: ${totals.success}`);
  console.log(`   Failed: ${totals.failed}`);
}

// CLI
loadBatches().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
