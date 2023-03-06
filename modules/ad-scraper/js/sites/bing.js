window.registerModuleCallback(bingScraper);

function bingScraper() {
  if (document.location.host !== "www.bing.com") return;

  window.onload = function () {
    setTimeout(bingScraperHelper, 1000);

    window.onchange = function () {
      setTimeout(bingScraperHelper, 2000);
    };
  };
}

function bingScraperHelper() {
  bingAdsWithoutPhoto();
  bingSearchTabAdsWithPhoto();
  bingSearchTabAboutWithPhoto();
  bingSearchTabCarAdsContainer();
  bingSearchTabCarAdsCarousel();
  bingSearchTabCarAdsSlidebar();
  bingImagesTabAdsWithPhoto();
  bingShoppingTabAds();
}

/**
 * Bing search: Scraping ads with no photo
 */
function bingAdsWithoutPhoto() {
  const infoScraper = (item) => {
    const adsDescription = item.querySelector("a").textContent;
    const supplier = item.querySelector("cite").textContent;
    const productURL = item.querySelector("a")["href"];
    if (!isURL(productURL)) return;

    listenClickOnAd(item, productURL);

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
  };

  let adsContainers = document.querySelectorAll("li.b_ad");
  let itemListIdentifier = "li[data-bm]";

  if (adsContainers.length === 0) {
    adsContainers = document.querySelectorAll("div.b_ad");
    itemListIdentifier = "div.sb_adTA";
  }

  for (const adsContainer of adsContainers) {
    if (adsContainer.querySelector(".adsMvCarousel")) return;

    const itemList = adsContainer.querySelectorAll(itemListIdentifier);
    for (const item of itemList) {
      try {
        infoScraper(item);
      } catch (error) {
        return;
      }
    }
  }
}

/**
 * Bing search at "search" tab: Scraping ads with images (ads)
 */
