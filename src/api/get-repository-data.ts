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
  description: null | string;
  homepageUrl: null | string;
  issues: {
    nodes: IssueNode[];
  };
  name: string;
  owner: {
    login: string;
  };
  url: string;
};

type IssueNode = {
  body: string;
  bodyHTML: string;
  projectItems: {
    nodes: RepositoryProjectItemNode[];
  };
  state: "CLOSED" | "OPEN";
  title: string;
  titleHTML: string;
};

type RepositoryProjectItemNode = {
  content: {
    body: string;
    state: "CLOSED" | "OPEN";
    title: string;
  };
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
        query repositoryData(
          $owner: String!
          $repoCount: Int = 20
          $commitCount: Int = 5
          $projectCount: Int = 20
          $itemCount: Int = 5
        ) {
          user(login: $owner) {
            repositories(
              first: $repoCount
              isArchived: false
              isFork: false
              orderBy: { field: PUSHED_AT, direction: DESC }
            ) {
              nodes {
                name
                owner {
                  login
                }
                description
                homepageUrl
                url
                ... on Repository {
                  issues(first: $projectCount, states: OPEN) {
                    nodes {
                      title
                      titleHTML
                      body
                      bodyHTML
                      state
                      stateReason
                      projectItems(first: $itemCount) {
                        nodes {
                          content {
                            ... on DraftIssue {
                              title
                              body
                            }
                            ... on Issue {
                              title
                              body
                              state
                              stateReason
                            }
                            ... on PullRequest {
                              title
                              body
                              state
                            }
                          }
                        }
                      }
                    }
                  }
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
        }
      `,
      ...graphqlOptions,
    });

    return repositoryData.user.repositories.nodes.filter((repo) => repo.owner.login === owner && repo.name !== owner);
  } catch (error) {
    console.error("Error fetching repository data", error);

    throw new Error("Repository data fetch failed");
  }
};
