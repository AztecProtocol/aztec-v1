#!/bin/bash

echo $CHANGED_MODULES;
cat /tmp/changed-modules;
CHANGED_MODULES=$(cat /tmp/changed-modules);
echo $CI;
echo "$(pwd)/dist";

if [ "$PROD" = true ]; then
    if [ "$CI" = true ] && [ ! -d "$(pwd)/dist" ] || [[ "aztec.js" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building prod bundle";
    ./node_modules/.bin/webpack --config ./webpack.prod.js;
    fi
else
    if [ "$CI" = true ] && [ ! -d "$(pwd)/dist" ] || [[ "aztec.js" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    ./node_modules/.bin/webpack --config ./webpack.dev.js;
    fi
fi