export type EndpointStatus = 'healthy' | 'unhealthy' | 'unknown';

export type Endpoint = {
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
};

export type EndpointPayload = {
  tenantId: string;
  category: string;
  name: string;
  url: string;
  timeoutMs?: number;
};

export type EndpointUpdatePayload = {
  name?: string;
  url?: string;
  timeoutMs?: number;
};
