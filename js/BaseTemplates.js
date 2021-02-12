import {html} from "./vendor/uhtml.js";
import {linkClick, getEntityType, getPropertyFromId} from "./helpers.js";
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
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
      <a class="site-logo-link" href="${`/?site-language=${Language.current}`}" onclick="${linkClick}">
        <img class="site-logo" src="${app.siteInfo.logo}" />
      </a>
      <h1 class="site-title mobile" ref="${(element) => element.innerHTML = app.siteInfo.name}"></h1>
    </header>
    `;
};
export const template_sidebar = () => {
  const filters = app.filters;
  const languages = app.languages;
  const languageFilter = filters.langCode.size > 1 ? html`
    <div class="filter">
      <h5 class="title">${t`I want results in the language:`}</h5>
      ${template_languages(filters.langCode, languages)}
    </div>
  ` : null;
  const subjectFilter = filters.subject.size ? html`
    <div class="filter">
      <h5 class="title">${t`Category`}</h5>
      ${template_subjects(filters.subject, app.categories)}
    </div>
  ` : null;
  const authorFilter = filters.authors.size > 1 ? html`
    <div class="filter">
      <h5 class="title">${t`Author(s)`}</h5>
      ${template_tags(filters.authors, t.direct(`Select an author`), app.authors)}
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
        ${subjectFilter}
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
          <option value="${tag}" selected="${selected ? true : null}">${tagObjects ? getPropertyFromId(tagObjects, tag, Language.current, "name") : tag}</option>
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
          <option value="${langCode}" selected="${selected ? true : null}">${languages.get(langCode)}</option>
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
export const template_subjects = (subjects, subjectObjects) => {
  const toggleSubject = (subject) => {
    for (const innerSubject of subjects.keys()) {
      subjects.set(innerSubject, innerSubject === subject && !subjects.get(subject));
    }
    window.dispatchEvent(new CustomEvent("filter-selected"));
  };
  return html`
    <select class="mobile" onchange="${(event) => toggleSubject(event.currentTarget.value)}">
      <option value="">${t`- All subjects -`}</option>
      ${[...subjects.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([subject, selected]) => html`
        <option value="${subject}" selected="${selected ? true : null}">${subject}</option>
      `)}
    </select>

    <ul class="list desktop">
      ${[...subjects.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([subject, selected]) => html`
        <li class="${"list-item " + (selected ? "active" : "")}" onclick="${() => toggleSubject(subject)}">${subjectObjects ? getPropertyFromId(subjectObjects, subject, Language.current, "name") : subject}</li>
      `)}
    </ul>`;
};
export const template_overview = () => {
  let hiddenSelect;
  let visibleSelect;
  const filterUrl = app.createFilterUrl();
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
      </div>
      <div class="overview content">
        ${app.filteredItems.map((item) => getEntityType(item.type).teaser(item, filterUrl))}
      </div>  
    </div>      
    `;
};
export const template_content_top = (content = null) => {
  const isActive = location.pathname === "/about";
  return html`
      <div class="content-top">

        ${content ? content : ""}

        <nav class="main-menu-wrapper">
          <ul class="main-menu">
            <li class="menu-item"><a onclick="${linkClick}" class="${"menu-link " + (isActive ? "active" : "")}" href="/about">${t`About this website`}</a></li>
          </ul>
        </nav>       

        ${template_site_language()}

      </div>
    `;
};
export const template_site_language = () => {
  const setSiteLanguage = async (langCode) => {
    await Language.setCurrent(langCode);
    app.updateUrl();
    await app.render();
  };
  return html`
  <div class="site-language-picker-wrapper">
  <img class="site-language-picker-icon" src="/images/language.svg">
  <select class="site-language-picker" onchange="${(event) => setSiteLanguage(event.currentTarget.value)}">
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
