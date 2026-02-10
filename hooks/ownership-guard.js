#!/usr/bin/env node
"use strict";

// Ownership guard: preToolUse hook for Write tool.
// Reads JSON from stdin; outputs { decision: "allow"|"deny", reason?: string }.
// Strict mode: if .cursor/reports/current-owner.txt exists, only allow paths owned by that owner.
// Loose mode: only allow paths that match at least one ownership prefix.

const fs = require("fs");
const path = require("path");

const OWNERSHIP = {
  "backend-a": ["server/", "api/", "routes/", "src/app/api/"],
  "backend-b": ["db/", "migrations/", "workers/", "prisma/", "src/lib/db/"],
  frontend: ["app/", "components/", "ui/", "web/", "src/app/", "src/components/"],
  qa: ["**/*.test.", "**/*.spec.", "__tests__/", "e2e/"],
  docs: ["docs/"],
  devops: [".github/", "Dockerfile", "docker-compose", ".gitlab-ci"],
};

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function getFilePath(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return null;
  const p = toolInput.path ?? toolInput.file_path ?? toolInput.filePath;
  if (typeof p === "string") return p;
  if (Array.isArray(toolInput.paths) && toolInput.paths[0]) return toolInput.paths[0];
  if (Array.isArray(toolInput.edits) && toolInput.edits[0]) {
    const e = toolInput.edits[0];
    return e.path ?? e.file_path ?? e.filePath ?? null;
  }
  return null;
}

function pathBelongsToOwner(relativePath, owner) {
  const normalized = relativePath.replace(/\\/g, "/");
  const prefixes = OWNERSHIP[owner];
  if (!prefixes) return false;
  return prefixes.some((prefix) => normalized.startsWith(prefix) || normalized.includes(prefix));
}

function getOwnerForPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  for (const [owner, prefixes] of Object.entries(OWNERSHIP)) {
    if (prefixes.some((p) => normalized.startsWith(p) || normalized.includes(p))) return owner;
  }
  return null;
}

async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify({ decision: "allow", reason: "Invalid JSON input" }));
    process.exit(0);
  }

  const workspaceRoots = input.workspace_roots || input.workspace_roots;
  const root = Array.isArray(workspaceRoots) && workspaceRoots[0] ? workspaceRoots[0] : process.cwd();
  const filePath = getFilePath(input.tool_input || input);

  if (!filePath) {
    process.stdout.write(JSON.stringify({ decision: "allow", reason: "No path in tool_input" }));
    process.exit(0);
  }

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  let relativePath = path.relative(root, absolutePath);
  if (relativePath.startsWith("..")) {
    relativePath = path.relative(root, path.resolve(root, filePath));
  }
  relativePath = relativePath.replace(/\\/g, "/");

  const reportsDir = path.join(root, ".cursor", "reports");
  const currentOwnerPath = path.join(reportsDir, "current-owner.txt");
  let currentOwner = null;
  if (fs.existsSync(currentOwnerPath)) {
    try {
      currentOwner = fs.readFileSync(currentOwnerPath, "utf8").trim();
    } catch (_) {}
  }

  const ownerForPath = getOwnerForPath(relativePath);

  if (currentOwner) {
    if (ownerForPath && ownerForPath !== currentOwner) {
      process.stdout.write(
        JSON.stringify({
          decision: "deny",
          reason: "Path belongs to another owner. Use /handoff.",
        })
      );
      process.exit(0);
    }
    if (!pathBelongsToOwner(relativePath, currentOwner) && ownerForPath === null) {
      process.stdout.write(
        JSON.stringify({
          decision: "deny",
          reason: "Path does not match any ownership. Use /handoff for cross-owner changes.",
        })
      );
      process.exit(0);
    }
  } else {
    if (!ownerForPath) {
      const allowed = Object.keys(OWNERSHIP).join(", ");
      process.stdout.write(
        JSON.stringify({
          decision: "deny",
          reason: `Path does not match any ownership (${allowed}). Use /handoff or edit under owned paths.`,
        })
      );
      process.exit(0);
    }
  }

  process.stdout.write(JSON.stringify({ decision: "allow" }));
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ decision: "allow", reason: "Hook error: " + err.message }));
});
