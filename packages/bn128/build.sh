#!/bin/bash

echo $CHANGED_MODULES;

if [ "$PROD" = true ]; then
    if [ "$CI" = true ] && [ ! -d "dist" ] || [[ "bn128" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building prod bundle";
    ./node_modules/.bin/webpack --config ./webpack.prod.js;
    fi
else
    if [ "$CI" = true ] && [ ! -d "dist" ] || [[ "bn128" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    ./node_modules/.bin/webpack --config ./webpack.dev.js;
    fi
fi