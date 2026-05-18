#!/usr/bin/env node
const fs = require("fs");
const readline = require("readline");
const path = require("path");

// Simple CSV parser - split by comma (FMCSA format is consistent)
function parseCSVLine(line) {
  return line.split(",").map((v) => v.trim());
}

async function processCSVStream(filePath, maxRows = 20) {
  console.log(`🚛 Processing: ${filePath}`);
  console.log("");

  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream });

  let headers = null;
  let lineCount = 0;
  let arCount = 0;
  const records = [];

  console.log("📖 Reading file...\n");

  for await (const line of rl) {
    lineCount++;

    if (lineCount === 1) {
      headers = parseCSVLine(line);
      console.log("📋 Columns:", headers.slice(0, 10).join(", "), "...");
      console.log("");
      console.log(`📄 First ${maxRows} records:`);
      console.log("");
      continue;
    }

    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });

    // Check for Arkansas using PHY_STATE column (index 57)
    const state = values[57]?.replace(/"/g, "").trim().toUpperCase();
    if (state === "AR") {
      arCount++;
    }

    // Show first N rows
    if (records.length < maxRows) {
      records.push(record);
      const dotNumber = record["DOT_NUMBER"] || record["DOT Number"] || "N/A";
      const company =
        record["LEGAL_NAME"] ||
        record["Legal Name"] ||
        record["DBA_NAME"] ||
        record["DBA Name"] ||
        "N/A";
      const state = record["PHY_STATE"] || record['"PHY_STATE"'] || "N/A";
      const status =
        record["CARRIER_OPERATION"] ||
        record["Carrier Operation"] ||
        record["STATUS"] ||
        record["Status"] ||
        "N/A";
      console.log(
        `${records.length}. DOT#${dotNumber} | ${company.substring(0, 40)} | ${state} | ${status}`,
      );
    }

    // Progress indicator every 100k lines
    if (lineCount % 100000 === 0) {
      process.stdout.write(
        `\r📊 Lines processed: ${lineCount.toLocaleString()} | AR count: ${arCount}`,
      );
    }
  }

  console.log("\n");
  console.log("✅ Processing complete!");
  console.log(`   Total lines: ${lineCount.toLocaleString()}`);
  console.log(`   AR records: ${arCount}`);

  // Save preview
  const outputFile = filePath.replace(".csv", "_preview.json");
  fs.writeFileSync(outputFile, JSON.stringify(records, null, 2));
  console.log(`💾 Preview saved to: ${outputFile}`);
}

// Main
const filePath =
  process.argv[2] ||
  path.join(
    require("os").homedir(),
    "Downloads",
    "Company_Census_File_20260518.csv",
  );

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

processCSVStream(filePath, 20);
