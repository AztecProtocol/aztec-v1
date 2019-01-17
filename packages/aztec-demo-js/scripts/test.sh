#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

ganache_port=8545

ganache_running() {
  nc -z localhost "$ganache_port"
}

if ! [ ganache_running ]; then
  echo "Ganache is not running"
  exit 1
fi

echo "Using Mocha $(./node_modules/.bin/mocha --version)"

NODE_ENV=TEST ./node_modules/.bin/mocha ./resources --trace-warnings --exit --colors --recursive --reporter spec
