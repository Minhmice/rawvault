#!/usr/bin/env node
"use strict";

// Optional sessionStart hook: writes a reminder to .cursor/reports/session-reminder.txt
// so the agent is instructed to read it and assign skills from routing.yml.

const fs = require("fs");
const path = require("path");

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch (_) {}
  const workspaceRoots = input.workspace_roots || [];
  const root = workspaceRoots[0] || process.cwd();
  const reportsDir = path.join(root, ".cursor", "reports");
  try {
    fs.mkdirSync(reportsDir, { recursive: true });
  } catch (_) {}
  const reminderPath = path.join(reportsDir, "session-reminder.txt");
  const text = "For this session, assign skills from .cursor/team/routing.yml when using /ship or delegating work items.\n";
  fs.writeFileSync(reminderPath, text, "utf8");
}

main().catch(() => {});
