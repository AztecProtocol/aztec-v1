#!/bin/bash

# 1. replace package.json version with random number.
# 2. replace link in template.html with deployed staging address

PACKAGES_TO_PREPARE='extension,sdk';

CWD_PATH=$(pwd);
TEMPLATE_PATH="$CWD_PATH/test/harness";
TEMPLATE_NAME="index.html.template";
DEFAULT_SERVE_LOCATION="https://localhost:5555/sdk/aztec.js";

HTML=$(cat "$TEMPLATE_PATH/$TEMPLATE_NAME");

# Need first argument to be package
if [[ $PACKAGES_TO_PREPARE == *$1* ]]; then
    if [[ ! -z  "$SERVE_LOCATION" ]]; then
        echo "${HTML/\{\{SDK_SERVING_URL\}\}/$SERVE_LOCATION}" > "$TEMPLATE_PATH/index.html"
    else
        echo "${HTML/\{\{SDK_SERVING_URL\}\}/$DEFAULT_SERVE_LOCATION}" > "$TEMPLATE_PATH/index.html"
    fi
fi