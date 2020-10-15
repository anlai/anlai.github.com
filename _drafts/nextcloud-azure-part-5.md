---
layout: post
title: Nextcloud on Azure Cleanup (Part 5)
date: 
categories: azure nextcloud
---


1. Download the Azure Database root certificate, [link and explanation can be found here](https://docs.microsoft.com/en-us/azure/mariadb/howto-configure-ssl)), place it wherever but I put it in `etc/ssl/azmariadb`
1. Update credentials in Nextcloud `config.php` file.  Property `dbpassword` with the new password
1. Add the following to the `config.php` file (update the path to where you placed the file)

    ```php
    'dbdriveroptions' => array(
        PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/azmariadb/BaltimoreCyberTrustRoot.crt.pem',
    ),
    ```