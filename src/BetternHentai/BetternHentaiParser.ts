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
    RequestHeaders,
    MangaStatus,
    MangaTile
} from "paperback-extensions-common"

export interface nHentaiImage {
    t: string; // type
    w: number; // width
    h: number; // height
}

const typeOfImage = (image: nHentaiImage): string => {
    let map: { [key: string]: string } = { "j": "jpg", "p": "png" };
    return map[image.t];
}

export interface nHentaiImages {
    pages: nHentaiImage[];
    cover: nHentaiImage;
    thumbnail: nHentaiImage;
}

export interface nHentaiTag {
    id: number;
    type: string;
    name: string;
    url: string;
    count: number;
}

export interface GalleryTitle {
    english: string;
    japanese: string;
    pretty: string;
}

export interface Gallery {
    id: number;
    media_id: string;
    title: GalleryTitle;
    images: nHentaiImages;
    scanlator: string;
    upload_date: number;
    tags: nHentaiTag[];
    num_pages: number;
    num_favorites: number;
}

export interface nHentaiSearch {
    result: Gallery[];
}

export const parseGallery = (data: Gallery): Manga => {
    return createManga({
        id: data.id.toString(),
        titles: [data.title.english, data.title.japanese, data.title.pretty],
        image: `https://t.nhentai.net/galleries/${data.media_id}/cover.${typeOfImage(data.images.cover)}`,
        rating: 0,
        status: MangaStatus.COMPLETED,
    })
}

export const parseChapterDetails = (data: Gallery, mangaId: string): ChapterDetails => {
    let counter: number = 0;
    return createChapterDetails({
        id: "",
        mangaId: mangaId,
        longStrip: false,
        pages: data.images.pages.map(image => {
            let type = typeOfImage(image);
            counter++;
            return `https://i.nhentai.net/galleries/${data.media_id}/${counter}.${type}`;
        }),
    })
}

export const parseSearch = (data: nHentaiSearch): MangaTile[] => {
    const tiles: MangaTile[] = [];
    for (let gallery of data.result) {
        tiles.push(createMangaTile({
            id: gallery.id.toString(),
            image: `https://t.nhentai.net/galleries/${gallery.media_id}/cover.${typeOfImage(gallery.images.cover)}`,
            title: createIconText({
                text: gallery.title.english
            })
        }))
    }
    return tiles;
}