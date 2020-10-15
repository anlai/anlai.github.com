---
layout: post
title: NextCloud on Azure (PaaS) - Part 1
date: 2020-10-14
categories: azure app-service app-service-linux docker nextcloud mariadb
---

Want to run a pretty slow instance of Nextcloud in the cloud? But for cheap-ish?

I originally set off to learn about Nextcloud to see what was so great about it.  Then I wanted it in the cloud so I could access it anywhere, well now I've learned a pretty bad way to setup it up and an ok way to set it up.  I've been learning more and more about Azure App Service Linux, so why not?

This is what the overall solution looks like.  It uses all managed services, should have zero maintenance for me, and uses SSL to secure endpoints (including between the app and the database, yes i'm a little surprised this needed to be said).

![Solution Architecture Image]({{ '/assets/images/posts/2020/10/nextcloud-appservicelinux/nextcloud-arch.png' | relative_url }})

Services that will be used in the solution:
- Linux App Service Plan (B1 minimum, P1V2 recommended)
- App Service Linux (containers)
- Storage Account v2
- Azure Database for MariaDB

With this setup, looking at ~$45/month + storage costs.  While yes it's a lot more than paying a few bucks a month to Microsoft or Google, apparently this is popular because privacy.

## Nextcloud

Nextcloud itself is kind of neat, it's got tons of features (most of which I probably won't even use).  If you don't know what it is here is their website [https://nextcloud.com](https://nextcloud.com), but you are probably reading this because you know.

Ordinarily you need to have 3 things to run Nextcloud: web server, database, and storage.  You also have 3 options when running Nextcloud: SQLite, MySQL/MariaDB, and PostgreSQL.  Because I'm trying to run it on fully managed services and I have an affinity for Azure, I ended up with the above services.  

MariaDB was a choice, Azure has other managed offerings for MySQL and PostgreSQL as well.  There are some settings that are specific to MariaDB security wise, so if you opt for one of the others you may need to figure out securing the connection on your own.

## Guide

Below are the parts, that I'll update the links as I make each new post.

Parts:
1. Introduction (this post)
1. Azure App Service Linux Setup
1. Azure Database for MariaDB Setup
1. Nextcloud Setup
1. Securing and Cleaning up the Nextcloud Install
1. Summary Script for the Lazy