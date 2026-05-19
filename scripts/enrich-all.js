#!/usr/bin/env node
/**
 * Enrich All Arkansas Carriers with FMCSA API Data
 * 
 * Processes all batch files and fetches real-time data from FMCSA API.
 * Can be run as a background job on Fly.io or locally.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FMCSA_API_KEY = process.env.FMCSA_API_KEY;
const FMCSA_API_URL = 'https://mobile.fmcsa.dot.gov/qc/services';
const DATA_DIR = process.env.DATA_DIR || './data';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './data/enriched';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50'); // Carriers per batch API call
const RATE_LIMIT_MS = parseInt(process.env.RATE_LIMIT_MS || '200'); // Delay between API calls

if (!FMCSA_API_KEY) {
  console.error('❌ FMCSA_API_KEY not set');
  process.exit(1);
}

// Fetch carrier details
async function fetchCarrierDetails(dotNumber) {
  const url = `${FMCSA_API_URL}/carriers/${dotNumber}?webKey=${FMCSA_API_KEY}`;
  
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(res.statusCode === 200 ? parsed.content : null);
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
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

// Enrich carriers in parallel with rate limiting
async function enrichBatch(carriers) {
  const results = [];
  
  for (const carrier of carriers) {
    const [details, safety] = await Promise.all([
      fetchCarrierDetails(carrier.dotNumber),
      fetchSafetyRating(carrier.dotNumber)
    ]);
    
    if (details) {
      results.push({
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
          totalDrivers: details.totalDrivers ?? carrier.totalDrivers,
          totalPowerUnits: details.totalPowerUnits ?? carrier.totalPowerUnits,
          statusCode: details.statusCode || carrier.status,
          safetyRating: safety?.rating || carrier.safetyRating,
          safetyReviewDate: safety?.reviewDate,
          carrierOperation: details.carrierOperation,
          mcs150Date: details.MCS150Date,
          addDate: details.addDate,
          fetchedAt: new Date().toISOString()
        }
      });
    } else {
      results.push({ ...carrier, apiEnriched: false });
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }
  
  return results;
}

// Process a single batch file
async function processBatchFile(batchFile) {
  console.log(`\n📂 Processing ${batchFile}...`);
  
  const inputPath = path.join(DATA_DIR, batchFile);
  const outputPath = path.join(OUTPUT_DIR, `enriched_${batchFile}`);
  
  // Skip if already enriched
  if (fs.existsSync(outputPath) && !process.env.FORCE_REENRICH) {
    console.log(`  ⏭️  Already enriched (use FORCE_REENRICH=1 to override)`);
    return { file: batchFile, skipped: true };
  }
  
  const carriers = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`  📊 ${carriers.length} carriers to enrich`);
  
  // Process in chunks
  const enriched = [];
  let processed = 0;
  let successful = 0;
  
  for (let i = 0; i < carriers.length; i += BATCH_SIZE) {
    const chunk = carriers.slice(i, i + BATCH_SIZE);
    const results = await enrichBatch(chunk);
    
    enriched.push(...results);
    processed += chunk.length;
    successful += results.filter(r => r.apiEnriched).length;
    
    // Progress
    const pct = Math.round((processed / carriers.length) * 100);
    process.stdout.write(`\r  ⏳ ${pct}% (${processed}/${carriers.length}) - ${successful} successful `);
  }
  
  console.log(); // newline
  
  // Save
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
  
  console.log(`  ✅ Saved to enriched_${batchFile}`);
  console.log(`  📈 Success rate: ${Math.round(successful/processed*100)}%`);
  
  return { 
    file: batchFile, 
    total: carriers.length, 
    successful, 
    rate: Math.round(successful/carriers.length*100) 
  };
}

// Main
async function main() {
  console.log('🚛 FMCSA API Full Enrichment');
  console.log('=============================');
  console.log(`API Key: ${FMCSA_API_KEY.substring(0, 10)}...${FMCSA_API_KEY.slice(-4)}`);
  console.log(`Data Dir: ${DATA_DIR}`);
  console.log(`Output Dir: ${OUTPUT_DIR}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Rate Limit: ${RATE_LIMIT_MS}ms`);
  console.log('');
  
  // Create output dir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Find batch files
  const batchFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^batch_\d+\.json$/))
    .sort();
  
  console.log(`📂 Found ${batchFiles.length} batch files`);
  console.log('');
  
  // Process all
  const results = [];
  let totalCarriers = 0;
  let totalSuccessful = 0;
  
  for (let i = 0; i < batchFiles.length; i++) {
    const batchFile = batchFiles[i];
    console.log(`\n[${i + 1}/${batchFiles.length}]`);
    
    const result = await processBatchFile(batchFile);
    results.push(result);
    
    if (!result.skipped) {
      totalCarriers += result.total;
      totalSuccessful += result.successful;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Batch files processed: ${results.filter(r => !r.skipped).length}/${batchFiles.length}`);
  console.log(`Total carriers: ${totalCarriers.toLocaleString()}`);
  console.log(`Successfully enriched: ${totalSuccessful.toLocaleString()}`);
  console.log(`Overall success rate: ${Math.round(totalSuccessful/totalCarriers*100)}%`);
  console.log('');
  console.log('💾 Enriched data saved to: ' + OUTPUT_DIR);
  console.log('');
  console.log('Next: Run sync-engine.js to detect changes and update Drupal');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
