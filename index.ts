import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as storageNextgen from "@pulumi/azure-nextgen/storage/v20200801preview";
import { CDNCustomDomainResource } from "./customdomain";

const projectName = pulumi.getProject();
const stackName = pulumi.getStack();

// Assurez-vous d'avoir un CNAME au niveau du DNS qui pointe vers votre endpoint
const customDomain = stackName === "demo-azure-cdn-prod" ? "demo-azure.app.ulaval.ca" : null;
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

if (pulumi.getStack().endsWith("-app")) {
    new azure.storage.Container("artifacts", {
        name: "artifacts",
        storageAccountName: storageAccount.name,
    }, {
        parent: storageAccount
    });
}

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
                        blobTypes: ["blockBlob"]
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

if (customDomain) {
    new CDNCustomDomainResource("cdnCustomDomain", {
        resourceGroupName: resourceGroupName,
        profileName: cdnProfileName,
        endpointName: cdnEndpointName,
        customDomainHostName: customDomain,
        
        // This will enable HTTPS through Azure's one-click
        // automated certificate deployment.
        // The certificate is fully managed by Azure from provisioning
        // to automatic renewal at no additional cost to you.
        httpsEnabled: true,
        
    }, { 
        parent: endpoint
    });
}

export const staticWebsiteEndpoint = storageAccount.primaryWebEndpoint;
export const cdnEndpoint = pulumi.interpolate`https://${endpoint.hostName}/`;