import { Suspense } from "react";

import RepositoryData from "./repository-data";

const RepositoryPage = () => {
  return (
    <div className="flex flex-col gap-20">
      <h1 className="text-xl">Repositories</h1>
      <Suspense fallback={<div className="text-lg">Loading...</div>}>
        <RepositoryData />
      </Suspense>
    </div>
  );
};

export default RepositoryPage;
