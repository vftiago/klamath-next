import { getProjectData } from "@/api/get-project-data";
import ProjectDataContainer from "./project-data-container";

const ProjectData = async () => {
  const projectList = await getProjectData();

  return <ProjectDataContainer initialProjectList={projectList} />;
};

export default ProjectData;
