#!/bin/bash

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd $REPO_ROOT

echo "==> Setting up main from remote, cleaning up local changes or unpushed commits"
git clean -f
git branch -D temp 2>/dev/null || true
git checkout -b temp
git branch -D main
git checkout -b main

echo "==> Applying patch and creating a commit"
git apply --whitespace=fix ${SCRIPT_DIR}/demo.patch
git commit -am "Demo prep"

echo "==> Installing npm dependencies"
npm install

echo "==> Downloading container images"
docker compose pull

echo "==> Deleting postgres:17.2 container image"
docker image rm postgres:17.2 || true

echo "==> Configuring DBC (if this fails, ask to be added to the dockerdevrel organization)"
docker buildx create --driver cloud dockerdevrel/demo-builder 2>/dev/null || true
docker buildx use cloud-dockerdevrel-demo-builder

echo "==> Configuring Scout"
docker scout config organization dockerdevrel
