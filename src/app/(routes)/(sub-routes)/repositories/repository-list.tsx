"use client";

import { memo } from "react";
import type { RepositoryNode } from "@/api/get-repository-data";
import RepositoryCard from "./repository-card";

// memoized so typing in the search input can defer re-rendering the grid
const RepositoryList = memo(function RepositoryList({ repositoryList }: { repositoryList: RepositoryNode[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {repositoryList.map((repositoryNode, index) => (
        <li
          className="animate-fade-in flex opacity-0"
          key={repositoryNode.name}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <RepositoryCard repositoryNode={repositoryNode} />
        </li>
      ))}
    </ul>
  );
});

export default RepositoryList;
