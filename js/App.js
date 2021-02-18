import {render, html} from "./vendor/uhtml.js";
import {fetchData, lastPart, setCaretAtEnd} from "./helpers.js";
import {addMatomo, addChatwoot} from "./ThirdPartyScripts.js";
import {Language, isRTL} from "./LanguageService.js";
import {env} from "./Env.js";
import {UniversalRouter} from "./vendor/universal-router.js";
import {routes} from "./routes.js";
import {template_style, template_header, template_sidebar} from "./BaseTemplates.js";
const baseUrl = `${env.channelsApi}/${env.channelId}`;
Language.setBaseUrl(baseUrl);
class App {
  constructor() {
    this.currentPage = null;
    this.sortBy = "title";
    this.showPanel = "";
    this.couldNotLoad = false;
    this.search = "";
    this.languages = new Map();
    Language.uiLanguages = {
      en: "English",
      nl: "Nederlands",
      de: "Deutsch",
      ar: "\u0639\u0631\u0628\u0649"
    };
    this.element = document.querySelector("#app");
    fetchData(baseUrl).then(async ([siteInfo, items]) => {
      const query = new URLSearchParams(location.search);
      await Language.setCurrent(query.get("site-language") ?? "en");
      if (!siteInfo.errors) {
        this.allSiteInfo = siteInfo;
        this.setSiteInfo();
        if (siteInfo.matomo)
          addMatomo(this.siteInfo.matomo);
        if (siteInfo.chatwoot)
          addChatwoot(this.siteInfo.chatwoot);
        this.setItems(items ? items : JSON.parse(localStorage.offlineItems ?? "[]"));
        this.filters = this.createFilters(this.items, this.authors, this.categories);
        this.routerContext = {
          app: this
        };
        this.router = new UniversalRouter(routes(), {context: this.routerContext});
      } else {
        this.couldNotLoad = true;
      }
      this.render();
    }).catch((exception) => {
      console.log(exception);
      this.render();
    });
    window.addEventListener("click", (event) => {
      if (this.showPanel === "menu" && !event.target.classList.contains("toggle-menu") && !event.target.closest(".content-top")) {
        this.showPanel = "";
        this.render();
      }
    });
    Language.addEventListener("language-change", () => window.$chatwoot?.setLocale(Language.current));
    window.addEventListener("resize", () => this.render());
    window.addEventListener("popstate", () => this.render());
    window.addEventListener("should-render", () => this.render());
    window.addEventListener("searched", () => setCaretAtEnd(document.querySelector('input[type="search"]')));
    window.addEventListener("filter-selected", () => {
      const filters2 = this.createFilterUrl(this.filters);
      history.pushState(null, null, filters2 ? "/?" + filters2 : "/");
      this.render();
    });
  }
  setSiteInfo() {
    const siteInfoCurrentLanguage = this.allSiteInfo.find((info) => info.langCode === Language.current);
    const siteInfoFallback = this.allSiteInfo.find((info) => info.langCode === "en");
    const siteInfoFinalFallback = this.allSiteInfo.find((info) => !info.langCode);
    this.siteInfo = siteInfoCurrentLanguage ?? siteInfoFallback ?? siteInfoFinalFallback;
    document.title = this.siteInfo.name.replace(/(<([^>]+)>)/gi, "");
  }
  setItems(items) {
    this.items = items?.ebook ?? items?.video;
    this.authors = items?.person ?? [];
    this.pages = items?.page ?? [];
    this.categories = items?.category ?? [];
  }
  createFilters(items, authors, categories) {
    const query = new URLSearchParams(location.search);
    this.search = query.get("search");
    const selectedCategory = query.get("category");
    const selectedLangCode = query.get("langCode");
    const selectedAuthors = query.get("authors")?.split(",").map((tag) => tag.replace(/&#x2C;/g, ",")) ?? [];
    const selectedTags = query.get("tags")?.split(",").map((tag) => tag.replace(/&#x2C;/g, ",")) ?? [];
    const filters2 = {
      tags: new Map(),
      category: new Map(),
      langCode: new Map(),
      authors: new Map()
    };
    for (const item of items) {
      if (item?.tags) {
        for (const tag of item.tags) {
          filters2.tags.set(tag, selectedTags.includes(tag));
        }
      }
      filters2.langCode.set(item.langCode, item.langCode === selectedLangCode);
      this.languages.set(item.langCode, item.language);
    }
    for (const author of authors) {
      if (!filters2.authors.get(author.id)) {
        filters2.authors.set(author.id, selectedAuthors.includes(lastPart(author.id)));
      }
    }
    for (const category of categories) {
      if (!filters2.category.get(category.id)) {
        filters2.category.set(category.id, selectedCategory === lastPart(category.id));
      }
    }
    return filters2;
  }
  getFilteredItems() {
    let filteredItems = [...this.items];
    for (const [name, filter] of Object.entries(this.filters)) {
      const selectedFilterItems = [...filter.entries()].map(([item, selected]) => selected ? item : null).filter((item) => item);
      if (selectedFilterItems.length && filteredItems[0]) {
        if (Array.isArray(filteredItems[0][name])) {
          filteredItems = filteredItems.filter((item) => item[name].some((filterItem) => {
            return selectedFilterItems.includes(filterItem);
          }));
        } else {
          filteredItems = filteredItems.filter((item) => selectedFilterItems.includes(item[name]));
        }
      }
    }
    if (this.search) {
      filteredItems = filteredItems.filter((item) => {
        return item?.searchWords?.join(" ").toLowerCase().includes(this.search.toLowerCase()) || item?.description.toLowerCase().includes(this.search.toLowerCase());
      });
    }
    filteredItems.sort((a, b) => {
      a = a?.[app.sortBy];
      b = b?.[app.sortBy];
      if (Array.isArray(a))
        a = a[0];
      if (Array.isArray(b))
        b = b[0];
      return a?.localeCompare(b);
    });
    return filteredItems;
  }
  async render() {
    if (this.couldNotLoad) {
      render(this.element, html`
        <div>
          <h4>Loading the current channel did not work.</h1>
        </div>
      `);
      return;
    }
    this.setSiteInfo();
    this.filteredItems = this.getFilteredItems();
    if (this.showPanel) {
      document.body.dataset.showPanel = this.showPanel;
    } else {
      delete document.body.dataset.showPanel;
    }
    const siteIsRtl = isRTL(Language.uiLanguages[Language.current]);
    document.body.dir = siteIsRtl ? "rtl" : "ltr";
    try {
      const response = await this.router.resolve({pathname: location.pathname});
      render(this.element, html`${[
        template_style(),
        template_header(),
        template_sidebar(),
        ...response
      ]}`);
    } catch (exception) {
    }
  }
  updateUrl() {
    const filters2 = this.createFilterUrl(this.filters);
    history.pushState(null, null, filters2 ? "?" + filters2 : "/");
  }
  createFilterUrl(filters2, skipSearch = false) {
    const urlObject = {};
    for (const [name, filter] of Object.entries(filters2)) {
      const selection = [...filter.entries()].filter(([, selected]) => selected).map(([tag]) => lastPart(tag).replace(/,/g, "&#x2C;")).join(",");
      if (selection) {
        urlObject[name] = selection;
      }
    }
    if (this.search && !skipSearch) {
      urlObject.search = this.search;
    }
    urlObject["site-language"] = Language.current;
    const previousQuery = new URLSearchParams(location.search);
    if (previousQuery.get("item-language")) {
      urlObject["item-language"] = previousQuery.get("item-language");
    }
    const query = new URLSearchParams(urlObject);
    return query.toString();
  }
  toggleVisiblePanel(name) {
    this.showPanel === name ? this.showPanel = "" : this.showPanel = name;
  }
}
export const app = new App();
