Script Pulumi permettant de déployer les ressources Azure pour un module Javascript

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
## Créer la stack
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
