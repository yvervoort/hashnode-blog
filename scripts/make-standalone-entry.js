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
      // Ignore the target itself if it already exists
      if (path.resolve(p) !== path.resolve(target)) return p;
    }
  }
  return null;
}

if (!fs.existsSync(root)) {
  console.error("Missing:", root);
  process.exit(1);
}

// If server.js already exists where we want it, great.
if (fs.existsSync(target)) {
  console.log("OK: server.js exists:", target);
  process.exit(0);
}

const found = walk(root);
if (!found) {
  console.error("No server.js found anywhere under:", root);
  process.exit(1);
}

const rel = "./" + path.relative(root, found).replace(/\\/g, "/");
const content = `// generated wrapper\nrequire("${rel}");\n`;

process.env.PORT = process.env.PORT || "8080";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
require("${rel}");
`;

console.log("Generated:", target, "->", rel);
