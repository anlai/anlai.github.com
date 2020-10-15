---
layout: post
title: Nextcloud on Azure Database MySQL/MariaDB with SSL (Part 3)
date: 
categories: azure azure-database azure-mariadb
---

This installment will talk about the database we're going to use for NextCloud.  There are technically a few options available to you but given how we setup NextCloud on App Service, SQLite is definietly not an option (not that it would even be advisable anyways).  Which leaves three options: MySQL, MariaDB, and PostgreSQL.  Luckily for me Azure offers all 3, so lucky, right?

I decided to use the managed database Azure Database for MariaDB.  It's pretty nice spin up the database server and database, and you are on your way.  No installing an OS, doing updates, or installing the database from scratch.  Just a few commands and you are kinda good.

## Security

When the database is setup, it's pretty secure by default (at least I really hope it is).  There are still a few more things to deal with to get things squared away, but there is one feature that I wouldn't turn off since all traffic will be out on "public networks".

SSL encryption, if you really aren't aware it secures your communication with the database server from NextCloud app server.  Using SSL enabled MySQL/MariaDB you would kind of assume should be straight forward.  Not so much.  If you try to setup Nextcloud with a database that has SSL enabled it apparently chokes and there isn't really a way to fix that.

NextCloud needs to be setup with SSL disabled, then manually reenable SSL.  It appears the biggest problem that SSL doesn't work is that the container doesn't trust the Azure Database certificate chain.  So as a mitigation, we'll either use a throwaway account or reset the password immediately after setup.

## Deployment

At a highlevel these are the steps we'll take to get this deployed:

1. Deploy Azure Database for MariaDB server
1. Create the database
1. Turn off SSL
1. Setup NextCloud
1. Turn on SSL
1. Reset MariaDB user account (or drop the throwaway account)
1. Configure NextCloud for SSL and update credentials
1. Restart everything
1. Profit?

### Deploy the Database

```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
$location = 'westus'

$dbname = 'nextcloud'
$dbusername = ''
$dbpassword = ''

az mariadb server create --name $basename --resource-group $rg --sku-name 'B_Gen5_1' --admin-user $dbusername --admin-password $dbpassword --location $location --subscription $subscription --ssl-enforcement Disabled
az mariadb db create --name $dbname --resource-group $rg --subscription $subscription --server-name $basename
az mariadb server configuration set --name 'tx_isolation' --resource-group $rg --server $basename --value 'READ-COMMITTED'

# firewall rule to allow all Azure services through
az mariadb server firewall-rule create -g $rg -s $basename -n "AllowAllWindowsAzureIps" --start-ip-address "0.0.0.0" --end-ip-address "0.0.0.0"
az mariadb server update --resource-group $rg --name $basename --ssl-enforcement Disabled
```
At this point your database and is configured and you are more or less ready to go.  You can take the additional steps to create a throwaway account if you want.

### Database Accounts (optional)

You can use the admin credentials defined in the last step, but I wouldn't recommend it.  You should create two accounts and throwaway and a NextCloud account.  Easiest way to do this is to open up a cloud shell in Azure and use the following command [Microsoft documentation on MySQL using Cloud Shell](https://docs.microsoft.com/en-us/azure/mariadb/tutorial-design-database-cli#use-azure-cloud-shell):

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

## Guide

Parts:
1. Introduction (this post)
1. Azure App Service Linux Setup
1. Azure Database for MariaDB Setup
1. Nextcloud Setup
1. Securing and Cleaning up the Nextcloud Install



What this really means though, is that if you are using a cloud hosted instance (or just have some public network between servers) your credentials might as well be considered compromised after setup.  In order to setup Nextcloud wtih SSL I recommend the follwing steps:

1. Turn of SSL on the database instance
1. Setup Nextcloud through the wizard
1. Once completed, immediately shut off Nextcloud
1. Log into the database and change the password (you can also use a temp user and drop it at this step)

1. Turn on SSL on the database instance
1. Restart your Nextcloud instance
1. $$$