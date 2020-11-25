Script Pulumi permettant de déployer les ressources Azure pour un module Javascript

## Services utilisés
Les services privilégiés pour déployer un module JS ici sont le "Storage Account" et le "CDN".

Le storage account offre une fonctionnalité de site web statique qui est utilisé pour gérer le routage et la gestion du 404.

Le CDN est utilisé afin d'optimiser la distribution de l'application et pour son engin de règles permettant de manipuler les entêtes HTTP.

## Pour utiliser Pulumi localement
Vous devez d'abord installer les outils "az" de Microsoft et pulumi lui-même localement.

## Lier Pulumi à un blob Azure
Pulumi doit conserver son état à quelque part. Par défaut, il va utiliser le service payant qui vient avec Pulumi mais il existe aussi une manière de l'utiliser gratuitement.

Pour se faire, il faut lui indiquer un endroit où conserver son état.

Le plus simple est de créer un storage account Azure et un container dédié.

Exécuter:
```
set AZURE_STORAGE_ACCOUNT=<le nom du storage account>
set AZURE_STORAGE_KEY=<la clé du storage account>
pulumi login --cloud-url azblob://<le nom du container>
```

par exemple:
```
set AZURE_STORAGE_ACCOUNT=frpol9build
set AZURE_STORAGE_KEY=xxx
set PULUMI_CONFIG_PASSPHRASE=xxx
pulumi login --cloud-url azblob://pulumi
```

## Pour créer une nouvelle stack
Pulumi utilise la notion de "stack" pour supporter plusieurs environnemnet d'une même infrastructure.

Exécuter :
```
pulumi stack init <nom de la stack incluant le nom du projet>
```
Générer un nouveau mot de passe et conserver le dans une voûte sécuritaire (ex: Azure Key Vault)
```
set PULUMI_CONFIG_PASSPHRASE=<mot de passe de la stack>
pulumi stack select <nom de la stack>
```
## Configurer la stack
Exécuter :
```
pulumi config set azure:environment public
pulumi config set azure:location CanadaEast
pulumi config set azure:subscriptionId <id subscription>
pulumi config set azure:tenantId: <id tenant>
pulumi config set azure:clientId <guid compte Azure pour se connecter>
pulumi config set --secret azure:clientSecret <mot de passe compte Azure>
```
## Déployer les ressources
```
pulumi up
```

## Pour sélectionner une stack
```
pulumi stack select demo-azure-cdn-dev
```