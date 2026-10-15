/**
 * Everything written on the city's neon signs and billboards. Edit here to customize.
 *
 * Rules: real words only, at most `MAX_TEXT_CHARS` characters (spaces count), uppercase Latin reads best in
 * neon. Japanese is drawn with the viewer's system CJK font. Vertical signs stack one character per cell.
 */

export const MAX_TEXT_CHARS = 12;

/**
 * The six big blade signs on the edge buildings, in order: left building top to bottom, then right
 * building top to bottom. Fewer entries than slots falls back to the pool; more are ignored.
 */
export const FRAME_SIGNS: readonly string[] = ["ラーメン", "KARAOKE", "居酒屋", "HOTEL", "寿司", "ARCADE"];

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
  "RAMEN",
  "HOTEL",
  "BAR",
  "SUSHI",
  "KARAOKE",
  "ARCADE",
  "VINYL",
  "TATTOO",
  "OPEN",
  "24H",
  "NOODLES",
  "CAFE",
  "PAWN",
  "DINER",
  "LIVE",
  "JAZZ",
  "MOTEL",
  "CINEMA",
  "GYOZA",
  "TAXI",
  "CLUB",
  "BOOKS",
  "LAUNDRY",
  "PIZZA",
  "GAMES",
  "REPAIR",
];

/** Pool for the rooftop billboards: short slogans and (fictional) brands. */
export const BILLBOARD_POOL: readonly string[] = [
  "KLAMATH",
  "ULTRA COLA",
  "NEO AIRLINES",
  "VISIT MARS",
  "HYPER TAXI",
  "SAKURA BANK",
  "NIGHT MARKET",
  "NEON TOWER",
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
