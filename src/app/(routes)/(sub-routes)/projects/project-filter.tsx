"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";

import { ProjectNode } from "@/api/get-project-data";
import SearchInput from "@/app/_shared/ui/search-input";

type ProjectFilterProps = {
  projectList: ProjectNode[];
  onFilteredListChange: (filteredList: ProjectNode[]) => void;
};

const ProjectFilter = ({ projectList, onFilteredListChange }: ProjectFilterProps) => {
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  const applyFilters = useCallback(
    (search: string) => {
      let filteredList = [...projectList];

      if (search) {
        filteredList = filteredList.filter(
          (project) =>
            project.title.toLowerCase().includes(search.toLowerCase()) ||
            project.shortDescription?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      onFilteredListChange(filteredList);
    },
    [projectList, onFilteredListChange],
  );

  useEffect(() => {
    applyFilters(deferredSearch);
  }, [deferredSearch, applyFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

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
