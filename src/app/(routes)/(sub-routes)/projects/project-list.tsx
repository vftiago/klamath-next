"use client";

import type { ProjectNode } from "@/api/get-project-data";
import ProjectCard from "./project-card";

type ProjectListProps = {
  projectList: ProjectNode[];
  title?: string;
};

const ProjectList = ({ projectList, title }: ProjectListProps) => {
  if (!projectList || projectList.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm">{title}</h2>
          <div className="flex-1 border-t" />
        </div>
      ) : null}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projectList.map((projectNode, index) => (
          <li
            className="flex animate-fade-in opacity-0"
            key={projectNode.id}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <ProjectCard projectNode={projectNode} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectList;
