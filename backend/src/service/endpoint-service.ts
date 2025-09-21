import { randomUUID } from 'crypto';
import { EndpointStore } from '@store/endpoint-store';
import { EndpointModel } from '@model/endpoint-model';
import { EndpointInput, EndpointStatus, EndpointUpdateInput } from '@type/Endpoint';
import { CheckEndpoint, CheckEndpointResult } from '@lib/check-endpoint';
import { notificationService } from '@service/notification-service';

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

  updateEndpoint = async (
    ownerId: string,
    endpointId: string,
    updateInput: EndpointUpdateInput
  ): Promise<EndpointModel> => {
    const sanitizedUpdate: Partial<EndpointModel> = {};

    if (updateInput.name !== undefined) {
      if (typeof updateInput.name !== 'string') {
        const error = new Error('name must be a string');
        (error as any).statusCode = 400;
        throw error;
      }

      const trimmedName = updateInput.name.trim();
      if (!trimmedName) {
        const error = new Error('name cannot be empty');
        (error as any).statusCode = 400;
        throw error;
      }

      sanitizedUpdate.name = trimmedName;
    }

    if (updateInput.url !== undefined) {
      if (typeof updateInput.url !== 'string') {
        const error = new Error('url must be a string');
        (error as any).statusCode = 400;
        throw error;
      }

      const trimmedUrl = updateInput.url.trim();
      if (!trimmedUrl) {
        const error = new Error('url cannot be empty');
        (error as any).statusCode = 400;
        throw error;
      }

      sanitizedUpdate.url = trimmedUrl;
    }

    if (updateInput.timeoutMs !== undefined) {
      if (
        typeof updateInput.timeoutMs !== 'number' ||
        Number.isNaN(updateInput.timeoutMs) ||
        updateInput.timeoutMs <= 0
      ) {
        const error = new Error('timeoutMs must be a positive number');
        (error as any).statusCode = 400;
        throw error;
      }

      sanitizedUpdate.timeoutMs = updateInput.timeoutMs;
    }

    if (Object.keys(sanitizedUpdate).length === 0) {
      const error = new Error('At least one valid field must be provided for update');
      (error as any).statusCode = 400;
      throw error;
    }

    const existingEndpoint = await this.endpointStore.getEndpoint(ownerId, endpointId);

    if (!existingEndpoint) {
      const error = new Error('Endpoint not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return this.endpointStore.updateEndpoint(ownerId, endpointId, sanitizedUpdate);
  };

  deleteEndpoint = async (ownerId: string, endpointId: string): Promise<void> => {
    if (!endpointId) {
      const error = new Error('endpointId is required');
      (error as any).statusCode = 400;
      throw error;
    }

    const normalizedEndpointId = endpointId.trim();

    if (!normalizedEndpointId) {
      const error = new Error('endpointId cannot be empty');
      (error as any).statusCode = 400;
      throw error;
    }

    const existingEndpoint = await this.endpointStore.getEndpoint(
      ownerId,
      normalizedEndpointId
    );

    if (!existingEndpoint) {
      const error = new Error('Endpoint not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await this.endpointStore.deleteEndpoint(ownerId, normalizedEndpointId);
  };

  listEndpoints = async (ownerId: string): Promise<EndpointModel[]> => {
    return this.endpointStore.listEndpoints(ownerId);
  };

  refreshEndpoints = async (ownerId: string): Promise<EndpointModel[]> => {
    const endpoints = await this.endpointStore.listEndpoints(ownerId);

    return Promise.all(
      endpoints.map((endpoint) => this.refreshEndpointStatus(endpoint))
    );
  };

  deleteTenant = async (ownerId: string, tenantId: string): Promise<number> => {
    if (!tenantId) {
      const error = new Error('tenantId is required');
      (error as any).statusCode = 400;
      throw error;
    }

    const normalizedTenantId = tenantId.trim();

    if (!normalizedTenantId) {
      const error = new Error('tenantId cannot be empty');
      (error as any).statusCode = 400;
      throw error;
    }

    const endpoints = await this.endpointStore.listEndpoints(ownerId);

    const tenantEndpoints = endpoints.filter(
      (endpoint) => endpoint.tenantId.trim() === normalizedTenantId
    );

    if (tenantEndpoints.length === 0) {
      return 0;
    }

    await this.endpointStore.deleteEndpoints(tenantEndpoints);

    return tenantEndpoints.length;
  };

  refreshAllEndpoints = async (): Promise<EndpointModel[]> => {
    const endpoints = await this.endpointStore.listAllEndpoints();

    return Promise.all(
      endpoints.map((endpoint) => this.refreshEndpointStatus(endpoint))
    );
  };

  private refreshEndpointStatus = async (
    endpoint: EndpointModel
  ): Promise<EndpointModel> => {
    const timeout = endpoint.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const checkResult = await CheckEndpoint(endpoint.url, timeout);
    const newStatus: EndpointStatus = checkResult.status;
    const statusChanged = endpoint.status !== newStatus;
    const nowIso = new Date().toISOString();

    const errorMessage =
      checkResult.status === 'healthy'
        ? null
        : checkResult.errorMessage ?? null;

    const updatePayload: Partial<EndpointModel> = {
      status: newStatus,
      statusCode: checkResult.statusCode,
      responseTimeMs: checkResult.responseTimeMs,
      errorMessage,
      lastCheckedAt: nowIso,
      statusSince: statusChanged ? nowIso : endpoint.statusSince,
    };

    const sanitizedUpdatePayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([, value]) => value !== undefined)
    ) as Partial<EndpointModel>;

    const updatedEndpoint = await this.endpointStore.updateEndpoint(
      endpoint.ownerId,
      endpoint.endpointId,
      sanitizedUpdatePayload
    );

    if (errorMessage === null) {
      updatedEndpoint.errorMessage = null;
    }

    await this.notifyIfUnhealthy(updatedEndpoint, checkResult);

    return updatedEndpoint;
  };

  private notifyIfUnhealthy = async (
    endpoint: EndpointModel,
    checkResult: CheckEndpointResult
  ) => {
    if (checkResult.status !== 'unhealthy') {
      return;
    }

    await notificationService.notifyEndpointIssue(endpoint, checkResult);
  };
}

export const endpointService = new EndpointService();
