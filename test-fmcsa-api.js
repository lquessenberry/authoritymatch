#!/usr/bin/env node
/**
 * FMCSA API Test Script
 * Verifies API connectivity and tests data retrieval
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const FMCSA_API_URL = 'https://mobile.fmcsa.dot.gov/qc/services';

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testAPIKey(apiKey) {
  console.log('\n🔑 Testing FMCSA API Key...');
  console.log('==========================');
  
  const testDotNumber = '168450'; // Known AR carrier from our CSV
  const url = `${FMCSA_API_URL}/carriers/${testDotNumber}?webKey=${apiKey}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('\n✅ API Key is VALID!');
            console.log('Response preview:');
            console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
            resolve(true);
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.log('\n❌ API Key is INVALID or EXPIRED');
            console.log('Error:', parsed.message || parsed.error);
            resolve(false);
          } else {
            console.log(`\n⚠️ Unexpected status: ${res.statusCode}`);
            console.log('Response:', parsed);
            resolve(false);
          }
        } catch (e) {
          console.log('\n⚠️ Could not parse response:');
          console.log(data.substring(0, 500));
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('\n❌ Request failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      console.log('\n⏱️ Request timed out (30s)');
      resolve(false);
    });
  });
}

async function testCarrierSearch(apiKey) {
  console.log('\n🔍 Testing Carrier Search...');
  console.log('===========================');
  
  const url = `${FMCSA_API_URL}/carriers?webKey=${apiKey}&size=5`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode === 200 && parsed.content) {
            console.log(`✅ Found ${parsed.content.length} carriers`);
            console.log('\nSample carriers:');
            parsed.content.slice(0, 3).forEach((carrier, i) => {
              console.log(`  ${i + 1}. DOT#${carrier.dotNumber} - ${carrier.legalName || 'N/A'} (${carrier.phyState || '??'})`);
            });
            resolve(true);
          } else {
            console.log('⚠️ No carriers found or error');
            console.log(parsed);
            resolve(false);
          }
        } catch (e) {
          console.log('⚠️ Parse error:', e.message);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Search failed:', err.message);
      resolve(false);
    });
  });
}

async function testUpdatedSince(apiKey) {
  console.log('\n📅 Testing "Updated Since" Query...');
  console.log('==============================');
  
  // Test with last 7 days
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().split('T')[0];
  
  const url = `${FMCSA_API_URL}/carriers?webKey=${apiKey}&updatedSince=${sinceStr}&size=10`;
  
  console.log(`Querying carriers updated since ${sinceStr}...`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode === 200) {
            const count = parsed.content?.length || 0;
            console.log(`✅ Found ${count} carriers updated in last 7 days`);
            resolve(true);
          } else {
            console.log(`⚠️ Status ${res.statusCode}:`, parsed.message);
            resolve(false);
          }
        } catch (e) {
          console.log('⚠️ Parse error');
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function testStateFilter(apiKey) {
  console.log('\n🗺️ Testing State Filter (Arkansas)...');
  console.log('=====================================');
  
  const url = `${FMCSA_API_URL}/carriers?webKey=${apiKey}&state=AR&size=5`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode === 200 && parsed.content) {
            const arCarriers = parsed.content.filter(c => c.phyState === 'AR');
            console.log(`✅ Found ${arCarriers.length} Arkansas carriers in sample`);
            arCarriers.slice(0, 3).forEach((carrier, i) => {
              console.log(`  ${i + 1}. DOT#${carrier.dotNumber} - ${carrier.legalName || carrier.dbaName || 'Unknown'}`);
            });
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function runTests() {
  console.log('🚛 FMCSA API Testing Tool');
  console.log('=========================\n');
  
  // Get API key
  let apiKey = process.env.FMCSA_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  FMCSA_API_KEY not found in environment');
    console.log('\nTo get an API key:');
    console.log('1. Visit: https://mobile.fmcsa.dot.gov/qc/Registration');
    console.log('2. Register for a free account');
    console.log('3. Request API access');
    console.log('\nOr enter your API key now:\n');
    
    apiKey = await question('FMCSA API Key: ');
  } else {
    console.log('✅ Found FMCSA_API_KEY in environment');
    console.log(`Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  
  if (!apiKey || apiKey.trim() === '') {
    console.log('\n❌ No API key provided. Exiting.');
    rl.close();
    process.exit(1);
  }
  
  apiKey = apiKey.trim();
  
  // Run tests
  const results = {
    keyValid: await testAPIKey(apiKey),
    search: false,
    updatedSince: false,
    stateFilter: false
  };
  
  if (results.keyValid) {
    results.search = await testCarrierSearch(apiKey);
    results.updatedSince = await testUpdatedSince(apiKey);
    results.stateFilter = await testStateFilter(apiKey);
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`API Key Valid:     ${results.keyValid ? '✅' : '❌'}`);
  console.log(`Carrier Search:    ${results.search ? '✅' : '❌'}`);
  console.log(`Updated Since:     ${results.updatedSince ? '✅' : '❌'}`);
  console.log(`State Filter:      ${results.stateFilter ? '✅' : '❌'}`);
  
  if (results.keyValid && results.search && results.updatedSince && results.stateFilter) {
    console.log('\n🎉 All tests passed! API is ready for production use.');
    console.log('\nYou can now:');
    console.log('  export FMCSA_API_KEY=' + apiKey);
    console.log('  node batch-ingest.js  # or run via GitHub Actions');
  } else if (results.keyValid) {
    console.log('\n⚠️  API key works but some features may be limited.');
    console.log('Check FMCSA API documentation for your account tier.');
  } else {
    console.log('\n❌ API key validation failed.');
    console.log('Please check your key and try again.');
  }
  
  rl.close();
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Tests cancelled.');
  rl.close();
  process.exit(0);
});

runTests().catch(err => {
  console.error('\n❌ Fatal error:', err);
  rl.close();
  process.exit(1);
});
