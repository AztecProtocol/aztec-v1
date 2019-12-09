#!/bin/sh
#set -ex

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$ECS_CLUSTER_STACK_NAME" ]
then
    echo "Not defined ECS_CLUSTER_STACK_NAME varialbe, pls make sure that you have .env file"
    exit 1
fi

# deploy stack
echo "Deploying ${ECS_CLUSTER_STACK_NAME} stack. Pls, wait..."

eval "aws cloudformation deploy --stack-name ${ECS_CLUSTER_STACK_NAME} --template-file deployment/stacks/cluster.yml"

echo "Done!"