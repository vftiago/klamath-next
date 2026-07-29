import { graphql } from "@octokit/graphql";

const owner = process.env.OWNER;
const token = process.env.GITHUB_AUTH_TOKEN;

if (!owner || !token) {
  throw new Error("Missing required environment variables: OWNER and GITHUB_AUTH_TOKEN must both be set");
}

export const graphqlOptions = {
  owner,
};

export const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});
