---
layout: post
title: NextCloud on Azure App Service - Part 2
date: 2020-10-15
categories: azure app-service app-service-linux docker nextcloud mysql
---

Azure App Service Linux to me has always been very much of a black box.  It does some magic behind the scenes to determine what was deployed to it and figure out how to auto startup.  It's even more of a black box when using containers, there is minal logging and (as far as I can tell) it's not possible to ssh into a container just to check in on things.

While it's possible to deploy using a multi-container setup (Nextcloud + MySQL/MariaDB containers), I don't really advise it just because of the lack of available logging.  What we'll worry about in this post is setting up the local storage for NextCloud docker container and talk about database later on.  This also implies that we won't be using SQLite, it just doesn't work and I doubt the persistent storage would be fast enough anyways.

## Persistent Storage

The biggest problem with App Service is persistent storage.  When using app service the assumption is that the node the instance is running on can be restarted and/or deployed to a new node at any time and anything changed or stored are lost forever.  The only thing you can expect to persist between instances is the application code or in this case the docker container.

There are a couple of options for persistent storage, hint, there is one option that is (unscientifically) an order of magnitude slower than the other.  [This blog post from Tom Kerkhove](https://blog.tomkerkhove.be/2019/07/25/mounting-volumes-on-azure-web-app-for-containers/) does a fantastic job at explaining the options.

Summary of the post, there are two options:
1. App Service Persistent Shared Storage ([MS Docs](https://docs.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-persistent-shared-storage))
1. Azure Storage Account File Share ([MS Docs, maybe it's a little old?](https://docs.microsoft.com/en-us/azure/app-service/configure-connect-to-azure-storage?pivots=container-linux))

Option #2 is excessively slower, the app will eventually load and configure but it's more or less unusable (think 30-60 seconds minimum to load pages).

Option #1 is quite a bit faster and it's usable but it's not fast.

From what I understand the underlying architecture between the two is that they are mapped network storage (obviously #2 is), one is closer to the node (and faster) than the other.

## Deployment

### Storage Account

Nothing fancy, just deploying a standard v2 storage account.  We're only going to use this for file storage all the configurations will sit in the shared persistent storage on the App Service.  However you technically don't need this, if you are going to use another type of storage built into NextCloud like AWS S3 or BlackBlaze (which is S3 compatible).  But I would recommend doing it as you only pay based on usage.

What this will create is a new storage account, a file share named `nextcloud-data`, and retrieves the storage key.

```powershell
az storage account create --name $storagename --resource-group $rg --subscription $subscription --access-tier Hot --sku 'Standard_LRS'
az storage share create --account-name $storagename --name 'nextcloud-data'
$key = az storage account keys list  --account-name $storagename --resource-group $rg --subscription $subscription --query [0].value
```
**See the bottom for the full script**

### Deploying App Service

Deployment is pretty straight forward, we'll create an App Service Plan for Linux, App Service Linux using Docker Compose to define the container, and if you have a domain setup custom DNS.

The reason Docker Compose is required is to be able to map the App Service persistent shared storage.  If we were going to use the storage account for everything all the appropriate volumes can be mounted just by the App Service file mounts.  Since we're going with a hybrid approach, Docker Compose is really the only way to do it.  So let's talk about what's going on here, the file itself isn't doing anything special for the most part, it references the nextcloud (latest) image and exposes port 80 on 8000 on the host.  App Service actually detects that and more or less creates a reverse proxy with SSL termination for you, so when someone navigates to your site with just https (no port) they will get routed to your site properly.

What you'll probably notice is in volumes, there are two things that stand out `${WEBAPP_STORAGE_HOME}` this variable maps to the root of the shared persistent storage.  Notice too that the 3rd one just references `data`, this gets mapped to a mounted file share on the App Service.

Drop this file onto your computer, assumed filename: *docker_compose.yml*
```yml
version: '2'
services:
  nextcloud:
    image: nextcloud
    volumes:
      - ${WEBAPP_STORAGE_HOME}/site/nextcloud:/var/www/html
      - ${WEBAPP_STORAGE_HOME}/site/ca:/etc/ssl/azure
      - data:/var/www/html/data
    ports:
      - 8000:80
    restart: always
```
The App Service Plan and App Service will get spun up using Powershell command using Azure CLI.  The full script is at the bottom, but let's break down what is happening.

These variables will just make it easer as we build a bigger and bigger script.  Since you'll need to associate resources with each other, naming everything similar and in variables will just make it loads easier.

These central variables:
- $subscription -- the unique identifier of the subscription to put the resources into
- $rg -- name of the resource group
- $basename -- acts as a global unqiue identifier for services (and associated dns names), e.g. nextcloud-planetexpress would make an App Service called "nextcloud-planetexpress" with a dns name "nextcloud-planetexpress.azurewebsites.net"
- $location -- region to deploy your services, list can be retrieved by executing this command `az account list-locations -o table`
- $fqdn -- the fully qualified domain name for the app service (the dns for the main NextCloud site) (optional)

```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'
$fqdn = 'NOT_SET'
```
These commands will spin up the Linux App Service Plan and App Service.  The App Service also references the docker_compose.yml file.

```powershell
az appservice plan create --name $basename --resource-group $rg --is-linux --location $location --sku P1V2 --subscription $subscription
az webapp create --name $basename --plan $basename --resource-group $rg  --subscription $subscription --multicontainer-config-type compose --multicontainer-config-file docker_compose.yml
```

These following commands set some App Service application settings (also maps as environmental variables in the container):
- WEBSITES_CONTAINER_START_TIME_LIMIT -- increases startup time (in seconds), startup can take quite a while
- WEBSITES_ENABLE_APP_SERVICE_STORAGE -- enables the shared persistent storage

```powershell
az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_CONTAINER_START_TIME_LIMIT=1800
az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
```

This final command mounts the Storage Account fileshare to the App Service.  Note that the `custom-id` property is the identifier that we reference in the docker_compose.yml file.

```powershell
az webapp config storage-account add --name $basename --resource-group $rg --account-name $storagename --access-key $key --share-name 'nextcloud-data' --custom-id 'data' --storage-type AzureFiles --mount-path '/var/www/html/data'
```

### Full Deployment Script

Drop this onto your computer, name it **nextcloud_setup_part1.ps1**
```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'
$fqdn = 'NOT_SET'

# storage account
Write-Host "================================"
Write-HOst "Storage Account"
Write-Host "================================"

az storage account create --name $storagename --resource-group $rg --subscription $subscription --access-tier Hot --sku 'Standard_LRS'
az storage share create --account-name $storagename --name 'nextcloud-data'
$key = az storage account keys list  --account-name $storagename --resource-group $rg --subscription $subscription --query [0].value

Write-Host "================================"
Write-Host "App Service"
Write-Host "================================"
# app service
az appservice plan create --name $basename --resource-group $rg --is-linux --location $location --sku P1V2 --subscription $subscription

az webapp create --name $basename --plan $basename --resource-group $rg  --subscription $subscription --multicontainer-config-type compose --multicontainer-config-file docker_compose.yml

az webapp stop --name $basename --resource-group $rg --subscription $subscription

az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_CONTAINER_START_TIME_LIMIT=1800
az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

az webapp config storage-account add --name $basename --resource-group $rg --account-name $storagename --access-key $key --share-name 'nextcloud-data' --custom-id 'data' --storage-type AzureFiles --mount-path '/var/www/html/data'

az webapp config set --ftps-state FtpsOnly --name $basename --resource-group $rg --subscription $subscription

## optional 
If($fqdn -ne 'NOT_SET') {
    az webapp config hostname add --webapp-name $basename --resource-group $rg --subscription $subscription --hostname $fqdn
    $thumbprint = az webapp config ssl create --name $basename --resource-group $rg --subscription $subscription --hostname $fqdn --query 'thumbprint'
    az webapp config ssl bind --certificate-thumbprint $thumbprint --ssl-type SNI --name $basename --resource-group $rg --subscription $subscription
}
```

## Guide Quick Links

1. [Introduction]({% post_url 2020-10-14-nextcloud-azure-part-1 %})
1. Azure App Service Linux Setup (this post)
1. [Azure Database for MariaDB Setup]({% post_url 2020-10-22-nextcloud-azure-part-3 %})
1. Nextcloud Setup
1. Securing and Cleaning up the Nextcloud Install