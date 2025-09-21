// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { USER_REPO_TABLE } from '@static/consts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LSISortKey, Model, PartitionKey, SortKey } from '@shiftcoders/dynamo-easy';
import { RepoInterface } from '@type/Repo';
import { BaseDynamoModel } from '@model/base-dynamo-model';

@Model({ tableName: USER_REPO_TABLE })
export class RepoModel extends BaseDynamoModel implements RepoInterface {
  static readonly byId = 'byId';

  @PartitionKey()
  userId: string;
  @SortKey()
  stars: number;
  @LSISortKey(RepoModel.byId)
  id: number;
  name: string;
  repositoryUrl: string;
  avatarUrl: string;
}
