---
layout: post
title: Nextcloud on Azure Database MySQL/MariaDB with SSL (Part 3)
date: 2020-10-22
categories: azure azure-database azure-mariadb
---

This installment will talk about the database we're going to use for NextCloud.  There are technically a few options available to you but given how we setup NextCloud on App Service, SQLite is definietly not an option (not that it would even be advisable anyways).  Which leaves three (more like 2.5?) options: MySQLMariaDB, and PostgreSQL.  Luckily for me Azure offers all three, so lucky, right?

I decided to use the managed database Azure Database for MariaDB.  It's pretty nice, spin up the database server and database, and you are on your way.  No installing an OS, doing updates, or installing the database server from scratch.  Just a few commands and you are kinda good.

## Security

When the database is setup, it's pretty secure by default (at least I really hope it is).  There are still a few more things to deal with to get things squared away, but there is one feature that I wouldn't turn off since all traffic will be out on "public networks" (realistically it doesn't leave Azure's network but it's not private).

SSL encryption, if you really aren't aware it secures your communication with the database server from NextCloud app server.  Using SSL enabled MySQL/MariaDB you would kind of assume should be straight forward.  Not so much.  If you try to setup Nextcloud with a database that has SSL enabled it apparently chokes and there isn't really a way to fix that.

NextCloud needs to be setup with SSL disabled, then configure NextCloud to use SSL.  It appears the biggest problem that SSL doesn't work is that the container doesn't trust the Azure Database certificate chain.  So as a mitigation, we'll either use a throwaway account or reset the password immediately after setup.

## Deployment

### Deploy the Database

Deployment of the database server, configuration, and security settings can be boiled down into a few scripts.

This first two commands creates a new database server, and a new database.  It creates the smallest MariaDB server allowed by Azure a Basic Generation 5 with 1vCore (as noted by B_Gen5_1).

```powershell
az mariadb server create --name $basename --resource-group $rg --sku-name 'B_Gen5_1' --admin-user $dbusername --admin-password $dbpassword --location $location --subscription $subscription --ssl-enforcement Disabled
az mariadb db create --name $dbname --resource-group $rg --subscription $subscription --server-name $basename
```

This next command changes the transaction isolation level to TRANSACTION_READ_COMMITTED.  This is recommended by the NextCloud Database Configuration guide, [see here](https://docs.nextcloud.com/server/15/admin_manual/configuration_database/linux_database_configuration.html)

```powershell
az mariadb server configuration set --name 'tx_isolation' --resource-group $rg --server $basename --value 'READ-COMMITTED'
```

This last command changes the server firewall rules, and opens it up to all Azure services.  Yes this means all services, even those that you don't own.  However this is technically the best you can get unless you get a reserve IP on your app service.  Note that you'll probably need to open up additional rules in your firewall depending on how you want to run the MySQL commands (see below). 

```powershell
az mariadb server firewall-rule create -g $rg -s $basename -n "AllowAllWindowsAzureIps" --start-ip-address "0.0.0.0" --end-ip-address "0.0.0.0"
```

At this point your database and is configured and you are more or less ready to go.

### Database Accounts (optional)

You can technically use the admin username/password you setup above, to complete the NextCloud setup, but I don't really advise it.  Honestly it'll make it easier when you have to cycle your passwords since it's built into the Azure Portal ui, but it's also an account with full admin rights to your database server.  I recomend setting up additional username/passwords for NextCloud to use and a throwaway just for setup purposes.

The easiest way to do this is to open up a cloud shell in Azure and use the following command [Microsoft documentation on MySQL using Cloud Shell](https://docs.microsoft.com/en-us/azure/mariadb/tutorial-design-database-cli#use-azure-cloud-shell):

This command will connect mysql cli (server url and username can be found on the MariaDB home page in Azure Portal)

```bash
mysql -h {server url} -u {username} -p
```

Then in MySQL, we'll create 2 accounts.  The throwaway and a nextcloud specific account (seperate from the admin account).

```
CREATE USER 'temp' IDENTIFIED BY '{password}';
CREATE USER 'nextcloud' IDENTIFIED BY '{password}';
CREATE DATABASE IF NOT EXISTS nextcloud;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES ON nextcloud.* TO 'temp' IDENTIFIED BY '{password}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES ON nextcloud.* TO 'nextcloud' IDENTIFIED BY '{password}';
FLUSH privileges;
```

Now your database is ready to go, make sure you keep all the passwords. They'll be referred to as throwaway and nextcloud db account.

### Post Install

Remember there will be a few steps with the database after installation, which will get covered in the final post that cleans up security and the throw away account.

### Full Deployment Script

```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'

$dbname = 'nextcloud'
$dbusername = '{username here}'
$dbpassword = '{password here}'

az mariadb server create --name $basename --resource-group $rg --sku-name 'B_Gen5_1' --admin-user $dbusername --admin-password $dbpassword --location $location --subscription $subscription --ssl-enforcement Disabled
az mariadb db create --name $dbname --resource-group $rg --subscription $subscription --server-name $basename
az mariadb server configuration set --name 'tx_isolation' --resource-group $rg --server $basename --value 'READ-COMMITTED'

# firewall rule to allow all Azure services through
az mariadb server firewall-rule create -g $rg -s $basename -n "AllowAllWindowsAzureIps" --start-ip-address "0.0.0.0" --end-ip-address "0.0.0.0"
az mariadb server update --resource-group $rg --name $basename --ssl-enforcement Disabled
```

## Guide

Parts:
1. [Introduction]({% post_url 2020-10-14-nextcloud-azure-part-1 %})
1. [Azure App Service Linux Setup]({% post_url 2020-10-15-nextcloud-azure-part-2 %})
1. Azure Database for MariaDB Setup (this post)
1. Nextcloud Setup
1. Securing and Cleaning up the Nextcloud Install