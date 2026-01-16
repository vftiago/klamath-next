"use client";

import type { RepositoryNode } from "@/api/get-repository-data";
import RepositoryCard from "./repository-card";

const RepositoryList = ({ repositoryList }: { repositoryList: RepositoryNode[] }) => (
  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {repositoryList.map((repositoryNode, index) => (
      <li
        className="flex animate-fade-in opacity-0"
        key={repositoryNode.name}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <RepositoryCard repositoryNode={repositoryNode} />
      </li>
    ))}
  </ul>
);

export default RepositoryList;
