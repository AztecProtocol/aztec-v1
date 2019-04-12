#!/usr/bin/env bash

cd ../../protocol
truffle migrate --reset --network kovan
truffle migrate --reset --network rinkeby
truffle migrate --reset --network ropsten
cd ../../monorepo-scripts
