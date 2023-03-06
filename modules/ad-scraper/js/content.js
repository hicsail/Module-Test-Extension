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

function extractAsinFromUrl(url) {
  try {
    const regex = RegExp("(http|https)://www.amazon..*(%2Fdp%2F|/dp/)([A-Z0-9]{10})");

    return url.match(regex)[3];
  } catch (error) {
    return null;
  }
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

function sendMsg(item) {
  console.log(item);
  // chrome.runtime.sendMessage(item);
}
