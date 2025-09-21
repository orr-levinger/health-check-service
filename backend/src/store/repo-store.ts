import { DynamoStoreRepository } from '@model/dynamo-store-repository';
import { RepoModel } from '@model/repo-model';

export class RepoStore extends DynamoStoreRepository<RepoModel> {
  constructor() {
    super(RepoModel);
  }

  saveReposForUser = async (repos: RepoModel[]) => {
    await this.batchPut(repos);
  };

  getUserRepos = async (userId: string): Promise<RepoModel[]> => {
    return this.query().wherePartitionKey(userId).execFetchAll();
  };

  deleteRepos = async (repos: RepoModel[]): Promise<void> => {
    return this.batchDelete(repos);
  };

  getReposByIds = async (userId: string, ids: number[]): Promise<RepoModel[]> => {
    const queryPromises = ids.map((id) =>
      this.query()
        .index(RepoModel.byId)
        .wherePartitionKey(userId)
        .whereSortKey()
        .eq(id)
        .execSingle()
    );
    return await Promise.all(queryPromises);
  };
}
