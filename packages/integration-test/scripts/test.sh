#!/usr/bin/env bash

echo "start of test script"
# Exit script as soon as a command fails.
set -o errexit
echo "after second command"

# Executes cleanup function at script exit.
trap cleanup EXIT
echo "after third command"

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

echo "after solc download"

./node_modules/.bin/truffle version

# Run Ropsten integration test
./node_modules/.bin/truffle test ./test/integration.js --network ropsten

# Run Rinkeby integration test
./node_modules/.bin/truffle test ./test/integration.js --network rinkeby




if [ $ENV_EXISTS -eq 0 ]; then
  rm ".env"
  echo "Deleted added .env"
fi




