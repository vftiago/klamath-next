import RepositoryDataContainer from "./repository-data-container";

import { getRepositoryData } from "@/api/get-repository-data";

const RepositoryData = async () => {
  const repositoryList = await getRepositoryData();

  return <RepositoryDataContainer initialRepositoryList={repositoryList} />;
};

export default RepositoryData;
