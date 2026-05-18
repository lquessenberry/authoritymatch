/**
 * Authority Sync Engine
 * 
 * Automates the complete data pipeline:
 * 1. Daily FMCSA API sync (incremental updates)
 * 2. Weekly full CSV re-ingestion (bulk refresh)
 * 3. Change detection and alerting
 * 4. Database consistency checks
 */

import { fetchUpdatedCarriers, fetchCarrierDetails, transformFMCSACarrier, detectChanges, calculateSeverity, type ChangeDetectionResult } from './sources/fmcsa-api';
import type { AuthorityRecord } from '@authoritymatch/core';

const DRUPAL_URL = process.env.DRUPAL_URL || 'http://localhost:8080';
const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '24');

interface SyncState {
  lastFullSync: Date;
  lastIncrementalSync: Date;
  totalAuthorities: number;
  pendingChanges: ChangeDetectionResult[];
  errors: string[];
}

interface DatabaseRecord {
  id: string;
  dotNumber: string;
  data: AuthorityRecord;
  updatedAt: Date;
  version: number;
}

// Load current state from checkpoint
function loadSyncState(): SyncState {
  try {
    const fs = require('fs');
    if (fs.existsSync('./sync-state.json')) {
      const raw = JSON.parse(fs.readFileSync('./sync-state.json', 'utf-8'));
      return {
        ...raw,
        lastFullSync: new Date(raw.lastFullSync),
        lastIncrementalSync: new Date(raw.lastIncrementalSync),
      };
    }
  } catch (e) {
    console.error('Failed to load sync state:', e);
  }
  
  return {
    lastFullSync: new Date(0),
    lastIncrementalSync: new Date(0),
    totalAuthorities: 0,
    pendingChanges: [],
    errors: [],
  };
}

// Save sync state
function saveSyncState(state: SyncState): void {
  const fs = require('fs');
  fs.writeFileSync('./sync-state.json', JSON.stringify(state, null, 2));
}

// Fetch all authorities from Drupal
async function fetchDrupalAuthorities(): Promise<Map<string, DatabaseRecord>> {
  const query = `
    query GetAuthorities($limit: Int!, $offset: Int!) {
      authorityRecords(limit: $limit, offset: $offset) {
        nodes {
          id
          dotNumber
          updatedAt
          ... on AuthorityRecord {
            legalName
            dbaName
            state
            status
            safetyRating
            totalDrivers
            totalPowerUnits
          }
        }
      }
    }
  `;

  const authorities = new Map<string, DatabaseRecord>();
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${DRUPAL_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { limit, offset } }),
    });

    const result = await response.json();
    const nodes = result.data?.authorityRecords?.nodes || [];

    if (nodes.length === 0) {
      hasMore = false;
      break;
    }

    for (const node of nodes) {
      authorities.set(node.dotNumber, {
        id: node.id,
        dotNumber: node.dotNumber,
        data: node,
        updatedAt: new Date(node.updatedAt),
        version: 1,
      });
    }

    offset += nodes.length;
  }

  return authorities;
}

// Apply changes to Drupal
async function applyChange(change: ChangeDetectionResult): Promise<boolean> {
  const mutation = `
    mutation UpdateAuthority($id: ID!, $input: AuthorityRecordInput!) {
      updateAuthorityRecord(id: $id, input: $input) {
        entity {
          id
          updatedAt
        }
        errors
        violations {
          message
        }
      }
    }
  `;

  try {
    // First get the Drupal ID for this DOT number
    const lookupQuery = `
      query LookupByDot($dotNumber: String!) {
        authorityRecords(filter: { dotNumber: $dotNumber }) {
          nodes {
            id
          }
        }
      }
    `;

    const lookupResponse = await fetch(`${DRUPAL_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: lookupQuery,
        variables: { dotNumber: change.dotNumber },
      }),
    });

    const lookupResult = await lookupResponse.json();
    const drupalId = lookupResult.data?.authorityRecords?.nodes?.[0]?.id;

    if (!drupalId) {
      console.error(`❌ Authority ${change.dotNumber} not found in Drupal`);
      return false;
    }

    // Build update input from changes
    const input: any = {};
    for (const fieldChange of change.changes) {
      input[fieldChange.field] = fieldChange.newValue;
    }

    const response = await fetch(`${DRUPAL_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: { id: drupalId, input },
      }),
    });

    const result = await response.json();

    if (result.errors || result.data?.updateAuthorityRecord?.violations?.length > 0) {
      console.error(`❌ Failed to update ${change.dotNumber}:`, 
        result.errors || result.data?.updateAuthorityRecord?.violations);
      return false;
    }

    console.log(`✅ Updated ${change.dotNumber}: ${change.changes.map(c => c.field).join(', ')}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${change.dotNumber}:`, error);
    return false;
  }
}

// Send alerts for critical changes
async function sendAlert(changes: ChangeDetectionResult[]): Promise<void> {
  const critical = changes.filter(c => c.severity === 'critical');
  const high = changes.filter(c => c.severity === 'high');

  if (critical.length === 0 && high.length === 0) return;

  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('⚠️ No webhook configured for alerts');
    return;
  }

  const message = {
    text: `🚨 Authority Changes Detected`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${critical.length}* critical and *${high.length}* high-priority authority changes detected`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: critical.slice(0, 5).map(c => 
            `• DOT#${c.dotNumber}: ${c.changes.filter(ch => ch.importance === 'critical').map(ch => ch.field).join(', ')}`
          ).join('\n'),
        },
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

