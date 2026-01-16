import { getRepositoryData } from "@/api/get-repository-data";
import RepositoryDataContainer from "./repository-data-container";

const RepositoryData = async () => {
  const repositoryList = await getRepositoryData();

  return <RepositoryDataContainer initialRepositoryList={repositoryList} />;
};

export default RepositoryData;
