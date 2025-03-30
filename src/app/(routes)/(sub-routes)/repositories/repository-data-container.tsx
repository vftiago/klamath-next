"use client";

import { useState } from "react";

import RepositoryFilter from "./repository-filter";
import RepositoryList from "./repository-list";

import { RepositoryNode } from "@/api/get-repository-data";

type FilteredRepositoryContainerProps = {
  initialRepositoryList: RepositoryNode[];
};

const RepositoryDataContainer = ({ initialRepositoryList }: FilteredRepositoryContainerProps) => {
  const [filteredRepositories, setFilteredRepositories] = useState(initialRepositoryList);

  return (
    <div className="flex flex-col gap-10">
      <RepositoryFilter repositoryList={initialRepositoryList} onFilteredListChange={setFilteredRepositories} />
      {!filteredRepositories.length ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl">No repositories found</h2>
          <p>Try another search term</p>
        </div>
      ) : null}
      <RepositoryList repositoryList={filteredRepositories} />
    </div>
  );
};

export default RepositoryDataContainer;
