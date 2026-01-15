import clsx from "clsx";

import { ProjectItemNode, ProjectNode } from "@/api/get-project-data";
import CardBase from "@/app/_shared/ui/card-base";

type IssueSectionProps = {
  title: string;
  issues: ProjectItemNode[];
};

const IssueSection = ({ title, issues }: IssueSectionProps) => (
  <div className="flex flex-col gap-1">
    <h3 className="text-xs">{title}</h3>
    {issues.length > 0 ? (
      <ul className="flex list-disc flex-col overflow-y-auto p-0">
        {issues.slice(0, 3).map((item) => (
          <li key={item.content.id}>— {item.content.title}.</li>
        ))}
        {issues.length > 3 && <li className="text-xs">+{issues.length - 3} more</li>}
      </ul>
    ) : (
      <p>— Nothing.</p>
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

  const inProgressIssues = items.nodes.filter((item) => item.fieldValueByName?.name === "In Progress");
  const todoIssues = items.nodes.filter((item) => item.fieldValueByName?.name === "Todo");

  return (
    <CardBase
      title={title}
      homepageUrl={homepageUrl}
      githubUrl={repositoryUrl}
      description={shortDescription}
      className={clsx("font-roboto-condensed transition-opacity duration-500 ease-in-out", {
        "opacity-50 hover:opacity-100": closed,
        "min-h-80": !closed,
      })}
    >
      {!closed && (
        <div className="flex flex-col gap-2">
          <IssueSection title="Currently In Progress" issues={inProgressIssues} />
          <IssueSection title="Next Up" issues={todoIssues} />
        </div>
      )}
    </CardBase>
  );
};

export default ProjectCard;
