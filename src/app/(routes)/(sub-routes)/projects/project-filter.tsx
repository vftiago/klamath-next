"use client";

import { useState } from "react";
import { IoMdClose } from "react-icons/io";

import { ProjectNode } from "@/api/get-project-data";

interface ProjectFilterProps {
  projectList: ProjectNode[];
  onFilteredListChange: (filteredList: ProjectNode[]) => void;
}

const ProjectFilter = ({ projectList, onFilteredListChange }: ProjectFilterProps) => {
  const [searchValue, setSearchValue] = useState("");

  const applyFilters = (search: string) => {
    let filteredList = [...projectList];

    if (search) {
      filteredList = filteredList.filter(
        (project) =>
          project.title.toLowerCase().includes(search.toLowerCase()) ||
          project.shortDescription?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    onFilteredListChange(filteredList);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    applyFilters(newValue);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    applyFilters("");
  };

  return (
    <div className="flex h-12 w-full gap-2">
      <div className="relative flex-1">
        <input
          placeholder="Search projects..."
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
    </div>
  );
};

export default ProjectFilter;
