import { randomUUID } from 'crypto';
import { EndpointStore } from '@store/endpoint-store';
import { EndpointModel } from '@model/endpoint-model';
import { EndpointInput, EndpointStatus } from '@type/Endpoint';
import { CheckEndpoint } from '@lib/check-endpoint';

class EndpointService {
  private endpointStore = new EndpointStore();
  private readonly DEFAULT_TIMEOUT_MS = 5000;

  createEndpoint = async (
    ownerId: string,
    endpointInput: EndpointInput
  ): Promise<EndpointModel> => {
    const timestamp = new Date().toISOString();
    const endpoint: EndpointModel = {
      ownerId,
      endpointId: randomUUID(),
      tenantId: endpointInput.tenantId,
      category: endpointInput.category,
      name: endpointInput.name,
      url: endpointInput.url,
      timeoutMs: endpointInput.timeoutMs ?? this.DEFAULT_TIMEOUT_MS,
      status: 'unknown',
      statusSince: timestamp,
    };

    return this.endpointStore.createEndpoint(endpoint);
  };

  listEndpoints = async (ownerId: string): Promise<EndpointModel[]> => {
    return this.endpointStore.listEndpoints(ownerId);
  };

  refreshEndpoints = async (ownerId: string): Promise<EndpointModel[]> => {
    const endpoints = await this.endpointStore.listEndpoints(ownerId);

    const updatedEndpoints = await Promise.all(
      endpoints.map(async (endpoint) => {
        const timeout = endpoint.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
        const checkResult = await CheckEndpoint(endpoint.url, timeout);
        const newStatus: EndpointStatus = checkResult.status;
        const statusChanged = endpoint.status !== newStatus;
        const nowIso = new Date().toISOString();

        const updatedEndpoint = await this.endpointStore.updateEndpoint(
          ownerId,
          endpoint.endpointId,
          {
            status: newStatus,
            statusCode: checkResult.statusCode,
            responseTimeMs: checkResult.responseTimeMs,
            errorMessage: checkResult.errorMessage,
            lastCheckedAt: nowIso,
            statusSince: statusChanged ? nowIso : endpoint.statusSince,
          }
        );

        return updatedEndpoint;
      })
    );

    return updatedEndpoints;
  };
}

export const endpointService = new EndpointService();
