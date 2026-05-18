#!/usr/bin/env node
/**
 * Batch CSV Ingestion for FMCSA Authority Records
 * Processes large CSV files in manageable batches with resume capability
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Configuration
const CONFIG = {
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 1000,
  CHECKPOINT_INTERVAL: parseInt(process.env.CHECKPOINT_INTERVAL) || 10000,
  OUTPUT_DIR: process.env.OUTPUT_DIR || './data',
  STATE_FILTER: (process.env.STATE_FILTER || '').toUpperCase(),
  DRY_RUN: process.env.DRY_RUN === 'true',
  RESUME_FROM: parseInt(process.env.RESUME_FROM) || 0,
};

// Progress tracking
class ProgressTracker {
  constructor(checkpointFile) {
    this.checkpointFile = checkpointFile;
    this.stats = {
      totalProcessed: 0,
      matched: 0,
      batchesCompleted: 0,
      errors: 0,
      startTime: Date.now(),
      lastLine: 0,
    };
    this.loadCheckpoint();
  }

  loadCheckpoint() {
    if (fs.existsSync(this.checkpointFile)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf-8'));
        this.stats = { ...this.stats, ...saved };
        console.log(`📍 Resuming from line ${this.stats.lastLine}`);
      } catch (e) {
        console.log('⚠️ Could not load checkpoint, starting fresh');
      }
    }
  }

  saveCheckpoint() {
    fs.writeFileSync(this.checkpointFile, JSON.stringify(this.stats, null, 2));
  }

  update(lineNumber, matched = false, error = false) {
    this.stats.totalProcessed++;
    if (matched) this.stats.matched++;
    if (error) this.stats.errors++;
    this.stats.lastLine = lineNumber;

    if (this.stats.totalProcessed % CONFIG.CHECKPOINT_INTERVAL === 0) {
      this.saveCheckpoint();
      this.printProgress();
    }
  }

  printProgress() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.totalProcessed / elapsed;
    const batches = Math.floor(this.stats.totalProcessed / CONFIG.BATCH_SIZE);
    
    process.stdout.write(`\r📊 Processed: ${this.stats.totalProcessed.toLocaleString()} | ` +
      `Matched: ${this.stats.matched.toLocaleString()} | ` +
      `Batches: ${batches} | ` +
      `Rate: ${rate.toFixed(0)}/s | ` +
      `Errors: ${this.stats.errors}`);
  }

  finish() {
    this.saveCheckpoint();
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    console.log('\n');
    console.log('✅ Batch processing complete!');
    console.log(`   Total processed: ${this.stats.totalProcessed.toLocaleString()}`);
    console.log(`   Matched records: ${this.stats.matched.toLocaleString()}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Time: ${elapsed.toFixed(1)}s`);
    console.log(`   Avg rate: ${(this.stats.totalProcessed / elapsed).toFixed(0)} records/s`);
  }
}

// Batch processor
class BatchProcessor {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.currentBatch = [];
    this.batchNumber = 0;
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  add(record) {
    this.currentBatch.push(record);
    
    if (this.currentBatch.length >= CONFIG.BATCH_SIZE) {
      this.flush();
    }
  }

  flush() {
    if (this.currentBatch.length === 0) return;

    this.batchNumber++;
    const filename = path.join(this.outputDir, `batch_${String(this.batchNumber).padStart(5, '0')}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(this.currentBatch, null, 2));
    console.log(`\n💾 Saved batch ${this.batchNumber}: ${this.currentBatch.length} records → ${filename}`);
    
    this.currentBatch = [];
  }

  close() {
    this.flush();
  }
}

// Transform FMCSA record to AuthorityRecord format
function transformRecord(values, headers) {
  const getValue = (index) => values[index]?.replace(/^"|"$/g, '').trim() || '';
  
  return {
    dotNumber: getValue(3),
    legalName: getValue(17), // COMPANY_OFFICER_1 or find LEGAL_NAME
    dbaName: getValue(18), // COMPANY_OFFICER_2 or find DBA
    state: getValue(57), // PHY_STATE
    status: getValue(2), // STATUS_CODE
    carrierOperation: getValue(7), // CARRIER_OPERATION
    physicalAddress: {
      street: getValue(50), // PHY_STREET
      city: getValue(51), // PHY_CITY
      state: getValue(57), // PHY_STATE
      zip: getValue(58), // PHY_ZIP
    },
    mailingAddress: {
      street: getValue(60), // CARRIER_MAILING_STREET
      city: getValue(61), // CARRIER_MAILING_CITY
      state: getValue(62), // CARRIER_MAILING_STATE
      zip: getValue(63), // CARRIER_MAILING_ZIP
    },
    phone: getValue(16), // PHONE
    fax: getValue(17), // FAX
    email: '', // Not in census file
    
    // Authority dates
    mcs150Date: getValue(0), // MCS150_DATE
    addDate: getValue(1), // ADD_DATE
    
    // Safety/insurance
    safetyRating: '', // Not directly in census
    insuranceStatus: '', // Would need separate lookup
    
    // Fleet info
    totalDrivers: parseInt(getValue(37)) || 0, // TOTAL_DRIVERS
    totalPowerUnits: parseInt(getValue(23)) || 0, // POWER_UNITS
    
    // Metadata
    rawData: {
      censusLine: values.join(','),
    },
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'FMCSA_CENSUS_20260518',
  };
}

// Main processing function
async function processBatches(filePath) {
  console.log('🚛 FMCSA Batch Ingestion');
  console.log('========================');
  console.log(`File: ${filePath}`);
  console.log(`Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`State filter: ${CONFIG.STATE_FILTER || 'All'}`);
  console.log(`Dry run: ${CONFIG.DRY_RUN}`);
  console.log(`Resume from: ${CONFIG.RESUME_FROM || 'Start'}`);
  console.log('');

  const checkpointFile = path.join(CONFIG.OUTPUT_DIR, 'checkpoint.json');
  const tracker = new ProgressTracker(checkpointFile);
  const processor = new BatchProcessor(CONFIG.OUTPUT_DIR);

  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream });

  let headers = null;
  let lineNumber = 0;
  let matched = 0;

  for await (const line of rl) {
    lineNumber++;

    // Skip to resume point
    if (lineNumber < tracker.stats.lastLine) {
      continue;
    }

    // Parse header
    if (lineNumber === 1) {
      headers = line.split(',').map(h => h.trim());
      console.log(`📋 Headers: ${headers.length} columns`);
      console.log(`   Key columns: DOT_NUMBER=4, PHY_STATE=58, STATUS=3`);
      console.log('');
      continue;
    }

    if (!line.trim()) continue;

    const values = line.split(',');
    const state = values[57]?.replace(/"/g, '').trim().toUpperCase();

    // Apply state filter
    if (CONFIG.STATE_FILTER && state !== CONFIG.STATE_FILTER) {
      tracker.update(lineNumber);
      continue;
    }

    try {
      const record = transformRecord(values, headers);
      
      if (!CONFIG.DRY_RUN) {
        processor.add(record);
      }
      
      matched++;
      tracker.update(lineNumber, true);
    } catch (error) {
      console.error(`\n❌ Error on line ${lineNumber}: ${error.message}`);
      tracker.update(lineNumber, false, true);
    }
  }

  processor.close();
  tracker.finish();

  // Summary
  console.log('');
  console.log('📁 Output:');
  console.log(`   Directory: ${CONFIG.OUTPUT_DIR}`);
  console.log(`   Batches: ${processor.batchNumber}`);
  console.log(`   Checkpoint: ${checkpointFile}`);
}

// CLI
const filePath = process.argv[2] || '/home/lquessenberry/Downloads/Company_Census_File_20260518.csv';

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

processBatches(filePath).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
