"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { RepositoryNode } from "@/api/get-repository-data";
import { getLatestCommitTime } from "@/api/repository-utils";
import EmptyState from "@/app/_shared/ui/empty-state";
import RepositoryFilter from "./repository-filter";
import RepositoryList from "./repository-list";

type RepositoryDataContainerProps = {
  initialRepositoryList: RepositoryNode[];
};

const RepositoryDataContainer = ({ initialRepositoryList }: RepositoryDataContainerProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [sortAscending, setSortAscending] = useState(false);
  const deferredSearch = useDeferredValue(searchValue);

  const filteredRepositories = useMemo(() => {
    const search = deferredSearch.toLowerCase();

    const filtered = search
      ? initialRepositoryList.filter((repo) => repo.name.toLowerCase().includes(search))
      : [...initialRepositoryList];

    return filtered.sort((a, b) => {
      const aTime = getLatestCommitTime(a);
      const bTime = getLatestCommitTime(b);

      return sortAscending ? aTime - bTime : bTime - aTime;
    });
  }, [deferredSearch, initialRepositoryList, sortAscending]);

  return (
    <div className="flex flex-col gap-10">
      <RepositoryFilter
        searchValue={searchValue}
        sortAscending={sortAscending}
        onSearchChange={setSearchValue}
        onSortToggle={() => setSortAscending((prev) => !prev)}
      />
      {!filteredRepositories.length ? (
        <EmptyState message={deferredSearch ? undefined : "Nothing to see here."} title="No repositories found" />
      ) : null}
      <RepositoryList repositoryList={filteredRepositories} />
    </div>
  );
};

export default RepositoryDataContainer;
