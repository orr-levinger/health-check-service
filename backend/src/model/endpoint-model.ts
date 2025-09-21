import { CUSTOMER_ENDPOINTS_TABLE } from '@static/consts';
import { Model, PartitionKey, SortKey } from '@shiftcoders/dynamo-easy';
import { EndpointInterface } from '@type/Endpoint';
import { BaseDynamoModel } from '@model/base-dynamo-model';

@Model({ tableName: CUSTOMER_ENDPOINTS_TABLE })
export class EndpointModel extends BaseDynamoModel implements EndpointInterface {
  @PartitionKey()
  ownerId: string;

  @SortKey()
  endpointId: string;

  tenantId: string;
  category: string;
  name: string;
  url: string;
  timeoutMs: number;
  status: EndpointInterface['status'];
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  lastCheckedAt?: string;
  statusSince?: string;
}
