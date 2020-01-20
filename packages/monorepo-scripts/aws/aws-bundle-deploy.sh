#!/bin/bash

PACKAGES_TO_DEPLOY='extension,sdk'
BUILD_FOLDER=''

CWD_PATH=$(pwd);
PACKAGE_NAME=$(echo $CWD_PATH | rev | cut -d'/' -f1 | rev)

if [[ $PACKAGES_TO_DEPLOY == *$PACKAGE_NAME* ]]; then
    VERSION=$1;
    BUCKET="s3://$PACKAGE_NAME.aztecprotocol.com";
    BUCKET_PATH="$1";

    # IS_EMPTY=$(aws s3 ls "$BUCKET/$BUCKET_PATH/");
    # if [[ ! -z  "$IS_EMPTY" ]]; then
    #     # exit 1;
    # fi

    BUILD_PATH=$BUNDLE_PATH;
    aws s3 sync $BUILD_PATH "$BUCKET/$BUCKET_PATH/"

fi

exit 0