import { Suspense } from "react";
import Link from "next/link";

import RepositoryData from "./repository-data";

const RepositoryPage = () => {
  return (
    <div className="flex flex-col gap-20">
      <h1 className="text-2xl">
        <Link href="/">Home</Link> / Repositories
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RepositoryData />
      </Suspense>
    </div>
  );
};

export default RepositoryPage;
