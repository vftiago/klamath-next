"use cache";

import RepositoryDataContainer from "./repository-data-container";
import { getRepositoryData } from "@/api/get-repository-data";

const RepositoryData = async () => {
  const repositoryData = await getRepositoryData();

  const repositoryList = repositoryData.user.repositories.nodes.filter(({ owner, name }) => {
    return owner.login === process.env.OWNER && name !== process.env.OWNER;
  });

  return <RepositoryDataContainer initialRepositoryList={repositoryList} />;
};

export default RepositoryData;
