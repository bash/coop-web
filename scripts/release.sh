#!/bin/bash

BRANCH="gh-pages"

FILES=(
  build/*
  index.html
)

CURRENT_DIRECTORY=`pwd`
TEMP_DIR=$(mktemp -d)
REMOTE_URL=$(git config --get remote.origin.url)

set -e

cleanup() {
    rm -rf ${TEMP_DIR}
    cd ${CURRENT_DIRECTORY}
}

trap cleanup EXIT

echo "Cloning repository..."
git clone -b ${BRANCH} ${REMOTE_URL} ${TEMP_DIR} -q

echo "Cleaning old files..."
cd ${TEMP_DIR}
git rm -r .

echo "Copying new files..."

for FILE in ${FILES[@]}; do
    mkdir -p ${TEMP_DIR}/$(dirname ${FILE})
    cp -R ${CURRENT_DIRECTORY}/${FILE} ${TEMP_DIR}/${FILE}
done

git add -A

TIMESTAMP=$(date +"%s")

# git config user.email "travis@rubys.ninja"
# git config user.name "Travis"
git commit -m "Build for tag #$TIMESTAMP"

echo "Pushing..."
git push origin ${BRANCH}
