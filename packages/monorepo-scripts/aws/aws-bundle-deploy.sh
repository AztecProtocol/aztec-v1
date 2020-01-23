#!/bin/bash

PACKAGES_TO_DEPLOY='extension,sdk'

CWD_PATH=$(pwd);
BUILD_PATH="$CWD_PATH/build"
PACKAGE_NAME=$(echo $CWD_PATH | rev | cut -d'/' -f1 | rev)

if [[ $PACKAGES_TO_DEPLOY == *$PACKAGE_NAME* ]]; then
    VERSION=$1;
    BUCKET="s3://$PACKAGE_NAME.aztecprotocol.com";
    BUCKET_PATH="$1";

    IS_EMPTY=$(aws s3 ls "$BUCKET/$BUCKET_PATH/");
    if [[ ! -z  "$IS_EMPTY" ]]; then
        exit 1;
    fi

    aws s3 sync $BUILD_PATH "$BUCKET/$BUCKET_PATH/" --acl public-read;

fi

exit 0