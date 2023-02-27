window.registerModuleCallback(targetScraper);

function targetScraper() {
  if (document.location.host !== "www.target.com") return;

  const adsLog = new Set();
  console.log("Target Scraper started");

  window.addEventListener("load", () => {
    setInterval(() => {
      targetSearchResultScraper(adsLog);
    }, 5000);
  });
}

/**
 * Scraping sponsored item in the result board
 */
function targetSearchResultScraper(adsLog) {
  const sponsoredTags = document.querySelectorAll("p[data-test=sponsoredText]");

  let cnt = 0;
  for (const tag of sponsoredTags) {
    const item = tag.closest("div[class^=styles__StyledCol-sc]");
    const id = extractIdFromURL(item.querySelector("a")["href"]);

    if (adsLog.has(id)) continue;

    adsLog.add(id);
    console.log(id + " CNT: " + cnt++);

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

// extract id from url which start with "A-" and followed by 8 digits
function extractTargetIdFromURL(url) {
  const regex = RegExp("A-[0-9]{8}");
  return url.match(regex)[0];
}
