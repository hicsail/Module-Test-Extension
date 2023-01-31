# AdScraper 
### (This README is temp and should be deleted before merging)

## Overview
This module scrapes advertisements appering in Google Search and Amazon Search, both with and without image components.
It scrapes Product Name, Supplier Name, Image URL and Image Size, while it is currently not scraping the Image position(x, y).

## Getting Started
1) Clone this repository:
<pre>
git clone https://github.com/Snafkin547/Module-Test-Extension.git
</pre>

2) Update submodules (cookies and screenshot)
<pre>
git submodule update --init --recursive
</pre>


## Workflow

This whole respository acts as a harness to ship the codde out to be readily usable as an extension.

1) Put scraper code (the code with `.querySelectorAll('xxx')` in <a href="https://github.com/Snafkin547/Module-Test-Extension/blob/AD_scraper/modules/AdScraper/js/content.js">content.js</a>

2) Put sender code (which sends collected data to the DB) in <a href="https://github.com/Snafkin547/Module-Test-Extension/blob/AD_scraper/modules/AdScraper/js/worker.js">worker.js </a>

3) At the root directory, run `python3 package_chrome.py` and unzip a produced file (chrome-extension.zip) in the root directory

4) Upload the unzipped folder by opening "chrome://extensions/" or following the steps below:

<ul>

<Step1>

![image](https://user-images.githubusercontent.com/62607343/207383200-c0599d5c-afbe-4905-8968-33c4f03be86e.png)


<Step2>

![image](https://user-images.githubusercontent.com/62607343/207383385-cf3cbc16-852d-4030-80ed-99e886f2b4d6.png)

</ul>

## Remaining Tasks

<li> Scraping Recommended based on your browsing history
<li> Scraping Products related to this search
<li> Scraping horizontal banner at the bottom

<li> Send collected data to the background worker
<li> Build the background worker to send the data to the DB

<li> Test
 
## Completed Features

<li> Google Search Ads banner without Photos
<li> Google Search Ads banner with Photos  

<li> Amazon Ads at the top container
<li> Amazon Ads at the bottom container  
<li> Amazon Ads inside the search reult (No product supplier name)
<li> Amazon Ads big section betweem the search reult
  