function bingSearchTabAdsWithPhoto() {
  if (document.location.pathname !== "/search") return;

  const adsContainers = document.querySelectorAll("div.adsMvCarousel.pa_carousel");
  for (const adsContainer of adsContainers) {
    const listId = adsContainer.getAttribute("carouselid");
    const itemList = adsContainer.querySelector(`div#slideexp${listId}.b_slidebar`);

    for (const item of itemList.childNodes) {
      if (item.classList.contains("see_more")) continue;
      let adsDescription = "";
      item
        .querySelector("p.pa_title")
        .querySelectorAll("span:not(.b_ellipsis):not([style])")
        .forEach((element) => {
          adsDescription += element.textContent;
        });
      const supplier = item.querySelector("cite").textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPriceNode = item.querySelector("p.pa_price").querySelector("strong");
      const originalPriceNode = item.querySelector("p.pa_price").querySelector("span");
      const img = item.querySelector("div.pa_img").querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: Number(currentPriceNode.textContent.replaceAll(/[^0-9^\.]/g, "")),
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
 * Bing search at "search" tab: Scraping ads with images (about)
 */
function bingSearchTabAboutWithPhoto() {
  if (document.location.pathname !== "/search") return;

  const adsContainers = document.querySelectorAll(
    "div.br-pcContainer.adsMvCarousel, div.br-pcContainer:not([carouselid])"
  );
  for (const adsContainer of adsContainers) {
    let itemList = adsContainer.querySelectorAll(".br-gridInterCard");
    if (itemList.length === 0) {
      const listId = adsContainer.getAttribute("carouselid");
      itemList = adsContainer.querySelector(`div#slideexp${listId}.b_slidebar`).childNodes;
    }
    for (const item of itemList) {
      if (item.classList.contains("see_more")) continue;

      const adsDescription =
        item.querySelector("div.pcc-ttl")?.querySelector("span")?.getAttribute("title") ??
        item.querySelector("div.pcc-ttl").textContent;
      const supplier = item.querySelector("div.sa_seller").textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPrice = Number(
        item
          .querySelector("div.sa_price")
          .textContent.split("$")[1]
          .replaceAll(/[^0-9^\.]/g, "")
      );
      const originalPrice =
        item.querySelector("div.sa_price").textContent.split("$").length > 2
          ? Number(
              item
                .querySelector("div.sa_price")
                .textContent.split("$")[2]
                .replaceAll(/[^0-9^\.]/g, "")
            )
          : null;
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

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

/**
 * Bing search at "search" tab: Scraping car ads in container
 */
function bingSearchTabCarAdsContainer() {
  if (document.location.pathname !== "/search") return;

  const itemList = document
    .querySelector("div.autos_ads_container")
    ?.querySelectorAll("div.autosAd");
  if (!itemList || itemList?.length === 0) return;
  for (const item of itemList) {
    const adsDescription = item.querySelector("div.autosTitle").textContent;
    const supplier = item.querySelector("span.dealerName").textContent;
    const productURL = item.parentNode["href"];
    const currentPrice = Number(
      item.querySelector("div.priceDetails_A").textContent.replaceAll(/[^0-9^\.]/g, "")
    );
    const img = item.querySelector("img");
    let imgURL = isURL(img["src"]) ? img["src"] : null;
    let imgBASE64 = isURL(img["src"]) ? null : img["src"];

    listenClickOnAd(item, productURL);

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

/**
 * Bing search at "search" tab: Scraping car ads in carousel
 */
function bingSearchTabCarAdsCarousel() {
  if (document.location.pathname !== "/search") return;

  const adsContainer = document.querySelector("div.autos_ml_ads_container");
  const adsCarousel = adsContainer?.querySelector("div.ta_carousel.adsMvCarousel");
  const listId = adsCarousel?.getAttribute("carouselid");
  const itemList = adsContainer?.querySelector(`div#slideexp${listId}.b_slidebar`);
  if (!itemList || itemList?.length === 0) return;
  for (const item of itemList.childNodes) {
    if (item.classList.contains("see_more")) continue;
    const adsDescription =
      item.querySelector("div.title").querySelector("span")?.getAttribute("title") ??
      item.querySelector("div.title").textContent;
    const supplier = item
      .querySelector("div.dealerDetails")
      .querySelector("span.dealerName").textContent;
    const productURL = item.querySelector("a")["href"];
    const currentPrice = Number(
      item.querySelector("div.priceDetails").textContent.replaceAll(/[^0-9^\.]/g, "")
    );
    const img = item.querySelector("img");
    let imgURL = isURL(img["src"]) ? img["src"] : null;
    let imgBASE64 = isURL(img["src"]) ? null : img["src"];

    listenClickOnAd(item, productURL);

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

/**
 * Bing search at "search" tab: Scraping car ads in slidebar
 */
function bingSearchTabCarAdsSlidebar() {
  if (document.location.pathname !== "/search") return;

  const adsContainer = document
    .querySelector("div.ProductAdsContainer")
    ?.querySelector("div.b_slidebar");
  if (!adsContainer || adsContainer?.length === 0) return;
  for (const item of adsContainer.childNodes) {
    const adsDescription =
      item.querySelector("div.slideTitle").querySelector("span")?.title ??
      item.querySelector("div.slideTitle").textContent;
    const productURL = item.querySelector("a")["href"];
    const currentPrice = Number(
      item.querySelector("div.bm_adprice").textContent.replaceAll(/[^0-9^\.]/g, "")
    );
    const img = item.querySelector("img");
    let imgURL = isURL(img["src"]) ? img["src"] : null;
    let imgBASE64 = isURL(img["src"]) ? null : img["src"];

    listenClickOnAd(item, productURL);

    const adsItem = {
      asin: extractAsinFromUrl(productURL),
      content: "records_ads",
      url: window.location.href,
      host: window.location.host,
      pageTitle: document.title,
      adsDescription,
      supplier: null,
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

/**
 * Bing search at "images" tab: Scraping ads with images
 */
function bingImagesTabAdsWithPhoto() {
  if (document.location.pathname !== "/images/search") return;

  const adsContainers = document.querySelectorAll("div.ra_car_container");
  for (const adsContainer of adsContainers) {
    const id = adsContainer.querySelector("div.ta_carousel").getAttribute("carouselid");
    const itemList = adsContainer.querySelector(`div#slideexp${id}.b_slidebar`);
    for (const item of itemList.childNodes) {
      const adsDescription = item.querySelector("div.ra_title").textContent;
      const supplier = item.querySelector("div.ra_seller").textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPriceNode = item.querySelector("div.ra_price").querySelector("div.ra_sp");
      const originalPriceNode = item.querySelector("div.ra_price").querySelector("div.ra_op");
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: Number(currentPriceNode.textContent.replaceAll(/[^0-9^\.]/g, "")),
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
 * Bing search at "Shopping" tab: Scraping ads
 */
function bingShoppingTabAds() {
  if (document.location.pathname !== "/shop") return;

  const adsContainers = document.querySelectorAll("div.br-pcContainer[carouselid]");
  for (const adsContainer of adsContainers) {
    const id = adsContainer.getAttribute("carouselid");
    const itemList = adsContainer.querySelector(`div#slideexp${id}.b_slidebar`);
    for (const item of itemList.childNodes) {
      const adsDescription = item.querySelector("div.br-offTtl").textContent;
      const supplier = item.querySelector("div.br-offSlr").textContent;
      const productURL = item.querySelector("a")["href"];
      const currentPriceNode = item.querySelector("div.br-price");
      const originalPriceNode = item.querySelector("div.br-standardPriceDemoted");
      const img = item.querySelector("img");
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      listenClickOnAd(item, productURL);

      const adsItem = {
        asin: extractAsinFromUrl(productURL),
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier,
        productURL,
        currentPrice: Number(currentPriceNode.textContent.replaceAll(/[^0-9^\.]/g, "")),
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
