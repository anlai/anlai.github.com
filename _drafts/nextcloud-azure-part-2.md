---
layout: post
title: NextCloud on Azure App Service (Part 2)
date: 
categories: azure app-service app-service-linux docker nextcloud mysql
---

Azure App Service Linux to me has always been very much of a black box.  It does some magic behind the scenes to determine what was deployed to it and figure out how to auto startup.  It's even more of a black box when using containers, there is minal logging and (as far as I can tell) it's not possible to ssh into a container just to check in on things.

While it's possible to deploy using a multi-container setup (Nextcloud + MySQL/MariaDB containers), I don't really advise it just because of the lack of available logging.  What we'll worry about in this post is setting up the "local" storage for NextCloud docker container and talk about database later on.  This also implies that we won't be using SQLite, it just doesn't work and I doubt the persistent storage would be fast enough anyways.

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

### Deploying App Service

Deployment is pretty straightforward you'll need to take this first docker compose file and store it somewhere locally (like on your desktop).

*docker_compose.yml*
```yml
version: '2'
services:
  nextcloud:
    image: nextcloud
    volumes:
      - ${WEBAPP_STORAGE_HOME}/site/nextcloud:/var/www/html
    ports:
      - 8000:80
    restart: always
```
Next you can take this Powershell script and put it in the same directory as the *docker_compose.yml* above.  Don't forget to fill in the variable information before executing.  Feel free to use whatever values you want, but the below is an example that you can probably use to generate unique resource names.

*{uniquename}* can be replaced with something like a domain name (e.g. nextcloud-planetexpress)

Optionally you can comment out the last 3 lines if you want to use a custom dns for your App Service.  Otherwise (given the example above) your address will be https://nextcloud-planetexpress.azurewebsites.net.

*provision_webapp.ps1*
```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'

az appservice plan create --name $basename --resource-group $rg --is-linux --location $location --sku P1V2 --subscription $subscription

az webapp create --name $basename --plan $basename --resource-group $rg  --subscription $subscription --multicontainer-config-type compose --multicontainer-config-file docker_compose.yml

az webapp stop --name $basename --resource-group $rg --subscription $subscription

az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_CONTAINER_START_TIME_LIMIT=1800
az webapp config appsettings set --name $basename --resource-group $rg --subscription $subscription --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

## optional 
#$fqdn = '{your fqdn}'
#az webapp config hostname add --webapp-name $basename --resource-group $rg --subscription $subscription --hostname $fqdn
#az webapp config ssl create --name $basename --resource-group $rg --subscription $subscription --hostname $fqdn
```

Once you have your information filled out execute the ps1 script.  Once it's done executing you should have an App Service that is spun up and partially ready to go, still need to hook things up to the other services.

*\*Note that the App Service Plan is spun up as a P1V2, it can be scaled down once setup is complete with almost no drop in performance.  Setup just takes a bit longer*

### Deploy Storage Account

## Guide

Parts:
1. Introduction (this post)
1. Azure App Service Linux Setup
1. Azure Database for MariaDB Setup
1. Nextcloud Setup
1. Securing and Cleaning up the Nextcloud Install