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

start_ganache() {
  if [[ -z "$TEST_MNEMONIC" ]]; then
    file_name=".env"
    if [ -f $file_name ]; then
      export ENV_EXISTS=1
    else
      export ENV_EXISTS=0
      cp ".env.example" ".env"
      echo "Temporarily copied .env.example to .env"
    fi  
    while read line; do
      if [[ $line == TEST_MNEMONIC=* ]]; then
        export "$line"
      fi
    done <<< "$(cat .env)"
  fi
  if [[ -z "$TEST_MNEMONIC" ]]; then
    ./node_modules/.bin/ganache-cli --networkId 1234 --gasLimit 0xfffffffffff --port "$ganache_port" > /dev/null &
  else
    ./node_modules/.bin/ganache-cli --networkId 1234 --gasLimit 0xfffffffffff --port "$ganache_port" -m="$TEST_MNEMONIC" > /dev/null &
  fi
  ganache_pid=$!

  echo "Waiting for ganache to launch on port "$ganache_port"..."

  while ! ganache_running; do
    sleep 0.1 # wait for 1/10 of a second before check again
  done

  echo "Ganache launched!"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

./node_modules/.bin/truffle version
./node_modules/.bin/truffle test "$@"

if [ "$MODE" = "coverage" ]; then
  ./node_modules/.bin/istanbul report html lcov
  
  if [ "$CI" = true ]; then
    cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
  fi
fi

if [ "$MODE" = "profile" ]; then
  ./node_modules/.bin/istanbul report html lcov
  
  if [ "$CI" = true ]; then
    cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
  fi
fi


if [ "$ENV_EXISTS" -eq 0 ]; then
  rm ".env"
  echo "Deleted added .env"
fi




