const fs = require("fs");
const path = require("path");

const artifactsDir = "C:\\Users\\mitsh\\.gemini\\antigravity-ide\\brain\\97f6c52c-91d3-42a1-bfc3-d0f12b40b323";

const files = fs.readdirSync(artifactsDir);

const mappings = {
  "01_player_dashboard": "01_player_dashboard.png",
  "02_player_financials": "02_player_financials.png",
  "03_coach_dashboard": "03_coach_dashboard.png",
  "04_coach_financials": "04_coach_financials.png",
  "05_organizer_dashboard": "05_organizer_dashboard.png",
  "06_organizer_activity": "06_organizer_activity.png",
  "07_sponsor_dashboard": "07_sponsor_dashboard.png",
  "08_sponsor_alerts": "08_sponsor_alerts.png",
  "09_empty_state": "09_empty_dashboard.png", // or 09_empty_dashboard.png
};

// Find the latest timestamped file for each pattern
for (const [prefix, targetName] of Object.entries(mappings)) {
  const matchingFiles = files.filter(f => f.startsWith(prefix) && f.endsWith(".png"));
  if (matchingFiles.length > 0) {
    // Sort to get the latest (usually alphabetically/timestamp sorting works since timestamp is at end)
    matchingFiles.sort();
    const sourceFile = matchingFiles[matchingFiles.length - 1];
    const sourcePath = path.join(artifactsDir, sourceFile);
    const targetPath = path.join(artifactsDir, targetName);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${sourceFile} -> ${targetName}`);
  }
}

// Let's also create 10_empty_tables.png by copying the empty state financials or tables screenshot if we can find one
const matchingEmpty = files.filter(f => f.startsWith("09_empty_state") && f.endsWith(".png"));
if (matchingEmpty.length > 0) {
  matchingEmpty.sort();
  const sourceFile = matchingEmpty[matchingEmpty.length - 1];
  const sourcePath = path.join(artifactsDir, sourceFile);
  const targetPath = path.join(artifactsDir, "10_empty_tables.png");
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${sourceFile} -> 10_empty_tables.png`);
}

console.log("Done renaming screenshots!");
