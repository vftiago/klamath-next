import type { RepositoryNode } from "./get-repository-data";

// client-safe helpers: no octokit import, so client components can use these without pulling the GraphQL client into the bundle

// repos without commits rank as 0 so they always sink to the end of the default (descending) order
export const getLatestCommitTime = (repo: RepositoryNode): number => {
  const committedDate = repo.defaultBranchRef?.target.history.edges[0]?.node.committedDate;

  return committedDate ? new Date(committedDate).getTime() : 0;
};
