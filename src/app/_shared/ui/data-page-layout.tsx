import Link from "next/link";
import type { ReactNode} from "react";
import { Suspense } from "react";
import ErrorBoundaryWrapper from "./error-boundary-wrapper";

type DataPageLayoutProps = {
  children: ReactNode;
  title: string;
};

const DataPageLayout = ({ children, title }: DataPageLayoutProps) => {
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
