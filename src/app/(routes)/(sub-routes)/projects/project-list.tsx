"use client";

import { motion } from "framer-motion";

import ProjectCard from "./project-card";

import { ProjectNode } from "@/api/get-project-data";

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

type ProjectListProps = {
  projectList: ProjectNode[];
  title?: string;
};

const ProjectList = ({ projectList, title }: ProjectListProps) => {
  if (!projectList || projectList.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm">{title}</h2>
          <div className="flex-1 border-t" />
        </div>
      ) : null}
      <motion.ul
        initial="hidden"
        animate="visible"
        variants={UL_VARIANTS}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {projectList.map((projectNode) => (
          <motion.li key={projectNode.id} className="flex" variants={LI_VARIANTS}>
            <ProjectCard projectNode={projectNode} />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

export default ProjectList;
