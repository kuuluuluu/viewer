import {render, html} from "./vendor/uhtml.js";
import {getEntityType, fetchData, lastPart, setCaretAtEnd} from "./helpers.js";
import {addMatomo, addChatwoot} from "./ThirdPartyScripts.js";
import {template_style, template_header, template_sidebar, template_overview, template_about} from "./BaseTemplates.js";
import {Language, isRTL} from "./LanguageService.js";
import {env} from "./Env.js";
const channelId = localStorage?.channelId ?? 'demo-ebooks';
const baseUrl = `${env.channelsApi}/${channelId}`;
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
        this.items = items?.ebook ?? items?.video;
        this.authors = items?.person ?? [];
        this.categories = items?.category ?? [];
        this.filters = this.createFilters(this.items, this.authors, this.categories);
      } else {
        this.couldNotLoad = true;
      }
      this.render();
    }).catch((exception) => {
      console.log(exception);
      this.couldNotLoad = true;
      this.render();
    });
    window.addEventListener("popstate", () => this.render());
    window.addEventListener("should-render", () => this.render());
    window.addEventListener("searched", () => setCaretAtEnd(document.querySelector('input[type="search"]')));
    window.addEventListener("filter-selected", () => {
      const filters = this.createFilterUrl();
      history.pushState(null, null, filters ? "/?" + filters : "/");
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
  createFilters(items, authors, categories) {
    const query = new URLSearchParams(location.search);
    this.search = query.get("search");
    const selectedSubject = query.get("subject");
    const selectedLangCode = query.get("langCode");
    const selectedAuthors = query.get("authors")?.split(",").map((tag) => tag.replace(/&#x2C;/g, ",")) ?? [];
    const selectedTags = query.get("tags")?.split(",").map((tag) => tag.replace(/&#x2C;/g, ",")) ?? [];
    const filters = {
      tags: new Map(),
      subject: new Map(),
      langCode: new Map(),
      authors: new Map()
    };
    for (const item of items) {
      if (item?.tags) {
        for (const tag of item.tags) {
          filters.tags.set(tag, selectedTags.includes(tag));
        }
      }
      if (item.subject) {
        filters.subject.set(item.subject, item.subject === selectedSubject);
      }
      filters.langCode.set(item.langCode, item.langCode === selectedLangCode);
      this.languages.set(item.langCode, item.language);
    }
    for (const author of authors) {
      filters.authors.set(author.id, selectedAuthors.includes(author.name));
    }
    for (const category of categories) {
      filters.subject.set(category.id, selectedAuthors.includes(category.name));
    }
    return filters;
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
        return item?.searchWords.join(" ").toLowerCase().includes(this.search.toLowerCase()) || item?.description.toLowerCase().includes(this.search.toLowerCase());
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
  render() {
    if (this.couldNotLoad) {
      render(this.element, html`
        <div>
        <h4>Loading the current channel did not work. Are you looking for this?</h1>
          <ul>
            <li><a href="${"http://prophet-stories:" + location.port}">Prophet Stories</a></li>
            <li><a href="${"http://ebookseastomorg:" + location.port}">Ebooks</a></li>
          </ul>
        </div>
      `);
      return;
    }
    this.setSiteInfo();
    let page = "page";
    if (location.pathname === "/")
      page = "overview";
    if (location.pathname.split("/")?.[1] === "about")
      page = "about";
    this.filteredItems = this.getFilteredItems();
    document.body.dataset.page = page;
    if (this.showPanel) {
      document.body.dataset.showPanel = this.showPanel;
    } else {
      delete document.body.dataset.showPanel;
    }
    const siteIsRtl = isRTL(Language.uiLanguages[Language.current]);
    document.body.dir = siteIsRtl ? "rtl" : "ltr";
    if (window.$chatwoot) {
      window.$chatwoot.setLocale(Language.current);
    } else {
      window.chatwootSettings = {
        locale: Language.current
      };
    }
    const type = location.pathname.split("/")?.[1];
    if (this.currentPage !== page && page === "page")
      getEntityType(type).pageInit();
    this.currentPage = page;
    render(this.element, html`
        ${page === "page" ? [
      template_style(),
      template_header(),
      template_sidebar(),
      getEntityType(type).page()
    ] : ""}

        ${page === "overview" ? [
      template_style(),
      template_header(),
      template_sidebar(),
      template_overview()
    ] : ""}

        ${page === "about" ? [
      template_style(),
      template_header(),
      template_sidebar(),
      template_about()
    ] : ""}

    `);
  }
  updateUrl() {
    const filters = this.createFilterUrl();
    history.pushState(null, null, filters ? "?" + filters : "/");
  }
  createFilterUrl() {
    const urlObject = {};
    for (const [name, filter] of Object.entries(this.filters)) {
      const selection = [...filter.entries()].filter(([, selected]) => selected).map(([tag]) => lastPart(tag).replace(/,/g, "&#x2C;")).join(",");
      if (selection) {
        urlObject[name] = selection;
      }
    }
    if (this.search) {
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
