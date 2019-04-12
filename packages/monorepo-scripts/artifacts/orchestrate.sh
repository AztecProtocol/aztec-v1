#!/usr/bin/env bash
cd packages/protocol
yarn truffle compile

cd ../../
yarn build:artifacts

if [[ -z $(git status -s) ]]; then
  echo "Smart contracts have not changed, so do not redeploy them to testnets."
  exit 0
fi

echo "Kumbaya"
