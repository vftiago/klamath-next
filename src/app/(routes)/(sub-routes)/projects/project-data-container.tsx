"use client";

import { useMemo, useState } from "react";
import type { ProjectNode } from "@/api/get-project-data";
import EmptyState from "@/app/_shared/ui/empty-state";
import ProjectFilter from "./project-filter";
import ProjectList from "./project-list";

type ProjectDataContainerProps = {
  initialProjectList: ProjectNode[];
};

const ProjectDataContainer = ({ initialProjectList }: ProjectDataContainerProps) => {
  const [filteredProjects, setFilteredProjects] = useState(initialProjectList);

  const openProjects = useMemo(
    () => filteredProjects.filter((project) => !project.closed),
    [filteredProjects],
  );

  const closedProjects = useMemo(
    () => filteredProjects.filter((project) => project.closed),
    [filteredProjects],
  );

  return (
    <div className="flex flex-col gap-10">
      <ProjectFilter projectList={initialProjectList} onFilteredListChange={setFilteredProjects} />
      {!openProjects.length && !closedProjects.length ? (
        <EmptyState title="No projects found" />
      ) : null}
      <ProjectList projectList={openProjects} title="Open Projects" />
      <ProjectList projectList={closedProjects} title="Closed Projects" />
    </div>
  );
};

export default ProjectDataContainer;
