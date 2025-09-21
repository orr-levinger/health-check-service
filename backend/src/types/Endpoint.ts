export type EndpointStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface EndpointInterface {
  ownerId: string;
  endpointId: string;
  tenantId: string;
  category: string;
  name: string;
  url: string;
  timeoutMs: number;
  status: EndpointStatus;
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  lastCheckedAt?: string;
  statusSince?: string;
}

export type EndpointInput = {
  tenantId: string;
  category: string;
  name: string;
  url: string;
  timeoutMs?: number;
};
