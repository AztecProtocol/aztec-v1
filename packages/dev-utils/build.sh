#!/bin/bash

CHANGED_MODULES=$(cat /tmp/changed-modules);

if [ "$CI" = true ] &&  [ ! -d "$(pwd)/lib" ] || [[ "dev-utils" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    yarn clean && babel --copy-files --out-dir ./lib --root-mode upward ./src;
fi
