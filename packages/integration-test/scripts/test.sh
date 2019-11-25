#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

./node_modules/.bin/truffle version

# Run Ropsten integration test
./node_modules/.bin/truffle test ./test/integration.js --network ropsten

# Run Rinkeby integration test
./node_modules/.bin/truffle test ./test/integration.js --network rinkeby




if [ $ENV_EXISTS -eq 0 ]; then
  rm ".env"
  echo "Deleted added .env"
fi




