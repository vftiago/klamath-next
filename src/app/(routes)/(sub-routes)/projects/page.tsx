import DataPageLayout from "@/app/_shared/ui/data-page-layout";
import ProjectData from "./project-data";

export const revalidate = 3600;

const ProjectPage = () => {
  return (
    <DataPageLayout title="Projects">
      <ProjectData />
    </DataPageLayout>
  );
};

export default ProjectPage;
