#!/bin/bash

echo $CHANGED_MODULES;
if [ "$CI" = true ]; then
    echo "CI is true";
fi

if [ ! -d "dist" ]; then
    echo "dist does not exist";
fi

if [[ "aztec.js" =~ $CHANGED_MODULES ]]; then
    echo "aztec.js not in changedmodules";
fi


if [ "$PROD" = true ]; then
    if [ "$CI" = true ] && [ ! -d "dist" ] || [[ "aztec.js" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building prod bundle";
    ./node_modules/.bin/webpack --config ./webpack.prod.js;
    fi
else
    if [ "$CI" = true ] && [ ! -d "dist" ] || [[ "aztec.js" =~ $CHANGED_MODULES ]] || [ ! "$CI" = true ]; then
    echo "Re-building dev bundle";
    ./node_modules/.bin/webpack --config ./webpack.dev.js;
    fi
fi