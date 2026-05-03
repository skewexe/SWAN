#!/bin/bash
set -euo pipefail

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "[setup] Checking prerequisites..."
if ! command_exists pnpm; then
  echo "[setup] pnpm is required"
  exit 1
fi

if ! command_exists node; then
  echo "[setup] node is required"
  exit 1
fi

echo "[setup] Installing dependencies..."
pnpm install

echo "[setup] Checking database connection..."
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[setup] DATABASE_URL is not set"
  exit 1
fi

echo "[setup] Pushing database schema..."
pnpm --filter @workspace/db run push

echo "[setup] Setup complete"
