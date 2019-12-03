#!/bin/bash

CHANGED_MODULES=$(cat /tmp/changed-modules);
echo $CHANGED_MODULES;

if [ "$PROD" = true ]; then
    if [ "$CI" = true ] && [ ! -d "$(pwd)/dist" ] || [[ "bn128" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building prod bundle";
    webpack --config ./webpack.prod.js;
    fi
else
    if [ "$CI" = true ] && [ ! -d "$(pwd)/dist" ] || [[ "bn128" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    webpack --config ./webpack.dev.js;
    fi
fi