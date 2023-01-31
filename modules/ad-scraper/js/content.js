/* global chrome */

function ltrim(str) {
  if (!str) return str;
  return str.replace(/^\s+/g, "");
}

function getBetween(str, str_a, str_b) {
  const substring = str.match(str_a + "(.*)" + str_b)[0];
  const res = substring.replace("from", "").replace('. "', "");
  if (res[0] == "") return ltrim(res);
  return res;
}

function isURL(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+,]*)*" + // port and path
      "(\\?[,;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

function listenClickOnAd(node, redirectURL) {
  node.addEventListener("click", () => {
    const redirectEvent = {
      host: window.location.host,
      url: window.location.href,
      redirectURL,
    };

    console.log(`Redirecting to ${redirectEvent}`);
  });
}

function sendMsg(item) {
  console.log(item);
  // chrome.runtime.sendMessage(item);
}
