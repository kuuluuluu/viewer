import {html} from "./vendor/uhtml.js";
import {linkClick, getEntityType, getPropertyFromId, responsiveImage} from "./helpers.js";
import {SlimSelect} from "./vendor/slimselect.js";
import {app} from "./App.js";
import {Language, t} from "./LanguageService.js";
export const template_style = () => {
  return html`
    <style>
      ${`
      body {
        --color-primary: ${app.siteInfo?.colors?.primary};
        --color-secondary: ${app.siteInfo?.colors?.secondary};
        --color-tertiary: ${app.siteInfo?.colors?.tertiary};
      }
      `}
    </style>
    `;
};
export const template_header = () => {
  const menuToggle = (event) => {
    if (!event.target.classList.contains("toggle-menu"))
      return;
    app.toggleVisiblePanel("menu");
    app.render();
  };
  return html`
    <header class="site-header" onclick="${menuToggle}">
      <button class="toggle-menu mobile">
        <img src="/images/menu.svg">
      </button>
      <a class="site-logo-link" href="${`/?site-language=${Language.current}`}" onclick="${linkClick}">
        ${app.siteInfo.logo ? html`<img class="site-logo" src="${responsiveImage(app.siteInfo.logo, {width: 100})}" />` : html``}
      </a>
      <h1 class="site-title mobile" ref="${(element) => element.innerHTML = app.siteInfo.name}"></h1>
    </header>
    `;
};
export const template_sidebar = () => {
  const filters2 = app.filters;
  const languages = app.languages;
  const languageFilter = filters2.langCode.size > 1 ? html`
    <div class="filter">
      <h5 class="title">${t`I want results in the language`}</h5>
      ${template_languages(filters2.langCode, languages)}
    </div>
  ` : null;
  const categoryFilter = filters2.category.size ? html`
    <div class="filter">
      <h5 class="title">${t`Category`}</h5>
      ${template_categories(filters2.category, app.categories)}
    </div>
  ` : null;
  const authorFilter = filters2.authors.size > 1 ? html`
    <div class="filter">
      <h5 class="title">${t`Author(s)`}</h5>
      ${template_tags(filters2.authors, t.direct(`Select an author`), app.authors)}
    </div>
  ` : null;
  const searchFilter = languageFilter || authorFilter ? html`
    <div class="filter">
      <h5 class="title">${t`Search`}</h5>
      ${template_search(app)}
    </div>
  ` : null;
  return html`
    <div class="sidebar filters">

      <button class="close" onclick="${() => {
    app.toggleVisiblePanel("filters");
    app.render();
  }}">
        <img src="/images/close.svg" />
      </button>

      <div class="inner">
        ${languageFilter || authorFilter ? html`<h3 class="title">
          ${t`Filter`}
        </h3>` : null}
        ${languageFilter}
        ${searchFilter}
        ${categoryFilter}
        ${authorFilter}
      </div>
    </div>
  `;
};
export const template_tags = (tags, placeholder, tagObjects) => {
  const makeSlimSelect = (select) => {
    if (select.slim) {
      select.slim.data.setSelectedFromSelect();
      select.slim.render();
    } else {
      new SlimSelect({select});
    }
  };
  const toggleTag = (event) => {
    for (const option of event.currentTarget.options) {
      tags.set(option.value, option.selected);
    }
    window.dispatchEvent(new CustomEvent("filter-selected"));
  };
  return html`
      <select ref="${makeSlimSelect}" multiple onchange="${toggleTag}">
        <option data-placeholder="true">${placeholder}</option>
        
        ${[...tags.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tag, selected]) => html`
          <option value="${tag}" .selected="${selected ? true : null}">${tagObjects ? getPropertyFromId(tagObjects, tag, Language.current, "name") : tag}</option>
        `)}
      </select>
    `;
};
export const template_languages = (languageFilter, languages) => {
  const setLanguage = (language) => {
    for (const [langCode, selected] of languageFilter) {
      languageFilter.set(langCode, langCode === language);
    }
    window.dispatchEvent(new CustomEvent("filter-selected"));
  };
  return html`
      <select onchange="${(event) => setLanguage(event.currentTarget.value)}">
        <option value="">${t`- All languages -`}</option>
        ${[...languageFilter.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([langCode, selected]) => html`
          <option value="${langCode}" .selected="${selected ? true : null}">${languages.get(langCode)}</option>
        `)}
      </select>`;
};
export const template_search = (app2) => {
  const setSearch = (event, search) => {
    if (event.ctrlKey || event.key === "Control")
      return;
    if (event.shiftKey || event.key === "Shift")
      return;
    app2.search = search;
    window.dispatchEvent(new CustomEvent("filter-selected"));
    window.dispatchEvent(new CustomEvent("searched"));
  };
  return html`
    <input value="${app2.search}" placeholder="${t.direct(`Search by keyword`)}" onkeyup="${(event) => setSearch(event, event.currentTarget.value)}" type="search" />
  `;
};
export const template_categories = (categories, categoryObjects) => {
  const toggleSubject = (category) => {
    for (const innerSubject of categories.keys()) {
      categories.set(innerSubject, innerSubject === category && !categories.get(category));
    }
    window.dispatchEvent(new CustomEvent("filter-selected"));
  };
  return html`
    <select class="mobile" onchange="${(event) => toggleSubject(event.currentTarget.value)}">
      <option value="">${t`- All categories -`}</option>
      ${[...categories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([category, selected]) => html`
        <option value="${category}" selected="${selected ? true : null}">
          ${categoryObjects?.length ? getPropertyFromId(categoryObjects, category, Language.current, "name") : category}
        </option>
      `)}
    </select>

    <ul class="list desktop">
      ${[...categories.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([category, selected]) => html`
        <li class="${"list-item " + (selected ? "active" : "")}" onclick="${() => toggleSubject(category)}">
          ${categoryObjects?.length ? getPropertyFromId(categoryObjects, category, Language.current, "name") : category}
        </li>
      `)}
    </ul>`;
};
export const template_overview = () => {
  let hiddenSelect;
  let visibleSelect;
  const filterUrl = app.createFilterUrl(app.filters);
  const sortItems = {
    title: t`Title`,
    authors: t`Author`,
    language: t`Language`
  };
  const sortChange = (event) => {
    app.sortBy = event.target.value;
    app.render();
    updateWidth();
  };
  const updateWidth = () => {
    const width = hiddenSelect.getBoundingClientRect().width;
    visibleSelect.style.width = width + "px";
  };
  const filterMapping = {
    category: app.categories,
    authors: app.authors,
    langCode: app.languages
  };
  const selectedFilters = [];
  const createFiltersClone = (ignoreName, ignoreKey) => {
    const filters2 = {
      tags: new Map(),
      category: new Map(),
      langCode: new Map(),
      authors: new Map()
    };
    for (const [name, values] of Object.entries(app.filters)) {
      filters2[name] = new Map();
      for (const [key, selected] of values.entries()) {
        filters2[name].set(key, ignoreName === name && ignoreKey === key ? false : selected);
      }
    }
    return filters2;
  };
  const selectedFilterClick = (event) => {
    event.preventDefault();
    const href = event.currentTarget.getAttribute("href");
    history.pushState(null, null, href);
    app.filters = app.createFilters(app.items, app.authors, app.categories);
    app.render();
  };
  for (const [name, values] of Object.entries(app.filters)) {
    for (const [key, selected] of values.entries()) {
      if (selected) {
        let label = key;
        if (Array.isArray(filterMapping?.[name])) {
          label = getPropertyFromId(filterMapping?.[name], key, Language.current, "name");
        } else {
          label = filterMapping?.[name].get(key);
        }
        const newFilters = createFiltersClone(name, key);
        const filtersQuery = app.createFilterUrl(newFilters);
        selectedFilters.push(html`<a class="selected-filter" onclick="${selectedFilterClick}" href="${"/?" + filtersQuery}">${label} <img src="/images/close.svg"></a>`);
      }
    }
  }
  return html`
    <div class="content-wrapper">
      ${template_content_top()}
      <h1 class="site-title desktop" ref="${(element) => element.innerHTML = app.siteInfo.name}"></h1>
      <div class="page-actions">

        <button class="toggle-filters mobile" onclick="${() => {
    app.toggleVisiblePanel("filters");
    app.render();
  }}">
          <img src="/images/filter.svg" />
          ${t`Filter`}
        </button>

        <div class="sort-wrapper">
          <h4 class="title">${t`Sort by`}</h4>

          <select ref="${(element) => hiddenSelect = element}" class="hidden">
            <option>${sortItems[app.sortBy]}</option>
          </select>

          <select onchange="${sortChange}" ref="${(element) => {
    visibleSelect = element;
    setTimeout(updateWidth, 20);
  }}">
            ${Object.entries(sortItems).map(([key, label]) => html`<option selected=${app.sortBy === key ? true : null} value="${key}">${label}</option>`)}
          </select>

        </div>

        ${selectedFilters.length ? html`
        <div class="selected-filters">
          <label>${t`Your filters`}</label>
          ${selectedFilters}
        </div>
        ` : html``}

      </div>
      <div class="overview content">
        ${app.filteredItems.map((item) => getEntityType(item.type).teaser(item, filterUrl))}
      </div>  
    </div>      
    `;
};
export const template_content_top = (content = null) => {
  const isActive = location.pathname === "/about";
  const closeMenu = (event) => {
    linkClick(event);
    app.showPanel = "";
    app.render();
  };
  return html`
      <div class="content-top">

        <button class="close" onclick="${() => {
    app.toggleVisiblePanel("");
    app.render();
  }}">
          <img src="/images/close.svg" />
        </button>

        ${content ? content : ""}

        <nav class="main-menu-wrapper">
          <ul class="main-menu">
            <li class="menu-item"><a onclick="${closeMenu}" class="${"menu-link " + (isActive ? "active" : "")}" href="/about">${t`About this website`}</a></li>
          </ul>
        </nav>       

        ${template_site_language()}

      </div>
    `;
};
export const template_site_language = () => {
  let hiddenSelect;
  let visibleSelect;
  const setSiteLanguage = async (langCode) => {
    await Language.setCurrent(langCode);
    app.showPanel = "";
    app.updateUrl();
    await app.render();
    updateWidth();
  };
  const updateWidth = () => {
    const width = hiddenSelect.getBoundingClientRect().width;
    visibleSelect.style.width = width + "px";
  };
  return html`
  <div class="site-language-picker-wrapper">

    <select ref="${(element) => hiddenSelect = element}" class="hidden">
      <option>${Language.uiLanguages[Language.current]}</option>
    </select>

    <img class="site-language-picker-icon" src="/images/language.svg">

    <select ref="${(element) => {
    visibleSelect = element;
    setTimeout(updateWidth, 20);
  }}" class="site-language-picker" onchange="${(event) => setSiteLanguage(event.currentTarget.value)}">
      ${[...Object.entries(Language.uiLanguages)].sort(([a], [b]) => a.localeCompare(b)).map(([langCode, label]) => html`
        <option selected="${Language.current === langCode ? true : null}" value="${langCode}">${label}</option>
      `)}
    </select>
  </div>`;
};
export const template_about = () => {
  return html`
      <div class="content-wrapper">

        ${template_content_top()}

        <h1 class="site-title desktop" ref="${(element) => element.innerHTML = app.siteInfo.name}"></h1>
        <div class="overview content">
          <div class="text-page" ref="${(element) => element.innerHTML = app.siteInfo.about}"></div>
        </div>
        
      </div>
    `;
};
