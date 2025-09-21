import { RepoStore } from '@store/repo-store';
import { RepoModel } from '@model/repo-model';

class RepoService {
  private repoStore = new RepoStore();

  saveReposForUser = async (repos: RepoModel[]) => {
    await this.repoStore.saveReposForUser(repos);
  };

  getUserRepos = async (userId: string): Promise<RepoModel[]> => {
    return this.repoStore.getUserRepos(userId);
  };

  getRepoById = async (userId: string): Promise<RepoModel[]> => {
    return this.repoStore.getUserRepos(userId);
  };

  deleteRepos = async (userId: string, reposIds: number[]): Promise<void> => {
    const reposToDelete = await this.repoStore.getReposByIds(userId, reposIds);
    return this.repoStore.deleteRepos(reposToDelete);
  };
}

export const repoService = new RepoService();
