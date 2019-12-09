#!/bin/sh
#set -ex

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$VPC_STACK_NAME" ]
then
    echo "Not defined VPC_STACK_NAME varialbe, pls make sure that you have .env file"
    exit 1
fi

# deploy stack
echo "Deploying ${VPC_STACK_NAME} stack. Pls, wait..."

eval "aws cloudformation deploy --stack-name ${VPC_STACK_NAME} --template-file deployment/stacks/vpc.yml"

echo "Done!"