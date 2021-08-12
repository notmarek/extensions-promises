import { Chapter, ChapterDetails, Tag, HomeSection, LanguageCode, Manga, MangaStatus, MangaTile, MangaUpdates, PagedResults, SearchRequest, TagSection } from "paperback-extensions-common";

const entities = require("entities");

export interface UpdatedManga {
  ids: string[],
  loadMore: boolean;
}

export const parseMangaDetails = ($: CheerioStatic, mangaId: string): Manga => {
  const panel = $("#content");
  const titles = [];
  titles.push(decodeHTMLEntity($(".heading.py-2>h5.text-highlight", panel).contents().text() ?? ""));

  const image = $(".media-content", panel).attr("style")?.replace("background-image:url(", "https://lynxscans.com").replace(")", "");
  const description = $("[name=\"description\"]").attr("content");



  const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: [] })];

  return createManga({
    id: mangaId,
    titles: titles,
    image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
    rating: 0,
    status: MangaStatus.ONGOING,
    author: "",
    artist: "",
    tags: tagSections,
    desc: !description ? "" : decodeHTMLEntity(description),
    hentai: false
  });
}

export const parseChapters = ($: CheerioStatic, mangaId: string): Chapter[] => {
  const chapters: Chapter[] = [];

  for (const chapter of $(".list-item.col-sm-3.no-border", ".list.list-row.row").toArray()) {

    const title = decodeHTMLEntity($("a.item-author.text-color", chapter).text().trim());
    const id = $("a.item-author.text-color", chapter).attr('href')?.split('/').pop() ?? "";
    let chapterNumber: number = parseInt($(".text-muted.text-sm", chapter).text().trim() ?? "0");
    if (!id) continue;
    chapters.push(createChapter({
      id: id,
      mangaId,
      name: title,
      langCode: LanguageCode.ENGLISH,
      chapNum: chapterNumber,
      time: undefined,
    }));
  }
  return chapters;
}

export const parseChapterDetails = (content: string, mangaId: string, chapterId: string): ChapterDetails => {
  const pages: string[] = [];
  let re = /window.chapterPages = (.*?);/;
  let res = re.exec(content);
  if (!res) { } else {
    JSON.parse(res[1]).map((x: string) => { let r = "https://lynxscans.com/" + x.replaceAll("\\/", "/"); pages.push(r.replaceAll(" ", "%20")); });
  }
  const chapterDetails = createChapterDetails({
    id: chapterId,
    mangaId: mangaId,
    pages: pages,
    longStrip: false
  });
  return chapterDetails;
}

export const parseUpdatedManga = ($: CheerioStatic, time: Date, ids: string[]): UpdatedManga => {
  const updatedManga: string[] = [];
  let loadMore = true;

  for (const manga of $("div.content-genres-item", "div.panel-content-genres").toArray()) {
    const id = $("a", manga).attr('href')?.split('/').pop()?.replace(/\/$/, "") ?? "";
    const mangaDate = new Date($("span.genres-item-time", manga).text().trim() ?? "");
    if (!id) continue;
    if (mangaDate > time) {
      if (ids.includes(id)) {
        updatedManga.push(id);
      }
    } else {
      loadMore = false;
    }
  }
  return {
    ids: updatedManga,
    loadMore
  }
}

export const parseHomeSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
  for (const section of sections) sectionCallback(section);

  //NewReleases
  const NewReleases: MangaTile[] = [];
  for (const manga of $("div.list-item.rounded", "#content div.row:nth-child(2)").toArray()) {
    const title = $('.list-title.ajax', manga).text().trim() ?? "";
    const id = $('.list-title.ajax', manga).attr('href')?.split('/').pop();
    const image = $('a', manga).first().attr("style")?.replace("background-image:url(", "https://lynxscans.com").replace(");height: 100%;", "") ?? "";
    const subtitle = $(".badge.badge-md.text-uppercase.bg-darker-overlay", manga).text().trim() ?? "";
    if (!id || !title) continue;
    NewReleases.push(createMangaTile({
      id: id,
      image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }
  sections[0].items = NewReleases;
  sectionCallback(sections[0]);

  // Recommended
  const Recommended: MangaTile[] = [];
  for (const manga of $("div.list-item.rounded", "#content div.row:nth-child(5)").toArray()) {
    const title = $('.list-title.ajax', manga).text().trim() ?? "";
    const id = $('.list-title.ajax', manga).attr('href')?.split('/').pop();
    const image = $('a', manga).first().attr("style")?.replace("background-image:url(", "https://lynxscans.com").replace(")", "") ?? "";
    const subtitle = $(".badge.badge-md.text-uppercase.bg-darker-overlay", manga).text().trim() ?? "";
    if (!id || !title) continue;
    Recommended.push(createMangaTile({
      id: id,
      image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }
  sections[1].items = Recommended;
  sectionCallback(sections[1]);

  for (const section of sections) sectionCallback(section);
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
  const mangas: MangaTile[] = [];
  for (const manga of $("div.list-item.rounded", "#content").toArray()) {
    const title = $('.list-title.ajax', manga).text().trim() ?? "";
    const id = $('.list-title.ajax', manga).attr('href')?.split('/').pop();
    const image = $('a', manga).first().attr("style")?.replace("background-image:url(", "https://lynxscans.com").replace(");height: 100%;", "") ?? "";
    const subtitle = $(".badge.badge-md.text-uppercase.bg-darker-overlay", manga).text().trim() ?? "";
    if (!id || !title) continue;
    mangas.push(createMangaTile({
      id: id,
      image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }
  return mangas;
}

export const generateSearch = (query: SearchRequest): string => {
  let search: string = query.title ?? "";
  return encodeURI(search);
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
  const mangas: MangaTile[] = [];
  for (const manga of $("div.list-item.rounded", "#content").toArray()) {
    const title = $('.list-title.ajax', manga).text().trim() ?? "";
    const id = $('.list-title.ajax', manga).attr('href')?.split('/').pop();
    const image = $('a', manga).first().attr("style")?.replace("background-image:url(", "https://lynxscans.com").replace(")", "") ?? "";
    const subtitle = $(".badge.badge-md.text-uppercase.bg-darker-overlay", manga).text().trim() ?? "";
    if (!id || !title) continue;
    mangas.push(createMangaTile({
      id: id,
      image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }
  return mangas;
}

export const parseTags = ($: CheerioStatic): TagSection[] | null => {
  const arrayTags: Tag[] = [];
  for (const tag of $("a.a-h.text-nowrap", "div.panel-category").toArray()) {
    const label = $(tag).text().trim();
    const id = encodeURI($(tag).attr("href")?.split('/').pop()?.replace(/\/$/, "") ?? "");
    if (!id || !label) continue;
    arrayTags.push({ id: id, label: label });
  }
  const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
  return tagSections;
}

export const isLastPage = ($: CheerioStatic): boolean => {
  const disabled = $('.page-item.disabled').text();
  return disabled.trim().includes("Next");
}
export const isLastSearchPage = ($: CheerioStatic): boolean => {
  const disabled = $('.page-item.disabled').attr("aria-label");
  if (!disabled) return true;
  return disabled.trim().includes("Next");
}

const decodeHTMLEntity = (str: string): string => {
  return entities.decodeHTML(str);
}
