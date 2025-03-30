import { graphqlOptions, graphqlWithAuth } from "./octokit-api";

type ProjectContentItem = {
  id: string;
  title: string;
  body: string;
  bodyHTML: string;
};

export type ProjectItemNode = {
  fieldValueByName: {
    name?: string;
  } | null;
  content: ProjectContentItem;
};

export type ProjectNode = {
  id: string;
  title: string;
  url: string;
  shortDescription: string | null;
  readme: string | null;
  closed: boolean;
  repositories: {
    nodes: {
      homepageUrl: string | null;
      url: string | null;
    }[];
  };
  items: {
    nodes: ProjectItemNode[];
  };
};

type UserProjects = {
  user: {
    projectsV2: {
      nodes: ProjectNode[];
    };
  };
};

export const getProjectData = async (): Promise<UserProjects> => {
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
                readme
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
                        body
                        bodyHTML
                      }
                      ... on Issue {
                        id
                        title
                        body
                        bodyHTML
                      }
                      ... on PullRequest {
                        id
                        title
                        body
                        bodyHTML
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

    return projectData;
  } catch (error) {
    console.error("Error fetching project data", error);

    throw new Error("Project data fetch failed");
  }
};
