"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

import RepositoryCard from "./repository-card";

import { RepositoryNode } from "@/api/get-repository-data";
import { LI_VARIANTS, UL_VARIANTS } from "@/app/_shared/motion/list-variants";

const RepositoryList = ({ repositoryList }: { repositoryList: RepositoryNode[] }) => {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const controls = useAnimation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (shouldAnimate) {
      controls.start("visible").then(() => {
        setShouldAnimate(false);
      });
    } else {
      controls.set("visible");
    }
  }, [controls, shouldAnimate]);

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
  }, [repositoryList, shouldAnimate, controls]);

  return (
    <motion.ul
      initial={shouldAnimate ? "hidden" : false}
      animate={controls}
      variants={UL_VARIANTS}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {repositoryList.map((repositoryNode) => (
        <motion.li
          key={repositoryNode.name}
          className="flex"
          variants={LI_VARIANTS}
          initial={shouldAnimate ? undefined : false}
        >
          <RepositoryCard repositoryNode={repositoryNode} />
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default RepositoryList;
