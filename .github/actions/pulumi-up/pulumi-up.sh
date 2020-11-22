#!/bin/sh
# En cas d'erreur: permission denied: unknown.
# git update-index --chmod=+x .github\actions\pulumi-up\pulumi-up.sh
set -e

export AZURE_STORAGE_ACCOUNT=frpol9build
export AZURE_STORAGE_KEY=$2
export PULUMI_CONFIG_PASSPHRASE=$3

echo "Running pulumi login..."
pulumi login --cloud-url azblob://pulumi

echo "Selecting stack..."
pulumi stack select $1

echo "Running npm ci..."
npm ci

echo "Running pulumi up..."
pulumi up --skip-preview --yes
