import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as azureNextgen from "@pulumi/azure-nextgen";
import * as storageNextgen from "@pulumi/azure-nextgen/storage/v20200801preview";

const projectName = pulumi.getProject();
const stackName = pulumi.getStack();
const objectName = `frpol9-${stackName}`;
const resourceGroupName = `${objectName}-rg`;
const storageAccountName = `${objectName}st`.replace(/-/g, '').substr(0, 24);
const cdnProfileName = `${objectName}-cdn`;
const cdnEndpointName = `${objectName}-endpoint`;

const defaultTags = {
    "ApplicationName": projectName,
    "Env": stackName,
};

// Create an Azure Resource Group
const resourceGroup = new azure.core.ResourceGroup(resourceGroupName, {
    name: resourceGroupName,
    tags: defaultTags,
});

// Create an Azure resource (Storage Account)
const storageAccount = new azure.storage.Account(storageAccountName, {
    name: storageAccountName,
    resourceGroupName: resourceGroup.name,
    accountTier: "Standard",
    accountKind: "StorageV2",
    accountReplicationType: "LRS",
    enableHttpsTrafficOnly: false,
    staticWebsite: {
        indexDocument: "index.html",
        error404Document: "index.html"
    },
    tags: defaultTags,
}, {
    parent: resourceGroup
});

const blobService = new storageNextgen.BlobServiceProperties("/default", {
    accountName: storageAccount.name,
    blobServicesName: "/default",
    resourceGroupName: resourceGroup.name,
    lastAccessTimeTrackingPolicy: {
        enable: true,
        blobType: ["blockBlob"],
        name: "AccessTimeTracking"
    },
}, {
    parent: storageAccount
});

new storageNextgen.ManagementPolicy("managementPolicy", {
    managementPolicyName: "default",
    accountName: storageAccount.name,
    resourceGroupName: resourceGroup.name,
    policy: {
        rules: [
            {
                name: "delete-not-accessed-after",
                enabled: true,
                type: "Lifecycle",
                definition: {
                    actions: {
                        baseBlob: {
                            delete: {
                                daysAfterLastAccessTimeGreaterThan: 30
                            }
                        }
                    },
                    filters: {
                        blobTypes: ["blockBlob"],
                        prefixMatch: ["$web/"]
                    }
                }
            }
        ]
    }
}, {
    parent: blobService
})

// We can add a CDN in front of the website
const cdn =  new azure.cdn.Profile(cdnProfileName, {
    name: cdnProfileName,
    resourceGroupName: resourceGroup.name,
    sku: "Standard_Microsoft",
    tags: defaultTags
}, {
    parent: resourceGroup
});

const endpoint = new azure.cdn.Endpoint(cdnEndpointName, {
    name: cdnEndpointName,
    resourceGroupName: resourceGroup.name,
    profileName: cdn.name,
    originHostHeader: storageAccount.primaryWebHost,
    origins: [{
        name: "blobstorage",
        hostName: storageAccount.primaryWebHost,
    }],
    deliveryRules: [
        {
            order: 1,
            name: "forcehttps",
            requestSchemeCondition: {
                operator: "Equal",
                matchValues: ["HTTP"]
            },
            urlRedirectAction: {
                redirectType: "PermanentRedirect",
                protocol: "Https",
            }
        }
    ],
    tags: defaultTags
}, {
    parent: resourceGroup
});

export const staticWebsiteEndpoint = storageAccount.primaryWebEndpoint;
export const cdnEndpoint = pulumi.interpolate`https://${endpoint.hostName}/`;