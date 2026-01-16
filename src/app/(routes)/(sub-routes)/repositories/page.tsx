import DataPageLayout from "@/app/_shared/ui/data-page-layout";
import RepositoryData from "./repository-data";

const RepositoryPage = () => {
  return (
    <DataPageLayout title="Repositories">
      <RepositoryData />
    </DataPageLayout>
  );
};

export default RepositoryPage;
