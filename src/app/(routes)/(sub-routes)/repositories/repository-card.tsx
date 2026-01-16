import { VscGitCommit } from "react-icons/vsc";
import type { RepositoryNode } from "@/api/get-repository-data";
import CardBase from "@/app/_shared/ui/card-base";

type RepositoryCardProps = {
  repositoryNode: RepositoryNode;
};

const RepositoryCard = ({ repositoryNode }: RepositoryCardProps) => {
  const { defaultBranchRef, homepageUrl, name, url } = repositoryNode;

  const commitHistory = defaultBranchRef ? defaultBranchRef.target.history.edges : [];

  return (
    <CardBase className="min-h-64" githubUrl={url} homepageUrl={homepageUrl} title={name}>
      {commitHistory.length ? (
        <ul className="flex flex-col gap-1 p-0">
          {commitHistory.map((commit, index) => (
            <li
              className="grid h-4 list-none grid-flow-col items-center justify-start gap-1 p-0"
              key={index}
            >
              <VscGitCommit size="18px" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {commit.node.message}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        "Nothing to see here."
      )}
    </CardBase>
  );
};

export default RepositoryCard;
