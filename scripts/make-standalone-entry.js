const fs = require("fs");
const path = require("path");

const themeStandaloneRoot = path.resolve(
  "packages/blog-starter-kit/themes/personal/.next/standalone"
);

const outRoot = path.resolve(".next/standalone");
const target = path.join(outRoot, "server.js");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);

    // Skip Next internal stuff if present
    if (p.includes(`node_modules${path.sep}next${path.sep}dist`)) continue;

    if (ent.isDirectory()) {
      const found = walk(p);
      if (found) return found;
    } else if (ent.isFile() && ent.name === "server.js") {
      // Heuristic: prefer server.js that lives in an app folder (has .next beside it or above it)
      const dirName = path.dirname(p);
      const hasDotNextSibling = fs.existsSync(path.join(dirName, ".next"));
      if (hasDotNextSibling) return p;

      // Otherwise still allow it, but only if not in next/dist
      return p;
    }
  }
  return null;
}

if (!fs.existsSync(themeStandaloneRoot)) {
  console.error("Missing theme standalone output:", themeStandaloneRoot);
  process.exit(1);
}

fs.mkdirSync(outRoot, { recursive: true });

const found = walk(themeStandaloneRoot);
if (!found) {
  console.error("No suitable server.js found under:", themeStandaloneRoot);
  process.exit(1);
}

// Make a wrapper that requires the *theme's* server.js from the repo-root output folder
const rel = path
  .relative(outRoot, found)
  .split(path.sep)
  .join("/");

const wrapper = `// generated wrapper for Cloud Run/Firebase
process.env.PORT = process.env.PORT || "8080";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
require("./${rel}");
`;

fs.writeFileSync(target, wrapper, "utf8");
console.log("Generated:", target, "->", found);
