/**
 * Commmon profile components and utilities.
 */

import {Opt} from '@toolkit/core/util/Types';
import * as React from 'react';
import {
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {CachingImage} from './CachingImage';

type ProfilePicProps = {
  /** Uri of the profile pic. */
  pic: Opt<string>;

  /* Width and height of the pic to render */
  size: number;

  /** Style for the containing view */
  style?: StyleProp<ViewStyle>;
};

/**
 * Render a profile pic in the "standard" style for the app.
 */
export const ProfilePic = (props: ProfilePicProps) => {
  const {pic, size, style} = props;
  const sizeStyle = {width: size, height: size, borderRadius: size / 2};
  const [loaded, setLoaded] = React.useState(false);

  function onLoad() {
    setLoaded(true);
  }

  const errorView = (url: string, err: string) => {
    return shouldShowLocalDevHint(err) ? (
      <Text style={S.devHint} onPress={() => devLoadImage(url)}>
        (DEV){'\n'}load
      </Text>
    ) : (
      <></>
    );
  };

  return (
    <View style={[{width: size, height: size}, S.profileBox, style]}>
      <CachingImage
        source={{uri: pic ?? ''}}
        style={[S.profilePic, sizeStyle, {opacity: loaded ? 1 : 0}]}
        onLoad={onLoad}
        errorView={errorView}
      />
    </View>
  );
};

// Special case for local development possibly not loading images due to CORS
function shouldShowLocalDevHint(error: Opt<string>) {
  return (
    error != null &&
    error?.startsWith('Failed to load') &&
    __DEV__ &&
    Platform.OS === 'web' &&
    location.hostname === 'localhost'
  );
}

function devLoadImage(url: Opt<string>) {
  if (Platform.OS === 'web' && url != null) {
    Linking.openURL(url);

    if (
      confirm(
        "http://localhost profile images sometimes don't load due to CORS. " +
          'Opened image in another tab, click OK to reload. ' +
          "This behavior isn't shown in production.",
      )
    ) {
      document.location.reload();
    }
  }
}

const S = StyleSheet.create({
  profilePic: {
    borderWidth: 1,
    borderColor: '#888',
  },
  profileBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  devHint: {
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
