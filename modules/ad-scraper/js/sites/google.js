window.registerModuleCallback(googleScraper);

function googleScraper() {
  if (document.location.host !== "www.google.com") return;

  window.onload = function () {
    googleAllTabAdsWithoutPhoto();
    googleAllTabAdsWithPhoto();
    googleImageTabAds();
    googleShoppingTabAds();
  };
}

/**
 * Google search at "all" tab: Scraping ads with no photo
 */
function googleAllTabAdsWithoutPhoto() {
  const adsBanners = document.querySelectorAll("[aria-label=Ads]");
  for (const banner of adsBanners) {
    const adsContainers = banner.querySelectorAll('[data-text-ad="1"]');
    for (const adsContainer of adsContainers) {
      const adsDescription = adsContainer
        .querySelector("[role=heading]")
        .querySelector("span").textContent;
      const supplier = adsContainer
        .querySelector("a[data-pcu]")
        .getAttribute("data-pcu")
        .split(",")[0]
        .split("//")[1]
        .replaceAll("/", "");
      const productURL = adsContainer.querySelector("a[data-pcu]")["href"];
      const img = adsContainer.querySelector('img[alt]:not([alt=""])');
      let imgURL = isURL(img?.src) ? img.src : null;
      let imgBASE64 = isURL(img?.src) ? null : img?.src;

      listenClickOnAd(adsContainer, productURL);

      const adsItem = {
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: null,
        originalPrice: null,
        imgURL,
        imgBASE64,
        imageHeight: img?.height,
        imageWidth: img?.width,
        videoPreview: null,
        videoURL: null,
      };

      sendMsg(adsItem);
    }
  }
}

/**
 * Google search at "all" tab: Scraping ads with images
 */
