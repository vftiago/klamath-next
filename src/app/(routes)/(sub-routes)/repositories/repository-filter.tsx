"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { BsSortDown, BsSortUp } from "react-icons/bs";

import { RepositoryNode } from "@/api/get-repository-data";
import SearchInput from "@/app/_shared/ui/search-input";

type RepositoryFilterProps = {
  repositoryList: RepositoryNode[];
  onFilteredListChange: (filteredList: RepositoryNode[]) => void;
};

const RepositoryFilter = ({ repositoryList, onFilteredListChange }: RepositoryFilterProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [sortAscending, setSortAscending] = useState(false);
  const deferredSearch = useDeferredValue(searchValue);

  const applyFilters = useCallback(
    (search: string, ascending: boolean) => {
      let filteredList = [...repositoryList];

      if (search) {
        filteredList = filteredList.filter((repo) => repo.name.toLowerCase().includes(search.toLowerCase()));
      }

      filteredList.sort((a, b) => {
        const aLatestCommit = a.defaultBranchRef?.target.history.edges[0]?.node;
        const bLatestCommit = b.defaultBranchRef?.target.history.edges[0]?.node;

        if (!aLatestCommit || !bLatestCommit) return 0;

        const aDate = new Date(aLatestCommit.committedDate);
        const bDate = new Date(bLatestCommit.committedDate);

        return ascending ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      });

      onFilteredListChange(filteredList);
    },
    [repositoryList, onFilteredListChange],
  );

  useEffect(() => {
    applyFilters(deferredSearch, sortAscending);
  }, [deferredSearch, sortAscending, applyFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortAscending((prev) => !prev);
  }, []);

  return (
    <div className="flex h-12 w-full gap-2">
      <SearchInput
        placeholder="Search repositories..."
        value={searchValue}
        onChange={handleSearchChange}
        onClear={handleClearSearch}
      />

      <button
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-gray-500/10 text-lg outline-none"
        onClick={handleSortToggle}
        aria-label={sortAscending ? "Sort newest first" : "Sort oldest first"}
      >
        {sortAscending ? <BsSortUp size="1.5rem" /> : <BsSortDown size="1.5rem" />}
      </button>
    </div>
  );
};

export default RepositoryFilter;
