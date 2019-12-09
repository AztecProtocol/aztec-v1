#!/bin/sh
#set -ex

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$ADMIN_SERVICE_STACK_NAME" ]
then
    echo "Not defined ADMIN_SERVICE_STACK_NAME varialbe, pls make sure that you have .env file"
    exit 1
fi

if [ -z "$ECR_ADMIN_SERVICE_IMAGE_URL" ]
then
    echo "Not defined ECR_ADMIN_SERVICE_IMAGE_URL varialbe, pls make sure that you have .env file"
    exit 1
fi

if [ -z "$ECR_ADMIN_SERVICE_IMAGE_VERSION" ]
then
    echo "Not defined ECR_ADMIN_SERVICE_IMAGE_VERSION varialbe, pls make sure that you have .env file"
    exit 1
fi

# deploy stack
echo "Deploying ${ADMIN_SERVICE_STACK_NAME} stack. Pls, wait..."

eval "aws cloudformation deploy \
--stack-name ${ADMIN_SERVICE_STACK_NAME} \
--template-file deployment/stacks/admin-panel-service.yml \
--parameter-overrides \
ImageUrl='${ECR_ADMIN_SERVICE_IMAGE_URL}' \
ImageVersion='${ECR_ADMIN_SERVICE_IMAGE_VERSION}' \
DBUser='${DB_USER}' \
DBPassword='${DB_PASSWORD}' \
DBPrefix='${DB_DATABASE_PREFIX}' \
DBHost='${DB_HOST}' \
DBPort='${DB_PORT}' \
CookiesPassword='${COOKIES_PASSWORD}'"

echo "Done!"