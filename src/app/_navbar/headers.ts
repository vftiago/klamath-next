import { addWeight, weighted } from "@lrkit/weighted";
import { WeightedTable } from "@lrkit/weighted/types";

export enum RARITY {
  Common = "COMMON",
  Uncommon = "UNCOMMON",
  Rare = "RARE",
}

const WEIGHT: Record<RARITY, number> = {
  [RARITY.Common]: 10,
  [RARITY.Uncommon]: 5,
  [RARITY.Rare]: 1,
};

type Headers = {
  [path: string]: {
    [rarity in RARITY]: string[];
  };
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TODAY = WEEKDAYS[new Date().getDay()];

export const HEADERS: Headers = {
  "/": {
    [RARITY.Common]: ["Hello World", "Welcome", "Hello", "Landing page", "Take a seat"],
    [RARITY.Uncommon]: [
      "Online",
      `It is ${TODAY}`,
      "This is an uncommon header",
      "Just some text on a screen",
      "Probably not the worst website you'll visit today",
      "Oh, I didn't see you there",
      "Glad you're here",
    ],
    [RARITY.Rare]: [
      "Everything I ever said has been satire",
      "Windows 96",
      "Hypnotic isn't it?",
      "const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)",
      "I'm not a robot",
      "This is a rare header",
      "You shouldn't be here",
      "Welcome to the simulation",
      `Congratulations, you are my 1000th visitor!`,
      "Don't stare",
      "Keep staring",
      "You found me!",
      "Stay a while and read",
      "</thinking>",
      "I don't know what the sphere represents yet",
      "Perfect gem activated",
    ],
  },
  "/projects": {
    [RARITY.Common]: [
      "Projects",
      "Stuff I'm working on",
      "My projects",
      "Stuff I've been working on lately",
      "Ongoing projects",
    ],
    [RARITY.Uncommon]: ["What's cooking"],
    [RARITY.Rare]: ["This page was once a take home exercise"],
  },
  "/repositories": {
    [RARITY.Common]: ["Repositories", "My repositories", "My code"],
    [RARITY.Uncommon]: ["What's cooking"],
    [RARITY.Rare]: ["This page was once a take home exercise"],
  },
  "/about": {
    [RARITY.Common]: ["About", "Quick summary", "Me"],
    [RARITY.Uncommon]: ["Who am I?"],
    [RARITY.Rare]: ["What is this?", "Who are you?", "Who is this?"],
  },
  "/posts": {
    [RARITY.Common]: ["Blog", "Not actually a blog though", "Posts", "Articles", "Thoughts"],
    [RARITY.Uncommon]: ["What's new", "Recent thoughts", "Latest posts", "Latest articles"],
    [RARITY.Rare]: ["This is a rare header"],
  },
} as const;

export const WEIGHTED_RARITY: WeightedTable<RARITY> = weighted(
  Object.entries(RARITY).flatMap(([, rarity]) => addWeight([rarity], WEIGHT[rarity])),
);
