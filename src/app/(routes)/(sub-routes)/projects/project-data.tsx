import { getProjectData } from "@/api/get-project-data";
import ProjectDataContainer from "./project-data-container";

const ProjectData = async () => {
  const projectData = await getProjectData();

  const projectList = projectData.user.projectsV2.nodes;

  return <ProjectDataContainer initialProjectList={projectList} />;
};

export default ProjectData;
