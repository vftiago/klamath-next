"use cache";

import RepositoryList from "./repository-list";

import { getRepositoryData } from "@/api/get-repository-data";

const RepositoryData = async () => {
  const repositoryData = await getRepositoryData();

  const repositoryList = repositoryData.user.repositories.nodes.filter(({ owner, name }) => {
    return owner.login === process.env.OWNER && name !== process.env.OWNER;
  });

  return <RepositoryList repositoryList={repositoryList} />;
};

export default RepositoryData;
