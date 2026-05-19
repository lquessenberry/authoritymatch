#!/usr/bin/env node
/**
 * Authority Scoring Engine Test
 * Demonstrates the scoring algorithm on real carriers
 */

const fs = require('fs');
const path = require('path');

// Load test data
function loadTestAuthorities() {
  const dataDir = './data';
  const batchFile = process.argv[2] || 'batch_00001.json';
  const filePath = path.join(dataDir, batchFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')).slice(0, 20); // Test first 20
}

// Simple scoring implementation (mirrors the TypeScript engine)
function calculateScore(authority) {
  // Safety Score (30%)
  let safetyScore = 70;
  const safetyFactors = {};
  
  if (authority.safetyRating) {
    switch (authority.safetyRating) {
      case 'S': safetyFactors.rating = 30; break;
      case 'C': safetyFactors.rating = 15; break;
      case 'U': safetyFactors.rating = 0; break;
      default: safetyFactors.rating = 10;
    }
    safetyScore = safetyFactors.rating;
  } else {
    safetyScore = 50;
  }
  
  // Stability Score (25%)
  let stabilityScore = 60;
  const stabilityFactors = {};
  
  if (authority.addDate) {
    const age = new Date().getFullYear() - parseInt(authority.addDate.substring(0, 4));
    stabilityFactors.years = age;
    stabilityFactors.score = Math.min(50, age * 10);
    stabilityScore = stabilityFactors.score + 30; // Base + age bonus
  }
  
  // Scale Score (20%)
  const drivers = authority.totalDrivers || 0;
  const powerUnits = authority.totalPowerUnits || 0;
  const scaleFactors = {
    drivers,
    powerUnits,
    fleetTier: drivers > 100 ? 'large' : drivers > 20 ? 'medium' : drivers > 5 ? 'small' : 'micro'
  };
  
  let scaleScore = 15; // micro baseline
  if (drivers >= 501) scaleScore = 50;
  else if (drivers >= 101) scaleScore = 40;
  else if (drivers >= 21) scaleScore = 35;
  else if (drivers >= 6) scaleScore = 25;
  
  scaleScore += Math.min(25, drivers * 1.5); // Driver bonus
  
  // Compliance Score (15%)
  let complianceScore = 60;
  const complianceFactors = {
    insurance: authority.insuranceStatus || 'unknown',
    status: authority.status
  };
  
  complianceScore = authority.status === 'A' ? 90 : 50;
  
  // Geography Score (10%)
  const geoScore = 45; // Neutral baseline
  
  // Calculate weighted overall
  const overall = Math.round(
    safetyScore * 0.30 +
    stabilityScore * 0.25 +
    scaleScore * 0.20 +
    complianceScore * 0.15 +
    geoScore * 0.10
  );
  
  // Convert to grade
  let grade = 'F';
  if (overall >= 95) grade = 'A+';
  else if (overall >= 90) grade = 'A';
  else if (overall >= 85) grade = 'A-';
  else if (overall >= 80) grade = 'B+';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 70) grade = 'B-';
  else if (overall >= 65) grade = 'C+';
  else if (overall >= 60) grade = 'C';
  else if (overall >= 50) grade = 'D';
  
  return {
    overall,
    grade,
    components: {
      safety: { score: safetyScore, weight: 30 },
      stability: { score: stabilityScore, weight: 25 },
      scale: { score: scaleScore, weight: 20 },
      compliance: { score: complianceScore, weight: 15 },
      geography: { score: geoScore, weight: 10 }
    },
    factors: {
      safety: safetyFactors,
      stability: stabilityFactors,
      scale: scaleFactors,
      compliance: complianceFactors
    }
  };
}

