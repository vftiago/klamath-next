This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Running Locally

To check the project on your machine, clone it, install dependencies (`pnpm i`) and run the development server (`pnpm dev`).
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Setting Up Environment Variables

To see your GitHub projects and repositories under their respective routes, you need to first create a `.env` file in the root of the project and set the `GITHUB_AUTH_TOKEN` and `OWNER` environment variables.
`OWNER` is your GitHub username or organization name, and `GITHUB_AUTH_TOKEN` is a personal access token with `repo` scope. You can create a personal access token in your GitHub account settings.
