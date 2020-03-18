#!/bin/bash

PACKAGES_TO_DEPLOY='extension,sdk';

yarn build:integration;

CWD_PATH=$(pwd);
BUILD_PATH="$CWD_PATH/build";
PACKAGE_NAME=$(echo $CWD_PATH | rev | cut -d'/' -f1 | rev);

if [[ $PACKAGES_TO_DEPLOY == *$PACKAGE_NAME* ]]; then
    BUCKET="s3://staging-sdk.aztecprotocol.com";
    BUCKET_PATH="$1";

    aws s3 sync $BUILD_PATH "$BUCKET/$BUCKET_PATH/" --acl public-read;

fi

exit 0;