import type { Metadata } from "next";
import DataPageLayout from "@/app/_shared/ui/data-page-layout";
import ProjectData from "./project-data";

export const metadata: Metadata = {
  title: "Projects",
};

export const revalidate = 3600;

const ProjectPage = () => {
  return (
    <DataPageLayout title="Projects">
      <ProjectData />
    </DataPageLayout>
  );
};

export default ProjectPage;
