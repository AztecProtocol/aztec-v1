#!/usr/bin/env bash
cd packages/protocol
yarn truffle compile

echo "Script executed from: ${PWD}"

cd ../../
yarn build:artifacts

if [[ -z $(git status -s) ]]; then
  echo "Protocol contracts have not changed."
  exit 0
fi
