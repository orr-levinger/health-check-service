import { endpointService } from '@service/endpoint-service';
import { httpError, httpResponse } from '@common/http-response';
import { logLambdaEvent } from '@common/log-event';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  logLambdaEvent('Received update-endpoint request', event);
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

    if (!event.body) {
      return httpError(new Error('Request body is required'), 400);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(event.body);
    } catch (error) {
      return httpError(new Error('Invalid JSON body'), 400);
    }

    const { name, url, timeoutMs } = payload;

    if (name === undefined && url === undefined && timeoutMs === undefined) {
      return httpError(
        new Error('At least one of name, url or timeoutMs must be provided'),
        400
      );
    }

    const endpoint = await endpointService.updateEndpoint(ownerId, endpointId, {
      name: typeof name === 'string' ? name : undefined,
      url: typeof url === 'string' ? url : undefined,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : undefined,
    });

    return httpResponse(endpoint, 200);
  } catch (err) {
    console.error('Error updating endpoint', { error: err });
    const error = err instanceof Error ? err : new Error('Unexpected error');
    return httpError(error, (error as any).statusCode || 500);
  }
};
