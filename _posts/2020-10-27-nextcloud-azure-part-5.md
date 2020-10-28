---
layout: post
title: Nextcloud on Azure - Final Config & Cleanup (Part 5)
date: 2020-10-27
categories: azure nextcloud app-service app-service-linux
---

Welcome to the last part of this series on setting up NextCloud.  In order to get NextCloud working, there are a few configuration settings that need to be added/changed.  This will allow it to run on the App Service and use SSL with the database server.

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

Take those and use an SFTP client like FileZilla to connect.  Here you'll be downloading the config.php file that is in the root of your NextCloud install.  File should be located in `/site/nextcloud/config/config.php`, relative to the home directory.

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

If you aren't familiar with how SSL/TLS certificate trusts work, basically each machine has a set of root certificate public keys that they trust.  Any certificates derived from the private key paired would be trusted.  Without this trust you'd see those insecure errors in your browser when browsing a website, but the same concept applies for server to server communication.  The Docker container needs to trust the database server, which doesn't just use a default root certificate.

Azure Database for MariaDB uses a DigiCert certificate to secure communications.  You can read up about it from [Microsoft MariaDB SSL Connectivity Guide](https://docs.microsoft.com/en-us/azure/mariadb/howto-configure-ssl).  In that site, you need to download the "BaltimoreCyberTrustRoot.crt.pem" key.  Make sure you only download from the Microsoft Site, as this will be used to tell your Docker container it's ok to communicate with servers using certificates from this root certificate.

Once you have this file, upload it to the path `/site/ca` folder.  Make sure that the file you uploaded, matches up with the filename in the config.php file referenced above.

## Startup

Startup the App Service.  Try to navigate to the site.  It should take considerably less time to startup the application, but this time you should be able to log in using the credentials you setup earlier.  You should be greeted by the default home page that you can now do any other configuration, create users, or anything else you want with your NextCloud instance.

At this point you are done with all the setup and ready to go.

## Cleanup

Just a couple of things to clean up and you'll be good to go. 

### Delete Database Account

If you created the throw away account, delete it.  No reason to keep it around as it's a security vulnerability at this point.  Just connect back into the database server and execute this command:

```
DROP USER 'temp';
```

Or if you went with the admin username/password, you can reset that through the Azure Portal UI.  In the database overview page, with the red box in the screenshot below.

![Azure Database for MariaDB Password Reset]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/cleanup-database-passwordreset.png' | relative_url }})

### Scale Down App Service Plan

Just to save some time and headache, we originally spun up the App Service Plan as a P1V2 but it runs for about ~$80/month.  Once NextCloud is spun up you can scale it down to save some money.  From what I noticed, basic tier (B1, ~$14/month) vs P1V2 perform very similarly (presumably with low usage).  Peronally, my opinion is that the compute isn't the bottleneck, but it's the IO to the persistent storage.  You can see this by spinning up a plain App Service with NextCloud and persistent storage turned off, it runs pretty fast even in B1.

### Setup Backups

I'm not going to walk through this part, as I think it's fairly straight forward.  You probably want to have some backups of your NextCloud config files that are stored on the App Service persistent storage.  I recommend setting it up so backups go to your storage account on regular intervals, from there it's much easier to handle your files.

Note that backups requires at least an S1 tier App Service Plan or higher, if you follow my instructions about scaling down backups might not be a possibility.

## Conclusion

This was a bit of a learning experience for me, I've had some experience setting up some basic App Service containers, but this one took it to the next level.  The persistent storage appears to be quite the bottleneck (whether using App Service persistent or Storage Account File Share).

While it appears that App Services work pretty well for simple applications (or custom ones) just fine, for something a bit more involved, it takes a little bit of doing to get it working.  All in all, performance on B1 is acceptable, it's relatively cheap, includes SSL termination (and a free custom domain cert!).  I think App Services have come a long way since I started using them, I think it could be better in some aspects (looking at the logging) but I got it to eventually work and has little maintenance.

Happy Next Clouding!

## Guide

Parts:
1. [Introduction]({% post_url 2020-10-14-nextcloud-azure-part-1 %})
1. [App Service Setup]({% post_url 2020-10-15-nextcloud-azure-part-2 %})
1. [Database MySQL/MariaDB Setup]({% post_url 2020-10-22-nextcloud-azure-part-3 %})
1. [Nextcloud Setup]({% post_url 2020-10-26-nextcloud-azure-part-4 %})
1. [Final Configuration and Cleanup]({% post_url 2020-10-27-nextcloud-azure-part-5 %})