// Main incremental sync
export async function runIncrementalSync(state?: SyncState): Promise<SyncState> {
  console.log('🔄 Starting Incremental Sync');
  console.log('============================');

  const syncState = state || loadSyncState();
  const since = syncState.lastIncrementalSync;

  console.log(`📅 Fetching changes since ${since.toISOString()}`);

  try {
    // Fetch updated carriers from FMCSA API
    const carriers = await fetchUpdatedCarriers({ since });
    console.log(`📥 Fetched ${carriers.length} updated carriers`);

    // Load current Drupal data
    const drupalAuthorities = await fetchDrupalAuthorities();
    console.log(`📂 Loaded ${drupalAuthorities.size} authorities from Drupal`);

    // Detect changes
    const changes: ChangeDetectionResult[] = [];

    for (const carrier of carriers) {
      const existing = drupalAuthorities.get(carrier.dotNumber);
      const current = transformFMCSACarrier(carrier);

      if (existing) {
        const fieldChanges = detectChanges(existing.data, current);
        
        if (fieldChanges.length > 0) {
          const severity = calculateSeverity(fieldChanges);
          
          changes.push({
            dotNumber: carrier.dotNumber,
            changes: fieldChanges,
            previous: existing.data,
            current,
            severity,
            timestamp: new Date(),
          });

          // Auto-apply non-critical changes
          if (severity !== 'critical') {
            await applyChange(changes[changes.length - 1]);
          }
        }
      } else {
        // New carrier - flag for review
        console.log(`🆕 New carrier found: DOT#${carrier.dotNumber}`);
        
        changes.push({
          dotNumber: carrier.dotNumber,
          changes: [{ field: 'newRecord', oldValue: null, newValue: true, importance: 'major' }],
          previous: {},
          current,
          severity: 'medium',
          timestamp: new Date(),
        });
      }
    }

    // Send alerts for critical changes
    if (changes.length > 0) {
      await sendAlert(changes);
    }

    // Update state
    syncState.lastIncrementalSync = new Date();
    syncState.totalAuthorities = drupalAuthorities.size;
    syncState.pendingChanges = changes.filter(c => c.severity === 'critical');
    syncState.errors = [];

    console.log('');
    console.log('✅ Incremental sync complete');
    console.log(`   Updated carriers: ${carriers.length}`);
    console.log(`   Changes detected: ${changes.length}`);
    console.log(`   Critical pending: ${syncState.pendingChanges.length}`);

    saveSyncState(syncState);
    return syncState;

  } catch (error) {
    console.error('❌ Incremental sync failed:', error);
    syncState.errors.push(`${new Date().toISOString()}: ${error}`);
    saveSyncState(syncState);
    throw error;
  }
}

// Full CSV re-ingestion (weekly)
export async function runFullSync(csvPath: string): Promise<SyncState> {
  console.log('🔄 Starting Full CSV Sync');
  console.log('=========================');
  console.log(`📂 CSV: ${csvPath}`);

  const syncState = loadSyncState();

  try {
    // This will be handled by the batch-ingest.js script
    // We just trigger it and monitor
    const { execSync } = require('child_process');
    
    execSync(`node batch-ingest.js "${csvPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    syncState.lastFullSync = new Date();
    syncState.errors = [];

    console.log('');
    console.log('✅ Full sync complete');

    saveSyncState(syncState);
    return syncState;

  } catch (error) {
    console.error('❌ Full sync failed:', error);
    syncState.errors.push(`${new Date().toISOString()}: ${error}`);
    saveSyncState(syncState);
    throw error;
  }
}

// Scheduled runner
export async function runScheduled(): Promise<void> {
  const state = loadSyncState();
  const now = new Date();

  // Check if we need full sync (weekly, Sunday at 2 AM)
  const daysSinceFullSync = (now.getTime() - state.lastFullSync.getTime()) / (1000 * 60 * 60 * 24);
  const isSunday2AM = now.getDay() === 0 && now.getHours() === 2;

  if (daysSinceFullSync >= 7 && isSunday2AM) {
    console.log('📅 Scheduled full sync triggered');
    const csvPath = process.env.FMCSA_CSV_PATH || '/data/fmcsa.csv';
    await runFullSync(csvPath);
    return;
  }

  // Check if we need incremental sync
  const hoursSinceIncremental = (now.getTime() - state.lastIncrementalSync.getTime()) / (1000 * 60 * 60);

  if (hoursSinceIncremental >= SYNC_INTERVAL_HOURS) {
    console.log('📅 Scheduled incremental sync triggered');
    await runIncrementalSync(state);
    return;
  }

  console.log(`⏭️  No sync needed. Next incremental in ${SYNC_INTERVAL_HOURS - hoursSinceIncremental} hours`);
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || 'scheduled';

  (async () => {
    try {
      switch (mode) {
        case 'incremental':
          await runIncrementalSync();
          break;
        case 'full':
          const csvPath = process.argv[3] || '/data/fmcsa.csv';
          await runFullSync(csvPath);
          break;
        case 'scheduled':
        default:
          await runScheduled();
          break;
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })();
}
