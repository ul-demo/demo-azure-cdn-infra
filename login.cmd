:: Ce script permet d'authentifier pulumi avec son backend dans Azure
:: et de sélectionner une stack.
:: Pulumi utilise les variables AZURE_STORAGE_ACCOUNT et AZURE_STORAGE_KEY et la commande
::     pulumi login --cloud-url azblob://<container>
:: pour utiliser un backend hébergé dans un Storage Account d'Azure
::
:: La commande "pulumi stack select" + la variable PULUMI_CONFIG_PASSPRASE sont utilisés pour
:: sélectionner l'environnement courant
@echo off
set ENV=%1
set AZURE_STORAGE_ACCOUNT=frpol9build

echo Fetching key for pulumi storage account...
FOR /F "delims=" %%i IN ('az storage account keys list --account-name frpol9build --query [0].value --output tsv') ^
do set AZURE_STORAGE_KEY=%%i

echo Fetching vault secret for stack passphrase...
FOR /F "delims=" %%i IN ('az keyvault secret show --vault-name frpol9-build-vault --name demo-azure-cdn-%ENV% --query value --output tsv') ^
do set PULUMI_CONFIG_PASSPHRASE=%%i

echo Logging in pulumi...
pulumi login --cloud-url azblob://pulumi

echo Selecting stack demo-azure-cdn-%ENV%...
pulumi stack select demo-azure-cdn-%ENV%

echo Done.