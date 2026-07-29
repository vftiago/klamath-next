import { graphqlOptions, graphqlWithAuth } from "./octokit-api";

export type RepositoryNode = {
  defaultBranchRef: null | {
    target: {
      history: {
        edges: {
          node: {
            committedDate: string;
            message: string;
          };
        }[];
      };
    };
  };
  homepageUrl: null | string;
  name: string;
  url: string;
};

type UserRepositories = {
  user: {
    repositories: {
      nodes: RepositoryNode[];
    };
  };
};

export const getRepositoryData = async (): Promise<RepositoryNode[]> => {
  const owner = process.env.OWNER;

  try {
    const repositoryData = await graphqlWithAuth<UserRepositories>({
      query: /* GraphQL */ `
        query repositoryData($owner: String!, $repoCount: Int = 20, $commitCount: Int = 5) {
          user(login: $owner) {
            repositories(
              first: $repoCount
              isArchived: false
              isFork: false
              visibility: PUBLIC
              ownerAffiliations: OWNER
              orderBy: { field: PUSHED_AT, direction: DESC }
            ) {
              nodes {
                name
                homepageUrl
                url
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: $commitCount) {
                        edges {
                          node {
                            ... on Commit {
                              message
                              committedDate
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      ...graphqlOptions,
    });

    return repositoryData.user.repositories.nodes.filter((repo) => repo.name !== owner);
  } catch (error) {
    console.error("Error fetching repository data", error);

    throw new Error("Repository data fetch failed", { cause: error });
  }
};
