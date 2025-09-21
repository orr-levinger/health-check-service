import { endpointService } from '@service/endpoint-service';
import { httpError, httpResponse } from '@common/http-response';
import { logLambdaEvent } from '@common/log-event';
import { APIGatewayEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent) => {
  logLambdaEvent('Received delete-tenant request', event);
  try {
    const claims = event.requestContext.authorizer?.claims;
    const ownerId = claims?.sub;

    if (!ownerId) {
      return httpError(new Error('Unauthorized'), 401);
    }

    const tenantId = event.pathParameters?.tenantId;

    if (!tenantId) {
      return httpError(new Error('tenantId path parameter is required'), 400);
    }

    const deletedCount = await endpointService.deleteTenant(ownerId, tenantId);

    return httpResponse({ tenantId, deletedCount }, 200);
  } catch (err) {
    console.error('Error deleting tenant', { error: err });
    const error = err instanceof Error ? err : new Error('Unexpected error');
    return httpError(error, (error as any).statusCode || 500);
  }
};
