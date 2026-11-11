import { LOGO } from "./logos";

/**
 * Everything written on the city's neon signs and billboards. Edit here to customize.
 *
 * Rules: real words only, at most `MAX_TEXT_CHARS` characters (spaces count), uppercase Latin reads best in
 * neon. Japanese is drawn with the viewer's system CJK font. Vertical signs stack one character per cell. A
 * `LOGO` character (see `logos.ts`) is a one-cell mark drawn in place of a word.
 */

export const MAX_TEXT_CHARS = 12;

/** A slot on the edge frame buildings: side, then top to bottom. */
export type FrameSlot = "left-0" | "left-1" | "left-2" | "right-0" | "right-1" | "right-2";

export type FrameSign = {
  /** Where a click on the sign goes: an app route, or an external URL (opened in a new tab). */
  href?: string;
  /** Stable id, the same at every viewport size and seed. */
  id: string;
  slot: FrameSlot;
  text: string;
};

/**
 * The big blade signs on the edge buildings. They are authored, not rolled: always placed, in these slots,
 * with these words. An empty slot stays empty, and a frame building with no signs keeps no strip clear for
 * them. The links mirror the home page's.
 */
export const FRAME_SIGNS: readonly FrameSign[] = [
  { href: "https://dev.to/vftiago", id: "frame-right-0", slot: "right-0", text: LOGO.devto },
  { href: "https://www.linkedin.com/in/vftiago/", id: "frame-right-1", slot: "right-1", text: LOGO.linkedin },
  { href: "https://github.com/vftiago", id: "frame-right-2", slot: "right-2", text: LOGO.github },
];

/** Pool for the smaller signs hung on buildings across the layers. Shop words, mixed Japanese and English. */
export const SIGN_POOL: readonly string[] = [
  "ラーメン", // ramen
  "居酒屋", // izakaya (pub)
  "カラオケ", // karaoke
  "寿司", // sushi
  "薬局", // pharmacy
  "質屋", // pawn shop
  "喫茶店", // kissaten (coffee house)
  "銭湯", // sento (public bath)
  "焼肉", // yakiniku (grilled meat)
  "弁当", // bento
  "映画館", // cinema
  "眼鏡", // glasses (optician)
  "花屋", // florist
  "歯科", // dentist
  "ホテル", // hotel
  "パチンコ", // pachinko
  "古着", // second-hand clothes
  "餃子", // gyoza
  "天ぷら", // tempura
  "理髪店", // barber
  "本屋", // bookshop
  "うどん", // udon
  "蕎麦", // soba
  "中華", // Chinese food
  "定食", // teishoku (set meal)
  "占い", // fortune telling
  // "RAMEN",
  "HOTEL",
  "BAR",
  // "SUSHI",
  "KARAOKE",
  "ARCADE",
  "VINYL",
  "NOODLES",
  "CAFE",
  "PAWN",
  "DINER",
  "LIVE",
  "JAZZ",
  // "GYOZA",
  "CLUB",
  "BOOKS",
  "LAUNDRY",
  // "PIZZA",
  "GAMES",
  "REPAIR",
];

/**
 * Words on the street stalls' neon headers (the solid-roof variants), Latin and Japanese mixed. Short: the
 * header is a few dozen px wide, and the Japanese comes out roughly twice as large per character.
 */
export const STALL_SIGNS: readonly string[] = [
  "寿司", // sushi
  "餃子", // gyoza
  "焼鳥", // yakitori (grilled chicken skewers)
  "団子", // dango (rice dumplings)
  "甘酒", // amazake (sweet rice drink)
  "天丼", // tendon (tempura rice bowl)
  "おでん", // oden (simmered hotpot)
  "かき氷", // kakigori (shaved ice)
  "カレー", // curry
  "唐揚げ", // karaage (fried chicken)
  "綿菓子", // wataame (cotton candy)
  "UDON",
  "SOBA",
  "ODEN",
  "BEER",
  "SAKE",
  // "ラーメン", // ramen
  // "たこ焼き", // takoyaki (octopus balls)
  // "クレープ", // crepes
  // "たい焼き", // taiyaki (filled fish-shaped cakes)
  // "りんご飴", // ringo ame (candy apples)
  // "焼きそば", // yakisoba (fried noodles)
  // "いか焼き", // ikayaki (grilled squid)
  // "中華そば", // chuka soba (old-style ramen)
  "SUSHI",
  "RAMEN",
  "GYOZA",
  "MOCHI",
  "DANGO",
  "TACOS",
  "CURRY",
  "PIZZA",
  "HOTDOG",
  "CREPES",
  "WAFFLE",
  // "ホットドッグ", // hot dog
  // "ポップコーン", // popcorn
  "POPCORN",
  // "BANH MI",
  // "TAKOYAKI",
  // "YAKITORI",
];

/** Pool for the rooftop billboards: short slogans and (fictional) brands. */
export const BILLBOARD_POOL: readonly string[] = [
  "KLAMATH",
  "ULTRA COLA",
  "OFFWORLD",
  "HELITAXI",
  "SAKURA BANK",
  "NIGHT MARKET",
  "MOTEL",
  "KINOPLEX",
  "OPEN",
  "24H",
  "24H DINER",
  "ROBOT RAMEN",
  "夜市", // night market
  "未来へ", // to the future
  "新発売", // new release
  "宇宙旅行", // space travel
  "電脳都市", // cyber city
  "銀河鉄道", // galactic railway
  "今夜開催", // held tonight
];
