/* global chrome, handleMessage, registerCustomModule, registerMessageHandler */
const recordHTML = function (request, sender, sendResponse) {
  console.log("[Ad Scraper] Recording Ads for " + request.url + "...");

  if (request.content === "record_Ads") {
    const payload = {
      "url*": request.url,
      "page-title*": request.pageTitle,
      Ads: [],
    };

    chrome.Ads.getAll(
      {
        url: request.url,
      },
      function (Ads) {
        Ads.forEach(function (ad) {
          console.log(ad.name + " --> " + ad.name);
          console.log(ad);

          payload.Ads.push(ad);
        });

        if (payload.Ads.length > 0) {
          const newRequest = {
            content: "record_data_point",
            generator: "browser-Ads",
            payload: payload, // eslint-disable-line object-shorthand
          };

          handleMessage(newRequest, sender, sendResponse);
        }
      }
    );

    return true;
  }

  return false;
};

const fetchPrebid = function (request, sender, sendResponse) {
  if (request.content === "fetch_prebid") {
    console.log("[Ad Scraper] Fetching prebid for " + request.url + "...");

    const tabId = sender.tab.id;
    const frameId = sender.frameId;

    return chrome.scripting
      .executeScript({
        target: {
          tabId,
          frameIds: [frameId],
        },
        world: "MAIN",
        func: function () {
          const findAndReturnPrebid = function () {
            // possible prebid variable names
            const prebidNames = ["pbjs", "owpbjs", "fsprebid"];

            for (const name of prebidNames) {
              // when found the prebid variable, return the object and any required function calls
              if (window[name] !== undefined) {
                const prebid = window[name];

                return {
                  prebid: prebid,
                  config: prebid.getConfig(),
                  bid_responses: prebid.getBidResponses(),
                  winning_bids: prebid.getAllWinningBids(),
                  all_winning_bids: prebid.getAllPrebidWinningBids(),
                };
              }
            }

            return null;
          };

          try {
            const result = findAndReturnPrebid();

            return {
              prebid: result,
            };
          } catch (e) {
            // ignore CSP errors
            console.warn("[Ad Scraper] eval error", e);
          }

          return {
            prebid: null,
          };
        },
      })
      .then((response) => {
        sendResponse(response[0].result);
      });
  }

  return false;
};

registerCustomModule(function (config) {
  console.log("[Ad Scraper] Service worker initialized.");
  registerMessageHandler("Ad_scraper", recordHTML);
  registerMessageHandler("fetch_prebid", fetchPrebid);
});

async function iframeImageCapture(details) {
  const responseHeaders = {};
  const requestHeaders = {};
  for (const header of details.responseHeaders) {
    responseHeaders[header.name.toLowerCase()] = header.value.toLowerCase();
  }

  if (!requestHeaders["HEADER_NAME"]) return;

  // response content should be an image
  if (!responseHeaders["content-type"] || !responseHeaders["content-type"]?.includes("image"))
    return;
  // response content should be at least 1000 bytes to avoid tracking pixels
  if (!responseHeaders["content-length"] || responseHeaders["content-length"] < 1000) return;

  // sub_frame indicates the content is definitely inside an iframe which is very likely an ad
  // some contents in the iframe appears to be sub_frame
  if (details.frameType !== "sub_frame") {
    // checking parameters that can be used to identify an iframe
    if (!(responseHeaders["cross-origin-resource-policy"] || responseHeaders["x-xss-protection"]))
      return;
  }

  console.log(`Completed Message: at ${new Date(details.timeStamp)}`);
  console.log({
    url: details.url,
    requestId: details.requestId,
    frameType: details.frameType,
    tab: await chrome.tabs.get(details.tabId),
  });
}

// ########## START: request/redirect capture ##########
// dictionary to store all tabs and their urls
const tabLookup = {};

// first time initialization: it will populate the dictionary with all current tabs and their urls
chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    tabLookup[tab.id] = tab.url;
  }
});

// when a tab is created, it will be added to the dictionary if it is a new tab
chrome.tabs.onCreated.addListener((tab) => {
  if (
    tab.url.replaceAll("/", "") === "chrome:newtab" ||
    tab.pendingUrl?.replaceAll("/", "") === "chrome:newtab"
  )
    if (!tabLookup[tab.id]) tabLookup[tab.id] = null;
});

// remove the tab from the dictionary when it is closed
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  setInterval(() => {
    delete tabLookup[tabId];
  }, 1000);
});

// a set of domains where changing path does not trigger a request
const tabUpdateSet = new Set();
tabUpdateSet.add("www.npr.org");
tabUpdateSet.add("duckduckgo.com");
tabUpdateSet.add("www.youtube.com");

setInterval(() => {
  chrome.tabs.query({}, async (tabs) => {
    for (const tab of tabs) {
      await sleep(1000);
      if (tab.id in tabLookup) {
        if (tab.status === "complete" && tabLookup[tab.id] !== tab.url) tabLookup[tab.id] = tab.url;
      } else {
        tabLookup[tab.id] = tab.url;
      }
    }
  });
}, 3000);

