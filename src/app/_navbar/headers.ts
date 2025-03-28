import { addWeight, weighted } from "@lrkit/weighted";
import { WeightedTable } from "@lrkit/weighted/types";

enum WEIGHT {
  common = 10,
  uncommon = 2,
  rare = 1,
}

type Rarity = keyof typeof WEIGHT;

type PathHeaders = {
  [K in Rarity]?: string[];
};

type HeaderDefinitions = {
  [path: string]: PathHeaders;
};

type WeightedHeaders = {
  [key: string]: WeightedTable<string>;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TODAY = WEEKDAYS[new Date().getDay()];

const HEADER_DEFINITIONS: HeaderDefinitions = {
  "/": {
    common: ["Hello World", "Welcome", "Hello", "This is a website"],
    uncommon: [
      "Online",
      `It is ${TODAY}`,
      "This is an uncommon header",
      "Just some text on a screen",
      "Probably not the worst site you've visited today",
      "Oh hi, I didn't see you there",
      "Glad you're here",
    ],
    rare: [
      "Everything I ever said has been satire",
      "Windows 96",
      "Hypnotic isn't it?",
      "const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)",
      "I'm not a robot",
      "This is a rare header",
      "You shouldn't be here",
      "Welcome to the simulation",
      `Congratulations, you are my 10000th visitor!`,
      "Don't stare",
      "Keep staring",
      "You found me!",
      "Stay a while and read",
      "</thinking>",
    ],
  },
  "/repositories": {
    common: ["Repositories", "Stuff I've been working on lately", "Latest work", "Recent work"],
    uncommon: ["Dashboard", "What's cooking", "Latest stuff", "Recent stuff"],
  },
  "/about": {
    common: ["About", "Quick summary"],
    uncommon: ["Who am I?"],
    rare: ["What is this?", "Who are you?", "Who is this?"],
  },
  "/posts": {
    common: ["Blog", "Not actually a blog though", "Posts", "Articles", "Thoughts"],
    uncommon: ["What's new", "Recent thoughts", "Latest posts", "Latest articles"],
  },
} as const;

export const WEIGHTED_HEADERS: WeightedHeaders = Object.fromEntries(
  Object.entries(HEADER_DEFINITIONS).map(([path, categories]) => [
    path,
    weighted(
      Object.entries(categories).flatMap(([category, headers]) =>
        addWeight(headers, WEIGHT[category as Rarity] ?? WEIGHT.common),
      ),
    ),
  ]),
);
