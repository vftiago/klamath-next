import { Suspense } from "react";
import Link from "next/link";

import ProjectData from "./project-data";

import ErrorBoundaryWrapper from "@/app/_shared/ui/error-boundary-wrapper";

const ProjectPage = () => {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <h1 className="text-2xl">
        <Link href="/">Home</Link> / Projects
      </h1>
      <ErrorBoundaryWrapper>
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectData />
        </Suspense>
      </ErrorBoundaryWrapper>
    </div>
  );
};

export default ProjectPage;
