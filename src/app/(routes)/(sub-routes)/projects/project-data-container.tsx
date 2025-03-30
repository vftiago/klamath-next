"use client";

import { useState } from "react";

import ProjectFilter from "./project-filter";
import ProjectList from "./project-list";

import { ProjectNode } from "@/api/get-project-data";

interface ProjectDataContainerProps {
  initialProjectList: ProjectNode[];
}

const ProjectDataContainer = ({ initialProjectList }: ProjectDataContainerProps) => {
  const [filteredProjects, setFilteredProjects] = useState(initialProjectList);

  const openProjects = filteredProjects.filter((project) => {
    return !project.closed;
  });

  const closedProjects = filteredProjects.filter((project) => {
    return project.closed;
  });

  return (
    <div className="flex flex-col gap-10">
      <ProjectFilter projectList={initialProjectList} onFilteredListChange={setFilteredProjects} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm">Open Projects</h2>
          <div className="flex-1 border-t border-neutral-300" />
        </div>
        <ProjectList projectList={openProjects} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm">Closed Projects</h2>
          <div className="flex-1 border-t border-neutral-300" />
        </div>
        <ProjectList projectList={closedProjects} />
      </div>
    </div>
  );
};

export default ProjectDataContainer;
