import React from "react";
import { VscGitCommit } from "react-icons/vsc";

import { RepositoryNode } from "@/api/get-repository-data";
import GlassPanel from "@/app/_shared/ui/glass-panel";

type RepositoryCardProps = {
  repositoryNode: RepositoryNode;
};

const RepositoryCard = ({ repositoryNode }: RepositoryCardProps) => {
  const { name, homepageUrl, url, defaultBranchRef } = repositoryNode;

  const commitHistory = defaultBranchRef ? defaultBranchRef.target.history.edges : [];

  return (
    <GlassPanel rootClassName="border drop-shadow flex flex-col justify-between gap-4 p-3 flex-1 min-h-64">
      <div className="flex items-center justify-between border-b pb-2 font-barlow">
        <h4 className="text-lg">{name}</h4>

        {homepageUrl && (
          <a
            aria-label={`${name}'s homepage`}
            className="underline"
            target="_blank"
            rel="noreferrer"
            href={homepageUrl}
          >
            {homepageUrl}
          </a>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {commitHistory.length ? (
          <ul className="flex flex-col gap-1 p-0">
            {commitHistory.map((commit, index) => {
              return (
                <li className="grid h-4 list-none grid-flow-col items-center justify-start gap-1 p-0" key={index}>
                  <VscGitCommit size="18px" />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{commit.node.message}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          "Nothing to see here."
        )}
      </div>
      <div className="flex">
        <a
          aria-label={`${name}'s GitHub repository`}
          className="font-barlow underline"
          target="_blank"
          rel="noreferrer"
          href={url}
        >
          {url}
        </a>
      </div>
    </GlassPanel>
  );
};

export default RepositoryCard;
