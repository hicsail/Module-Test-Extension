window.registerModuleCallback(prebidScraper);

const adsLocators = {
  "www.cnn.com": cnnLocator,
  "www.reuters.com": reutersLocator,
  "www.bbc.com": bbcLocator,
  "www.bbc.co.uk": bbcLocator,
  "www.npr.org": nprLocator,
  "www.foxnews.com": foxLocator,
  "www.foxbusiness.com": foxLocator,
  "www.nbcnews.com": nbcLocator,
};

async function prebidScraper() {
  if (!(window.location.host in adsLocators)) return;

  console.log("[Ad Scraper] Looking for ads in " + window.location.href);

  const adsRecords = new Set();

  const fetchAndScrape = (records) => {
    chrome.runtime.sendMessage(
      {
        content: "fetch_prebid",
      },
      function (response) {
        const prebid = response.prebid;

        if (prebid) {
          adsContainedByPrebid(Object.values(prebid.bid_responses), records);
          adsContainedByPrebid(prebid.winning_bids, records, false);
          adsContainedByPrebid(prebid.all_winning_bids, records, false);
        }
      }
    );
  };

  window.onload = () => {
    // perform scrape upon page load
    fetchAndScrape(adsRecords);

    // perform scrape every 10 seconds
    setInterval(fetchAndScrape(adsRecords), 10000);
  };
}

// general ads content scraper
function adsContainedByPrebid(prebidSlots, adsRecords, bidResponse = true) {
  const bidContentScraper = (bids) => {
    for (const bid of bids) {
      if (adsRecords.has(bid.adId)) continue;

      adsRecords.add(bid.adId);
      const adItem = {
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adId: bid.adId,
        auctionId: bid.auctionId,
        locationCode: bid.adUnitCode,
        location: adsLocators[window.location.host](bid.adUnitCode),
        bidder: bid.bidder,
        advertiser: bid?.meta?.advertiserDomains?.length
          ? bid.meta.advertiserDomains[0]
          : null,
        mediaType: bid.mediaType,
        adHeight: bid.height,
        adWidth: bid.width,
      };

      console.log(adItem);
    }
  };

  if (!bidResponse) {
    bidContentScraper(prebidSlots);
    return;
  }
  for (const slot of prebidSlots) {
    bidContentScraper(slot?.bids);
  }
}

// location identifiers
function cnnLocator(adUnitCode) {
  switch (adUnitCode.replaceAll(/[0-9]/g, "")) {
    case "ad_bnr_atf_":
      return "top banner";
    case "ad_ns_atf_":
      return null;
    case "ad_nat_btf_":
      return "inline";
    case "ad_rect_atf_":
      return "side vertical";
    case "ad_rect_btf_":
      return "side vertical";
    default:
      return null;
  }
}

function reutersLocator(adUnitCode) {
  switch (adUnitCode.replaceAll(/[0-9]/g, "")) {
    case "reuters_desktop_leaderboard_atf":
      return "top banner";
    case "reuters_desktop_right_rail_":
      return "side vertical";
    case "reuters_desktop_native_":
      return "inline";
    default:
      return null;
  }
}

function bbcLocator(adUnitCode) {
  switch (adUnitCode) {
    case "dotcom-slot-leaderboard":
      return "top banner";
    case "dotcom-slot-mpu":
      return "side vertical";
    default:
      return null;
  }
}

function nprLocator(adUnitCode) {
  switch (adUnitCode) {
    case "ad-backstage-":
      return "inline";
    case "ad-secondary-":
      return "inline";
    case "ad-standard-":
      return "side vertical";
    default:
      return null;
  }
}

function foxLocator(adUnitCode) {
  const suffix = adUnitCode.split("-").pop();
  if (suffix === "lb1") return "top banner";

  switch (suffix.replaceAll(/[0-9]/g, "")) {
    case "lb":
      return "inline";
    case "ban":
      return "side vertical";
    default:
      return null;
  }
}

function nbcLocator(adUnitCode) {
  switch (adUnitCode.replaceAll(/[0-9]/g, "")) {
    case "div-gpt-topbanner-":
      return "top banner";
    case "div-gpt-boxflex-":
      return "side vertical";
    default:
      return null;
  }
}
