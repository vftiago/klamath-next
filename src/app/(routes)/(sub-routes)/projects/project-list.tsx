"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

import ProjectCard from "./project-card";

import { ProjectNode } from "@/api/get-project-data";
import { LI_VARIANTS, UL_VARIANTS } from "@/app/_shared/motion/list-variants";

type ProjectListProps = {
  projectList: ProjectNode[];
  title?: string;
};

const ProjectList = ({ projectList, title }: ProjectListProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const controls = useAnimation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (projectList.length > 0) {
      if (shouldAnimate) {
        controls.start("visible").then(() => {
          setShouldAnimate(false);
        });
      } else {
        controls.set("visible");
      }
    }
  }, [controls, shouldAnimate, projectList.length]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (shouldAnimate) {
      controls.stop();
      controls.set("visible");
      setShouldAnimate(false);
    }
  }, [projectList, shouldAnimate, controls]);

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
        initial={shouldAnimate ? "hidden" : false}
        animate={controls}
        variants={UL_VARIANTS}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {projectList.map((projectNode) => (
          <motion.li
            key={projectNode.id}
            className="flex"
            variants={LI_VARIANTS}
            initial={shouldAnimate ? undefined : false}
          >
            <ProjectCard projectNode={projectNode} />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

export default ProjectList;
