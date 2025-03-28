"use client";

import { useState } from "react";
import RepositoryFilter from "./repository-filter";
import RepositoryList from "./repository-list";
import { RepositoryNode } from "@/api/get-repository-data";

interface FilteredRepositoryContainerProps {
  initialRepositoryList: RepositoryNode[];
}

const RepositoryDataContainer = ({ initialRepositoryList }: FilteredRepositoryContainerProps) => {
  const [filteredRepositories, setFilteredRepositories] = useState(initialRepositoryList);

  return (
    <div className="flex flex-col gap-10">
      <RepositoryFilter repositoryList={initialRepositoryList} onFilteredListChange={setFilteredRepositories} />
      <RepositoryList repositoryList={filteredRepositories} />
    </div>
  );
};

export default RepositoryDataContainer;
