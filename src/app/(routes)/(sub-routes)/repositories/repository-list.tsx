"use client";

import { motion } from "framer-motion";

import RepositoryCard from "./repository-card";

import { RepositoryNode } from "@/api/get-repository-data";

const UL_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const LI_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "backInOut",
    },
  },
};

const RepositoryList = ({ repositoryList }: { repositoryList: RepositoryNode[] }) => {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={UL_VARIANTS}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {repositoryList.map((repositoryNode) => (
        <motion.li key={repositoryNode.name} className="flex" variants={LI_VARIANTS}>
          <RepositoryCard repositoryNode={repositoryNode} />
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default RepositoryList;
