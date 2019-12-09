#!/bin/sh
#set -ex

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$IAM_STACK_NAME" ]
then
    echo "Not defined IAM_STACK_NAME varialbe, pls make sure that you have .env file"
    exit 1
fi

# deploy stack
echo "Deploying ${IAM_STACK_NAME} stack. Pls, wait..."

eval "aws cloudformation deploy --stack-name ${IAM_STACK_NAME} --template-file deployment/stacks/iam.yml --capabilities CAPABILITY_IAM"

echo "Done!"