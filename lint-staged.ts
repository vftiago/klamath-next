import path from "path";

const buildEslintCommand = (filenames: string[]): string =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(" --file ")}`;

export default {
  "**/*.{ts,tsx}": ["prettier --write", "tsc -p tsconfig.json --noEmit", buildEslintCommand],
};
