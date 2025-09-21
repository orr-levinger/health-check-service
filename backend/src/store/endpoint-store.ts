import { DynamoStoreRepository } from '@model/dynamo-store-repository';
import { EndpointModel } from '@model/endpoint-model';

export class EndpointStore extends DynamoStoreRepository<EndpointModel> {
  constructor() {
    super(EndpointModel);
  }

  createEndpoint = async (endpoint: EndpointModel): Promise<EndpointModel> => {
    return this.putAndGet(endpoint);
  };

  listEndpoints = async (ownerId: string): Promise<EndpointModel[]> => {
    return this.query().wherePartitionKey(ownerId).execFetchAll();
  };

  listAllEndpoints = async (): Promise<EndpointModel[]> => {
    return this.scan().execFetchAll();
  };

  updateEndpoint = async (
    ownerId: string,
    endpointId: string,
    update: Partial<EndpointModel>
  ): Promise<EndpointModel> => {
    return this.updateByPartitionKeyAndSortKey(ownerId, endpointId, update);
  };
}
