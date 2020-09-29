---
layout: post
title: Github Public Keys for SSH Auth
date: 2020-09-15
categories: bash
---



```bash
curl https://api.github.com/users/{username}/keys | grep '"key"' | sed 's/^.*\(ssh-rsa .*\)\"$/\1/' >> ~/.ssh/authorized_keys
chmod 0600 ~/.ssh/authorized_keys
```