import { repoService } from '@service/repo-service';
import { httpError, httpResponse } from '@common/http-response';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  try {
    console.log('event', JSON.stringify(event, null, 2));
    const claims = event.requestContext.authorizer.claims;
    const userId = claims.sub;
    await repoService.deleteRepos(userId, JSON.parse(event.body) as number[]);
    return httpResponse({ message: 'Success' }, 201);
  } catch (err) {
    console.error('Error', { error: err });
    return httpError(err, err.statusCode || 500);
  }
};
