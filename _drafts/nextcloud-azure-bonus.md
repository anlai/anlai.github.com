---
layout: post
title: Nextcloud on Azure Bonus
date: 2020-10-14
categories: azure nextcloud
---

*docker_compose.yml*
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

*setup_part1.ps1
```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'
$fqdn = 'NOT_SET'
$dbname = 'nextcloud'
$dbusername = ''
$dbpassword = ''

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

Write-Host "================================"
Write-Host "Database"
Write-Host "================================"
az mariadb server create --name $basename --resource-group $rg --sku-name 'B_Gen5_1' --admin-user $dbusername --admin-password $dbpassword --location $location --subscription $subscription --ssl-enforcement Disabled
az mariadb db create --name $dbname --resource-group $rg --subscription $subscription --server-name $basename
az mariadb server configuration set --name 'tx_isolation' --resource-group $rg --server $basename --value 'READ-COMMITTED'

# firewall rule to allow all Azure services through
az mariadb server firewall-rule create -g $rg -s $basename -n "AllowAllWindowsAzureIps" --start-ip-address "0.0.0.0" --end-ip-address "0.0.0.0"
```

```bash
mysql -h {server url} -u {username} -p
```

```
CREATE USER 'temp' IDENTIFIED BY '{password}';
CREATE USER 'nextcloud' IDENTIFIED BY '{password}';
CREATE DATABASE IF NOT EXISTS nextcloud;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES ON nextcloud.* TO 'temp' IDENTIFIED BY '{password}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES ON nextcloud.* TO 'nextcloud' IDENTIFIED BY '{password}';
FLUSH privileges;
```

```powershell
az mariadb server update --resource-group $rg --name $basename --ssl-enforcement Disabled
az webapp start --name $basename --resource-group $rg --subscription $subscription
```



run setup

drop temp user
DROP USER 'temp';

stop app service
upload the root cert for database
update the config.php file

```powershell
az mariadb server update --resource-group $rg --name $basename --ssl-enforcement Enabled
az webapp start --name $basename --resource-group $rg --subscription $subscription
```