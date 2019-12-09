#!/bin/sh
#set -ex

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$ECR_ADMIN_SERVICE_IMAGE_URL" ]
then
    echo "Not defined ECR_URI varialbe, pls make sure that you have .env file"
    exit 1
fi

# image registry URI
URI=$ECR_ADMIN_SERVICE_IMAGE_URL

# uncomment to ensure we're up to date
# git pull

# authenticate to docker cli
`aws ecr get-login --region ${REGION} --no-include-email`

# bump version
docker run --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`
echo "version: $version"

docker build -t ${URI}:latest .

# uncomment to push to git
# git tag -a "$version" -m "version $version"
# git push

#git push --tags
docker tag ${URI}:latest ${URI}:$version
# push it
docker push ${URI}:latest
docker push ${URI}:$version