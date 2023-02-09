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
