#!/bin/bash

CHANGED_MODULES=$(cat /tmp/changed-modules);

if [ "$CI" = true ] && [ ! -d "$(pwd)/lib" ] || [[ "secp256k1" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    yarn clean && babel --copy-files --out-dir ./lib --root-mode upward ./src;
fi
