import { EndpointModel } from '@model/endpoint-model';
import { CheckEndpointResult } from '@lib/check-endpoint';

class NotificationService {
  async notifyEndpointIssue(
    endpoint: EndpointModel,
    checkResult: CheckEndpointResult
  ): Promise<void> {
    const issueDetail =
      checkResult.errorMessage ||
      (checkResult.statusCode
        ? `Received status code ${checkResult.statusCode}`
        : 'Unknown issue');

    console.log(
      '[MockNotification] Endpoint unhealthy',
      JSON.stringify(
        {
          ownerId: endpoint.ownerId,
          tenantId: endpoint.tenantId,
          endpointId: endpoint.endpointId,
          name: endpoint.name,
          url: endpoint.url,
          issue: issueDetail,
          checkedAt: endpoint.lastCheckedAt,
        },
        null,
        2
      )
    );
  }
}

export const notificationService = new NotificationService();
