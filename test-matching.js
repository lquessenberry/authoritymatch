#!/usr/bin/env node
/**
 * Matching Engine Test
 * Demonstrates authority-to-factor matching
 */

const fs = require("fs");
const path = require("path");

// Load test data
const factors = JSON.parse(fs.readFileSync("./data/factors.json", "utf-8"));
const authorities = JSON.parse(
  fs.readFileSync("./data/batch_00001.json", "utf-8"),
).slice(0, 50);

// Simplified matching implementation
function calculateMatch(authority, factor) {
  const drivers = authority.totalDrivers || 0;
  const prefs = factor.preferences;
  const disqualifiers = [];

  // Hard disqualifiers
  if (drivers < prefs.minFleetSize) {
    disqualifiers.push(`Too small (${drivers} < ${prefs.minFleetSize})`);
  }
  if (drivers > prefs.maxFleetSize) {
    disqualifiers.push(`Too large (${drivers} > ${prefs.maxFleetSize})`);
  }
  if (authority.status !== "A" && !prefs.acceptNewAuthorities) {
    disqualifiers.push("Not active");
  }
  const state = authority.physicalAddress?.state || authority.state;
  if (state && !prefs.preferredStates.includes(state)) {
    disqualifiers.push(`Wrong state (${state})`);
  }

  // Calculate component scores
  let fleetScore = 0;
  if (drivers >= prefs.minFleetSize && drivers <= prefs.maxFleetSize) {
    const range = prefs.maxFleetSize - prefs.minFleetSize;
    const position = drivers - prefs.minFleetSize;
    fleetScore = Math.round(50 + (position / range) * 50);
  }

  let geoScore = state && prefs.preferredStates.includes(state) ? 100 : 0;

  let riskScore = 70;
  if (authority.safetyRating === "S") riskScore += 20;
  if (authority.safetyRating === "U") riskScore -= 50;
  if (drivers < 10 && prefs.riskTolerance !== "AGGRESSIVE") riskScore -= 15;

  let prefScore = 70;
  if (prefs.riskTolerance === "AGGRESSIVE") prefScore += 10;
  if (prefs.acceptNewAuthorities) prefScore += 5;

  let financialScore = 75;
  if (Math.max(...factor.offerings.advanceRates) >= 0.95) financialScore += 15;

  // Weighted overall
  const score = Math.round(
    geoScore * 0.2 +
      fleetScore * 0.2 +
      riskScore * 0.25 +
      prefScore * 0.2 +
      financialScore * 0.15,
  );

  return {
    score,
    compatibility: {
      geographic: geoScore,
      fleetSize: fleetScore,
      riskProfile: riskScore,
      preferences: prefScore,
      financial: financialScore,
    },
    meetsRequirements: disqualifiers.length === 0,
    disqualifiers,
  };
}

function displayMatch(authority, factor, match) {
  const c = match.compatibility;
  const status = match.meetsRequirements
    ? "\x1b[32m[QUALIFIED]\x1b[0m"
    : "\x1b[31m[DISQUALIFIED]\x1b[0m";

  console.log("\n" + "-".repeat(70));
  console.log(
    (authority.legalName || authority.dbaName || "N/A") +
      " (" +
      authority.dotNumber +
      ")",
  );
  console.log(
    "-> " + factor.companyName + " | Score: " + match.score + "/100 " + status,
  );
  console.log("-".repeat(70));

  console.log("Compatibility:");
  console.log(
    "  Geographic   " +
      c.geographic.toString().padStart(3) +
      "% " +
      getBar(c.geographic),
  );
  console.log(
    "  Fleet Size   " +
      c.fleetSize.toString().padStart(3) +
      "% " +
      getBar(c.fleetSize),
  );
  console.log(
    "  Risk Profile " +
      c.riskProfile.toString().padStart(3) +
      "% " +
      getBar(c.riskProfile),
  );
  console.log(
    "  Preferences  " +
      c.preferences.toString().padStart(3) +
      "% " +
      getBar(c.preferences),
  );
  console.log(
    "  Financial    " +
      c.financial.toString().padStart(3) +
      "% " +
      getBar(c.financial),
  );

  if (match.disqualifiers.length > 0) {
    console.log("\n\x1b[31mDisqualifying Factors:\x1b[0m");
    match.disqualifiers.forEach((d) => console.log("  * " + d));
  }

  console.log("\nFactor Requirements:");
  console.log(
    "  Min Score: " +
      factor.preferences.minAuthorityScore +
      " | Risk: " +
      factor.preferences.riskTolerance,
  );
  console.log(
    "  Fleet: " +
      factor.preferences.minFleetSize +
      "-" +
      factor.preferences.maxFleetSize +
      " | Advance: " +
      Math.max(...factor.offerings.advanceRates) * 100 +
      "%",
  );
}

function getBar(value) {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  return "[" + "#".repeat(filled) + "-".repeat(empty) + "]";
}

function main() {
  console.log("Authority-to-Factor Matching Engine");
  console.log("======================================\n");

  // Test first 10 authorities against all 3 factors
  const testAuthorities = authorities.slice(0, 10);

  let qualifiedCount = 0;
  let totalMatches = 0;

  for (const authority of testAuthorities) {
    console.log("\n" + "=".repeat(70));
    console.log("AUTHORITY: " + (authority.legalName || "N/A"));
    console.log(
      "DOT#" +
        authority.dotNumber +
        " | " +
        (authority.totalDrivers || 0) +
        " drivers | " +
        (authority.physicalAddress?.state || "N/A"),
    );
    console.log("=".repeat(70));

    for (const factor of factors) {
      const match = calculateMatch(authority, factor);
      displayMatch(authority, factor, match);

      totalMatches++;
      if (match.meetsRequirements) qualifiedCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("MATCHING SUMMARY");
  console.log("=".repeat(70));
  console.log("\nTotal matches calculated: " + totalMatches);
  console.log(
    "Qualified matches: " +
      qualifiedCount +
      " (" +
      Math.round((qualifiedCount / totalMatches) * 100) +
      "%)",
  );
  console.log(
    "Disqualified: " +
      (totalMatches - qualifiedCount) +
      " (" +
      Math.round(((totalMatches - qualifiedCount) / totalMatches) * 100) +
      "%)",
  );

  console.log("\nFactor Profiles:");
  factors.forEach((f) => {
    const qualified = testAuthorities.filter((a) => {
      const m = calculateMatch(a, f);
      return m.meetsRequirements;
    }).length;
    console.log(
      "  " +
        f.companyName +
        ": " +
        qualified +
        "/" +
        testAuthorities.length +
        " qualified (" +
        f.preferences.riskTolerance +
        " risk)",
    );
  });

  console.log("\nMatching Weights:");
  console.log("  Geographic: 20% (State preferences)");
  console.log("  Fleet Size: 20% (Within min/max bounds)");
  console.log("  Risk Profile: 25% (Safety rating, OOS, insurance)");
  console.log("  Preferences: 20% (Risk tolerance, cargo types)");
  console.log("  Financial: 15% (Advance rates, fees)");

  console.log("\nMatching test complete!");
}

main();
