---
layout: post
title: Nextcloud on Azure - Final Config & Cleanup (Part 5)
date: 2020-10-14
categories: azure nextcloud app-service app-service-linux
---

In order to get NextCloud working, there are a few configuration settings that need to be added/changed.  This will allow it to run on the App Service and use SSL with the database server.

There are 3 changes that we're going to be making to the config.php file.

1. Add support for SSL
1. Change the Database User credentials
1. Disable the folder permissions check

## Setup FTP

First we need to download the file so we can edit it.  If we were using the Storage Account for persistant storage you could easily download and upload from the UI.  But since we're using the App Service persistent storage, the only real way is using SFTP.

We should have already set FTP to be SFTP only, but you can check in App Serivce > Configration > General Settings.  Should look like this screenshot.

![Configure FTP]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-appservice-ftp.png' | relative_url }})

Next, navigate to App Service > Deploy Center (Preview) > FTP Section.  You'll need to grab 3 pieces of information: FTPS Endpoint, Username, and Password.

![FTP Credentials]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-appservice-ftp-credentials.png' | relative_url }})

Take those and use an SFTP client like FileZilla to connect.  Here you'll be downloading the config.php file that is in the root of your NextCloud install.  File should be located in `site/nextcloud/config.php`, relative to the home directory.

## Config.php Changes

Once you have the config.php file, you need to update the two following fields.  Right now it should have your temporary throwaway account.  It's safe to switch to your permanent credentials at this time.

```php
  'dbuser' => '{username}',
  'dbpassword' => '{password}',
```

Next add this option to the array.  It instructs NextCloud to stop checking the permissions of the folders.

```php
  'check_data_directory_permissions' => false,
```

Add this next option, which tells the NextCloud container that this certificate root is trusted.  For now just got with it, this will be explained in the next section.

```php
  'dbdriveroptions' => array(
    PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/azure/BaltimoreCyberTrustRoot.crt.pem',
  ),
```

You can upload this file back to the SFTP location and overwrite the existing file.

## Database SSL Certificate Chain

If you aren't familiar with how SSL/TLS certificate trusts work, basically each machine has a set of root certificate public keys that they trust.  Any certificates derived from the private key paired with that public key would be trusted.  Without this trust you'd see those insecure errors in your browser, but the same concept applies for server to server communication.  The Docker container needs to trust the database server, which doesn't just use a standard root certificate.

Azure Database for MariaDB uses a DigiCert certificate to secure communications.  You can read up about it from [Microsoft MariaDB SSL Connectivity Guide](https://docs.microsoft.com/en-us/azure/mariadb/howto-configure-ssl).  In that site, you need to download the "BaltimoreCyberTrustRoot.crt.pem" key.  Make sure you only download from the Microsoft Site, as this will be used to tell your Docker container it's ok to communicate with servers using this root certificate.

Once you have this file, upload it to the path `site/ca` folder.  Make sure that the file you uploaded, matches up with the filename in the config.php file referenced above.

## Startup

Startup the App Service.  Try to navigate to the site.  It should take considerably less time to startup the application, but this time you should be able to log in using the credentials you setup earlier.  You should be greeted by the default home page that you can now do any other configuration, create users, or anything else you want with your NextCloud instance.

At this point you are done with all the setup and ready to go.

1. Download the Azure Database root certificate, [link and explanation can be found here](https://docs.microsoft.com/en-us/azure/mariadb/howto-configure-ssl)), place it wherever but I put it in `etc/ssl/azmariadb`
1. Update credentials in Nextcloud `config.php` file.  Property `dbpassword` with the new password
1. Add the following to the `config.php` file (update the path to where you placed the file)

    ```php
    'dbdriveroptions' => array(
        PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/azmariadb/BaltimoreCyberTrustRoot.crt.pem',
    ),
    ```

## Cleanup

### Delete Database Account

### Setup Backups

## Guide

Parts:
1. [Introduction]({% post_url 2020-10-14-nextcloud-azure-part-1 %})
1. [App Service Setup]({% post_url 2020-10-15-nextcloud-azure-part-2 %})
1. [Database MySQL/MariaDB Setup]({% post_url 2020-10-22-nextcloud-azure-part-3 %})
1. [Nextcloud Setup]({% post_url 2020-10-25-nextcloud-azure-part-4 %})
1. [Final Configuration and Cleanup]({% post_url 2020-10-26-nextcloud-azure-part-5 %})