import 'reflect-metadata';
import {
  BATCH_WRITE_MAX_REQUEST_ITEM_COUNT,
  DynamoStore,
  ModelConstructor,
  UpdateRequest,
} from '@shiftcoders/dynamo-easy';
import 'reflect-metadata';
import _ from 'lodash';
import { AWS_REGION } from '@static/consts';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { BatchWriteSingleTableRequest } from '@shiftcoders/dynamo-easy/dist/_types/dynamo/request/batchwritesingletable/batch-write-single-table.request';
import { BaseDynamoModel } from '@model/base-dynamo-model';

const config = {
  region: AWS_REGION,
};

export class DynamoStoreRepository<T extends BaseDynamoModel> extends DynamoStore<T> {
  MAX_DYNAMO_BATCH_SIZE = 25;

  constructor(model: ModelConstructor<T>, options?: Partial<DynamoDBClientConfig>) {
    super(model, new DynamoDB({ ...config, ...options }));
  }
  async putAndGet(item: T): Promise<T> {
    const dbItem = {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await super.put(dbItem).exec();
    return dbItem;
  }

  updateByPartitionKeyAndSortKey(
    partitionKey: string,
    sortKey: string,
    updateWith: Partial<T>
  ): Promise<T> {
    return this.patch(updateWith, this.update(partitionKey, sortKey));
  }

  private patch(updateWith: Partial<T>, updateRequest: UpdateRequest<T>) {
    for (const [attrKey, attrValue] of Object.entries(updateWith)) {
      if (attrValue === undefined) {
        continue;
      }

      const attribute = updateRequest.updateAttribute(attrKey as keyof T);

      if (attrValue === null) {
        updateRequest = attribute.remove();
        continue;
      }

      updateRequest = attribute.set(attrValue as T[keyof T]);
    }
    updateRequest.updateAttribute('updatedAt').set(new Date().toISOString());
    return updateRequest.returnValues('ALL_NEW').exec();
  }

  async batchOperation(
    manyItems: T[],
    cb: (
      batchWriteRequest: BatchWriteSingleTableRequest<T>,
      chunk: T[]
    ) => BatchWriteSingleTableRequest<T>
  ) {
    await Promise.all(
      _.chain(manyItems)
        .chunk(BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)
        .map((chunk) => {
          const request = this.batchWrite();
          return cb(request, chunk).exec();
        })
        .flatMap()
        .value()
    );
  }

  async batchPut(items: T[]) {
    await this.batchOperation(items, (batchWriteRequest, chunk) => {
      return batchWriteRequest.put(
        chunk.map((item) => {
          return {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    });
  }

  async batchDelete(items: T[]) {
    await this.batchOperation(items, (batchWriteRequest, chunk) => batchWriteRequest.delete(chunk));
  }
  async deleteAllByPartitionKey(partitionKey: string) {
    await this.batchDelete(await this.query().wherePartitionKey(partitionKey).execFetchAll());
  }
}
