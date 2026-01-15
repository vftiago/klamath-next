"use client";

import { useState } from "react";

import { ProjectNode } from "@/api/get-project-data";
import SearchInput from "@/app/_shared/ui/search-input";

type ProjectFilterProps = {
  projectList: ProjectNode[];
  onFilteredListChange: (filteredList: ProjectNode[]) => void;
};

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
      <SearchInput
        placeholder="Search projects..."
        value={searchValue}
        onChange={handleSearchChange}
        onClear={handleClearSearch}
      />
    </div>
  );
};

export default ProjectFilter;
