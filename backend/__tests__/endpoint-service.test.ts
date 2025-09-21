import { endpointService } from '@service/endpoint-service';
import { EndpointStore } from '@store/endpoint-store';
import { EndpointModel } from '@model/endpoint-model';
import * as checkEndpointModule from '@lib/check-endpoint';
import { notificationService } from '@service/notification-service';

const endpointStore =
  (endpointService as unknown as { endpointStore: EndpointStore }).endpointStore;

const buildEndpoint = (overrides: Partial<EndpointModel> = {}): EndpointModel =>
  ({
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
    ...overrides,
  }) as EndpointModel;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('endpointService.refreshEndpoints', () => {
  it('removes stale error details when an endpoint recovers', async () => {
    const existingEndpoint = buildEndpoint();

    jest.spyOn(endpointStore, 'listEndpoints').mockResolvedValue([existingEndpoint]);

    const updateSpy = jest
      .spyOn(endpointStore, 'updateEndpoint')
      .mockImplementation(async (_ownerId, _endpointId, update) => ({
        ...existingEndpoint,
        ...update,
      }));

    jest.spyOn(checkEndpointModule, 'CheckEndpoint').mockResolvedValue({
      status: 'healthy',
      statusCode: 200,
      responseTimeMs: 42,
    });

    jest.spyOn(notificationService, 'notifyEndpointIssue').mockResolvedValue();

    const [updatedEndpoint] = await endpointService.refreshEndpoints(
      existingEndpoint.ownerId
    );

    expect(updateSpy).toHaveBeenCalledWith(
      existingEndpoint.ownerId,
      existingEndpoint.endpointId,
      expect.objectContaining({
        status: 'healthy',
        errorMessage: null,
      })
    );
    expect(updatedEndpoint.errorMessage).toBeNull();
  });

  it('does not send notifications when a refreshed endpoint is healthy', async () => {
    const existingEndpoint = buildEndpoint();

    jest.spyOn(endpointStore, 'listEndpoints').mockResolvedValue([existingEndpoint]);

    jest
      .spyOn(endpointStore, 'updateEndpoint')
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

    await endpointService.refreshEndpoints(existingEndpoint.ownerId);

    expect(notifySpy).not.toHaveBeenCalled();
  });
});

describe('endpointService.deleteEndpoint', () => {
  it('throws a validation error when endpointId is empty', async () => {
    await expect(endpointService.deleteEndpoint('owner-1', '   ')).rejects.toMatchObject({
      message: 'endpointId cannot be empty',
      statusCode: 400,
    });
  });

  it('throws a not found error when the endpoint does not exist', async () => {
    jest.spyOn(endpointStore, 'getEndpoint').mockResolvedValue(null);

    await expect(
      endpointService.deleteEndpoint('owner-1', 'missing-endpoint')
    ).rejects.toMatchObject({
      message: 'Endpoint not found',
      statusCode: 404,
    });
  });

  it('removes the endpoint when it exists', async () => {
    const existingEndpoint = buildEndpoint({ endpointId: 'endpoint-123' });

    jest.spyOn(endpointStore, 'getEndpoint').mockResolvedValue(existingEndpoint);

    const deleteSpy = jest
      .spyOn(endpointStore, 'deleteEndpoint')
      .mockResolvedValue();

    await endpointService.deleteEndpoint(existingEndpoint.ownerId, '  endpoint-123  ');

    expect(deleteSpy).toHaveBeenCalledWith(
      existingEndpoint.ownerId,
      existingEndpoint.endpointId
    );
  });
});
