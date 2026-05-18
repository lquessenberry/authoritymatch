#!/usr/bin/env tsx
import { Command } from 'commander';
import { parseFMCSACSV } from '../sources/csv';
import { loadAuthority } from '../loaders';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('ingest-csv')
  .description('Import FMCSA authority records from CSV')
  .version('0.0.1')
  .requiredOption('-f, --file <path>', 'Path to FMCSA CSV file')
  .option('-s, --state <state>', 'Filter by state code (e.g., AR)')
  .option('-d, --since <date>', 'Filter by authority date (YYYY-MM-DD)')
  .option('-l, --limit <number>', 'Limit number of records', parseInt)
  .option('--dry-run', 'Parse but do not load to Drupal')
  .option('-o, --output <path>', 'Output JSON file for dry-run results')
  .action(async (options) => {
    console.log('🚛 AuthorityMatch CSV Ingestion');
    console.log('================================\n');

    // Validate file exists
    if (!fs.existsSync(options.file)) {
      console.error(`❌ File not found: ${options.file}`);
      process.exit(1);
    }

    const parseOptions = {
      filePath: path.resolve(options.file),
      stateFilter: options.state,
      sinceDate: options.since ? new Date(options.since) : undefined,
      limit: options.limit,
    };

    console.log(`📁 File: ${parseOptions.filePath}`);
    if (parseOptions.stateFilter) console.log(`🗺️  State Filter: ${parseOptions.stateFilter}`);
    if (parseOptions.sinceDate) console.log(`📅 Since: ${parseOptions.sinceDate.toISOString().split('T')[0]}`);
    if (parseOptions.limit) console.log(`🔢 Limit: ${parseOptions.limit}`);
    console.log('');

    try {
      console.log('🔍 Parsing CSV...');
      const authorities = await parseFMCSACSV(parseOptions);
      console.log(`✅ Found ${authorities.length} authority records\n`);

      // Show sample
      if (authorities.length > 0) {
        console.log('📋 Sample records:');
        authorities.slice(0, 3).forEach((auth, i) => {
          console.log(`  ${i + 1}. ${auth.mcNumber} - ${auth.companyName} (${auth.location?.state})`);
        });
        console.log('');
      }

      // Dry run - output to JSON
      if (options.dryRun) {
        if (options.output) {
          fs.writeFileSync(options.output, JSON.stringify(authorities, null, 2));
          console.log(`💾 Dry run results saved to: ${options.output}`);
        }
        console.log(`\n🏁 Dry run complete. ${authorities.length} records would be loaded.`);
        return;
      }

      // Load to Drupal
      console.log('🚀 Loading records to Drupal...');
      let loaded = 0;
      let failed = 0;

      for (const authority of authorities) {
        try {
          await loadAuthority(authority);
          loaded++;
          process.stdout.write(`\r  Progress: ${loaded}/${authorities.length}`);
        } catch (error) {
          failed++;
          console.error(`\n  ⚠️  Failed: ${authority.mcNumber}`, error);
        }
      }

      console.log('\n');
      console.log('✅ Ingestion complete!');
      console.log(`   Loaded: ${loaded}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Total:  ${authorities.length}`);

    } catch (error) {
      console.error('\n❌ Ingestion failed:', error);
      process.exit(1);
    }
  });

program.parse();
