#!/bin/bash

if [ -z "${RUNTIME_CONFIG}" ]; then
  echo 'Error: "RUNTIME_CONFIG" env var not set'
  exit 1
fi

echo 'Save "RUNTIME_CONFIG" to .config.toml'
echo $RUNTIME_CONFIG > .config.toml
node dist/server/entry.mjs
