"use client";

import { useState } from "react";

import ProjectFilter from "./project-filter";
import ProjectList from "./project-list";

import { ProjectNode } from "@/api/get-project-data";

type ProjectDataContainerProps = {
  initialProjectList: ProjectNode[];
};

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
      {!openProjects.length && !closedProjects.length ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">No projects found</h2>
          <p>Try another search term</p>
        </div>
      ) : null}
      <ProjectList projectList={openProjects} title="Open Projects" />
      <ProjectList closed projectList={closedProjects} title="Closed Projects" />
    </div>
  );
};

export default ProjectDataContainer;
