import { endpointService } from '@service/endpoint-service';
import { httpError, httpResponse } from '@common/http-response';
import { logLambdaEvent } from '@common/log-event';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  logLambdaEvent('Received create-endpoint request', event);
  try {
    const claims = event.requestContext.authorizer?.claims;
    const ownerId = claims?.sub;

    if (!ownerId) {
      return httpError(new Error('Unauthorized'), 401);
    }

    if (!event.body) {
      return httpError(new Error('Request body is required'), 400);
    }

    const payload = JSON.parse(event.body);
    const { tenantId, category, name, url, timeoutMs } = payload;

    if (!tenantId || !category || !name || !url) {
      return httpError(
        new Error('tenantId, category, name and url are required fields'),
        400
      );
    }

    const endpoint = await endpointService.createEndpoint(ownerId, {
      tenantId,
      category,
      name,
      url,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : undefined,
    });

    return httpResponse(endpoint, 201);
  } catch (err) {
    console.error('Error creating endpoint', { error: err });
    const error = err instanceof Error ? err : new Error('Unexpected error');
    return httpError(error, (error as any).statusCode || 500);
  }
};
