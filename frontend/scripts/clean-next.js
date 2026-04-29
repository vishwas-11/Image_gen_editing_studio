const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

try {
  if (fs.existsSync(nextDir)) {
    // Remove the full build output so dev starts from a clean slate.
    // Clearing only .next/cache can leave stale server chunks behind and
    // cause MODULE_NOT_FOUND errors on refresh.
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("Cleared stale Next.js build output.");
  } else {
    console.log("No Next.js build output to clear.");
  }
} catch (error) {
  console.warn("Could not clear Next.js build output:", error.message);
}
