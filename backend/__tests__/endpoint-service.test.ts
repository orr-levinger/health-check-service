import { endpointService } from '@service/endpoint-service';
import { EndpointStore } from '@store/endpoint-store';
import { EndpointModel } from '@model/endpoint-model';
import * as checkEndpointModule from '@lib/check-endpoint';
import { notificationService } from '@service/notification-service';

describe('endpointService.refreshEndpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clears existing error details when an endpoint recovers', async () => {
    const existingEndpoint: EndpointModel = {
      ownerId: 'owner-1',
      endpointId: 'endpoint-1',
      tenantId: 'tenant',
      category: 'category',
      name: 'Example',
      url: 'https://example.com/health',
      timeoutMs: 5000,
      status: 'unhealthy',
      statusCode: 429,
      responseTimeMs: 100,
      errorMessage: 'Non-2xx status code: 429',
      statusSince: '2024-01-01T00:00:00.000Z',
      lastCheckedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2023-12-31T00:00:00.000Z',
      updatedAt: '2023-12-31T00:00:00.000Z',
    } as EndpointModel;

    const listEndpointsSpy = jest
      .spyOn(
        (endpointService as unknown as { endpointStore: EndpointStore }).endpointStore,
        'listEndpoints'
      )
      .mockResolvedValue([existingEndpoint]);

    const updateSpy = jest
      .spyOn(
        (endpointService as unknown as { endpointStore: EndpointStore }).endpointStore,
        'updateEndpoint'
      )
      .mockImplementation(async (_ownerId, _endpointId, update) => ({
        ...existingEndpoint,
        ...update,
      }));

    jest.spyOn(checkEndpointModule, 'CheckEndpoint').mockResolvedValue({
      status: 'healthy',
      statusCode: 200,
      responseTimeMs: 42,
    });

    const notifySpy = jest
      .spyOn(notificationService, 'notifyEndpointIssue')
      .mockResolvedValue();

    const [updatedEndpoint] = await endpointService.refreshEndpoints(
      existingEndpoint.ownerId
    );

    expect(listEndpointsSpy).toHaveBeenCalledWith(existingEndpoint.ownerId);

    expect(updateSpy).toHaveBeenCalledWith(
      existingEndpoint.ownerId,
      existingEndpoint.endpointId,
      expect.objectContaining({
        status: 'healthy',
        errorMessage: null,
      })
    );

    expect(updatedEndpoint.status).toBe('healthy');
    expect(updatedEndpoint.errorMessage).toBeNull();
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
