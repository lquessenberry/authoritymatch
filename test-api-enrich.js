#!/usr/bin/env node
/**
 * Test FMCSA API Enrichment for Arkansas Carriers
 * 
 * Takes carriers from batch files, fetches real-time details from FMCSA API,
 * and compares/enriches the data.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FMCSA_API_KEY = process.env.FMCSA_API_KEY;
const FMCSA_API_URL = 'https://mobile.fmcsa.dot.gov/qc/services';
const DATA_DIR = './data';
const OUTPUT_DIR = './data/enriched';

if (!FMCSA_API_KEY) {
  console.error('❌ FMCSA_API_KEY not set');
  console.log('Usage: FMCSA_API_KEY=xxx node test-api-enrich.js [batch_file]');
  process.exit(1);
}

// Fetch carrier details from FMCSA API
async function fetchCarrierDetails(dotNumber) {
  const url = `${FMCSA_API_URL}/carriers/${dotNumber}?webKey=${FMCSA_API_KEY}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.content) {
            resolve(parsed.content);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Fetch safety rating
async function fetchSafetyRating(dotNumber) {
  const url = `${FMCSA_API_URL}/carriers/${dotNumber}/safer/safetyrating?webKey=${FMCSA_API_KEY}`;
  
  return new Promise((resolve) => {
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// Enrich a single carrier
async function enrichCarrier(carrier) {
  console.log(`  📡 Fetching DOT#${carrier.dotNumber}...`);
  
  const [details, safetyRating] = await Promise.all([
    fetchCarrierDetails(carrier.dotNumber),
    fetchSafetyRating(carrier.dotNumber)
  ]);
  
  if (!details) {
    console.log(`  ⚠️  No API data for DOT#${carrier.dotNumber}`);
    return { ...carrier, apiEnriched: false };
  }
  
  // Compare and merge data
  const enriched = {
    ...carrier,
    apiEnriched: true,
    apiData: {
      legalName: details.legalName || carrier.legalName,
      dbaName: details.dbaName || carrier.dbaName,
      phyStreet: details.phyStreet,
      phyCity: details.phyCity,
      phyState: details.phyState,
      phyZipcode: details.phyZipcode,
      telephone: details.telephone,
      emailAddress: details.emailAddress,
      totalDrivers: details.totalDrivers || carrier.totalDrivers,
      totalPowerUnits: details.totalPowerUnits || carrier.totalPowerUnits,
      statusCode: details.statusCode || carrier.status,
      safetyRating: safetyRating?.rating || carrier.safetyRating,
      safetyReviewDate: safetyRating?.reviewDate,
      carrierOperation: details.carrierOperation,
      mcs150Date: details.MCS150Date,
      addDate: details.addDate,
      fetchedAt: new Date().toISOString()
    }
  };
  
  // Detect changes
  const changes = [];
  if (carrier.legalName !== details.legalName && details.legalName) {
    changes.push({ field: 'legalName', csv: carrier.legalName, api: details.legalName });
  }
  if (carrier.status !== details.statusCode && details.statusCode) {
    changes.push({ field: 'status', csv: carrier.status, api: details.statusCode });
  }
  if (String(carrier.totalDrivers) !== String(details.totalDrivers) && details.totalDrivers) {
    changes.push({ field: 'totalDrivers', csv: carrier.totalDrivers, api: details.totalDrivers });
  }
  if (carrier.safetyRating !== safetyRating?.rating && safetyRating?.rating) {
    changes.push({ field: 'safetyRating', csv: carrier.safetyRating, api: safetyRating.rating });
  }
  
  if (changes.length > 0) {
    console.log(`  📝 Changes detected:`);
    changes.forEach(c => console.log(`     ${c.field}: "${c.csv}" → "${c.api}"`));
  } else {
    console.log(`  ✅ Data matches`);
  }
  
  return enriched;
}

// Process a batch file
async function processBatch(batchFile) {
  console.log(`\n📂 Processing ${batchFile}...`);
  console.log('='.repeat(60));
  
  const batchPath = path.join(DATA_DIR, batchFile);
  const carriers = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  
  console.log(`📊 Loaded ${carriers.length} carriers`);
  
  // Enrich first 10 carriers (limit for testing)
  const testCount = Math.min(10, carriers.length);
  console.log(`🧪 Testing with first ${testCount} carriers\n`);
  
  const enriched = [];
  let successCount = 0;
  let changeCount = 0;
  
  for (let i = 0; i < testCount; i++) {
    const carrier = carriers[i];
    const result = await enrichCarrier(carrier);
    enriched.push(result);
    
    if (result.apiEnriched) successCount++;
    
    // Rate limiting - be nice to FMCSA
    if (i < testCount - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  // Summary
  console.log('\n📊 Summary');
  console.log('='.repeat(60));
  console.log(`Processed: ${testCount} carriers`);
  console.log(`Successful API lookups: ${successCount}/${testCount}`);
  console.log(`Success rate: ${Math.round(successCount/testCount*100)}%`);
  
  // Save enriched data
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputFile = path.join(OUTPUT_DIR, `enriched_${batchFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
  console.log(`\n💾 Saved to: ${outputFile}`);
  
  return { processed: testCount, success: successCount };
}

// Main
async function main() {
  console.log('🚛 FMCSA API Enrichment Test');
  console.log('============================');
  console.log(`API Key: ${FMCSA_API_KEY.substring(0, 10)}...${FMCSA_API_KEY.slice(-4)}`);
  console.log('');
  
  const batchFile = process.argv[2] || 'batch_00001.json';
  
  try {
    const result = await processBatch(batchFile);
    
    console.log('\n✅ Test complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Check enriched data: cat data/enriched/enriched_' + batchFile);
    console.log('  2. Run full enrichment: FMCSA_API_KEY=xxx node scripts/enrich-all.js');
    console.log('  3. Set up automated sync in GitHub Actions');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
