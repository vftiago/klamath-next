"use client";

import SearchInput from "@/app/_shared/ui/search-input";

type ProjectFilterProps = {
  onSearchChange: (value: string) => void;
  searchValue: string;
};

const ProjectFilter = ({ onSearchChange, searchValue }: ProjectFilterProps) => {
  return (
    <div className="flex h-12 w-full gap-2">
      <SearchInput
        placeholder="Search projects..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
      />
    </div>
  );
};

export default ProjectFilter;
