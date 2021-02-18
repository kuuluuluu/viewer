import {Language} from "./LanguageService.js";
export const addMatomo = (id) => {
  const _paq = window._paq = window._paq || [];
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);
  const u = "//analytics.mep/";
  _paq.push(["setTrackerUrl", u + "matomo.php"]);
  _paq.push(["setSiteId", id]);
  const d = document, g = d.createElement("script"), s = d.getElementsByTagName("script")[0];
  g.type = "text/javascript";
  g.async = true;
  g.src = u + "matomo.js";
  s.parentNode.insertBefore(g, s);
};
export const addChatwoot = (id) => {
  window.chatwootSettings = {
    locale: Language.current
  };
  const BASE_URL = "http://chat.mep";
  const newScript = document.createElement("script");
  const scripts = document.getElementsByTagName("script")[0];
  newScript.src = BASE_URL + "/packs/js/sdk.js";
  scripts.parentNode.insertBefore(newScript, scripts);
  newScript.onload = function() {
    window.chatwootSDK.run({
      websiteToken: id,
      baseUrl: BASE_URL
    });
  };
};
