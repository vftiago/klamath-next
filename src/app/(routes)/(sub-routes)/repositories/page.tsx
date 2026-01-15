import RepositoryData from "./repository-data";

import DataPageLayout from "@/app/_shared/ui/data-page-layout";

const RepositoryPage = () => {
  return (
    <DataPageLayout title="Repositories">
      <RepositoryData />
    </DataPageLayout>
  );
};

export default RepositoryPage;
