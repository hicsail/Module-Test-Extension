window.registerModuleCallback(prebidScraper);

function prebidScraper() {
  window.onload = () => {
    setTimeout(() => {
      console.log(`PREBID: ${window.pbjsObj}`);
      console.log(`OWPBID: ${window.owpbjsObj}`);
      console.log(`FSPREBID: ${window.fsprebidObj}`);
      const prebid = window.pbjsObj ?? window.owpbjsObj ?? window.fsprebidObj;
      if (!prebid) return;

      const adsRecords = new Set();
      adsRecords.clear();
      adsContainedByPrebid(prebid, adsRecords);
    }, 5000);
  };
}

function adsContainedByPrebid(prebid, adsRecords) {
  const prebidSlots = Object.values(prebid.getBidResponses());
  for (const slot of prebidSlots) {
    for (const bid of slot?.bids) {
      if (adsRecords.has(bid.adId)) {
        continue;
      }

      adsRecords.add(bid.adId);

      const adItem = {
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adId: bid.adId,
        auctionId: bid.auctionId,
        bidder: bid.bidder,
        advertiser: bid?.meta?.advertiserDomains[0],
        currency: bid.currency,
        mediaType: bid.mediaType,
        adHeight: bid.height,
        adWidth: bid.width,
      };

      sendMsg(adItem);
    }
  }
}
