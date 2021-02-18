import {template_overview, template_page} from "./BaseTemplates.js";
import {app} from "./App.js";
import {getEntityType, lastPart, getPropertyFromId} from "./helpers.js";
import {Language} from "./LanguageService.js";
const setPage = (context) => {
  document.body.dataset.page = context.route.name;
  app.currentPage = context.route.name;
};
export const routes = () => {
  const routes2 = [
    {
      name: "home",
      path: "/",
      action: (context) => {
        setPage(context);
        return [
          template_overview()
        ];
      }
    },
    {
      name: "page",
      path: "/:type/:name",
      action: (context) => {
        const entityType = getEntityType(context.params.type);
        if (entityType) {
          if (app.currentPage !== "page")
            entityType.pageInit();
          setPage(context);
          return [
            entityType.page()
          ];
        }
      }
    }
  ];
  const pageIds = new Set();
  for (const page of app.pages) {
    const pageId = lastPart(page.id);
    if (!pageIds.has(lastPart(pageId))) {
      pageIds.add(lastPart(pageId));
      routes2.push({
        name: "page:" + pageId,
        path: "/" + pageId,
        action: (context) => {
          setPage(context);
          const contentPage = getPropertyFromId(app.pages, page.id, Language.current);
          return [
            template_page(contentPage)
          ];
        }
      });
    }
  }
  return routes2;
};
