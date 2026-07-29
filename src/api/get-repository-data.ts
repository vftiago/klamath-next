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

// repos without commits rank as 0 so they always sink to the end of the default (descending) order
export const getLatestCommitTime = (repo: RepositoryNode): number => {
  const committedDate = repo.defaultBranchRef?.target.history.edges[0]?.node.committedDate;

  return committedDate ? new Date(committedDate).getTime() : 0;
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

    return repositoryData.user.repositories.nodes
      .filter((repo) => repo.name !== owner)
      .sort((a, b) => getLatestCommitTime(b) - getLatestCommitTime(a));
  } catch (error) {
    console.error("Error fetching repository data", error);

    throw new Error("Repository data fetch failed", { cause: error });
  }
};
