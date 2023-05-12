/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

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
