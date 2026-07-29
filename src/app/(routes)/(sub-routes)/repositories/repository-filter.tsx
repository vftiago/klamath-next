"use client";

import { BsSortDown, BsSortUp } from "react-icons/bs";
import SearchInput from "@/app/_shared/ui/search-input";

type RepositoryFilterProps = {
  onSearchChange: (value: string) => void;
  onSortToggle: () => void;
  searchValue: string;
  sortAscending: boolean;
};

const RepositoryFilter = ({ onSearchChange, onSortToggle, searchValue, sortAscending }: RepositoryFilterProps) => {
  return (
    <div className="flex h-12 w-full gap-2">
      <SearchInput
        placeholder="Search repositories..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
      />

      <button
        aria-label={sortAscending ? "Sort newest first" : "Sort oldest first"}
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-gray-500/10 text-lg outline-none"
        onClick={onSortToggle}
      >
        {sortAscending ? <BsSortUp size="1.5rem" /> : <BsSortDown size="1.5rem" />}
      </button>
    </div>
  );
};

export default RepositoryFilter;
