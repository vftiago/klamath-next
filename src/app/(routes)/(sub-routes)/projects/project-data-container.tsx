"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ProjectNode } from "@/api/get-project-data";
import EmptyState from "@/app/_shared/ui/empty-state";
import ProjectFilter from "./project-filter";
import ProjectList from "./project-list";

type ProjectDataContainerProps = {
  initialProjectList: ProjectNode[];
};

const ProjectDataContainer = ({ initialProjectList }: ProjectDataContainerProps) => {
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  const filteredProjects = useMemo(() => {
    if (!deferredSearch) {
      return initialProjectList;
    }

    const search = deferredSearch.toLowerCase();

    return initialProjectList.filter(
      (project) =>
        project.title.toLowerCase().includes(search) || project.shortDescription?.toLowerCase().includes(search),
    );
  }, [deferredSearch, initialProjectList]);

  const openProjects = useMemo(() => filteredProjects.filter((project) => !project.closed), [filteredProjects]);

  const closedProjects = useMemo(() => filteredProjects.filter((project) => project.closed), [filteredProjects]);

  return (
    <div className="flex flex-col gap-10">
      <ProjectFilter searchValue={searchValue} onSearchChange={setSearchValue} />
      {!openProjects.length && !closedProjects.length ? (
        <EmptyState message={deferredSearch ? undefined : "Nothing to see here."} title="No projects found" />
      ) : null}
      <ProjectList projectList={openProjects} title="Open Projects" />
      <ProjectList projectList={closedProjects} title="Closed Projects" />
    </div>
  );
};

export default ProjectDataContainer;
