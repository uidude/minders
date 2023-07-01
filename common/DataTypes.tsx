import {User} from '@toolkit/core/api/User';
import {type Opt} from '@toolkit/core/util/Types';
import {BaseModel, Field, Model, TString} from '@toolkit/data/DataStore';

//
@Model({name: 'profile'})
export class Profile extends BaseModel {
  @Field() user: User;
  @Field() name: string;
  @Field(TString) pic?: Opt<string>;
}
