import { Octokit } from '@octokit/rest';
import { initSecret } from '@lib/SSM';
import { httpError, httpResponse } from '@common/http-response';
import { APIGatewayEvent } from 'aws-lambda';
let octokit;

const promise = initSecret('zets-github-token', 'GITHUB_TOKEN').then(() => {
  octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
});
async function fetchRepositories(page: number, pageSize: number) {
  try {
    const response = await octokit.request('GET /search/repositories', {
      q: 'stars:>1',
      sort: 'stars',
      order: 'desc',
      per_page: pageSize,
      page,
    });
    return response.data.items;
  } catch (error) {
    console.error('Error fetching data from GitHub API:', error);
    return [];
  }
}
export const handler = async (event: APIGatewayEvent) => {
  try {
    return promise.then(async () => {
      const page = Number(event.queryStringParameters?.page) || 1;
      const pageSize = Number(event.queryStringParameters?.pageSize) || 10;
      const items = (await fetchRepositories(page, pageSize)).map((repo) => ({
        name: repo.full_name,
        stars: repo.stargazers_count,
        repositoryUrl: repo.html_url,
        avatarUrl: repo.owner.avatar_url,
        id: repo.id,
      }));
      return httpResponse(items, 200);
    });
  } catch (err) {
    console.error('Error', { error: err });
    return httpError(err, err.statusCode || 500);
  }
};
