import { ReactNode, Suspense } from "react";
import Link from "next/link";

import ErrorBoundaryWrapper from "./error-boundary-wrapper";

type DataPageLayoutProps = {
  title: string;
  children: ReactNode;
};

const DataPageLayout = ({ title, children }: DataPageLayoutProps) => {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <h1 className="text-2xl">
        <Link href="/">Home</Link> / {title}
      </h1>
      <ErrorBoundaryWrapper>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </ErrorBoundaryWrapper>
    </div>
  );
};

export default DataPageLayout;
