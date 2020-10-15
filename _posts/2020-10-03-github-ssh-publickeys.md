---
layout: post
title: Github Public Keys for SSH Auth
date: 2020-10-03
categories: bash
---

If you are like me the first thing you do after setting up a new Linux server is setup your ssh keys so you can login with them.  Ubuntu has it built into the installer where it will pull it down during setup (which is what gave me the idea).  This script pulls down your public keys from your Github profile and puts them on the server for you.

Just replace `{username}` with your Github username and run the comands.

```bash
curl https://api.github.com/users/{username}/keys | grep '"key"' | sed 's/^.*\(ssh-rsa .*\)\"$/\1/' >> ~/.ssh/authorized_keys
chmod 0600 ~/.ssh/authorized_keys
```