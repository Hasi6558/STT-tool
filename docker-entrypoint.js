#!/usr/bin/env node

import { spawn } from "node:child_process";

const env = { ...process.env };

// Skip pre-rendering - already done in Dockerfile build stage
// The next build was already completed during docker build
console.log(
  "[Entrypoint] Skipping build - already completed in Docker build stage"
);

// launch application directly
await exec(process.argv.slice(2).join(" "));

function exec(command) {
  const child = spawn(command, { shell: true, stdio: "inherit", env });
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} failed rc=${code}`));
      }
    });
  });
}
