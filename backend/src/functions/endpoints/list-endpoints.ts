import { endpointService } from '@service/endpoint-service';
import { httpError, httpResponse } from '@common/http-response';
import { logLambdaEvent } from '@common/log-event';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  logLambdaEvent('Received list-endpoints request', event);
  try {
    const claims = event.requestContext.authorizer?.claims;
    const ownerId = claims?.sub;

    if (!ownerId) {
      return httpError(new Error('Unauthorized'), 401);
    }

    const refreshParam = event.queryStringParameters?.refresh;
    const shouldRefresh = refreshParam === 'true';

    const endpoints = shouldRefresh
      ? await endpointService.refreshEndpoints(ownerId)
      : await endpointService.listEndpoints(ownerId);

    return httpResponse(endpoints, 200);
  } catch (err) {
    console.error('Error loading endpoints', { error: err });
    const error = err instanceof Error ? err : new Error('Unexpected error');
    return httpError(error, (error as any).statusCode || 500);
  }
};
