import {
  Source,
  Manga,
  Chapter,
  ChapterDetails,
  HomeSection,
  SearchRequest,
  PagedResults,
  SourceInfo,
  MangaUpdates,
  TagType,
  TagSection,
  RequestHeaders
} from "paperback-extensions-common"
import { parseTags, parseSearch, isLastPage, parseViewMore, parseUpdatedManga, generateSearch, parseChapterDetails, parseChapters, parseHomeSections, parseMangaDetails, UpdatedManga, isLastSearchPage } from "./LynxScansParser"

const LS_DOMAIN = 'https://lynxscans.com'
const method = 'GET'

export const LynxScansInfo: SourceInfo = {
  version: '1.0.0',
  name: 'LynxScans',
  icon: 'icon.png',
  author: 'NotMarek',
  authorWebsite: 'https://github.com/NotMarek',
  description: 'Extension that pulls manga from LynxScans.',
  hentaiSource: false,
  websiteBaseURL: LS_DOMAIN,
  sourceTags: [
    {
      text: "Notifications",
      type: TagType.GREEN
    }
  ]
}

export class LynxScans extends Source {
  getMangaShareUrl(mangaId: string): string {
    return `${LS_DOMAIN}/comics/${mangaId}`
  }

  // Temporary solution until migration is out in public builds
  async getNewMangaId(oldMangaId: string): Promise<string> {
    return oldMangaId
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    let url: string
    url = `${LS_DOMAIN}/comics/${mangaId}`

    const request = createRequestObject({
      url,
      method,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    return parseMangaDetails($, mangaId);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    let url: string
    url = `${LS_DOMAIN}/comics/${mangaId}`

    const request = createRequestObject({
      url,
      method,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    return parseChapters($, mangaId);
  }

  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
    let newMangaId: string
    console.log(`mangaId: ${mangaId} chId: ${chapterId}`);
    console.log(`${LS_DOMAIN}/comics/${mangaId}/1/${chapterId}`);
    // if (mangaId.includes('manga')) {
    // newMangaId = mangaId
    // } else {
    // newMangaId = await this.getNewMangaId(mangaId)
    // }

    const request = createRequestObject({
      url: `${LS_DOMAIN}/comics/${mangaId}/1/${chapterId}`,
      method: method,
    });

    const response = await this.requestManager.schedule(request, 1);
    // const $ = this.cheerio.load(response.data, {xmlMode: false});
    return parseChapterDetails(response.data, mangaId, chapterId);
  }

  async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
    //   let page = 1
    //   let updatedManga: UpdatedManga = {
    //     ids: [],
    //     loadMore: true
    //   }

    //   while (updatedManga.loadMore) {
    //     const request = createRequestObject({
    //       url: `${LS_DOMAIN}/genre-all/${page++}`,
    //       method,
    //     });

    //     const response = await this.requestManager.schedule(request, 1);
    //     const $ = this.cheerio.load(response.data);

    // updatedManga = parseUpdatedManga($, time, ids)
    // if (updatedManga.ids.length > 0) {
    // mangaUpdatesFoundCallback(createMangaUpdates({
    // ids: []
    // }));
    // }
    //   }
  }

  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    const section1 = createHomeSection({ id: 'latest', title: 'NEW RELEASES', view_more: true });
    const section2 = createHomeSection({ id: 'recommended', title: 'RECOMMENDED RELEASES', view_more: false });
    // const section3 = createHomeSection({ id: 'new_manga', title: 'NEW MANGA', view_more: true });
    const sections = [section1, section2];
    const request = createRequestObject({
      url: LS_DOMAIN,
      method,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    parseHomeSections($, sections, sectionCallback);
  }

  async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.page ?? 1;
    let param = "";

    const request = createRequestObject({
      url: `${LS_DOMAIN}/${homepageSectionId}?page=${page}`,
      method,
      param,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    const manga = parseViewMore($);
    metadata = !isLastPage($) ? { page: page + 1 } : undefined;

    return createPagedResults({
      results: manga,
      metadata
    });
  }

  async searchRequest(query: SearchRequest, metadata: any): Promise<PagedResults> {
    let page: number = metadata?.page ?? 1;
    const search = generateSearch(query);
    const request = createRequestObject({
      url: `${LS_DOMAIN}/comics?query=${search}&page=${page}`,
      method,
    });

    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    const manga = parseSearch($);
    metadata = !isLastSearchPage($) ? { page: page + 1 } : undefined;

    return createPagedResults({
      results: manga,
      metadata
    });
  }

  // async getTags(): Promise<TagSection[] | null> {
  //   const request = createRequestObject({
  //     url: LS_DOMAIN,
  //     method,
  //   });

  //   const response = await this.requestManager.schedule(request, 1);
  //   const $ = this.cheerio.load(response.data);
  //   return parseTags($);
  // }

  globalRequestHeaders(): RequestHeaders {
    return {
      referer: LS_DOMAIN
    }
  }
}