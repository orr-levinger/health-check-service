import { endpointService } from '@service/endpoint-service';
import { httpError, httpResponse } from '@common/http-response';
import { logLambdaEvent } from '@common/log-event';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  logLambdaEvent('Received delete-endpoint request', event);
  try {
    const claims = event.requestContext.authorizer?.claims;
    const ownerId = claims?.sub;

    if (!ownerId) {
      return httpError(new Error('Unauthorized'), 401);
    }

    const endpointId = event.pathParameters?.endpointId;

    if (!endpointId) {
      return httpError(new Error('endpointId path parameter is required'), 400);
    }

    await endpointService.deleteEndpoint(ownerId, endpointId);

    return httpResponse(undefined, 204);
  } catch (err) {
    console.error('Error deleting endpoint', { error: err });
    const error = err instanceof Error ? err : new Error('Unexpected error');
    return httpError(error, (error as any).statusCode || 500);
  }
};
