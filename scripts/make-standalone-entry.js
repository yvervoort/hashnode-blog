// scripts/make-standalone-entry.js
const fs = require("fs");
const path = require("path");

const outRoot = path.resolve(".next/standalone");
const target = path.join(outRoot, "server.js");

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);

    // Skip the wrapper we are generating
    if (path.resolve(p) === path.resolve(target)) continue;

    // Avoid accidentally picking Next internal files if present
    if (p.includes(`${path.sep}node_modules${path.sep}next${path.sep}dist${path.sep}`)) continue;

    if (ent.isDirectory()) {
      const found = walk(p);
      if (found) return found;
    } else if (ent.isFile() && ent.name === "server.js") {
      return p;
    }
  }
  return null;
}

if (!fs.existsSync(outRoot)) {
  console.error("Missing:", outRoot);
  process.exit(1);
}

// If wrapper already exists, overwrite it (safe)
const found = walk(outRoot);
if (!found) {
  console.error("No server.js found anywhere under:", outRoot);
  process.exit(1);
}

const rel = "./" + path.relative(outRoot, found).split(path.sep).join("/");

const wrapper = `// generated wrapper for Firebase/Cloud Run
process.env.PORT = process.env.PORT || "8080";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
require("${rel}");
`;

fs.writeFileSync(target, wrapper, "utf8");
console.log("Generated:", target, "->", rel);
