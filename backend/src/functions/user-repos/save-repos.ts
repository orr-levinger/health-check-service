import { repoService } from '@service/repo-service';
import { httpError, httpResponse } from '@common/http-response';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  try {
    const claims = event.requestContext.authorizer.claims;
    const userId = claims.sub;
    const repos = JSON.parse(event.body).map((repo) => ({
      userId,
      ...repo,
    }));
    await repoService.saveReposForUser(repos);
    return httpResponse({ message: 'Success' }, 201);
  } catch (err) {
    console.error('Error', { error: err });
    return httpError(err, err.statusCode || 500);
  }
};
