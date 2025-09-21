import { DynamoStoreRepository } from '@model/dynamo-store-repository';
import { EndpointModel } from '@model/endpoint-model';

export class EndpointStore extends DynamoStoreRepository<EndpointModel> {
  constructor() {
    super(EndpointModel);
  }

  createEndpoint = async (endpoint: EndpointModel): Promise<EndpointModel> => {
    return this.putAndGet(endpoint);
  };

  getEndpoint = async (
    ownerId: string,
    endpointId: string
  ): Promise<EndpointModel | null> => {
    return this.get(ownerId, endpointId).exec();
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

  deleteEndpoint = async (ownerId: string, endpointId: string): Promise<void> => {
    await this.delete(ownerId, endpointId).exec();
  };

  deleteEndpoints = async (endpoints: EndpointModel[]): Promise<void> => {
    if (endpoints.length === 0) {
      return;
    }

    await this.batchDelete(endpoints);
  };
}
