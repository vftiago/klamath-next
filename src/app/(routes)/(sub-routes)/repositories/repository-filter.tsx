"use client";

import { useState } from "react";
import { BsSortDown, BsSortUp } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { RepositoryNode } from "@/api/get-repository-data";

interface RepositoryFilterProps {
  repositoryList: RepositoryNode[];
  onFilteredListChange: (filteredList: RepositoryNode[]) => void;
}

const RepositoryFilter = ({ repositoryList, onFilteredListChange }: RepositoryFilterProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [sortAscending, setSortAscending] = useState(false);

  const applyFilters = (search: string, ascending: boolean) => {
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
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    applyFilters(newValue, sortAscending);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    applyFilters("", sortAscending);
  };

  const handleSortToggle = () => {
    const newSortOrder = !sortAscending;
    setSortAscending(newSortOrder);
    applyFilters(searchValue, newSortOrder);
  };

  return (
    <div className="flex h-12 w-full gap-2">
      <div className="relative flex-1">
        <input
          placeholder="Search repositories..."
          className="h-12 w-full border border-neutral-500/20 bg-neutral-100/20 p-4 text-lg outline-none backdrop-blur-sm"
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
            aria-label="Clear search"
            onClick={handleClearSearch}
          >
            <IoMdClose size="1.2rem" />
          </button>
        )}
      </div>

      <button
        className="flex h-12 w-12 items-center justify-center border border-neutral-500/20 bg-neutral-100/20 text-lg outline-none backdrop-blur-sm"
        onClick={handleSortToggle}
        aria-label={sortAscending ? "Sort newest first" : "Sort oldest first"}
      >
        {sortAscending ? <BsSortUp size="1.5rem" /> : <BsSortDown size="1.5rem" />}
      </button>
    </div>
  );
};

export default RepositoryFilter;
