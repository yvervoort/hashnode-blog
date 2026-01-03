// scripts/make-standalone-entry.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(".next/standalone");
const target = path.join(root, "server.js");

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      const found = walk(p);
      if (found) return found;
    } else if (ent.isFile() && ent.name === "server.js") {
      // Ignore the target itself
      if (path.resolve(p) !== path.resolve(target)) return p;
    }
  }
  return null;
}

if (!fs.existsSync(root)) {
  console.error("Missing:", root);
  process.exit(1);
}

// If the wrapper already exists, keep it.
if (fs.existsSync(target)) {
  console.log("OK: wrapper already exists:", target);
  process.exit(0);
}

const realServer = walk(root);
if (!realServer) {
  console.error("No server.js found anywhere under:", root);
  process.exit(1);
}

const rel = "./" + path.relative(root, realServer).replace(/\\/g, "/");

const wrapper = `// generated wrapper (for Cloud Run / Firebase App Hosting)
process.env.PORT = process.env.PORT || "8080";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
require("${rel}");
`;

fs.writeFileSync(target, wrapper, "utf8");
console.log("Generated:", target, "->", rel);
