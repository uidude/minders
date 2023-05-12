/**
 * Screen for editing the user's profile.
 */

import {ProfilePic} from '@app/app/components/ProfilePic';
import {useUpdateUserAndProfile} from '@app/common/AppLogic';
import {Profile} from '@app/common/DataTypes';
import OutlineList from '@app/legacy/components/OutlineList';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useAction} from '@toolkit/core/client/Action';
import {withTimeout} from '@toolkit/core/util/DevUtil';
import {Opt} from '@toolkit/core/util/Types';
import {getRequired, useDataStore} from '@toolkit/data/DataStore';
import {useStorage} from '@toolkit/data/FileStore';
import {useComponents} from '@toolkit/ui/components/Components';
import {PressableSpring} from '@toolkit/ui/components/Tools';
import {useNav} from '@toolkit/ui/screen/Nav';
import {Screen} from '@toolkit/ui/screen/Screen';
import {SaveFormat, manipulateAsync} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, View} from 'react-native';

type Props = {
  async: {
    me: Profile;
  };
};

async function pickSquarePhoto(size: number = 256) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: true,
    aspect: [1, 1],
  });
  const image = result.assets && result.assets[0];

  if (image) {
    // Crop square box in the middle
    const width = image.width;
    const height = image.height;
    const boxSize = Math.min(width, height);
    const x = (width - boxSize) / 2;
    const y = (height - boxSize) / 2;
    const cropped = await manipulateAsync(
      image.uri,
      [
        {crop: {originX: x, originY: y, width: boxSize, height: boxSize}},
        {resize: {width: size, height: size}},
      ],
      {compress: 0.8, format: SaveFormat.JPEG},
    );
    return cropped.uri;
  }

  return null;
}

export function ProfilePicEditor(props: {
  pic: Opt<string>;
  setPic: (pic: string) => void;
  isLoading?: (loading: boolean) => void;
  size?: number;
}) {
  const {size = 128} = props;
  const {upload} = useStorage(Profile, 'pic', {maxBytes: 50000000});
  const {pic, setPic, isLoading} = props;
  const [uploadPic, uploading] = useAction('UploadPic', uploadPicHandler);
  const toUploadUri = React.useRef<Opt<string>>();

  React.useEffect(() => {
    if (isLoading) {
      isLoading(uploading);
    }
  }, [uploading]);

  async function editPic() {
    toUploadUri.current = await pickSquarePhoto();
    uploadPic();
  }

  async function uploadPicHandler() {
    const uri = toUploadUri.current;
    if (uri != null) {
      const uploadResult = await withTimeout(() => upload(uri), 30000);
      setPic(uploadResult.storageUri);
    }
  }

  return (
    <PressableSpring onPress={editPic}>
      {uploading ? (
        <View style={[S.uploading, {width: size, height: size}]}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ProfilePic pic={pic} size={size} style={{alignSelf: 'center'}} />
      )}
    </PressableSpring>
  );
}

const EditProfile: Screen<Props> = props => {
  requireLoggedInUser();
  const {me} = props.async;
  const {Button, TextInput} = useComponents();
  const [name, setName] = React.useState(me.name);
  const [pic, setPic] = React.useState(me.pic);
  const nav = useNav();
  const updateUserAndProfile = useUpdateUserAndProfile();
  const [save, saving] = useAction('SaveProfile', saveHandler);
  const [loading, setLoading] = React.useState(false);

  function back(reload: boolean = false) {
    if (nav.backOk()) {
      nav.back();
      nav.setParams({reload});
    } else {
      nav.navTo(OutlineList);
    }
  }

  async function saveHandler() {
    await updateUserAndProfile(me.id, {name, pic}, {});
    back(true);
  }

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <ProfilePicEditor pic={pic} setPic={setPic} isLoading={setLoading} />
      <View style={{height: 20}} />
      <TextInput
        type="primary"
        value={name}
        onChangeText={setName}
        label="Name"
      />
      <View style={{height: 20}} />
      <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
        <Button type="tertiary" onPress={() => back()}>
          Cancel
        </Button>
        <Button
          type="primary"
          onPress={save}
          loading={saving}
          disabled={loading}>
          Save
        </Button>
      </View>
    </ScrollView>
  );
};
EditProfile.title = 'Edit Your Profile';

EditProfile.load = async () => {
  const {id} = requireLoggedInUser();
  const profileStore = useDataStore(Profile);
  const me = await getRequired(profileStore, id);

  return {me};
};
const S = StyleSheet.create({
  container: {
    flex: 1,
    margin: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  row: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  profilePic: {
    width: 128,
    height: 128,
    borderWidth: 1,
    borderColor: '#888',
    alignSelf: 'center',
  },
  uploading: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

export default EditProfile;
