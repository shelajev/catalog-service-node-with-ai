# Demo help

This directory contains various patches that can be applied to this project to prepare it for various demos.

Why this instead of using other branches? Simply put, reduced maintenance. As we make updates to the main branch, it's easier to maintain a few patches than several branches.

**It is assumed you are running the commands below from the root of the project, not from within this directory.**

## End-to-end demo

For an end-to-end demo, the project is slightly downgraded to use an older version of the node base image, a few minor linting issues in the Dockerfile, an older version of Express, and setup the codebase to support a "feature addition."

More talking points to come soon!

```console
git apply --whitespace=fix demo/e2e.patch
```

## Scout demo

For a Scout demo, the following patch will adjust the Dockerfile to use an older base image and install an older version of Express, allowing you to demo out-of-date base images and vunlerable dependencies.

```console
git apply --whitespace=fix demo/scout.patch
```
