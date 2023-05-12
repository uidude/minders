/**
 * TODO: Describe what this screen is doing :)
 *
 * @format
 */

import * as React from 'react';
import {useAuth} from '@toolkit/core/api/Auth';
import {User} from '@toolkit/core/api/User';
import {Opt} from '@toolkit/core/util/Types';
import {useDataStore} from '@toolkit/data/DataStore';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {MultistepFlow, Step} from '@toolkit/ui/components/MultistepFlow';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useUpdateUserAndProfile} from '@app/common/AppLogic';
import {Profile} from '@app/common/DataTypes';
import OutlineList from '@app/screens/OutlineList';
import {ProfilePicEditor} from './EditProfile';

type Props = {
  user: User;
  async: {
    profile: Partial<Profile>;
  };
};

const Onboarding: Screen<Props> = props => {
  const {user} = props;
  const {profile} = props.async;
  const nav = useNav();
  const [NameInput, name] = useTextInput(user.name);
  const [pic, setPic] = React.useState<Opt<string>>(user.pic);
  const [loading, setLoading] = React.useState(false);
  const auth = useAuth();

  const updateUserAndProfile = useUpdateUserAndProfile();

  async function onFinish() {
    await updateUserAndProfile(user.id, {name, pic}, {});
    await auth.checkLogin();
    // TODO Show error if checkLogin() fails
    nav.reset(OutlineList);
  }

  function onCancel() {
    nav.navTo(OutlineList);
  }

  // TODO implement skip
  return (
    <MultistepFlow onCancel={onCancel} onFinish={onFinish}>
      <Step
        title="What's your name?"
        subtitle="This will be visible on your profile.">
        <NameInput type="primary" style={{marginTop: 32}} placeholder="Name" />
      </Step>
      <Step
        title="Show yourself"
        subtitle="Upload your profile picture."
        required={false}
        nextOk={!loading}>
        <ProfilePicEditor
          pic={pic}
          setPic={setPic}
          size={256}
          isLoading={setLoading}
        />
      </Step>
    </MultistepFlow>
  );
};
Onboarding.title = 'Onboarding';
Onboarding.style = {nav: 'none'};
Onboarding.linkable = false;

Onboarding.load = async props => {
  const userId = props.user.id;
  const profileStore = useDataStore(Profile);

  const profile = (await profileStore.get(userId)) ?? {};

  return {profile};
};

export default Onboarding;