function googleAllTabAdsWithPhoto() {
  const adsContainers = document.querySelectorAll("div.cu-container");

  for (const adsContainer of adsContainers) {
    const itemList = adsContainer.querySelectorAll(
      "div.mnr-c.pla-unit:not(.view-all-unit)"
    );
    for (const item of itemList) {
      try {
        const adsDescription = item
          .querySelector("div.pla-unit-title")
          .querySelector("span").textContent;
        const productATag = item.querySelector("a.clickable-card[aria-label]");
        const supplier = productATag["ariaLabel"]
          .substring(productATag["ariaLabel"].lastIndexOf("from") + 4)
          .trim();
        const productURL = productATag["href"];
        const currentPrice = extractCurrentGooglePrice(item);
        const originalPrice = extractOriginalGooglePrice(item);
        const img = item.querySelector("img");
        let imgURL = isURL(img["src"]) ? img["src"] : null;
        let imgBASE64 = isURL(img["src"]) ? null : img["src"];

        listenClickOnAd(item, productURL);

        const adsItem = {
          content: "records_ads",
          url: window.location.href,
          host: window.location.host,
          pageTitle: document.title,
          adsDescription,
          supplier,
          productURL,
          currentPrice,
          originalPrice,
          imgURL,
          imgBASE64,
          imageHeight: img.height,
          imageWidth: img.width,
          videoPreview: null,
          videoURL: null,
        };

        sendMsg(adsItem);
      } catch (error) {
        continue;
      }
    }

    // scraping for car ads
    const carList = adsContainer.querySelectorAll("g-inner-card");
    for (const item of carList) {
      try {
        const adsDescription = item
          .querySelector('[aria-label^="Title of"]')
          ["ariaLabel"].replace("Title of ", "");

        const supplier = item.querySelector(
          'span[aria-label^="From"]'
        ).textContent;
        const productURL = item.querySelector("a")["href"];
        const currentPrice = Number(
          item
            .querySelector('[aria-label^="Title of"]')
            .parentNode.childNodes[2].textContent.replaceAll(/[^0-9^\.]/g, "")
        );
        const img = item.querySelector("img");
        let imgURL = isURL(img["src"]) ? img["src"] : null;
        let imgBASE64 = isURL(img["src"]) ? null : img["src"];

        listenClickOnAd(item, productURL);

        const adsItem = {
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
      } catch (error) {
        continue;
      }
    }
  }
}

/**
 * Google search at "image" tab: Scraping ads in carousel list
 */
function googleImageTabAds() {
  const adsContainers = document.querySelectorAll("[data-id^=CarouselPLA]");

  for (const adsContainer of adsContainers) {
    const itemList = adsContainer.querySelectorAll("div.pla-unit");
    for (const item of itemList) {
      const supplier = item.querySelector("span[aria-label]").textContent;
      const productURL = item.querySelectorAll("a.pla-link")[1]["href"];
      const infoContainer = item
        .querySelector("div[jsaction^=mouseenter]")
        .querySelector("div[style^=margin]").parentNode;
      const adsDescription =
        infoContainer.childNodes[0].querySelector("span").textContent;
      const currentPrice = Number(
        infoContainer.childNodes[1].textContent
          .split("$")[1]
          .replaceAll(",", "")
      );
      const originalPrice = infoContainer.childNodes[1]
        .querySelector("span")
        ?.textContent.split("$")[1]
        .replaceAll(",", "");
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        imgURL,
        imgBASE64,
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview: null,
        videoURL: null,
      };

      sendMsg(adsItem);
    }

    // scraping for car ads
    const carList = adsContainer.querySelectorAll("div.sc-it");
    for (const item of carList) {
      const infoContainer = item.querySelector("img").parentNode.nextSibling;
      const adsDescription = infoContainer.childNodes[0].textContent;
      const supplier = infoContainer.childNodes[5].textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPrice = Number(
        infoContainer.childNodes[2].textContent
          .split("$")[1]
          .replaceAll(/[^0-9^\.]/g, "")
      );
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
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

/**
 * Google search at "shopping" tab: Scraping ads in carousel lists
 */
function googleShoppingTabAds() {
  const adsContainers = document.querySelectorAll(
    "div[class=sh-sr__shop-result-group]"
  );

  for (let idx = 0; idx < adsContainers.length; idx++) {
    if (adsContainers.length < 3 && idx > 0) break; // when there is only one ads list
    if (idx == adsContainers.length - 1) break; // ignore the last search related ... section
    const itemList = adsContainers[idx].querySelectorAll("div[data-hveid]");
    for (const item of itemList) {
      const supplier = item
        .querySelector("div.sh-np__seller-container[aria-label]")
        ["ariaLabel"].substring(4)
        .trim();
      const adsDescription = item.querySelector(
        ".sh-np__product-title"
      ).textContent;
      const productURL = item.querySelector("a")["href"];
      const prices = item
        .querySelector(".sh-np__product-title")
        .nextSibling.querySelector("span")
        .textContent.replaceAll(/[a-zA-Z]/g, "")
        .split("$");
      const currentPrice = Number(prices[1].replaceAll(",", ""));
      const originalPrice =
        prices.length > 2 ? Number(prices[2].replaceAll(",", "")) : null;
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice,
        originalPrice,
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

// helper functions
function extractCurrentGooglePrice(node) {
  try {
    const priceNodes = node
      .querySelector("div.pla-unit-title")
      .nextSibling.querySelectorAll("span");
    const currentPrice = priceNodes[0].textContent;

    return Number(currentPrice.split("$")[1].replaceAll(",", ""));
  } catch (error) {
    return null;
  }
}

function extractOriginalGooglePrice(node) {
  try {
    const priceNodes = node
      .querySelector("div.pla-unit-title")
      .nextSibling.querySelectorAll("span");
    const orginalPrice = priceNodes[1].textContent; // index out of bound when there is no original price

    return Number(orginalPrice.split("$")[1].replaceAll(",", ""));
  } catch (error) {
    return null;
  }
}
