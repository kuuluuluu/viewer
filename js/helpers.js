import {Video} from "./Entities/Video.js";
import {Ebook} from "./Entities/Ebook.js";
export const lastPart = (uri) => {
  if (uri.substr(0, 4) !== "http")
    return uri;
  const split = uri.split(/\/|#/);
  return split.pop();
};
export const fetchData = async (baseUrl) => {
  const dataPromise = fetch(baseUrl + "/data?format=json").then((response) => response.json());
  const infoPromise = fetch(baseUrl + "/info?format=json").then((response) => response.json());
  return Promise.all([infoPromise, dataPromise]);
};
export const linkClick = (event) => {
  event.preventDefault();
  const href = event.currentTarget.getAttribute("href");
  history.pushState(null, null, href);
  window.dispatchEvent(new CustomEvent("should-render"));
};
const entityTypes = [new Video(), new Ebook()];
export const getEntityType = (type) => {
  for (const entityType of entityTypes) {
    if (entityType.constructor.name.toLowerCase() === type?.toLowerCase()) {
      return entityType;
    }
  }
};
export const getPropertyFromId = (items, id, preferredLangCode, property = null) => {
  const propertyLocalLanguage = items.find((item) => item.id === id && item.langCode === preferredLangCode);
  const results = [];
  if (propertyLocalLanguage) {
    results.push(propertyLocalLanguage);
  }
  const itemEnglishFallback = items.find((item) => item.id === id && item.langCode === "en");
  if (itemEnglishFallback) {
    results.push(itemEnglishFallback);
  }
  const finalLanguageFallback = items.find((item) => item.id === id && item.language);
  if (finalLanguageFallback) {
    results.push(finalLanguageFallback);
  }
  const finalFallback = items.find((item) => item.id === id && !item.language);
  if (finalFallback) {
    results.push(finalFallback);
  }
  results.reverse();
  const combined = Object.assign({}, ...results);
  return property ? combined?.[property] : combined;
};
export function setCaretAtEnd(elem) {
  var elemLen = elem.value.length;
  if (document.selection) {
    elem.focus();
    var oSel = document.selection.createRange();
    oSel.moveStart("character", -elemLen);
    oSel.moveStart("character", elemLen);
    oSel.moveEnd("character", 0);
    oSel.select();
  } else if (elem.selectionStart || elem.selectionStart == "0") {
    elem.selectionStart = elemLen;
    elem.selectionEnd = elemLen;
    elem.focus();
  }
}
export const responsiveImage = (image, options = {}) => {
  const mapping = {
    width: "w",
    height: "h"
  };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    params.append(mapping[key], value.toString());
  }
  return `//images.weserv.nl/?url=${image}&default=${image}${params.toString() ? "&" + params.toString() : ""}`;
};
