import React from "react";
import clsx from "clsx";

import { ProjectItemNode, ProjectNode } from "@/api/get-project-data";
import GlassPanel from "@/app/_shared/ui/glass-panel";

type IssueSectionProps = {
  title: string;
  issues: ProjectItemNode[];
};

const IssueSection = ({ title, issues }: IssueSectionProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1">
      <h3 className="text-xs font-bold">{title}</h3>
    </div>

    {issues.length > 0 ? (
      <ul className="flex max-h-32 list-disc flex-col overflow-y-auto p-0">
        {issues.slice(0, 3).map((item) => (
          <li key={item.content.id}>— {item.content.title}.</li>
        ))}
        {issues.length > 3 && <li className="text-xs text-neutral-500">+{issues.length - 3} more</li>}
      </ul>
    ) : (
      <p>Nothing.</p>
    )}
  </div>
);

type ProjectCardProps = {
  projectNode: ProjectNode;
};

const ProjectCard = ({ projectNode }: ProjectCardProps) => {
  const { title, repositories, shortDescription, items, closed } = projectNode;

  const homepageUrl = repositories.nodes[0]?.homepageUrl;

  const repositoryUrl = repositories.nodes[0]?.url;

  const inProgressIssues = items.nodes.filter((item) => {
    const status = item.fieldValueByName?.name;
    return status === "In Progress";
  });

  const todoIssues = items.nodes.filter((item) => {
    const status = item.fieldValueByName?.name;
    return status === "Todo";
  });

  return (
    <GlassPanel
      rootClassName={clsx("flex flex-col gap-4 p-4 flex-1 min-h-80", {
        "opacity-50": closed,
      })}
    >
      <div className="flex flex-col border-b border-neutral-300 pb-2">
        <div className="flex justify-between">
          <h2 className="font-bold">{title}</h2>
          {homepageUrl && (
            <a
              aria-label={`${title}'s homepage`}
              href={homepageUrl}
              className="text-sm text-orange-600"
              target="_blank"
              rel="noreferrer"
            >
              {homepageUrl}
            </a>
          )}
        </div>
        {shortDescription && <div className="text-sm text-neutral-700">{shortDescription}</div>}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex flex-col gap-4">
          <IssueSection title="Currently In Progress" issues={inProgressIssues} />

          <IssueSection title="Next Up" issues={todoIssues} />
        </div>
        {repositoryUrl && (
          <div className="flex text-sm">
            <a
              aria-label={`${title}'s GitHub repository`}
              href={repositoryUrl}
              className="text-neutral-500"
              target="_blank"
              rel="noreferrer"
            >
              {repositoryUrl}
            </a>
          </div>
        )}
      </div>
    </GlassPanel>
  );
};

export default ProjectCard;
