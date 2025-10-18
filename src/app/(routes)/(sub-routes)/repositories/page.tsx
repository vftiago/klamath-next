import { Suspense } from "react";
import Link from "next/link";

import RepositoryData from "./repository-data";

import ErrorBoundaryWrapper from "@/app/_shared/ui/error-boundary-wrapper";

const RepositoryPage = () => {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <h1 className="text-2xl">
        <Link href="/">Home</Link> / Repositories
      </h1>
      <ErrorBoundaryWrapper>
        <Suspense fallback={<div>Loading...</div>}>
          <RepositoryData />
        </Suspense>
      </ErrorBoundaryWrapper>
    </div>
  );
};

export default RepositoryPage;
