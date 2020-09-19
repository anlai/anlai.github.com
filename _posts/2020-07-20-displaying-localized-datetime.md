---
layout: post
title: "Displaying Localized Date Time Values"
date: 2020-07-20
categories: javascript html
---

I've spent years messing around with different ways to deal with localization and I was never really happy with any solution.  Early on in my career (like a lot of developers), I learned the to not ever ever ever ever (enough evers?) use localized datetime values to store in the database and just use UTC.  Shockly I still see this all too regularly, with people asking "what do we do now that we're moving servers from one data center to another?"  Relying on the datetime of the server is just trouble waiting to happen.

The challenge I see the most is that records are timestamped, and generally just use something like DateTime.UtcNow() (in C#) in order to generate.  But when these values are displayed to the user, UTC isn't exactly user friendly.

## Server Side Solution

A lot of my past projects would have a configuration setting for timezone (or in multi-tenant situations a timezone config per tenant) and all you would need to do is convert server side.  It's simple enough to solve this problem (assuming you can just use a config setting for a timezone) and depending on language is probably a few extra lines of code per time you need to output it.

But you can kind of already see the problems, right?
- Every time you get from the database to output to a user, you need to convert from UTC to local.
- You need to know the timezone, so get that too each time.
- The timezone is basically fixed for all users (or for that tenant).
- Missed converting time somewhere?  No one will spot it for a while, it could just be a simple couple hours off (or a lot really depends on your timezone).
- Have a small population of a tenant in a different timezone than the configuration setting?  They'll be doing the math to convert in their heads constantly.

What this really doesn't solve for is if you have an application where the audience is anywhere in the world and knowing the datetime for that user makes a difference.  Think of say announcing a maintenance window of an application, if you just say 10PM tomorrow, who would actually know when that is?

## Client Side Solution

I don't know that I've seen a lot of suggestions to tackle this problem on the client side.  Maybe it's a lack of imagination on my part on what could go wrong?

The solution I've come up with is pretty simple.  You do zero server side processing (makes even more sense when you are doing an API) everything leaving the server stays in UTC.  Now all you need to do is drop the datetime value in ISO 8601 format for UTC and have the browser do the conversion to the clients timezone.

This is a properly formatted UTC string that the script expects.
<span>2020-09-19T05:12:32Z</span>

This value is converted using the script below.  It should show the above datetime and localized for your specific timezone.
<span class="localize-datetime">2020-09-19T05:12:32Z</span>

Taking C# Razor as an example, you would just output a datetime like this (assuming a variable called startDate):

```razor
<div class="localize-datetime">
@startDate.ToString("o");
</div>
```

Then the script below will execute on page load and convert all the objects with the class "localize-datetime".

<script src="https://gist.github.com/anlai/3fd9ce1bfcb7919522508cf846eec782.js"></script>
<script type="text/javascript" src="https://gitcdn.link/repo/anlai/3fd9ce1bfcb7919522508cf846eec782/raw/e6df0e369c4bb17f3908ee01025296c8ff997cf5/localize-datetime.js"></script>