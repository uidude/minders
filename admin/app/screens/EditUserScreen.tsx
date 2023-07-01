import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Checkbox, List, useTheme} from 'react-native-paper';
import {
  Role,
  SYSTEM_ROLES,
  User,
  UserRoles,
  requireLoggedInUser,
} from '@toolkit/core/api/User';
import {CodedError} from '@toolkit/core/util/CodedError';
import {useDataStore} from '@toolkit/data/DataStore';
import {UserNotFoundError} from '@toolkit/tbd/CommonErrors';
import {useTextInput} from '@toolkit/ui/UiHooks';
import {useComponents} from '@toolkit/ui/components/Components';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useAction} from '@app/admin/../../npe-toolkit/lib/core/client/Action';
import {useBackgroundStatus} from '@app/admin/../../npe-toolkit/lib/core/client/Status';
import {useUpdateUserAndProfile} from '@app/common/AppLogic';
import AllUsersScreen from './AllUsersScreen';

type Props = {userId: string; async: {user: User}};
const EditUserScreen: Screen<Props> = ({async: {user}}: Props) => {
  const loggedInUser = requireLoggedInUser();
  const [NameInput, name] = useTextInput(user.name);
  const [roles, setRoles] = React.useState(user.roles?.roles ?? []);
  const updateUserAndProfile = useUpdateUserAndProfile();
  const nav = useNav();
  const theme = useTheme();
  const rolesStore = useDataStore(UserRoles);
  const {setError} = useBackgroundStatus();
  const {Subtitle, Body, Button} = useComponents();
  const [saveAction, saving] = useAction('SaveUser', save);

  const back = () => {
    if (nav.backOk()) {
      nav.back();
    } else {
      nav.navTo(AllUsersScreen, {reload: true});
    }
  };

  const hasUnsavedChanges = () => {
    const nameChanged = user.name !== name;
    const initialRoles = user.roles?.roles ?? [];
    const rolesChanged =
      roles.length !== initialRoles.length ||
      roles.some(r => !initialRoles.includes(r));

    return nameChanged || rolesChanged;
  };

  async function save() {
    await Promise.all([
      // rolesStore.update({id: user.id, roles}),
      updateUserAndProfile(user.id, {name}, {}),
    ]);
    back();
    nav.setParams({reload: true});
  }

  const roleToggled = (role: Role) => {
    if (loggedInUser.id === user.id && role === 'admin') {
      setError(
        new CodedError(
          'npe.adhoc',
          'You cannot remove your own admin permissions',
        ),
      );
      return;
    }

    if (roles.includes(role)) {
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const roleCheckboxes = SYSTEM_ROLES.map(role => {
    return (
      <List.Item
        title={role}
        key={role}
        left={props => (
          <Checkbox
            status={roles?.includes(role) ? 'checked' : 'unchecked'}
            onPress={() => roleToggled(role)}
          />
        )}
      />
    );
  });

  return (
    <View style={S.modal}>
      <Subtitle>Edit {user.name}</Subtitle>
      <Body>ID: {user.id}</Body>
      <NameInput label="Name" type="primary" style={S.nameInput} />
      <List.Section>
        <List.Accordion
          title="Roles"
          description={roles?.join(', ') ?? null}
          style={{paddingHorizontal: 0}}>
          {roleCheckboxes}
        </List.Accordion>
      </List.Section>
      <View style={S.modalFooter}>
        <Button onPress={back}>Cancel</Button>
        <Button
          onPress={saveAction}
          loading={saving}
          disabled={!hasUnsavedChanges() || saving}
          type="primary"
          style={{marginLeft: 12}}>
          Save
        </Button>
      </View>
    </View>
  );
};

EditUserScreen.load = async ({userId}) => {
  const userStore = useDataStore(User);
  const user = await userStore.get(userId, {edges: [UserRoles]});
  if (user == null) {
    throw UserNotFoundError();
  }

  return {user};
};

EditUserScreen.title = 'Edit User';

const S = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: 'auto',
    height: 'auto',
    alignSelf: 'center',
    borderRadius: 7,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    marginTop: 20,
  },
  nameInput: {
    marginTop: 10,
    width: 450,
  },
});

EditUserScreen.style = {
  type: 'modal',
  nav: 'none',
};

export default EditUserScreen;
