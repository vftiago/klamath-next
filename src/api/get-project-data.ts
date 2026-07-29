import { graphqlOptions, graphqlWithAuth } from "./octokit-api";

export type ProjectItemNode = {
  content: ProjectContentItem;
  fieldValueByName: null | {
    name?: string;
  };
};

export type ProjectNode = {
  closed: boolean;
  id: string;
  items: {
    nodes: ProjectItemNode[];
  };
  repositories: {
    nodes: {
      homepageUrl: null | string;
      url: null | string;
    }[];
  };
  shortDescription: null | string;
  title: string;
  url: string;
};

type ProjectContentItem = {
  id: string;
  title: string;
};

type UserProjects = {
  user: {
    projectsV2: {
      nodes: ProjectNode[];
    };
  };
};

export const getProjectData = async (): Promise<ProjectNode[]> => {
  try {
    const projectData = await graphqlWithAuth<UserProjects>({
      query: /* GraphQL */ `
        query projectData($owner: String!, $projectCount: Int = 10, $itemCount: Int = 50) {
          user(login: $owner) {
            projectsV2(first: $projectCount) {
              nodes {
                id
                title
                url
                shortDescription
                closed
                repositories(first: 1) {
                  nodes {
                    homepageUrl
                    url
                  }
                }
                items(first: $itemCount) {
                  nodes {
                    fieldValueByName(name: "Status") {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                      }
                    }
                    content {
                      ... on DraftIssue {
                        id
                        title
                      }
                      ... on Issue {
                        id
                        title
                      }
                      ... on PullRequest {
                        id
                        title
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

    return projectData.user.projectsV2.nodes;
  } catch (error) {
    console.error("Error fetching project data", error);

    throw new Error("Project data fetch failed", { cause: error });
  }
};
