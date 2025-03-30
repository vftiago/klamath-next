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

const ProjectList = ({ projectList }: { projectList: ProjectNode[] }) => {
  return (
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
  );
};

export default ProjectList;
