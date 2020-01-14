#!/bin/bash

if [[ -z "$CIRCLE_TOKEN" ]]; then
    exit 0
fi

LAST_SUCCESSFUL_BUILD_URL="https://circleci.com/api/v1.1/project/github/aztecprotocol/AZTEC/tree/develop?filter=successful&limit=1"
LAST_SUCCESSFUL_COMMIT=`curl -Ss -u "$CIRCLE_TOKEN:" $LAST_SUCCESSFUL_BUILD_URL | jq -r '.[0]["vcs_revision"]'`
CHANGED_MODULES=$(echo $(git diff --name-only $LAST_SUCCESSFUL_COMMIT | grep ^packages\/.*\/ || true) | tr " " "\n" | cut -d\/ -f2 | uniq | paste -sd\| -)

if [[ $1 =~ $CHANGED_MODULES ]]; then
    exit 0
else
    exit 1
fi