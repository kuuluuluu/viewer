import {html} from "../vendor/uhtml.js";
import {lastPart, linkClick, getPropertyFromId, responsiveImage} from "../helpers.js";
import {template_content_top} from "../BaseTemplates.js";
import {app} from "../App.js";
import {t} from "../LanguageService.js";
export class Ebook {
  teaser(item, filters) {
    let frontCover = item?.covers?.find((cover) => cover.includes("front"));
    if (!frontCover && item?.covers?.length)
      frontCover = item?.covers[0];
    const authorNames = item.authors.map((authorId) => getPropertyFromId(app.authors, authorId, item.langCode, "name"));
    const link = "/ebook/" + lastPart(item.id) + `?item-language=${item.langCode}` + (filters ? "&" + filters : "");
    return html`
      <a href="${link}" class="teaser ebook" onclick="${linkClick}">
        ${frontCover ? html`<img loading="lazy" class="image" src="${responsiveImage(frontCover, {
      width: 230
    })}" />` : ""}
        <h3 class="title">${item.title}</h3>
        ${authorNames.length ? html`<span class="sub-title">${authorNames.map((authorName) => authorName)}</span>` : html``}
      </a>
    `;
  }
  pageInit() {
    app.currentCover = "front";
  }
  page() {
    const query = new URLSearchParams(location.search);
    const id = location.pathname.split("/")?.[2];
    const item = app.items.find((item2) => lastPart(item2.id) === id && item2.langCode === query.get("item-language"));
    if (!item)
      window.location.pathname = "/";
    const authors = item.authors.map((authorId) => getPropertyFromId(app.authors, authorId, item.langCode));
    const isDesktop = window.innerWidth >= 1100;
    const backButton = (extraClass) => html`<a class="${"back-to-overview " + extraClass}" onclick="${linkClick}" href="${"/?" + app.createFilterUrl()}"><span class="triangle">◀</span>${t`Back to search results`}</a>`;
    return html`
      <div class="content-wrapper">
        ${template_content_top()}

        <div class="${"full content ebook"}">
          <div class="grid-header">
            ${backButton("")}

            ${isDesktop ? html`
            <h1 class="title">${item.title}</h1>
            <h3 class="authors">${authors.map((author) => author.name)}</h3>
            ${this.downloads(item)}
            ` : html``}
            
          </div>

          <header class="book-header">
            ${!isDesktop ? html`
              <h1 class="title">${item.title}</h1>
              <h3 class="authors">${authors.map((author) => author.name)}</h3>            
            ` : html``}

            ${this.languages(item)}
            
          </header>

          <div class="cover-and-download-wrapper field">
            ${this.covers(item)}
            ${!isDesktop ? this.downloads(item) : html``}
          </div>

          <div class="description field">
            <p>${item.description}</p>
            ${this.videos(item)}
          </div>

          <div class="authors field">
            ${this.authors(authors)}
          </div>

        </div>
      </div>
    `;
  }
  covers(item) {
    let frontCover = item?.covers?.find((cover) => cover.includes("front"));
    if (!frontCover && item?.covers?.length)
      frontCover = item?.covers[0];
    const backCover = item?.covers?.find((cover) => cover.includes("back"));
    const coverClick = () => {
      if (frontCover && backCover) {
        app.currentCover = app.currentCover === "front" ? "back" : "front";
        app.render();
      }
    };
    return html`
      ${frontCover ? html`<img cover="${app.currentCover}" onclick="${coverClick}" class="cover front" alt="${item.title}" src="${responsiveImage(frontCover, {
      width: 400
    })}" />` : ""}
      ${backCover ? html`<img cover="${app.currentCover}" onclick="${coverClick}" class="cover back" alt="${item.title}" src="${responsiveImage(backCover, {
      width: 400
    })}" />` : ""}
    `;
  }
  downloads(item) {
    const pdfFile = item?.links?.find((file) => file.includes(".pdf"));
    const epubFile = item?.links?.find((file) => file.includes(".epub"));
    return pdfFile || epubFile ? html`
      <div class="downloads field">
        ${pdfFile ? html`<a class="pdf file-download" href="${pdfFile}" target="_blank"><img src="/images/download.svg" /><span>${t`PDF`}</span></a>` : ""}
        ${epubFile ? html`<a class="epub file-download" href="${epubFile}" target="_blank"><img src="/images/download.svg" /><span>${t`ePub`}</span></a>` : ""}
      </div>
    ` : "";
  }
  languages(item) {
    const typeSlug = item.type.toLowerCase();
    const filters = app.createFilterUrl();
    const otherLanguages = app.items.filter((innerItem) => innerItem.id === item.id && innerItem.language !== item.language).map((item2) => {
      return {
        language: item2.language,
        langCode: item2.langCode
      };
    });
    return html`
    <div class="language field">
      <label class="field-label language-label">${t`Language:`}</label>  
      <span class="value">${item.language}</span>
    </div>

    ${otherLanguages.length ? html`
      <div class="other-languages field">
        <label class="field-label also-available">${t`Also available in:`}</label>  
        ${otherLanguages.map((languageItem) => html`
          <a class="value other" onclick="${linkClick}" href="${"/" + typeSlug + "/" + lastPart(item.id) + `?item-language=${languageItem.langCode}` + (filters ? "&" + filters : "")}">${languageItem.language}</a>
        `)}
      </div>` : ""}

    ${item.originalTitle ? html`
      <div class="original-title field">
        <label class="original-title-label field-label">${t`Original title:`} </label>
        <span class="value">${item.originalTitle}</span>
    </div>` : ""}
    `;
  }
  videos(item) {
    const youtubeLinks = item?.links?.length ? item?.links.filter((file) => file.includes("youtube.com")).map((link) => {
      const youtubeId = link.replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "");
      return `https://www.youtube.com/embed/${youtubeId}`;
    }) : [];
    return youtubeLinks.map((link) => html`
      <div class="responsive-youtube">
        <iframe modestbranding="1" rel="0" src="${link}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>              
    `);
  }
  authors(authors) {
    return authors.map((author) => author?.description ? html`
      <div class="author-info">
        <p>
          ${author.image ? html`<img class="image" src="${responsiveImage(author.image, {width: 100})}">` : ""}
          ${author.description}
        </p>
      </div>
    ` : "");
  }
}
