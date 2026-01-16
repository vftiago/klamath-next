"use client";

import { useState } from "react";
import type { RepositoryNode } from "@/api/get-repository-data";
import EmptyState from "@/app/_shared/ui/empty-state";
import RepositoryFilter from "./repository-filter";
import RepositoryList from "./repository-list";

type RepositoryDataContainerProps = {
  initialRepositoryList: RepositoryNode[];
};

const RepositoryDataContainer = ({ initialRepositoryList }: RepositoryDataContainerProps) => {
  const [filteredRepositories, setFilteredRepositories] = useState(initialRepositoryList);

  return (
    <div className="flex flex-col gap-10">
      <RepositoryFilter repositoryList={initialRepositoryList} onFilteredListChange={setFilteredRepositories} />
      {!filteredRepositories.length ? <EmptyState title="No repositories found" /> : null}
      <RepositoryList repositoryList={filteredRepositories} />
    </div>
  );
};

export default RepositoryDataContainer;
