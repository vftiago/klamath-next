import { graphql } from "@octokit/graphql";

export const graphqlOptions = {
  owner: process.env.OWNER,
};

export const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_AUTH_TOKEN}`,
  },
});