// some websites does not send a request when the path has been changed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tabLookup[tabId]) return;

  const previewsUrl = new URL(tabLookup[tabId]);
  const currentUrl = new URL(tab.url);

  if (tabUpdateSet.has(previewsUrl.hostname) && previewsUrl.hostname === currentUrl.hostname) {
    tabLookup[tabId] = tab.url;
    return;
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
chrome.webRequest.onCompleted.addListener(
  async function (details) {
    let tab = null;
    let newTabRedirect = false;
    let sameTabRequest = false;
    let recordTime = null;
    let maxIterations = 5;
    do {
      await sleep(1000);
      tab = await chrome.tabs.get(details.tabId);
      if (tab.id in tabLookup) {
        sameTabRequest = true;
        recordTime = new Date();
      }
      if (tab.openerTabId && !(tab.id in tabLookup)) {
        newTabRedirect = true;
        recordTime = new Date();
      }
    } while (tab.status !== "complete" && maxIterations-- > 0);

    if (sameTabRequest) {
      // response url is the same as the url in the dictionary means the request is a refresh
      if (details.url === tabLookup[tab.id]) return;
      console.log(`[Ad Redirect] Capturing redirect at ${recordTime}`);
      // PAYLOAD TO SEND
      const payload = {
        datetime: recordTime,
        originalUrl: tabLookup[tab.id],
        destinationUrl: details.url,
      };
      console.log(payload);
    }

    tabLookup[tab.id] = tab.url;

    if (newTabRedirect) {
      console.log(`[Ad Redirect] Capturing redirect at ${recordTime}`);
      // PAYLOAD TO SEND
      const payload = {
        datetime: recordTime,
        originalUrl: tabLookup[tab.openerTabId],
        destinationUrl: details.url,
      };
      console.log(payload);
    }
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame"],
  },
  ["responseHeaders"]
);

// ########## END: request/redirect capture ##########
// ########## START: image URL capture ##########
const allowedSites = new Set();
allowedSites.add("www.npr.org");
allowedSites.add("www.nytimes.com");
allowedSites.add("www.washingtonpost.com");
allowedSites.add("www.cnn.com");
allowedSites.add("www.foxnews.com");
allowedSites.add("www.foxbusiness.com");
allowedSites.add("www.bbc.com");
allowedSites.add("www.reuters.com");
allowedSites.add("www.washingtonpost.com");
allowedSites.add("www.wsj.com");
allowedSites.add("www.nbcnews.com");

chrome.webRequest.onResponseStarted.addListener(
  async function (details) {
    if (details.tabId < 0) {
      return;
    }

    let tabInfo = await chrome.tabs.get(details.tabId);
    try {
      const currentUrl = new URL(tabInfo.url);
      if (!allowedSites.has(currentUrl.hostname)) return;
    } catch (e) {
      let maxIterations = 10;
      while (tabInfo.status !== "complete" && maxIterations-- > 0) {
        await sleep(1000);
        tabInfo = await chrome.tabs.get(details.tabId);
      }

      if (!allowedSites.has(new URL(tabInfo.url).hostname)) return;
    }

    const responseHeaders = {};

    for (const header of details.responseHeaders) {
      responseHeaders[header.name.toLowerCase()] = header.value.toLowerCase();
    }

    // response content should be an image
    if (!responseHeaders["content-type"] || !responseHeaders["content-type"]?.includes("image")) {
      return;
    }
    // response content should be at least 1000 bytes to avoid tracking pixels
    if (!responseHeaders["content-length"] || responseHeaders["content-length"] < 1000) {
      return;
    }

    // sub_frame indicates the content is definitely inside an iframe which is very likely an ad
    // some contents in the iframe appears to be sub_frame
    if (details.frameType !== "sub_frame") {
      // checking parameters that can be used to identify an iframe
      if (
        !(responseHeaders["cross-origin-resource-policy"] || responseHeaders["x-xss-protection"])
      ) {
        return;
      }
    }

    const responseUrl = new URL(details.url);
    const responseUrlParts = responseUrl.hostname.split(".");
    const url = new URL((await chrome.tabs.get(details.tabId)).url);
    const name = responseUrlParts[responseUrlParts.length - 2];
    for (const part of url.hostname.split(".")) {
      if (part.includes(name)) return;
      if (name.includes(part)) return;
    }

    for (const site of Array.from(allowedSites)) {
      for (const part of site.split(".")) {
        if (part.includes(name)) return;
        if (name.includes(part)) return;
      }
    }
    console.log(`Completed Message: at ${new Date(details.timeStamp)}`);

    // PAYLOAD TO SEND
    const adPayload = {
      url: details.url,
      requestId: details.requestId,
      frameType: details.frameType,
      tab: tabInfo,
      raw: details,
    };

    console.log(adPayload);
  },
  {
    urls: ["<all_urls>"],
  },
  ["responseHeaders", "extraHeaders"]
);

// ########## END: image URL capture ##########