function displayScore(authority, score) {
  const c = score.components;
  const gradeColor = 
    score.grade.startsWith('A') ? '\x1b[32m' : // Green
    score.grade.startsWith('B') ? '\x1b[33m' : // Yellow
    score.grade.startsWith('C') ? '\x1b[33m' : // Yellow
    '\x1b[31m'; // Red
  const reset = '\x1b[0m';
  
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`DOT#${authority.dotNumber} - ${authority.legalName || authority.dbaName || 'N/A'}`);
  console.log(`${'─'.repeat(70)}`);
  
  console.log(`\n📊 OVERALL SCORE: ${gradeColor}${score.overall}/100${reset} (${gradeColor}Grade ${score.grade}${reset})`);
  console.log();
  
  console.log('Component Breakdown:');
  console.log(`  🛡️  Safety       ${c.safety.score.toString().padStart(3)} × ${c.safety.weight}% = ${(c.safety.score * c.safety.weight / 100).toFixed(1)}`);
  console.log(`  📈 Stability    ${c.stability.score.toString().padStart(3)} × ${c.stability.weight}% = ${(c.stability.score * c.stability.weight / 100).toFixed(1)}`);
  console.log(`  🚛 Scale        ${c.scale.score.toString().padStart(3)} × ${c.scale.weight}% = ${(c.scale.score * c.scale.weight / 100).toFixed(1)}`);
  console.log(`  ✅ Compliance   ${c.compliance.score.toString().padStart(3)} × ${c.compliance.weight}% = ${(c.compliance.score * c.compliance.weight / 100).toFixed(1)}`);
  console.log(`  🗺️  Geography    ${c.geography.score.toString().padStart(3)} × ${c.geography.weight}% = ${(c.geography.score * c.geography.weight / 100).toFixed(1)}`);
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  TOTAL: ${score.overall}/100`);
  
  console.log('\nKey Factors:');
  if (score.factors.safety.rating !== undefined) {
    console.log(`  Safety Rating: ${score.factors.safety.rating === 30 ? 'Satisfactory' : score.factors.safety.rating === 15 ? 'Conditional' : 'Other'}`);
  }
  if (score.factors.stability.years !== undefined) {
    console.log(`  Years Active: ~${score.factors.stability.years} years`);
  }
  console.log(`  Fleet: ${score.factors.scale.drivers} drivers, ${score.factors.scale.powerUnits} power units (${score.factors.scale.fleetTier})`);
  console.log(`  Status: ${score.factors.compliance.status} | Insurance: ${score.factors.compliance.insurance}`);
}

function main() {
  console.log('🚛 Authority Scoring Engine Test');
  console.log('=================================\n');
  
  const authorities = loadTestAuthorities();
  console.log(`Loaded ${authorities.length} test authorities\n`);
  
  let aCount = 0, bCount = 0, cCount = 0, dCount = 0, fCount = 0;
  let totalScore = 0;
  
  for (const authority of authorities) {
    const score = calculateScore(authority);
    displayScore(authority, score);
    
    totalScore += score.overall;
    if (score.grade.startsWith('A')) aCount++;
    else if (score.grade.startsWith('B')) bCount++;
    else if (score.grade.startsWith('C')) cCount++;
    else if (score.grade === 'D') dCount++;
    else fCount++;
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 SCORING SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`\nTotal authorities scored: ${authorities.length}`);
  console.log(`Average score: ${Math.round(totalScore / authorities.length)}/100`);
  console.log(`\nGrade Distribution:`);
  console.log(`  A grades: ${aCount} (${Math.round(aCount/authorities.length*100)}%)`);
  console.log(`  B grades: ${bCount} (${Math.round(bCount/authorities.length*100)}%)`);
  console.log(`  C grades: ${cCount} (${Math.round(cCount/authorities.length*100)}%)`);
  console.log(`  D grades: ${dCount} (${Math.round(dCount/authorities.length*100)}%)`);
  console.log(`  F grades: ${fCount} (${Math.round(fCount/authorities.length*100)}%)`);
  
  console.log('\nScoring Weights:');
  console.log('  Safety: 30% (FMCSA safety ratings, CSA scores)');
  console.log('  Stability: 25% (Years in business, status consistency)');
  console.log('  Scale: 20% (Fleet size, driver/power unit ratio)');
  console.log('  Compliance: 15% (Insurance active, MCS-150 current)');
  console.log('  Geography: 10% (State risk factors)');
  
  console.log('\nGrade Boundaries:');
  console.log('  A+: 95-100 | A: 90-94 | A-: 85-89');
  console.log('  B+: 80-84 | B: 75-79 | B-: 70-74');
  console.log('  C+: 65-69 | C: 60-64 | D: 50-59 | F: 0-49');
  
  console.log('\n✅ Scoring test complete!');
}

main();
