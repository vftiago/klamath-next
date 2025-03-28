import { graphqlOptions, graphqlWithAuth } from "./octokit-api";

type ProjectItemNode = {
  content: {
    title: string;
    body: string;
    state: "OPEN" | "CLOSED";
  };
};

type IssueNode = {
  title: string;
  titleHTML: string;
  body: string;
  bodyHTML: string;
  state: "OPEN" | "CLOSED";
  projectItems: {
    nodes: ProjectItemNode[];
  };
};

export type RepositoryNode = {
  name: string;
  description: string | null;
  homepageUrl: string | null;
  url: string;
  owner: {
    login: string;
  };
  defaultBranchRef: {
    target: {
      history: {
        edges: {
          node: {
            message: string;
            committedDate: string;
          };
        }[];
      };
    };
  };
  issues: {
    nodes: IssueNode[];
  };
};

type UserRepositories = {
  user: {
    repositories: {
      nodes: RepositoryNode[];
    };
  };
};

export const getRepositoryData = async (): Promise<UserRepositories> => {
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

    return repositoryData;
  } catch (error) {
    console.error("Error fetching repository data", error);
    throw error;
  }
};
