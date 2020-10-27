---
layout: post
title: Nextcloud on Azure - NextCloud Setup (Part 4)
date: 2020-10-26
categories: azure nextcloud
---

Welcome to part 4 of the guide to get NextCloud setup.  You should have all of the necessary infrastructure setup and now we should be ready to startup the App Serivce and configure NextCloud.  Going to just note that since there is a minor lack of full logging, it's going to be a little bit of a sit and wait game because NextCloud writes a bunch of files and gets a lot of stuff setup.

In part 2, I talked about how much slower the persistent storage is compared to the App Service local.  This plays a significant role in setup time, obviously the slower the storage is, the longer it takes to do the initial setup (and by extension the subsequent using of the service) no matter the performance level you pick.

## Setup

Before we start running the setup, let's startup the App Service.  You can either do it the Azure Portal UI, or by PowerShell script up to you.

The `Start` button on App Service Overview page.  You'll probably want to get into the UI anyways, for some of the upcoming steps.

![App Service Startup]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-appservice-start.png' | relative_url }})

Or this script

```powershell
$subscription = '{subscription guid here}'
$rg = 'nextcloud'
$basename = 'nextcloud-{uniquename}'
az webapp stop --name $basename --resource-group $rg --subscription $subscription
```

Now that the App Service is started up, you'd think it would just start chugging away, right?  The obvious answer is wrong, the first time you run the application it doesn't do anything until it gets the first request.  ANYTHING...it doesn't even start loading the docker container image either.

If you look into your App Service logs right now, it should show you either "Loading...." or a box, like in this screenshot below.

![App Service Empty Logs]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-appservice-container-logs-empty.png' | relative_url }})

But if you open up the url (should be in the format of https://{app service name}.azurewebsites.net) you'll start to see the logs light up with activity.  It'll start downloading the container, spinning it up, etc.  It'll eventually report that the container is ready but still the page is loading, this is normal for this install.

![App Service Container Logs]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-appservice-container-logs.png' | relative_url }})

Even though the logs aren't showing any new infromation, as long as your page is still trying to load it's doing work in the background.  Best I can gather it's writing all the necessary files and folders into the persistent storage, setting up the database, and whatever else setup entails.  Depending on the performance level you picked, this should go on for ~5 minutes on P1V2, it's a bit slower on Basic, and not much faster on P2V2.

Eventually it'll chug along until you get this a 502 error.  Don't worry it's not broken, I'm not entirely sure what causes it, but judging by the error message the web server that is acting as a reverse proxy to your container didn't get a response and assumed something went wrong.  Note if you look at the container logs (or the log stream) you won't see any errors.

![Startup 502 Error]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/start-502error.png' | relative_url }})

Simply try to open the page up again in your browser and it should start to spin again.  Give it another minute or two and the setup page should show up.

![Initial Setup Page]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-initialpage.png' | relative_url }})

If you try to continue with SSL turned on the database server, you would see this error.  Luckily we've already turned it off so you shouldn't have to worry about it.  But if you do, go turn off SSL required on the database server.

![SSL Error]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-dbsslerror.png' | relative_url }})

Go through the setup wizard by creating your administrative credentials, and setup the database connection to the Maria DB instance we spun up in part 2.  If you created it, make sure to use the throw away account.

Once you finish the wizard you are going to see one more error.  The permissions where the NextCloud data is stored is too open for NextCloud.  Because we're using an App Service there isn't a whole lot you can do about folder permissions, but it's fine because the processes are isolated and you shouldn't really need to worry about permissions because no other apps are running on the App Service instance.

![Setup Directory Permissions]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/setup-directorypermissions.png' | relative_url }})

In order to get around this we're going to have to modify the config.php file.  First thing we'll need to do is stop the App Service.  The final configuration will be in part 5.

## Guide

Parts:
1. [Introduction]({% post_url 2020-10-14-nextcloud-azure-part-1 %})
1. [App Service Setup]({% post_url 2020-10-15-nextcloud-azure-part-2 %})
1. [Database MySQL/MariaDB Setup]({% post_url 2020-10-22-nextcloud-azure-part-3 %})
1. [Nextcloud Setup]({% post_url 2020-10-26-nextcloud-azure-part-4 %})
1. [Final Configuration and Cleanup]({% post_url 2020-10-27-nextcloud-azure-part-5 %})