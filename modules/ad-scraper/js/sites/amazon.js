window.registerModuleCallback(amazonScraper);

function amazonScraper() {
  if (document.location.host !== "www.amazon.com") return;

  window.onload = function () {
    amazonTopBannerScraper();
    amazonBottomBannerScraper();
    amazonSearchResultScraper();
    amazonRhfScraper();
    amazonHorizontalBannerScraper();
  };
}

/*
 * Scraping ads at the top container
 */
function amazonTopBannerScraper() {
  // helper function scrape supplier from top banner
  const supplierScraper = (node) => {
    const supplierText = node
      .querySelector("a.a-size-small")
      .querySelector("span.a-truncate-full")
      .querySelectorAll("span");

    let supplier = "";
    for (let idx = 0; idx < supplierText.length; idx++) {
      if (idx == 0) {
        supplier += supplierText[idx].textContent.replace("Shop", "");
        continue;
      }

      supplier += supplierText[idx].textContent;
    }

    return supplier.trim();
  };

  const topBanner = document.querySelector(".s-widget.AdHolder");
  if (!topBanner) return; // exit the function when top banner does not exist

  // In rare occasion, top banner will match the pattern of normal list of ads
  // It will successfully find the elemnent that contains the ads, but it will fail when trying to extract url
  // In this situation, top banner will only send user to store website instead of an product
  try {
    let items = topBanner.querySelectorAll("._bGlmZ_item_awNhH");
    let supplier = null;

    if (items.length <= 0) {
      items = topBanner.querySelectorAll("._bXVsd_gridColumn_2Jfab");
      supplier = supplierScraper(topBanner);
    } else {
      supplier = supplierScraper(topBanner);
    }

    for (const item of items) {
      const asin = item.querySelector("div.a-section.a-spacing-none").getAttribute("data-asin");
      const img = item.querySelector("img");
      const productURL = item.querySelector("a")["href"];
      const adsDescription = item.querySelector("span.a-truncate-full").textContent;
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      const bannerAds = {
        asin,
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
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview: null,
        videoURL: null,
      };

      detectDuplicateAndSendMsg(null, bannerAds);
    }
  } catch (error) {
    return;
  }
}

/*
 * Scraping ads at the bottom container
 */
function amazonBottomBannerScraper() {
  const bottomBanners = document.querySelectorAll(".s-widget.AdHolder");
  for (const banner of bottomBanners) {
    const items = banner.querySelectorAll("._bXVsd_container_3aZDQ");
    if (!items) return;

    for (const item of items) {
      const img = item.querySelector("img");
      const supplier = img["alt"].substring(
        img["alt"].indexOf("from") + 5,
        img["alt"].indexOf(".")
      );
      const productURL = item.querySelector("a")["href"];
      const adsDescription = item.querySelector("span.a-truncate-full").textContent;
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      const bannerAds = {
        asin: null,
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
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview: null,
        videoURL: null,
      };

      detectDuplicateAndSendMsg(null, bannerAds);
    }
  }
}

/**
 * Scraping ads inside the search result
 */
function amazonSearchResultScraper() {
  // It did not contain supplier name itself, only description in title
  const searchResultCollection = new Set();

  const searchResults = document.querySelectorAll('[alt^="Sponsored Ad"]');
  for (const resultImage of searchResults) {
    let item = resultImage.closest("div.s-inner-result-item");
    if (!item) item = resultImage.closest("div.s-result-item");

    const asin = item.getAttribute("data-asin");
    const currentPrice = extractCurrentAmazonPrice(item);
    const originalPrice = extractOriginalAmazonPrice(item);
    const productURL = item.querySelector("a.a-link-normal")["href"];
    const adsDescription = item.querySelector("span.a-color-base.a-text-normal").textContent;
    let imgURL = isURL(resultImage["src"]) ? resultImage["src"] : null;
    let imgBASE64 = isURL(resultImage["src"]) ? null : resultImage["src"];

    const resultAds = {
      asin,
      content: "record_Ads",
      url: window.location.href,
      pageTitle: document.title,
      supplier: null,
      productURL,
      currentPrice,
      originalPrice,
      imgURL,
      imgBASE64,
      adsDescription,
      imageHeight: resultImage.height,
      imageWidth: resultImage.width,
      videoPreview: null,
      videoURL: null,
    };

    detectDuplicateAndSendMsg(searchResultCollection, resultAds);
  }
}

/**
 * scraping recommended based on browsing history at the bottom (rhf-frame)
 */
