window.registerModuleCallback(yahooScraper);

function yahooScraper() {
  if (
    document.location.host !== "search.yahoo.com" &&
    document.location.host !== "images.search.yahoo.com"
  )
    return;

  window.onload = function () {
    yahooAllTabAdsWithoutPhoto();
    yahooAllTabAdsWithPhoto();
    yahooImageTabAdsWithoutPhoto();
    yahooImageTabAdsWithPhoto();
  };
}

/**
 * Yahoo search at "all" tab: Scraping ads without photo
 */
function yahooAllTabAdsWithoutPhoto() {
  if (document.location.host !== "search.yahoo.com") return;

  const itemList = document.querySelectorAll("div.ads:not(.pla)");
  for (const item of itemList) {
    const adsDescription = item.querySelector("h3.title")?.textContent;
    const supplier = item.querySelector("span.ad-domain").textContent;
    const productURL = item.querySelector("a")["href"];

    const adsItem = {
      asin: extractAsinFromUrl(productURL),
      content: "records_ads",
      url: window.location.href,
      host: window.location.host,
      pageTitle: document.title,
      adsDescription,
      supplier,
      productURL,
      currentPrice: null,
      originalPrice: null,
      imgURL: null,
      imgBASE64: null,
      imageHeight: null,
      imageWidth: null,
      videoPreview: null,
      videoURL: null,
    };

    sendMsg(adsItem);
  }
}

/**
 * Yahoo search at "all" tab: Scraping ads with photo
 */
function yahooAllTabAdsWithPhoto() {
  const adsContainers = document.querySelectorAll("ul.compProductList");
  for (const adsContainer of adsContainers) {
    const itemList = adsContainer.querySelectorAll("li[class*=bcapla]");
    for (const item of itemList) {
      const infoContainer = item.querySelector("div.text");
      const adsDescription = infoContainer.querySelector("div.first").textContent;
      const supplier = infoContainer.querySelector("div.seller, div.adsSeller")?.textContent.trim();
      const productURL = item.querySelector("a")["href"];
      const currentPriceNode = item.querySelector("div.current-price");
      const originalPriceNode = item.querySelector("div.origin-price");
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: currentPriceNode
          ? Number(currentPriceNode.textContent.replaceAll(/[^0-9^\.]/g, ""))
          : null,
        originalPrice: originalPriceNode
          ? Number(originalPriceNode.textContent.replaceAll(/[^0-9^\.]/g, ""))
          : null,
        imgURL,
        imgBASE64,
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview: null,
        videoURL: null,
      };

      sendMsg(adsItem);
    }
  }
}

/**
 * Yahoo search at "images" tab: Scraping ads without photo
 */
function yahooImageTabAdsWithoutPhoto() {
  if (document.location.host !== "images.search.yahoo.com") return;

  const adsContainers = document.querySelectorAll("div.ads:not(.pla)");
  for (const adsContainer of adsContainers) {
    const itemList = adsContainer.querySelectorAll("li");
    for (const item of itemList) {
      const adsDescription = item.querySelector("span.tt").textContent;
      const supplier = item.querySelector("span.ht").textContent;
      const productURL = item.querySelector("a")["href"];

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: null,
        originalPrice: null,
        imgURL: null,
        imgBASE64: null,
        imageHeight: null,
        imageWidth: null,
        videoPreview: null,
        videoURL: null,
      };

      sendMsg(adsItem);
    }
  }
}

/**
 * Yahoo search at "images" tab: Scraping ads with photo
 */
function yahooImageTabAdsWithPhoto() {
  const adsContainers = document.querySelectorAll("div.ads.pla");
  for (const adsContainer of adsContainers) {
    const itemList = adsContainer.querySelectorAll("li.plaItem");
    for (const item of itemList) {
      const adsDescription = item.querySelector("div.title").textContent;
      const supplier = item.querySelector("div.seller").textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPrice = Number(
        item.querySelector("div.price").textContent.replaceAll(/[^0-9^\.]/g, "")
      );
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice,
        originalPrice: null,
        imgURL,
        imgBASE64,
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview: null,
        videoURL: null,
      };

      sendMsg(adsItem);
    }
  }
}
