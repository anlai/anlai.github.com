---
layout: post
title: Grafana and InfluxDB on Azure App Service Linux Containers Powershell Instructions
date: 2020-09-30
categories: azure app-service app-service-linux grafana influxdb docker
---


## InfluxDB setup

Here is the series of Powershell scripts to execute mostly the same configuration as above.  These commands require the usage of [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest)

You can either do it from the cloud shell or locally (which requires the login steps).

```azurepowershell
$subscriptionId = {subscription id}
$rgname = Grafana
$aspname = Grafana
$storagename = grafanadata
$region = westus
$influxdbFileshare = influxdb
$influxdbAppname = influxdb-sample
$grafanaFileshare = grafana
$grafanaAppname = grafana-sample

# login
az login
az account set --subscription $subscriptionId

# create app service plan
az appservice plan create -g $rgname -n $aspname --is-linux -l $region --sku B1

# create storage account
az storage account create -g $rgname -n $storagename -l $region --kind StorageV2 --sku Standard_LRS --access_tier Hot
az storage share create --account-name $storagename --name $influxdbFileshare
az storage share create --account-name $storagename --name $grafanaFileshare

# create app service (influxdb)
az webapp create -g $rgname -p $aspname -n $influxdbAppname -i influxdb
az webapp stop -g $rgname -n $influxdbAppname
az webapp config set -g $rgname -n $influxdbAppname --always-on true
az webapp config appsettings set -g $rgname -n $influxdbAppname --settings \
    INFLUXDB_ADMIN_USER=admin \
    INFLUXDB_ADMIN_PASSWORD={strong password} \
    INFLUXDB_DB=firstdb \
    INFLUXDB_USER=firstuser \
    INFLUXDB_USER_PASSWORD={strong password} \
    INFLUXDB_HTTP_AUTH_ENABLED=true \
az webapp config storage-account add -g $rgname -n $influxdbAppname --custom-id data \
    --storage-type AzureFiles \
    --account-name $storagename \
    --share-name $influxdbFileshare \
    --mount-path /var/lib/influxdb
az webapp start -g $rgname -n $influxdbAppname
az webapp stop -g $rgname -n $influxdbAppname
az webapp config appsettings delete -g $rgname -n $influxdbAppname --setting-names INFLUXDB_ADMIN_USER \
    INFLUXDB_ADMIN_PASSWORD \
    INFLUXDB_DB \
    INFLUXDB_USER \
    INFLUXDB_USER_PASSWORD
az webapp start -g $rgname -n $influxdbAppname

# create app service (grafana)
az webapp create -g $rgname -p $aspname -n $grafanaAppname -i grafana/grafana
```

### Grafana Setup

```powershell
$grafanaFileshare = grafana
$grafanaAppname = grafana-sample
$rgname = Grafana
$storagename = grafanadata
$connstring = "sqlite3:///var/lib/grafana/grafana.db?cache=private&mode=rwc&_journal_mode=WAL"

az webapp config appsettings set -g $rgname -n $grafanaAppname --settings GF_DATABASE_URL=$connstring
az webapp config storage-account add -g $rgname -n $grafanaAppname --custom-id data \
    --storage-type AzureFiles \
    --account-name $storagename \
    --share-name $grafanaFileshare \
    --mount-path /var/lib/grafana
```