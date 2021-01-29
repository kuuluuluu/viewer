import {html} from "../vendor/uhtml.js";
import {lastPart, linkClick} from "../helpers.js";
import {template_content_top} from "../BaseTemplates.js";
import {app} from "../App.js";
export class Video {
  constructor() {
    this.player = new Map();
    this.videoIsPaused = new Map();
  }
  teaser(item, filters) {
    const typeSlug = item.type.toLowerCase();
    const youtubeId = item.links.replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "");
    return html`
      <a href="${"/" + typeSlug + "/" + lastPart(item.id) + `?item-language=${item.langCode}` + (filters ? "&" + filters : "")}" 
         class="${"teaser " + typeSlug}" 
         onclick="${linkClick}">
        ${item.covers ? html`<div class="cover-wrapper"><img class="cover" src="${item.covers}" /></div>` : ""}
        <div class="progress" style="${`width: ${localStorage[youtubeId] ? localStorage[youtubeId] : 0}%;`}" ></div>
        <h3 class="title">${item.title}</h3>
      </a>
    `;
  }
  page() {
    const query = new URLSearchParams(location.search);
    const id = location.pathname.split("/")?.[2];
    const item = app.items.find((item2) => lastPart(item2.id) === id && item2.langCode === query.get("item-language"));
    if (!item)
      window.location.pathname = "/";
    const typeSlug = item.type.toLowerCase();
    const youtubeId = item.links.replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "");
    const youtubeLink = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&modestbranding=1&rel=0&disablekb=1&showinfo=0&showsearch=0&playsinline=1`;
    const attachApi = async (element) => {
      await this.loadYoutubeAPI();
      if (this.player.get(element))
        return;
      this.player.set(element, new window.YT.Player(element, {
        events: {
          onStateChange: (event) => {
            if (!this.player.get(element))
              return;
            const percentage = 100 / this.player.get(element).getDuration() * this.player.get(element).getCurrentTime();
            localStorage[youtubeId] = parseInt(percentage.toString());
            const newState = event.data === 2;
            if (this.videoIsPaused.get(youtubeId) !== newState) {
              this.videoIsPaused.set(youtubeId, newState);
              window.dispatchEvent(new CustomEvent("should-render"));
            }
          }
        }
      }));
    };
    return html`
      <div class="content-wrapper">
        ${template_content_top()}
        <div class="${"full content " + typeSlug}">
          <h1>${item.title}</h1>

          <div class="video-wrapper">
            <div class="responsive-youtube" paused="${this.videoIsPaused.get(youtubeId) ? true : null}">
              <iframe ref="${attachApi}" src="${youtubeLink}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>

        </div>
      </div>
    `;
  }
  async loadYoutubeAPI() {
    return new Promise((resolve) => {
      if (!document.querySelector("#youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = resolve;
      } else {
        resolve(null);
      }
    });
  }
}