function amazonRhfScraper() {
  // For each search, the rhf-frame will only be loaded once when user scroll down
  // Clear the set when rhf-frame is changed to visible
  // Add items from the list to the set as user going through each pages
  // If item is already in the list, it won't be loaded
  const carouselSet = new Set(); // set for recording sent items

  let bottomFrame = document.querySelector(".rhf-frame");

  // helper function for sending ads message to PDK and store it in the Set
  const sendMsgAndAddToSet = (node) => {
    if (!node.querySelector("div.a-section.a-spacing-none")) return;

    const asin = extractAsinFromUrl(node.querySelector("a")["href"]);
    if (carouselSet.has(asin)) return;

    carouselSet.add(asin);

    const adsDescription = node.querySelector("span.a-truncate-full").textContent;
    const productURL = node.querySelector("a")["href"];
    const currentPrice = extractCurrentAmazonPrice(node);
    const originalPrice = extractOriginalAmazonPrice(node);
    const img = node.querySelector("img");
    let imgURL = isURL(img["src"]) ? img["src"] : null;
    let imgBASE64 = isURL(img["src"]) ? null : img["src"];

    const listAds = {
      asin,
      content: "records_ads",
      url: window.location.href,
      host: window.location.host,
      pageTitle: document.title,
      adsDescription,
      supplier: null,
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

    detectDuplicateAndSendMsg(null, listAds);
  };

  // define observer for monitoring the carousel list, fires when user move to another page
  const observerCarousel = new MutationObserver(() => {
    setTimeout(() => {
      const sponsoredTags = document.querySelector("div.rhf-frame").querySelectorAll("div.spUl");

      for (const sponsoredTag of sponsoredTags) {
        const carouselList = sponsoredTag.closest("div.celwidget").querySelector("ol");

        if (
          !carouselList.getAttribute("aria-busy") ||
          carouselList.getAttribute("aria-busy") === "false"
        ) {
          const carouselItems = carouselList.querySelectorAll("li");
          for (const item of carouselItems) {
            sendMsgAndAddToSet(item);
          }
        }
      }
    }, 1000);
  });

  let bottomFrameDetected = false;
  // define observer for monitoring the attribute change of the bottom rhf-frame
  const observerBottomFrame = new MutationObserver(() => {
    // clear the carousel list set
    carouselSet.clear();
    setTimeout(() => {
      // if bottom frame is displayed
      if (bottomFrame.style.display === "block" && !bottomFrameDetected) {
        bottomFrameDetected = true; // no longer need to trigger the observer on bottom frame once it's displayed

        // get all sponsored lists' tags
        const sponsoredTags = bottomFrame.querySelectorAll("div.spUl");
        if (sponsoredTags.length > 0) {
          for (const sponsoredTag of sponsoredTags) {
            // for each sponsor tag, get the list associated to it
            const sponsoredList = sponsoredTag.closest("div.celwidget").querySelector("ol");

            // log the list at the first time
            if (!sponsoredList.getAttribute("aria-busy")) {
              const carouselItems = sponsoredList.querySelectorAll("li");
              for (const item of carouselItems) {
                sendMsgAndAddToSet(item);
              }
            }

            observerCarousel.observe(sponsoredList, {
              attributes: true,
              attributeOldValue: true,
            });
          }
        }
      }
    }, 2000);
  });

  observerBottomFrame.observe(bottomFrame, {
    attributes: true,
    attributeFilter: ["style"],
    attributeOldValue: true,
  });
}

/**
 * scraping horizontal banners in the middle or at the bottom
 */
function amazonHorizontalBannerScraper() {
  const horizontalBannerCollection = new Set();

  const horizontalBanners = document.querySelectorAll(".sbv-product");
  if (horizontalBanners.length > 0) {
    for (const banner of horizontalBanners) {
      const asin = extractAsinFromUrl(banner.querySelector("a")["href"]);
      const currentPrice = extractCurrentAmazonPrice(banner);
      const originalPrice = extractOriginalAmazonPrice(banner);
      const img = banner.querySelector("img");
      const video = banner.closest(".sg-row").querySelector("video");
      const videoURL = video["src"];
      const videoPreview = video["poster"];
      const productURL = banner.querySelector("a.a-link-normal")["href"];
      const adsDescription = banner.querySelector("span.a-text-normal").textContent;
      let imgURL = isURL(img["src"]) ? img["src"] : null;
      let imgBASE64 = isURL(img["src"]) ? null : img["src"];

      const bannerAds = {
        asin,
        content: "records_ads",
        url: window.location.href,
        host: window.location.host,
        pageTitle: document.title,
        adsDescription,
        supplier: null,
        productURL,
        currentPrice,
        originalPrice,
        imgURL,
        imgBASE64,
        imageHeight: img.height,
        imageWidth: img.width,
        videoPreview,
        videoURL,
      };

      detectDuplicateAndSendMsg(horizontalBannerCollection, bannerAds);
    }
  }
}

// helper functions
function detectDuplicateAndSendMsg(collection, item) {
  if (collection) {
    if (collection.has(item.asin)) return;

    collection.add(item.asin);
  }

  sendMsg(item);
}

function extractCurrentAmazonPrice(node) {
  try {
    const currentPrice = node
      .querySelector(".a-size-base.a-link-normal.s-underline-text.s-underline-link-text")
      .querySelector(".a-price:not(.a-text-price)");

    return currentPrice
      ? Number(
          currentPrice.querySelector(".a-offscreen").textContent.split("$")[1].replaceAll(",", "")
        )
      : null;
  } catch (error) {
    return null;
  }
}

function extractOriginalAmazonPrice(node) {
  try {
    const originalPrice = node
      .querySelector(".a-size-base.a-link-normal.s-underline-text.s-underline-link-text")
      .querySelector(".a-price.a-text-price");

    return originalPrice
      ? Number(
          originalPrice.querySelector(".a-offscreen").textContent.split("$")[1].replaceAll(",", "")
        )
      : null;
  } catch (error) {
    return null;
  }
}
