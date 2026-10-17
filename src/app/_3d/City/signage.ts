/**
 * Everything written on the city's neon signs and billboards. Edit here to customize.
 *
 * Rules: real words only, at most `MAX_TEXT_CHARS` characters (spaces count), uppercase Latin reads best in
 * neon. Japanese is drawn with the viewer's system CJK font. Vertical signs stack one character per cell.
 */

export const MAX_TEXT_CHARS = 12;

/** A slot on the edge frame buildings: side, then top to bottom. */
export type FrameSlot = "left-0" | "left-1" | "left-2" | "right-0" | "right-1" | "right-2";

export type FrameSign = {
  /** Route the sign will navigate to once signs are clickable; not used by the renderer yet. */
  href?: string;
  /** Stable id, the same at every viewport size and seed. */
  id: string;
  slot: FrameSlot;
  text: string;
};

/**
 * The six big blade signs on the edge buildings. They are authored, not rolled: always placed, in these
 * slots, with these words. An empty slot stays empty. The routes mirror the home page's links for now.
 */
export const FRAME_SIGNS: readonly FrameSign[] = [
  { href: "/projects", id: "frame-left-0", slot: "left-0", text: "ラーメン" },
  { href: "/repositories", id: "frame-left-1", slot: "left-1", text: "KARAOKE" },
  { href: "/about", id: "frame-left-2", slot: "left-2", text: "居酒屋" },
  { href: "https://dev.to/vftiago", id: "frame-right-0", slot: "right-0", text: "HOTEL" },
  { href: "https://www.linkedin.com/in/vftiago/", id: "frame-right-1", slot: "right-1", text: "寿司" },
  { href: "https://github.com/vftiago", id: "frame-right-2", slot: "right-2", text: "ARCADE" },
];

/** Pool for the smaller signs hung on buildings across the layers. Shop words, mixed Japanese and English. */
export const SIGN_POOL: readonly string[] = [
  "ラーメン",
  "居酒屋",
  "カラオケ",
  "寿司",
  "薬局",
  "質屋",
  "喫茶店",
  "銭湯",
  "焼肉",
  "弁当",
  "映画館",
  "眼鏡",
  "花屋",
  "歯科",
  "ホテル",
  "パチンコ",
  "古着",
  "餃子",
  "天ぷら",
  "理髪店",
  "本屋",
  "うどん",
  "蕎麦",
  "中華",
  "定食",
  "占い",
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
  "夜市",
  "未来へ",
  "新発売",
  "宇宙旅行",
  "電脳都市",
  "銀河鉄道",
  "今夜開催",
];
