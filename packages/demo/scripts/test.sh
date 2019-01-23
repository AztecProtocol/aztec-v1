#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

ganache_port=8545

ganache_running() {
  nc -z localhost "$ganache_port"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  ./node_modules/.bin/ganache-cli --networkId 1234 --gasLimit 0xfffffffffff > /dev/null &
  ganache_pid=$!
fi

echo "Deploying contracts to ganache"
cd ../contracts
./node_modules/.bin/truffle migrate --reset --network development
cd ../demo

echo "Using Mocha $(./node_modules/.bin/mocha --version)"

NODE_ENV=TEST ./node_modules/.bin/mocha ./resources --trace-warnings --exit --colors --recursive --reporter spec
