window.registerModuleCallback(targetScraper);

function targetScraper() {
  if (document.location.host !== "www.target.com") return;

  window.onload = function () {
    targetSearchResultScraper();
  };
}

/**
 * Scraping sponsored item in the result board
 */
function targetSearchResultScraper() {
  const sponsoredTags = document.querySelectorAll("p[data-test=sponsoredText]");
  for (const tag of sponsoredTags) {
    const item = tag.closest("div[class^=styles__StyledCol-sc]");
    const adsDescription = item.querySelector(
      "a[data-test=product-title]"
    ).textContent;
    const productURL = item.querySelector("a")["href"];
    const currentPrice = Number(
      item
        .querySelector("span[data-test=current-price]")
        .textContent.replaceAll(/[^0-9^\.]/g, "")
    );
    const originalPrice = item.querySelector("span[data-test=comparison-price]")
      ? Number(
          item
            .querySelector("span[data-test=comparison-price]")
            .textContent.replaceAll(/[^0-9^\.]/g, "")
        )
      : null;
    const img = item.querySelector("img");
    const imgURL = isURL(img["src"]) ? img["src"] : null;
    const imgBASE64 = isURL(img["src"]) ? null : img["src"];

    listenClickOnAd(item, productURL);

    const adsItem = {
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

    sendMsg(adsItem);
  }
}
